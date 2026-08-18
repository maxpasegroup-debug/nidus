import { ndiePageUnderstandingService } from "../modules/ndie/page-understanding/page-understanding.service.js";

const sample = await ndiePageUnderstandingService.understand({
  importJobId: "phase-2-verification",
  pages: [
    {
      pageId: "page-1",
      pageNumber: 1,
      pageImageUrl: "https://assets.nidus.test/page-1-review.png",
      ocrText: "1. Evaluate \\int_0^1 x^2 dx and choose the correct option. (A) 1/3 (B) 1/2 The graph is shown below.",
      layoutJson: {
        regions: [
          { id: "q1", elementType: "QUESTION_AREA", text: "1. Evaluate \\int_0^1 x^2 dx and choose the correct option.", confidence: 0.82, readingOrder: 1, coordinates: { x: 0.08, y: 0.12, width: 0.82, height: 0.12 } },
          { id: "o1", elementType: "TEXT", text: "(A) 1/3 (B) 1/2", confidence: 0.78, readingOrder: 2, coordinates: { x: 0.1, y: 0.25, width: 0.6, height: 0.08 } }
        ]
      },
      formulaJson: { formulas: [{ formulaId: "f1", latex: "\\int_0^1 x^2 dx", confidence: 0.86, readingOrder: 1, coordinates: { x: 0.28, y: 0.13, width: 0.2, height: 0.05 } }] },
      visualJson: { visuals: [{ visualId: "g1", visualType: "GRAPH", caption: "Graph shown below", confidence: 0.76, readingOrder: 3, coordinates: { x: 0.2, y: 0.38, width: 0.42, height: 0.28 } }] },
      assessmentJson: { questions: [{ questionNumber: "1" }] },
      evaluationJson: { answers: [{ questionNumber: "1", answer: "A" }] },
      validationJson: { publishReadiness: { status: "READY_WITH_REVIEW" } }
    },
    {
      pageId: "page-2",
      pageNumber: 2,
      pageImageUrl: "https://assets.nidus.test/page-2-review.png",
      ocrText: "Answer Key 1 A 2 C 3 D"
    }
  ]
});

const checks: Array<[string, boolean, unknown?]> = [
  ["service is ready", ndiePageUnderstandingService.health().status === "ready", ndiePageUnderstandingService.health()],
  ["document-level schema", sample.schemaVersion === "ndie-page-understanding-document-v1", sample.schemaVersion],
  ["uses rendered page image", sample.pages.every((page) => page.source.consumesRenderedPageImage), sample.pages.map((page) => page.source)],
  ["never reads raw pdf", sample.pages.every((page) => page.source.neverReadsRawPdf === true), sample.pages.map((page) => page.source)],
  ["detects question page", sample.pages[0]?.pageType === "QUESTION_PAGE", sample.pages[0]?.pageType],
  ["detects answer key page", sample.pages[1]?.pageType === "ANSWER_KEY_PAGE", sample.pages[1]?.pageType],
  ["preserves formula risk", sample.summary.formulaHeavyPages >= 1 && sample.diagnostics.risks.includes("FORMULA_HEAVY"), sample.summary],
  ["preserves visual risk", sample.summary.visualHeavyPages >= 1 && sample.diagnostics.risks.includes("GRAPH_HEAVY"), sample.diagnostics],
  ["creates relationships", sample.pages[0]?.relationships.some((relationship) => relationship.type === "USES_FORMULA") === true, sample.pages[0]?.relationships],
  ["dominant subject is mathematics", sample.summary.dominantSubject === "MATHEMATICS", sample.summary]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok, details] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`, details ? JSON.stringify(details) : "");
}

if (failed.length) {
  throw new Error(`NDIE page understanding verification failed: ${failed.map(([name]) => name).join(", ")}`);
}
