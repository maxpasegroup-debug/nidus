import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  publisher: readFileSync(join(root, "src/modules/ndie/publisher/publisher.service.ts"), "utf8"),
  contract: readFileSync(join(root, "src/modules/ndie/contracts/publish-package.ts"), "utf8"),
  queue: readFileSync(join(root, "src/modules/ndie/queue/queue.service.ts"), "utf8"),
  states: readFileSync(join(root, "src/modules/ndie/queue/state-machine.ts"), "utf8"),
  worker: readFileSync(join(root, "src/modules/ndie/worker/worker.service.ts"), "utf8"),
  ndieService: readFileSync(join(root, "src/modules/ndie/ndie.service.ts"), "utf8")
};

const required = [
  ["rich exam package contract", files.contract.includes("NdieExamPackage") && files.contract.includes("ndie-rich-exam-package-v1")],
  ["approved-only publish authority", files.publisher.includes("[\"APPROVED\"]") && files.publisher.includes("reviewStatus: \"APPROVED\"")],
  ["teacher review blocker", files.publisher.includes("TEACHER_REVIEW_INCOMPLETE")],
  ["validation blocker", files.publisher.includes("CRITICAL_VALIDATION")],
  ["answer and asset integrity blockers", files.publisher.includes("MISSING_ANSWER") && files.publisher.includes("MISSING_ASSET")],
  ["immutable publish version", files.publisher.includes("PUBLISH_VERSION") && files.publisher.includes("ndieRevision.create")],
  ["publisher provider run metrics", files.publisher.includes("providerKind: \"PUBLISHER\"") && files.publisher.includes("PUBLISH_COMPLETED")],
  ["CBT compatibility", files.publisher.includes("testsService.publishDraft") && files.publisher.includes("NDIE_RICH_V1")],
  ["publish queue entrypoint", files.queue.includes("enqueuePublish") && files.states.includes("READY_FOR_PUBLISH")],
  ["publish worker", files.worker.includes("runPublishForJob") && files.worker.includes("READY_FOR_STUDENT_DELIVERY")],
  ["health endpoint publisher metrics", files.ndieService.includes("publisher") && files.publisher.includes("rollbackAvailability")]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  checks: required.length,
  gate: "production-gate-12-rich-publishing",
  capabilities: required.map(([name]) => name)
}));
