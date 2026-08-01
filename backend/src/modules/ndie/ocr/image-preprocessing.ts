import sharp from "sharp";
import { env } from "../../../config/env.js";

export type NdiePreprocessingOptions = {
  deskew?: boolean;
  denoise?: boolean;
  contrast?: boolean;
  binarize?: boolean;
  rotateDegrees?: number;
  crop?: { left: number; top: number; width: number; height: number };
};

export type NdiePreprocessedImage = {
  buffer: Buffer;
  mimeType: "image/png";
  metadata: {
    enabled: boolean;
    operations: string[];
    inputSizeBytes: number;
    outputSizeBytes: number;
    width?: number;
    height?: number;
  };
};

export async function preprocessOcrImage(input: Buffer, options: NdiePreprocessingOptions = {}): Promise<NdiePreprocessedImage> {
  const operations: string[] = [];
  let pipeline = sharp(input, { limitInputPixels: env.NDIE_OCR_MAX_IMAGE_PIXELS });

  if (options.crop) {
    pipeline = pipeline.extract(options.crop);
    operations.push("crop");
  }
  if (options.rotateDegrees) {
    pipeline = pipeline.rotate(options.rotateDegrees);
    operations.push("rotation-correction");
  }
  if (options.denoise) {
    pipeline = pipeline.median(1);
    operations.push("denoise");
  }
  if (options.contrast) {
    pipeline = pipeline.normalize();
    operations.push("contrast-enhancement");
  }
  if (options.binarize) {
    pipeline = pipeline.grayscale().threshold(170);
    operations.push("binarization");
  }

  const output = await pipeline.png().toBuffer({ resolveWithObject: true });
  return {
    buffer: output.data,
    mimeType: "image/png",
    metadata: {
      enabled: env.NDIE_OCR_PREPROCESSING_ENABLED,
      operations,
      inputSizeBytes: input.length,
      outputSizeBytes: output.data.length,
      width: output.info.width,
      height: output.info.height
    }
  };
}
