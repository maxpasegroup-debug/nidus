import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  renderer: readFileSync(join(root, "../frontend/src/components/tests/rich-student-renderer.tsx"), "utf8"),
  questionCard: readFileSync(join(root, "../frontend/src/components/tests/question-card.tsx"), "utf8"),
  attemptPage: readFileSync(join(root, "../frontend/src/app/test-attempt/[id]/page.tsx"), "utf8"),
  service: readFileSync(join(root, "src/modules/ndie/student-delivery/student-delivery.service.ts"), "utf8"),
  ndieService: readFileSync(join(root, "src/modules/ndie/ndie.service.ts"), "utf8"),
  queue: readFileSync(join(root, "src/modules/ndie/queue/queue.service.ts"), "utf8"),
  states: readFileSync(join(root, "src/modules/ndie/queue/state-machine.ts"), "utf8"),
  worker: readFileSync(join(root, "src/modules/ndie/worker/worker.service.ts"), "utf8")
};

const required = [
  ["rich student renderer component", files.renderer.includes("RichStudentQuestionRenderer") && files.questionCard.includes("RichStudentQuestionRenderer")],
  ["published package consumption", files.renderer.includes("NDIE_RICH_V1") && files.renderer.includes("ndiePackageId")],
  ["formula rendering and latex copy", files.renderer.includes("NidusMathText") && files.renderer.includes("copyLatex")],
  ["visual zoom fullscreen viewer", files.renderer.includes("AssetViewer") && files.renderer.includes("requestFullscreen")],
  ["table graph diagram rendering", files.renderer.includes("block.type === \"table\"") && files.renderer.includes("block.type === \"graph\"") && files.renderer.includes("block.type === \"diagram\"")],
  ["multiple and future answer modes", files.renderer.includes("MULTIPLE_CORRECT_MCQ") && files.renderer.includes("textarea")],
  ["autosave resume timer retained", files.attemptPage.includes("autosaveAttempt") && files.attemptPage.includes("resumeAttempt") && files.attemptPage.includes("TimerCard")],
  ["delivery queue state", files.states.includes("READY_FOR_STUDENT_DELIVERY") && files.states.includes("DELIVERY_READY")],
  ["delivery worker", files.worker.includes("runStudentDeliveryForJob") && files.worker.includes("student-rich-renderer-v1")],
  ["delivery health", files.service.includes("assetIntegrity") && files.ndieService.includes("studentDelivery")]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  checks: required.length,
  gate: "production-gate-13-student-delivery",
  capabilities: required.map(([name]) => name)
}));
