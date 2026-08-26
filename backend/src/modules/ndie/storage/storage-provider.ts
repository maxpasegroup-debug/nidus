import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { uploadBufferToCloudinaryResource, type CloudinaryUploadResult } from "../../../config/cloudinary.js";
import { uploadBufferToCloudinary } from "../../../config/cloudinary.js";
import { env } from "../../../config/env.js";

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

function localStorageRoot() {
  return resolve(env.NDIE_LOCAL_STORAGE_ROOT);
}

function assertLocalStorageAllowed() {
  if (!env.NDIE_LOCAL_STORAGE_ENABLED || env.NODE_ENV === "production") {
    throw new Error("NDIE local storage is available only in an explicitly enabled non-production environment.");
  }
}

function safeStoragePath(folder: string, fileName: string) {
  const root = localStorageRoot();
  const safeFolder = folder.split(/[\\/]+/).filter(Boolean).map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "_")).join("/");
  const extension = extname(fileName).replace(/[^a-zA-Z0-9.]/g, "");
  const stem = basename(fileName, extname(fileName)).replace(/[^a-zA-Z0-9._-]/g, "_") || "asset";
  const target = resolve(root, safeFolder, `${stem}-${randomUUID()}${extension}`);
  const relation = relative(root, target);
  if (!relation || relation.startsWith("..") || isAbsolute(relation)) throw new Error("Invalid NDIE local storage path.");
  return { root, target, publicId: relation.replace(/\\/g, "/") };
}

async function storeLocalBuffer(buffer: Buffer, fileName: string, folder: string, resourceType: string): Promise<NdieStoredAsset> {
  assertLocalStorageAllowed();
  const location = safeStoragePath(folder, fileName);
  await mkdir(resolve(location.target, ".."), { recursive: true });
  await writeFile(location.target, buffer, { flag: "wx" });
  return {
    secureUrl: pathToFileURL(location.target).href,
    publicId: location.publicId,
    resourceType,
    checksum: checksum(buffer),
    sizeBytes: buffer.length,
    storageProvider: "local-staging"
  };
}

export async function readNdieStoredUrl(url: string) {
  if (!url.startsWith("file:")) {
    const response = await fetch(url);
    if (!response.ok) throw Object.assign(new Error("Unable to load NDIE asset from storage."), { statusCode: 502, retryable: true });
    return Buffer.from(await response.arrayBuffer());
  }
  assertLocalStorageAllowed();
  const root = localStorageRoot();
  const target = resolve(fileURLToPath(url));
  const relation = relative(root, target);
  if (!relation || relation.startsWith("..") || isAbsolute(relation)) throw new Error("NDIE local asset is outside the configured storage root.");
  return readFile(target);
}

export async function storeNdieSource(file: Express.Multer.File, folder: string) {
  if (!env.NDIE_LOCAL_STORAGE_ENABLED) {
    const result = await uploadBufferToCloudinary(file, folder);
    return { ...result, storageProvider: "cloudinary" };
  }
  const stored = await storeLocalBuffer(file.buffer, file.originalname, folder, file.mimetype.startsWith("image/") ? "image" : "raw");
  return { ...stored, storageProvider: stored.storageProvider };
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

export class LocalNdieAssetStorageProvider implements NdieAssetStorageProvider {
  readonly id = "local-staging";

  uploadPageImage(input: { buffer: Buffer; fileName: string; folder: string; mimeType: "image/png" | "image/jpeg" }) {
    return storeLocalBuffer(input.buffer, input.fileName, input.folder, "image");
  }
}

export const ndieAssetStorageProvider = env.NDIE_LOCAL_STORAGE_ENABLED
  ? new LocalNdieAssetStorageProvider()
  : new CloudinaryNdieAssetStorageProvider();
