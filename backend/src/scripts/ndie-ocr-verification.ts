import { createCanvas } from "@napi-rs/canvas";
import { TesseractOcrProvider } from "../modules/ndie/ocr/tesseract-ocr.provider.js";
import { preprocessOcrImage } from "../modules/ndie/ocr/image-preprocessing.js";

async function makeImage() {
  const canvas = createCanvas(900, 260);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 900, 260);
  ctx.fillStyle = "black";
  ctx.font = "42px Arial";
  ctx.fillText("NIDUS OCR TEST", 80, 110);
  ctx.font = "30px Arial";
  ctx.fillText("Page 1 Mathematics", 80, 170);
  return canvas.toBuffer("image/png");
}

async function main() {
  const source = await makeImage();
  const preprocessed = await preprocessOcrImage(source, { contrast: true, denoise: true });
  const provider = new TesseractOcrProvider();
  const startedAt = Date.now();
  const result = await provider.recognize({
    importJobId: "ocr-verification-import",
    pageId: "ocr-verification-page",
    pageNumber: 1,
    imageBuffer: preprocessed.buffer,
    languageHints: ["eng"],
    preprocessing: preprocessed.metadata
  });

  const normalizedText = result.text.toUpperCase();
  if (!normalizedText.includes("NIDUS")) throw new Error(`Expected OCR text to include NIDUS. Got: ${result.text}`);
  if (!result.normalized?.blocks) throw new Error("Normalized OCR blocks missing");

  console.log(JSON.stringify({
    status: "PASS",
    provider: provider.id,
    confidence: result.confidence,
    language: result.language,
    text: result.text,
    blockCount: result.normalized.blocks.length,
    durationMs: Date.now() - startedAt
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "FAIL",
    message: error instanceof Error ? error.message : "OCR verification failed"
  }));
  process.exit(1);
});
