import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const service = readFileSync(join(root, "src/modules/ndie/ai-reconstruction/ai-reconstruction.service.ts"), "utf8");
const academyRoutes = readFileSync(join(root, "src/modules/academy/academy.routes.ts"), "utf8");
const academyController = readFileSync(join(root, "src/modules/academy/academy.controller.ts"), "utf8");
const academyService = readFileSync(join(root, "src/modules/academy/academy.service.ts"), "utf8");
const packageJson = readFileSync(join(root, "package.json"), "utf8");

const required = [
  ["isolated reconstruction service", service.includes("ndieAiReconstructionService") && service.includes("NIDUS_AI_RECONSTRUCTION_ENGINE_V1")],
  ["prompt builder", service.includes("buildAiReconstructionPrompt") && service.includes("Do not invent questions") && service.includes("Never silently discard")],
  ["structured NDIE inputs", service.includes("ocr") && service.includes("layout") && service.includes("formula") && service.includes("visual") && service.includes("assessment") && service.includes("evaluation") && service.includes("stemIntelligence")],
  ["page references and assets", service.includes("pageReferences") && service.includes("boundingBoxes") && service.includes("originalPageAssets") && service.includes("questionRelationships")],
  ["provider orchestrator routing", service.includes("ndieProviderOrchestratorService.router.route") && service.includes("fallbackChain")],
  ["fallback never blocks", service.includes("NDIE_FALLBACK") && service.includes("buildDeterministicDraft")],
  ["admin metadata", service.includes("promptChecksum") && service.includes("responseChecksum") && service.includes("estimatedCostUsd") && service.includes("latencyMs")],
  ["academy route", academyRoutes.includes("/exams/import/reconstruct")],
  ["academy controller", academyController.includes("reconstructExamImport")],
  ["academy service integration", academyService.includes("ndieAiReconstructionService.reconstruct") && academyService.includes("EXAM_IMPORT_RECONSTRUCTED")],
  ["npm script", packageJson.includes("test:ndie-reconstruction")]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", milestone: "production-launch-milestone-5-ai-reconstruction", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  milestone: "production-launch-milestone-5-ai-reconstruction",
  checks: required.length,
  capabilities: required.map(([name]) => name)
}, null, 2));
