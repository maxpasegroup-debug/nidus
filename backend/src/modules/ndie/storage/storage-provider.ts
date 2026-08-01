import { createHash } from "node:crypto";
import { uploadBufferToCloudinaryResource, type CloudinaryUploadResult } from "../../../config/cloudinary.js";

export type NdieStoredAsset = CloudinaryUploadResult & {
  checksum: string;
  sizeBytes: number;
  storageProvider: string;
};

export interface NdieAssetStorageProvider {
  id: string;
  uploadPageImage(input: {
    buffer: Buffer;
    fileName: string;
    folder: string;
    mimeType: "image/png" | "image/jpeg";
  }): Promise<NdieStoredAsset>;
}

function checksum(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export class CloudinaryNdieAssetStorageProvider implements NdieAssetStorageProvider {
  readonly id = "cloudinary";

  async uploadPageImage(input: {
    buffer: Buffer;
    fileName: string;
    folder: string;
    mimeType: "image/png" | "image/jpeg";
  }): Promise<NdieStoredAsset> {
    const result = await uploadBufferToCloudinaryResource(
      { buffer: input.buffer, originalname: input.fileName, mimetype: input.mimeType },
      input.folder,
      "image"
    );
    return {
      ...result,
      checksum: checksum(input.buffer),
      sizeBytes: input.buffer.length,
      storageProvider: this.id
    };
  }
}

export const ndieAssetStorageProvider = new CloudinaryNdieAssetStorageProvider();
