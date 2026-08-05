import { describe, expect, it } from "@jest/globals";
import { REAL_FILE_BASELINE_SLOTS } from "../modules/ndie/certification/real-file-baseline.service.js";
import { buildRealFilePipelineEvidence } from "../modules/ndie/certification/real-file-evidence-builder.js";

function completeImport(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-08-05T00:00:00.000Z");
  return {
    id: "import-001",
    status: "DELIVERY_READY",
    testId: "test-001",
    currentCheckpoint: "DELIVERY_READY",
    uploadedBy: "teacher-001",
    createdAt: now,
    updatedAt: now,
    sourceDocuments: [{
      id: "source-001",
      sourceKind: "QUESTION_PAPER",
      fileType: "application/pdf",
      fileSize: 1024,
      checksum: "source-hash",
      preservationState: "PRESERVED",
      pageCount: 2
    }],
    pages: [
      { id: "page-1", pageNumber: 1, renderStatus: "PAGE_RENDERED", ocrStatus: "OCR_COMPLETED", ocrText: "Q1", ocrJson: { confidence: 0.98 }, layoutJson: { page: 1 }, checksum: "page-1", renderDurationMs: 10 },
      { id: "page-2", pageNumber: 2, renderStatus: "PAGE_RENDERED", ocrStatus: "OCR_COMPLETED", ocrText: "Q2", ocrJson: { confidence: 0.98 }, layoutJson: { page: 2 }, checksum: "page-2", renderDurationMs: 12 }
    ],
    assets: [{ id: "asset-1", assetType: "RENDERED_PAGE_IMAGE", role: "REVIEW_IMAGE", pageNumber: 1, url: "https://example.test/page-1.png" }],
    elements: [
      { id: "formula-1", elementType: "FORMULA", confidence: 0.98, pageNumber: 1 },
      { id: "diagram-1", elementType: "DIAGRAM", confidence: 0.97, pageNumber: 1 },
      { id: "table-1", elementType: "TABLE", confidence: 0.97, pageNumber: 2 }
    ],
    questionCandidates: [
      { id: "candidate-1", reviewStatus: "APPROVED", confidence: 0.96, approvedQuestionId: "question-1" },
      { id: "candidate-2", reviewStatus: "APPROVED", confidence: 0.96, approvedQuestionId: "question-2" }
    ],
    answerKeyCandidates: [{ id: "answer-1", status: "MAPPED", confidence: 0.99 }],
    solutionCandidates: [{ id: "solution-1", status: "MAPPED", confidence: 0.95 }],
    reviewDecisions: [{ id: "review-1", decision: "APPROVED", createdAt: now }],
    qualityScores: [{ overall: 0.97, grade: "A", createdAt: now }],
    providerRuns: [
      { providerId: "renderer.pdfjs", providerKind: "RENDERER", stage: "PAGES_RENDERED", status: "SUCCEEDED", confidence: 1, startedAt: now, completedAt: now },
      { providerId: "ocr.tesseract", providerKind: "OCR", stage: "OCR_COMPLETED", status: "SUCCEEDED", confidence: 0.98, startedAt: now, completedAt: now },
      { providerId: "layout.rule-based", providerKind: "LAYOUT", stage: "LAYOUT_COMPLETED", status: "SUCCEEDED", confidence: 0.9, startedAt: now, completedAt: now },
      { providerId: "formula.rule-based", providerKind: "FORMULA", stage: "FORMULA_COMPLETED", status: "SUCCEEDED", confidence: 0.9, startedAt: now, completedAt: now },
      { providerId: "visual.rule-based", providerKind: "VISUAL", stage: "VISUAL_COMPLETED", status: "SUCCEEDED", confidence: 0.9, startedAt: now, completedAt: now },
      { providerId: "question.rule-based", providerKind: "QUESTION", stage: "QUESTION_COMPLETED", status: "SUCCEEDED", confidence: 0.9, startedAt: now, completedAt: now },
      { providerId: "publisher.ndie", providerKind: "PUBLISHER", stage: "PUBLISH_COMPLETED", status: "COMPLETED", confidence: 1, startedAt: now, completedAt: now }
    ],
    queueJobs: [],
    ...overrides
  };
}

describe("NDIE Phase 3 - Real File Evidence Exporter", () => {
  it("builds a complete PASS evidence manifest from stored NDIE import records", () => {
    const slot = REAL_FILE_BASELINE_SLOTS.find((candidate) => candidate.id === "nda-maths-pdf");
    expect(slot).toBeDefined();

    const manifest = buildRealFilePipelineEvidence({
      slot: slot!,
      importJob: completeImport(),
      sourceSha256: "source-hash",
      executedBy: "test"
    });

    expect(manifest.manifestVersion).toBe("real-file-pipeline-evidence-v1");
    expect(manifest.stages).toHaveLength(10);
    expect(manifest.stages.every((stage) => stage.status === "PASS")).toBe(true);
    expect(manifest.stages.map((stage) => stage.stage)).toEqual([
      "UPLOAD",
      "RENDER",
      "OCR",
      "LAYOUT",
      "FORMULA",
      "VISUAL",
      "AI_RECONSTRUCTION",
      "TEACHER_REVIEW",
      "PUBLISH",
      "CBT_RENDER"
    ]);
  });

  it("fails teacher review, publish and CBT render when those records are incomplete", () => {
    const slot = REAL_FILE_BASELINE_SLOTS.find((candidate) => candidate.id === "answer-key-pdf");
    expect(slot).toBeDefined();

    const manifest = buildRealFilePipelineEvidence({
      slot: slot!,
      importJob: completeImport({
        status: "READY_FOR_REVIEW",
        testId: null,
        questionCandidates: [{ id: "candidate-1", reviewStatus: "PENDING_REVIEW", confidence: 0.75, approvedQuestionId: null }],
        answerKeyCandidates: []
      }),
      sourceSha256: "source-hash"
    });

    const review = manifest.stages.find((stage) => stage.stage === "TEACHER_REVIEW");
    const publish = manifest.stages.find((stage) => stage.stage === "PUBLISH");
    const cbt = manifest.stages.find((stage) => stage.stage === "CBT_RENDER");

    expect(review?.status).toBe("FAIL");
    expect(publish?.status).toBe("FAIL");
    expect(cbt?.status).toBe("FAIL");
  });
});
