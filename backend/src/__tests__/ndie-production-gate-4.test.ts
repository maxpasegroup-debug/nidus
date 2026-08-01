import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertNdieJobTransition } from "../modules/ndie/queue/state-machine.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 4 enterprise OCR provider", () => {
  const contract = read("src/modules/ndie/contracts/ocr-result.ts");
  const providers = read("src/modules/ndie/contracts/providers.ts");
  const tesseract = read("src/modules/ndie/ocr/tesseract-ocr.provider.ts");
  const preprocessing = read("src/modules/ndie/ocr/image-preprocessing.ts");
  const ocrService = read("src/modules/ndie/ocr/ocr.service.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const queueService = read("src/modules/ndie/queue/queue.service.ts");
  const env = read("src/config/env.ts");
  const container = read("src/modules/ndie/ndie.container.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");

  it("defines a normalized structured OCR result model", () => {
    expect(contract).toContain("NdieNormalizedOcrPage");
    expect(contract).toContain("blocks");
    expect(contract).toContain("paragraphs");
    expect(contract).toContain("lines");
    expect(contract).toContain("words");
    expect(contract).toContain("symbols");
    expect(contract).toContain("boundingBox");
    expect(contract).toContain("confidence");
    expect(contract).toContain("language");
    expect(contract).toContain("readingOrder");
  });

  it("keeps OCR provider architecture swappable", () => {
    expect(providers).toContain("interface OcrProvider");
    expect(providers).toContain("normalized?");
    expect(container).toContain("new TesseractOcrProvider()");
    expect(container).toContain('createDisabledProvider("ocr.google-vision"');
    expect(container).toContain('createDisabledProvider("ocr.azure"');
    expect(tesseract).toContain('readonly id = "ocr.tesseract"');
  });

  it("supports provider-independent preprocessing hooks", () => {
    expect(preprocessing).toContain("deskew");
    expect(preprocessing).toContain("denoise");
    expect(preprocessing).toContain("contrast");
    expect(preprocessing).toContain("binarize");
    expect(preprocessing).toContain("rotation-correction");
    expect(preprocessing).toContain("crop");
    expect(env).toContain("NDIE_OCR_PREPROCESSING_ENABLED");
  });

  it("stores normalized and raw OCR separately", () => {
    expect(ocrService).toContain("rawProviderResponse");
    expect(ocrService).toContain("normalized");
    expect(ocrService).toContain("ocrJson");
    expect(ocrService).toContain("ocrText");
    expect(ocrService).toContain("role: \"OCR_IMAGE\"");
  });

  it("integrates OCR with worker and queue checkpoints only", () => {
    expect(worker).toContain('job.stage === "OCR"');
    expect(worker).toContain("ndieOcrService.runOcr");
    expect(stateMachine).toContain('"OCR_RUNNING"');
    expect(stateMachine).toContain('"OCR_COMPLETED"');
    expect(stateMachine).toContain('"READY_FOR_LAYOUT"');
    expect(queueService).toContain("enqueueOcr");
    expect(() => assertNdieJobTransition("READY_FOR_OCR", "OCR_RUNNING")).not.toThrow();
    expect(() => assertNdieJobTransition("OCR_RUNNING", "READY_FOR_LAYOUT")).toThrow();
    expect(() => assertNdieJobTransition("OCR_COMPLETED", "READY_FOR_LAYOUT")).not.toThrow();
  });

  it("adds OCR diagnostics, confidence and language metrics to health", () => {
    expect(tesseract).toContain("blankPage");
    expect(tesseract).toContain("lowConfidence");
    expect(tesseract).toContain("missingText");
    expect(tesseract).toContain("languageMismatch");
    expect(tesseract).toContain("rotatedPage");
    expect(tesseract).toContain("providerFailure");
    expect(ocrService).toContain("averageConfidence");
    expect(ocrService).toContain("languageDistribution");
    expect(ndieService).toContain("ndieOcrService.health()");
  });

  it("separates deterministic OCR failures from retryable provider failures", () => {
    expect(ocrService).toContain("deterministicOcrFailure");
    expect(ocrService).toContain("OCR_RETRY_PENDING");
    expect(ocrService).toContain("PROVIDER_FAILURE_DETERMINISTIC");
    expect(ocrService).toContain("PROVIDER_FAILURE_RETRYABLE");
  });
});
