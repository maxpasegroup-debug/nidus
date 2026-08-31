import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "./env.js";
import { hasExpectedMediaSignature, safeMediaFileName } from "../modules/media/media-upload-security.js";

export { safeMediaFileName } from "../modules/media/media-upload-security.js";

export type CloudinaryUploadResult = { secureUrl: string; publicId: string; resourceType: string; format?: string };

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true
});

export const cloudinaryConfig = {
  cloudName: env.CLOUDINARY_CLOUD_NAME,
  apiKey: env.CLOUDINARY_API_KEY,
  apiSecret: env.CLOUDINARY_API_SECRET
};

export const allowedMediaMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

function hasCloudinaryCredentials() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export function assertCloudinaryReady() {
  if (!hasCloudinaryCredentials()) {
    return false;
  }
  return true;
}

function resourceTypeForMime(mimeType: string): "image" | "video" | "raw" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
}

export function validateUpload(file: Express.Multer.File) {
  if (!allowedMediaMimeTypes.has(file.mimetype)) throw new Error("Unsupported file type. Upload images, PDFs, Word, PowerPoint, or videos only.");
  if (file.size > env.MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`File exceeds ${env.MAX_UPLOAD_MB}MB upload limit`);
  if (!hasExpectedMediaSignature(file.buffer, file.mimetype)) throw new Error("Uploaded file content does not match its declared file type");
}

export async function uploadBufferToCloudinary(file: Express.Multer.File, folder = "nidus/media"): Promise<CloudinaryUploadResult> {
  validateUpload(file);
  if (!assertCloudinaryReady()) {
    throw new Error("Cloudinary is not configured");
  }

  const resourceType = resourceTypeForMime(file.mimetype);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        filename_override: safeMediaFileName(file.originalname),
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        type: "authenticated",
        access_mode: "authenticated"
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id, resourceType: result.resource_type, format: result.format });
      }
    );
    stream.end(file.buffer);
  });
}

export async function uploadBufferToCloudinaryResource(
  input: { buffer: Buffer; originalname: string; mimetype: string },
  folder = "nidus/media",
  resourceType: "image" | "video" | "raw" = resourceTypeForMime(input.mimetype)
): Promise<CloudinaryUploadResult> {
  validateUpload({ ...input, fieldname: "file", encoding: "7bit", size: input.buffer.length, stream: undefined as never, destination: "", filename: "", path: "" });
  if (!assertCloudinaryReady()) throw new Error("Cloudinary is not configured");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        filename_override: safeMediaFileName(input.originalname),
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        type: "authenticated",
        access_mode: "authenticated"
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id, resourceType: result.resource_type, format: result.format });
      }
    );
    stream.end(input.buffer);
  });
}

export async function deleteCloudinaryAsset(publicId: string, mimeType?: string) {
  if (!assertCloudinaryReady()) return { result: "skipped" };
  return cloudinary.uploader.destroy(publicId, { resource_type: mimeType ? resourceTypeForMime(mimeType) : "image", type: "authenticated" });
}

export function signedMediaUrl(publicId: string, mimeType?: string) {
  assertCloudinaryReady();
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: "authenticated",
    resource_type: mimeType ? resourceTypeForMime(mimeType) : "image",
    // Upload responses contain the real Cloudinary version, but ExamUpload
    // persists only the public ID. Cloudinary's SDK otherwise fabricates a
    // `/v1/` segment for IDs containing folders, which makes authenticated
    // PDF/raw downloads fail after a successful upload. Versionless delivery
    // URLs resolve the stored asset without inventing a version.
    force_version: false,
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60
  });
}

function mediaFormat(publicId: string, mimeType?: string) {
  const mimeFormats: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "text/csv": "csv",
  };
  return (mimeType && mimeFormats[mimeType.toLowerCase()])
    || publicId.match(/\.([a-z0-9]{1,10})$/i)?.[1]?.toLowerCase()
    || "bin";
}

/**
 * Cloudinary's authenticated download endpoint is the authoritative way for
 * backend jobs to retrieve private/raw source documents. Unlike a CDN URL it
 * is time-limited and signed as an API request, so PDF reconstruction does
 * not depend on CDN version/path behaviour.
 */
export function authenticatedMediaDownloadUrl(publicId: string, mimeType?: string) {
  assertCloudinaryReady();
  return cloudinary.utils.private_download_url(publicId, mediaFormat(publicId, mimeType), {
    resource_type: mimeType ? resourceTypeForMime(mimeType) : "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
  });
}

export function signedCloudinaryPageImageUrl(publicId: string, pageNumber: number) {
  assertCloudinaryReady();
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: "authenticated",
    resource_type: "image",
    format: "jpg",
    force_version: false,
    transformation: [
      { page: pageNumber, width: 1800, crop: "limit", quality: "auto", fetch_format: "jpg" }
    ],
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60
  });
}
