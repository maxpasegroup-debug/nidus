import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "./env.js";

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format?: string;
};

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

function hasCloudinaryCredentials() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function resourceTypeForMime(mimeType: string): "image" | "video" | "raw" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
}

export async function uploadBufferToCloudinary(file: Express.Multer.File, folder = "nidus/media"): Promise<CloudinaryUploadResult> {
  if (!hasCloudinaryCredentials()) {
    const encodedName = encodeURIComponent(file.originalname.replace(/\s+/g, "-"));
    return {
      secureUrl: `https://res.cloudinary.com/nidus-placeholder/${folder}/${Date.now()}-${encodedName}`,
      publicId: `${folder}/${Date.now()}-${encodedName}`,
      resourceType: resourceTypeForMime(file.mimetype)
    };
  }

  const resourceType = resourceTypeForMime(file.mimetype);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format
        });
      }
    );

    stream.end(file.buffer);
  });
}

export async function deleteCloudinaryAsset(publicId: string, mimeType?: string) {
  if (!hasCloudinaryCredentials()) return { result: "skipped" };

  return cloudinary.uploader.destroy(publicId, {
    resource_type: mimeType ? resourceTypeForMime(mimeType) : "image"
  });
}

export async function uploadLectureAssetPlaceholder(filePath: string): Promise<CloudinaryUploadResult> {
  return {
    secureUrl: filePath,
    publicId: `placeholder/${Date.now()}`,
    resourceType: "video"
  };
}
