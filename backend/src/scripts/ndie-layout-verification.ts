import { RuleBasedLayoutProvider } from "../modules/ndie/layout-analyzer/rule-based-layout.provider.js";
import type { NdieNormalizedOcrPage } from "../modules/ndie/contracts/ocr-result.js";

function box(x: number, y: number, width: number, height: number) {
  return { x, y, width, height };
}

function line(text: string, readingOrder: number, x: number, y: number, width: number, height = 32) {
  const words = text.split(/\s+/).map((word, index) => ({
    text: word,
    confidence: 0.96,
    boundingBox: box(x + index * 70, y, Math.max(35, word.length * 12), height)
  }));
  return { text, confidence: 0.96, boundingBox: box(x, y, width, height), readingOrder, words };
}

async function main() {
  const normalizedOcr: NdieNormalizedOcrPage = {
    schemaVersion: "ndie-ocr-v1",
    providerId: "ocr.fixture",
    providerVersion: "fixture",
    pageId: "layout-verification-page",
    pageNumber: 1,
    language: "eng",
    languages: ["eng"],
    rotation: 0,
    confidence: 0.96,
    text: "fixture",
    blocks: [{
      blockType: "TEXT",
      text: "fixture",
      confidence: 0.96,
      boundingBox: box(60, 50, 920, 1180),
      readingOrder: 1,
      paragraphs: [{
        text: "fixture paragraph",
        confidence: 0.96,
        boundingBox: box(60, 50, 920, 1180),
        readingOrder: 1,
        lines: [
          line("NIDUS Academy Sample Paper", 1, 80, 45, 820),
          line("Instructions: choose the correct answer", 2, 80, 140, 620),
          line("Q1. Match the following values", 3, 80, 230, 410),
          line("A | B | C | D", 4, 80, 290, 410),
          line("Figure 1 graph of motion", 5, 560, 250, 340),
          line("Q2. Second column question", 6, 560, 420, 360),
          line("Page 1", 7, 470, 1320, 100)
        ]
      }]
    }],
    diagnostics: {
      blankPage: false,
      lowConfidence: false,
      missingText: false,
      languageMismatch: false,
      rotatedPage: false,
      providerFailure: false,
      retryable: false,
      issues: []
    },
    preprocessing: {},
    durationMs: 10,
    createdAt: new Date().toISOString()
  };

  const provider = new RuleBasedLayoutProvider();
  const result = await provider.analyze({
    importJobId: "layout-verification-import",
    pageId: "layout-verification-page",
    pageNumber: 1,
    width: 1000,
    height: 1400,
    rotation: 0,
    dpi: 300,
    aspectRatio: 0.714,
    imageUrl: "https://example.test/rendered-page.png",
    ocrJson: { normalized: normalizedOcr }
  });

  const classifications = new Set(result.normalized.regions.map((region) => region.classification));
  if (!classifications.has("HEADER")) throw new Error("Expected header detection");
  if (!classifications.has("INSTRUCTION_AREA")) throw new Error("Expected instruction area detection");
  if (!classifications.has("QUESTION_AREA")) throw new Error("Expected question area detection");
  if (result.normalized.columns.length < 2) throw new Error("Expected two-column layout detection");
  if (!result.normalized.tables.length) throw new Error("Expected layout-level table detection");
  if (!result.normalized.figures.length) throw new Error("Expected layout-level figure detection");
  if (result.normalized.regions.some((region) => !region.coordinates.polygon.length)) throw new Error("Every region must have polygon coordinates");

  console.log(JSON.stringify({
    status: "PASS",
    provider: provider.id,
    schemaVersion: result.normalized.schemaVersion,
    regions: result.normalized.regions.length,
    columns: result.normalized.columns.length,
    tables: result.normalized.tables.length,
    figures: result.normalized.figures.length,
    headers: result.normalized.headers.length,
    footers: result.normalized.footers.length,
    averageConfidence: result.confidence,
    diagnostics: result.normalized.diagnostics.issues
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "FAIL",
    message: error instanceof Error ? error.message : "Layout verification failed"
  }));
  process.exit(1);
});
