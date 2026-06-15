import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "./env.js";

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
  if (!allowedMediaMimeTypes.has(file.mimetype)) throw new Error("Unsupported file type. Upload images, PDFs, or videos only.");
  if (file.size > env.MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`File exceeds ${env.MAX_UPLOAD_MB}MB upload limit`);
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
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60
  });
}
