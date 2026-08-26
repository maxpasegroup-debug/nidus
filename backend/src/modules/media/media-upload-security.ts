import { basename } from "node:path";

export function safeMediaFileName(fileName: string) {
  return basename(fileName)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "upload";
}

export function hasExpectedMediaSignature(buffer: Buffer, mimeType: string) {
  if (!buffer.length) return false;
  const starts = (...bytes: number[]) => bytes.every((byte, index) => buffer[index] === byte);
  const ascii = (start: number, length: number) => buffer.subarray(start, start + length).toString("ascii");
  if (mimeType === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  if (mimeType === "image/png") return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (mimeType === "image/webp") return ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
  if (mimeType === "image/gif") return ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a";
  if (mimeType === "application/pdf") return ascii(0, 4) === "%PDF";
  if (["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation"].includes(mimeType)) {
    return starts(0x50, 0x4b, 0x03, 0x04) || starts(0x50, 0x4b, 0x05, 0x06) || starts(0x50, 0x4b, 0x07, 0x08);
  }
  if (mimeType === "application/msword" || mimeType === "application/vnd.ms-powerpoint") {
    return starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
  }
  if (mimeType === "video/mp4" || mimeType === "video/quicktime") return ascii(4, 4) === "ftyp";
  if (mimeType === "video/webm") return starts(0x1a, 0x45, 0xdf, 0xa3);
  if (mimeType === "text/plain" || mimeType === "text/csv") {
    return !buffer.includes(0) && !buffer.toString("utf8").includes("\uFFFD");
  }
  return false;
}
