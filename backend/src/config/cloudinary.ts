export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
};

export async function uploadLectureAssetPlaceholder(filePath: string): Promise<CloudinaryUploadResult> {
  return {
    secureUrl: filePath,
    publicId: `placeholder/${Date.now()}`
  };
}

export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET
};
