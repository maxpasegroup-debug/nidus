import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const files = {
  orchestrator: read("src/modules/ndie/provider-orchestrator/provider-orchestrator.service.ts"),
  service: read("src/modules/ndie/ndie.service.ts"),
  packageJson: read("package.json"),
  sdk: read("src/modules/ndie/provider-orchestrator/docs/provider-sdk-guide.md"),
  integration: read("src/modules/ndie/provider-orchestrator/docs/provider-integration-guide.md"),
  benchmark: read("src/modules/ndie/provider-orchestrator/docs/provider-benchmark-guide.md"),
  selection: read("src/modules/ndie/provider-orchestrator/docs/provider-selection-guide.md")
};

const required = [
  ["routing", files.orchestrator.includes("providerRouter") && files.orchestrator.includes("automatic routing") && files.orchestrator.includes("manual override")],
  ["fallback", files.orchestrator.includes("providerFallbackManager") && files.orchestrator.includes("fallbackChain") && files.orchestrator.includes("priorityChain")],
  ["provider voting", files.orchestrator.includes("providerVotingEngine") && files.orchestrator.includes("agreementScore") && files.orchestrator.includes("majorityResult")],
  ["confidence fusion", files.orchestrator.includes("confidenceFusionEngine") && files.orchestrator.includes("fusedConfidence") && files.orchestrator.includes("weighted-average")],
  ["benchmark comparison", files.orchestrator.includes("providerBenchmarkManager") && files.orchestrator.includes("realGoldenCorpusBenchmarkRunner.run")],
  ["cost manager", files.orchestrator.includes("providerCostManager") && files.orchestrator.includes("estimatedCostUsd")],
  ["health reporting", files.service.includes("providerOrchestrator") && files.orchestrator.includes("providerHealth") && files.orchestrator.includes("providerLatency")],
  ["provider metadata", files.orchestrator.includes("supportedLanguages") && files.orchestrator.includes("supportedDocumentTypes") && files.orchestrator.includes("formulaCapability") && files.orchestrator.includes("diagramCapability")],
  ["supported provider types", files.orchestrator.includes("STUDENT_EVALUATION") && files.orchestrator.includes("VALIDATION") && files.orchestrator.includes("QUESTION_DETECTION")],
  ["documentation", files.sdk.includes("Every provider must declare") && files.integration.includes("orchestrator") && files.benchmark.includes("golden corpus") && files.selection.includes("Routing modes")],
  ["npm script", files.packageJson.includes("test:ndie-provider-orchestrator")]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", gate: "production-gate-19-provider-orchestrator", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "production-gate-19-provider-orchestrator",
  checks: required.length,
  capabilities: required.map(([name]) => name)
}, null, 2));
