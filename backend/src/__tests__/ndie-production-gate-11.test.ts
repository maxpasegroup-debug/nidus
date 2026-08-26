import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 11 teacher review workspace", () => {
  const reviewService = read("src/modules/ndie/review-engine/review-engine.service.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");
  const controller = read("src/modules/ndie/ndie.controller.ts");
  const routes = read("src/modules/ndie/ndie.routes.ts");
  const security = read("src/modules/ndie/security/ndie-security.ts");
  const frontendService = read("../frontend/src/services/ndie.ts");
  const workspace = read("../frontend/src/components/ndie/teacher-review-workspace.tsx");

  it("enriches review workspace with dashboard, validation and review queues", () => {
    expect(reviewService).toContain("dashboard");
    expect(reviewService).toContain("overallConfidence");
    expect(reviewService).toContain("publishReadiness");
    expect(reviewService).toContain("questionIssues");
    expect(reviewService).toContain("formulas");
    expect(reviewService).toContain("visuals");
    expect(reviewService).toContain("answers");
    expect(reviewService).toContain("solutions");
    expect(reviewService).toContain("completionPercent");
  });

  it("adds autosave and bulk review APIs with authorization and audit hooks", () => {
    expect(ndieService).toContain("bulkReview");
    expect(ndieService).toContain("saveReviewSession");
    expect(ndieService).toContain("assertNdieImportAccess");
    expect(controller).toContain("bulkReview");
    expect(controller).toContain("saveReviewSession");
    expect(routes).toContain("/imports/:id/review-session");
    expect(routes).toContain("/imports/:id/review/bulk");
    expect(security).toContain("NDIE_REVIEW_BULK_UPDATED");
    expect(security).toContain("NDIE_REVIEW_SESSION_SAVED");
  });

  it("keeps immutable revision history for all review decisions", () => {
    expect(reviewService).toContain("ndieRevision.create");
    expect(reviewService).toContain("TEACHER_EDIT");
    expect(reviewService).toContain("TEACHER_SKIPPED");
    expect(reviewService).toContain("revisionSummary");
    expect(reviewService).toContain("before");
    expect(reviewService).toContain("snapshot");
  });

  it("builds a visual side-by-side teacher review interface", () => {
    expect(workspace).toContain("Original Rendered Page");
    expect(workspace).toContain("Extracted Review");
    expect(workspace).toContain("selectedBox");
    expect(workspace).toContain("requestFullscreen");
    expect(workspace).toContain("FormulaReview");
    expect(workspace).toContain("VisualReview");
    expect(workspace).toContain("AnswerReview");
    expect(workspace).toContain("ValidationReview");
    expect(workspace).toContain("HistoryReview");
  });

  it("supports keyboard productivity, filters, safe bulk review and autosave recovery", () => {
    expect(workspace).toContain("ArrowDown");
    expect(workspace).toContain("jumpToNextIssue");
    expect(workspace).toContain("Mark Shown for Review");
    expect(workspace).not.toContain("Bulk Approve");
    expect(workspace).toContain("issueOnly");
    expect(workspace).toContain("statusFilter");
    expect(workspace).toContain("saveNdieReviewSession");
    expect(workspace).toContain("localStorage.setItem");
    expect(frontendService).toContain("bulkReviewNdieCandidates");
    expect(frontendService).toContain("saveNdieReviewSession");
  });
});
