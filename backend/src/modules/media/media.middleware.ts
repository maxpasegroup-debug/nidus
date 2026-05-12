import multer from "multer";
import { env } from "../../config/env.js";
import { allowedMediaMimeTypes } from "../../config/cloudinary.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMediaMimeTypes.has(file.mimetype)) {
      callback(new Error("Unsupported file type. Upload images, PDFs, or videos only."));
      return;
    }

    callback(null, true);
  }
});

export function isAllowedMediaType(mimeType: string) {
  return allowedMediaMimeTypes.has(mimeType);
}
