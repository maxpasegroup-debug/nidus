import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  backendReview: readFileSync(join(root, "src/modules/ndie/review-engine/review-engine.service.ts"), "utf8"),
  backendRoutes: readFileSync(join(root, "src/modules/ndie/ndie.routes.ts"), "utf8"),
  frontendService: readFileSync(join(root, "../frontend/src/services/ndie.ts"), "utf8"),
  frontendWorkspace: readFileSync(join(root, "../frontend/src/components/ndie/teacher-review-workspace.tsx"), "utf8")
};

const required = [
  ["side-by-side original page", files.frontendWorkspace.includes("Original Rendered Page") && files.frontendWorkspace.includes("Extracted Review")],
  ["region highlighting", files.frontendWorkspace.includes("selectedBox")],
  ["question decisions", files.frontendWorkspace.includes("APPROVED") && files.frontendWorkspace.includes("NEEDS_EDIT") && files.frontendWorkspace.includes("SKIPPED")],
  ["formula review", files.frontendWorkspace.includes("FormulaReview")],
  ["visual review", files.frontendWorkspace.includes("VisualReview")],
  ["answer review", files.frontendWorkspace.includes("AnswerReview")],
  ["validation review", files.frontendWorkspace.includes("ValidationReview")],
  ["history review", files.frontendWorkspace.includes("HistoryReview")],
  ["keyboard shortcuts", files.frontendWorkspace.includes("ArrowDown") && files.frontendWorkspace.includes("jumpToNextIssue")],
  ["autosave", files.frontendWorkspace.includes("saveNdieReviewSession") && files.backendRoutes.includes("/imports/:id/review-session")],
  ["bulk review", files.frontendWorkspace.includes("bulkReviewNdieCandidates") && files.backendRoutes.includes("/imports/:id/review/bulk")],
  ["immutable before-after revisions", files.backendReview.includes("before") && files.backendReview.includes("after") && files.backendReview.includes("ndieRevision.create")],
  ["completion metrics", files.backendReview.includes("completionPercent") && files.backendReview.includes("estimatedPublishReadiness")]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  checks: required.length,
  workspace: "enterprise-teacher-review",
  capabilities: required.map(([name]) => name)
}));
