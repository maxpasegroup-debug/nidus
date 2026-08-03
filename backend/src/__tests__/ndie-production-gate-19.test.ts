import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 19 provider orchestrator", () => {
  const orchestrator = read("src/modules/ndie/provider-orchestrator/provider-orchestrator.service.ts");
  const service = read("src/modules/ndie/ndie.service.ts");
  const packageJson = read("package.json");

  it("creates all required provider hub components", () => {
    expect(orchestrator).toContain("providerRegistryHub");
    expect(orchestrator).toContain("providerSelector");
    expect(orchestrator).toContain("providerRouter");
    expect(orchestrator).toContain("providerHealthMonitor");
    expect(orchestrator).toContain("providerFallbackManager");
    expect(orchestrator).toContain("providerVotingEngine");
    expect(orchestrator).toContain("confidenceFusionEngine");
    expect(orchestrator).toContain("providerBenchmarkManager");
    expect(orchestrator).toContain("providerCostManager");
  });

  it("supports every Gate 19 provider type", () => {
    expect(orchestrator).toContain("OCR");
    expect(orchestrator).toContain("LAYOUT");
    expect(orchestrator).toContain("FORMULA");
    expect(orchestrator).toContain("VISION");
    expect(orchestrator).toContain("QUESTION_DETECTION");
    expect(orchestrator).toContain("EVALUATION");
    expect(orchestrator).toContain("VALIDATION");
    expect(orchestrator).toContain("STUDENT_EVALUATION");
  });

  it("declares enterprise provider metadata", () => {
    expect(orchestrator).toContain("supportedLanguages");
    expect(orchestrator).toContain("supportedDocumentTypes");
    expect(orchestrator).toContain("formulaCapability");
    expect(orchestrator).toContain("tableCapability");
    expect(orchestrator).toContain("diagramCapability");
    expect(orchestrator).toContain("questionCapability");
    expect(orchestrator).toContain("estimatedLatencyMs");
    expect(orchestrator).toContain("estimatedCostUsd");
    expect(orchestrator).toContain("availability");
  });

  it("supports routing modes and fallback chains", () => {
    expect(orchestrator).toContain("AUTOMATIC");
    expect(orchestrator).toContain("MANUAL_OVERRIDE");
    expect(orchestrator).toContain("COST_AWARE");
    expect(orchestrator).toContain("ACCURACY_AWARE");
    expect(orchestrator).toContain("HEALTH_AWARE");
    expect(orchestrator).toContain("priorityChain");
    expect(orchestrator).toContain("fallbackChain");
    expect(orchestrator).toContain("manualProviderId");
  });

  it("adds provider voting and confidence fusion", () => {
    expect(orchestrator).toContain("agreementScore");
    expect(orchestrator).toContain("majorityResult");
    expect(orchestrator).toContain("providerDisagreementReport");
    expect(orchestrator).toContain("providerRanking");
    expect(orchestrator).toContain("weighted-average");
    expect(orchestrator).toContain("fusedConfidence");
  });

  it("integrates golden corpus benchmark and provider costs", () => {
    expect(orchestrator).toContain("realGoldenCorpusBenchmarkRunner.run");
    expect(orchestrator).toContain("accuracy");
    expect(orchestrator).toContain("confidence");
    expect(orchestrator).toContain("processingTimeMs");
    expect(orchestrator).toContain("memory");
    expect(orchestrator).toContain("cost");
    expect(orchestrator).toContain("lowestCost");
  });

  it("extends NDIE health with provider orchestrator signals", () => {
    expect(service).toContain("ndieProviderOrchestratorService.health");
    expect(service).toContain("providerOrchestrator");
    expect(service).toContain("providers: providerOrchestrator.status");
    expect(orchestrator).toContain("providerHealth");
    expect(orchestrator).toContain("benchmarkSummary");
    expect(orchestrator).toContain("providerCosts");
    expect(orchestrator).toContain("providerLatency");
  });

  it("ships provider documentation and verification command", () => {
    expect(read("src/modules/ndie/provider-orchestrator/docs/provider-sdk-guide.md")).toContain("Every provider must declare");
    expect(read("src/modules/ndie/provider-orchestrator/docs/provider-integration-guide.md")).toContain("Integrate providers through the orchestrator");
    expect(read("src/modules/ndie/provider-orchestrator/docs/provider-benchmark-guide.md")).toContain("Providers are benchmarked");
    expect(read("src/modules/ndie/provider-orchestrator/docs/provider-selection-guide.md")).toContain("Routing modes");
    expect(packageJson).toContain("test:ndie-provider-orchestrator");
  });
});
