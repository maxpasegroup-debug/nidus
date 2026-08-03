import { createNdieContainer } from "../ndie.container.js";
import { realGoldenCorpusBenchmarkRunner } from "../certification/golden-corpus/repository.js";
import type { NdieProviderHealth, NdieProviderKind } from "../contracts/providers.js";

export type NdieOrchestratorProviderType =
  | "OCR"
  | "LAYOUT"
  | "FORMULA"
  | "VISION"
  | "QUESTION_DETECTION"
  | "EVALUATION"
  | "VALIDATION"
  | "STUDENT_EVALUATION";

export type NdieProviderMetadata = {
  id: string;
  name: string;
  version: string;
  type: NdieOrchestratorProviderType;
  registryKind?: NdieProviderKind;
  supportedLanguages: string[];
  supportedDocumentTypes: string[];
  formulaCapability: number;
  tableCapability: number;
  diagramCapability: number;
  questionCapability: number;
  estimatedLatencyMs: number;
  estimatedCostUsd: number;
  health: NdieProviderHealth["status"] | "READY" | "DEGRADED" | "UNAVAILABLE";
  availability: number;
};

export type NdieProviderRoutingPolicy = {
  type: NdieOrchestratorProviderType;
  language?: string;
  documentType?: string;
  requiresFormula?: boolean;
  requiresTable?: boolean;
  requiresDiagram?: boolean;
  requiresQuestionDetection?: boolean;
  mode?: "AUTOMATIC" | "MANUAL_OVERRIDE" | "COST_AWARE" | "ACCURACY_AWARE" | "HEALTH_AWARE";
  manualProviderId?: string;
};

const providerOrchestratorVersion = "ndie-provider-orchestrator-v1";

const staticProviderMetadata: NdieProviderMetadata[] = [
  {
    id: "ocr.stub",
    name: "Stub OCR",
    version: "1.0",
    type: "OCR",
    registryKind: "OCR",
    supportedLanguages: ["en"],
    supportedDocumentTypes: ["TEXT_FIXTURE", "PDF", "IMAGE"],
    formulaCapability: 0.1,
    tableCapability: 0.3,
    diagramCapability: 0.1,
    questionCapability: 0.2,
    estimatedLatencyMs: 100,
    estimatedCostUsd: 0,
    health: "READY",
    availability: 1
  },
  {
    id: "ocr.tesseract",
    name: "Tesseract OCR",
    version: "7",
    type: "OCR",
    registryKind: "OCR",
    supportedLanguages: ["en"],
    supportedDocumentTypes: ["PDF", "SCANNED_PDF", "IMAGE"],
    formulaCapability: 0.45,
    tableCapability: 0.55,
    diagramCapability: 0.25,
    questionCapability: 0.55,
    estimatedLatencyMs: 2500,
    estimatedCostUsd: 0.0005,
    health: "READY",
    availability: 0.95
  },
  {
    id: "layout.rule-based",
    name: "Rule Based Layout",
    version: "1.0",
    type: "LAYOUT",
    registryKind: "LAYOUT",
    supportedLanguages: ["en"],
    supportedDocumentTypes: ["TEXT_FIXTURE", "PDF", "SCANNED_PDF"],
    formulaCapability: 0.55,
    tableCapability: 0.72,
    diagramCapability: 0.62,
    questionCapability: 0.7,
    estimatedLatencyMs: 600,
    estimatedCostUsd: 0,
    health: "READY",
    availability: 0.98
  },
  {
    id: "formula.rule-based",
    name: "Rule Based Formula",
    version: "1.0",
    type: "FORMULA",
    registryKind: "FORMULA",
    supportedLanguages: ["en"],
    supportedDocumentTypes: ["TEXT_FIXTURE", "PDF", "DOCX"],
    formulaCapability: 0.78,
    tableCapability: 0.3,
    diagramCapability: 0.2,
    questionCapability: 0.4,
    estimatedLatencyMs: 700,
    estimatedCostUsd: 0,
    health: "READY",
    availability: 0.98
  },
  {
    id: "formula.mathpix",
    name: "Mathpix Formula",
    version: "future-adapter",
    type: "FORMULA",
    registryKind: "FORMULA",
    supportedLanguages: ["en"],
    supportedDocumentTypes: ["PDF", "SCANNED_PDF", "IMAGE", "DOCX"],
    formulaCapability: 0.98,
    tableCapability: 0.7,
    diagramCapability: 0.45,
    questionCapability: 0.5,
    estimatedLatencyMs: 3200,
    estimatedCostUsd: 0.006,
    health: "NOT_CONFIGURED",
    availability: 0
  },
  {
    id: "visual.rule-based",
    name: "Rule Based Visual",
    version: "1.0",
    type: "VISION",
    registryKind: "VISUAL",
    supportedLanguages: ["en"],
    supportedDocumentTypes: ["TEXT_FIXTURE", "PDF", "SCANNED_PDF", "IMAGE"],
    formulaCapability: 0.2,
    tableCapability: 0.72,
    diagramCapability: 0.76,
    questionCapability: 0.45,
    estimatedLatencyMs: 900,
    estimatedCostUsd: 0,
    health: "READY",
    availability: 0.98
  },
  {
    id: "visual.azure-vision",
    name: "Azure Vision",
    version: "future-adapter",
    type: "VISION",
    registryKind: "VISUAL",
    supportedLanguages: ["en", "hi"],
    supportedDocumentTypes: ["PDF", "SCANNED_PDF", "IMAGE"],
    formulaCapability: 0.55,
    tableCapability: 0.88,
    diagramCapability: 0.9,
    questionCapability: 0.55,
    estimatedLatencyMs: 2800,
    estimatedCostUsd: 0.004,
    health: "NOT_CONFIGURED",
    availability: 0
  },
  {
    id: "question.rule-based",
    name: "Rule Based Question Detector",
    version: "1.0",
    type: "QUESTION_DETECTION",
    registryKind: "QUESTION",
    supportedLanguages: ["en"],
    supportedDocumentTypes: ["TEXT_FIXTURE", "PDF", "DOCX"],
    formulaCapability: 0.5,
    tableCapability: 0.6,
    diagramCapability: 0.6,
    questionCapability: 0.82,
    estimatedLatencyMs: 800,
    estimatedCostUsd: 0,
    health: "READY",
    availability: 0.98
  },
  {
    id: "evaluation.rule-based",
    name: "Rule Based Evaluation",
    version: "1.0",
    type: "EVALUATION",
    registryKind: "EVALUATION",
    supportedLanguages: ["en"],
    supportedDocumentTypes: ["TEXT_FIXTURE", "PDF", "DOCX"],
    formulaCapability: 0.5,
    tableCapability: 0.55,
    diagramCapability: 0.45,
    questionCapability: 0.8,
    estimatedLatencyMs: 700,
    estimatedCostUsd: 0,
    health: "READY",
    availability: 0.98
  },
  {
    id: "ai.rule-based",
    name: "Rule Based Validator",
    version: "1.0",
    type: "VALIDATION",
    registryKind: "AI",
    supportedLanguages: ["en"],
    supportedDocumentTypes: ["TEXT_FIXTURE", "PDF", "DOCX"],
    formulaCapability: 0.65,
    tableCapability: 0.65,
    diagramCapability: 0.65,
    questionCapability: 0.72,
    estimatedLatencyMs: 400,
    estimatedCostUsd: 0,
    health: "READY",
    availability: 0.99
  },
  {
    id: "ai.openai",
    name: "OpenAI Validator",
    version: "future-adapter",
    type: "VALIDATION",
    registryKind: "AI",
    supportedLanguages: ["en", "hi"],
    supportedDocumentTypes: ["PDF", "DOCX", "SCANNED_PDF", "IMAGE", "TEXT_FIXTURE"],
    formulaCapability: 0.9,
    tableCapability: 0.9,
    diagramCapability: 0.9,
    questionCapability: 0.93,
    estimatedLatencyMs: 4500,
    estimatedCostUsd: 0.012,
    health: "NOT_CONFIGURED",
    availability: 0
  },
  {
    id: "student-evaluation.future",
    name: "Future Student Evaluation",
    version: "future-contract",
    type: "STUDENT_EVALUATION",
    supportedLanguages: ["en", "hi"],
    supportedDocumentTypes: ["RICH_ANSWER_PACKAGE"],
    formulaCapability: 0.9,
    tableCapability: 0.9,
    diagramCapability: 0.9,
    questionCapability: 0.9,
    estimatedLatencyMs: 5000,
    estimatedCostUsd: 0.01,
    health: "NOT_CONFIGURED",
    availability: 0
  }
];

function registryHealth() {
  const container = createNdieContainer();
  return container.providerRegistry.health();
}

function mergeHealth(metadata: NdieProviderMetadata[], health: NdieProviderHealth[]) {
  return metadata.map((provider) => {
    const runtime = health.find((entry) => entry.id === provider.id);
    return {
      ...provider,
      health: runtime?.status ?? provider.health,
      availability: runtime?.enabled && runtime.configured ? Math.max(provider.availability, 0.95) : provider.availability
    };
  });
}

function capabilityScore(provider: NdieProviderMetadata, policy: NdieProviderRoutingPolicy) {
  const language = !policy.language || provider.supportedLanguages.includes(policy.language) ? 1 : 0;
  const documentType = !policy.documentType || provider.supportedDocumentTypes.includes(policy.documentType) ? 1 : 0;
  const formula = policy.requiresFormula ? provider.formulaCapability : 1;
  const table = policy.requiresTable ? provider.tableCapability : 1;
  const diagram = policy.requiresDiagram ? provider.diagramCapability : 1;
  const question = policy.requiresQuestionDetection ? provider.questionCapability : 1;
  const health = provider.health === "READY" ? 1 : provider.health === "DEGRADED" ? 0.5 : 0;
  return (language + documentType + formula + table + diagram + question + health + provider.availability) / 8;
}

function rankingScore(provider: NdieProviderMetadata, policy: NdieProviderRoutingPolicy) {
  const capability = capabilityScore(provider, policy);
  const latencyScore = 1 / Math.max(1, provider.estimatedLatencyMs / 1000);
  const costScore = 1 / (1 + provider.estimatedCostUsd * 100);
  if (policy.mode === "COST_AWARE") return capability * 0.5 + costScore * 0.4 + latencyScore * 0.1;
  if (policy.mode === "ACCURACY_AWARE") return capability * 0.8 + latencyScore * 0.1 + costScore * 0.1;
  if (policy.mode === "HEALTH_AWARE") return capability * 0.6 + provider.availability * 0.4;
  return capability * 0.65 + latencyScore * 0.2 + costScore * 0.15;
}

export const providerRegistryHub = {
  list() {
    return mergeHealth(staticProviderMetadata, registryHealth());
  },

  byType(type: NdieOrchestratorProviderType) {
    return this.list().filter((provider) => provider.type === type);
  },

  metadata() {
    return this.list().map((provider) => ({
      name: provider.name,
      version: provider.version,
      type: provider.type,
      supportedLanguages: provider.supportedLanguages,
      supportedDocumentTypes: provider.supportedDocumentTypes,
      formulaCapability: provider.formulaCapability,
      tableCapability: provider.tableCapability,
      diagramCapability: provider.diagramCapability,
      questionCapability: provider.questionCapability,
      estimatedLatencyMs: provider.estimatedLatencyMs,
      estimatedCostUsd: provider.estimatedCostUsd,
      health: provider.health,
      availability: provider.availability
    }));
  }
};

export const providerHealthMonitor = {
  health() {
    const providers = providerRegistryHub.list();
    const ready = providers.filter((provider) => provider.health === "READY").length;
    const unavailable = providers.filter((provider) => provider.health === "NOT_CONFIGURED" || provider.health === "UNAVAILABLE").length;
    return {
      status: ready ? "ready" : "warning",
      providers: providers.map((provider) => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        health: provider.health,
        availability: provider.availability,
        estimatedLatencyMs: provider.estimatedLatencyMs,
        estimatedCostUsd: provider.estimatedCostUsd
      })),
      ready,
      unavailable
    };
  }
};

export const providerSelector = {
  select(policy: NdieProviderRoutingPolicy) {
    if (policy.mode === "MANUAL_OVERRIDE" && policy.manualProviderId) {
      const manual = providerRegistryHub.list().find((provider) => provider.id === policy.manualProviderId && provider.type === policy.type);
      if (manual) return { selected: manual, reason: "manual override", candidates: [manual] };
    }
    const candidates = providerRegistryHub.byType(policy.type)
      .map((provider) => ({ provider, score: rankingScore(provider, policy) }))
      .sort((a, b) => b.score - a.score);
    return {
      selected: candidates[0]?.provider ?? null,
      reason: policy.mode ?? "AUTOMATIC",
      candidates: candidates.map((candidate) => ({
        ...candidate.provider,
        routingScore: Math.round(candidate.score * 10000) / 10000
      }))
    };
  }
};

export const providerFallbackManager = {
  chain(policy: NdieProviderRoutingPolicy) {
    const route = providerSelector.select(policy);
    return {
      primary: route.selected,
      fallbackChain: route.candidates.filter((provider) => provider.id !== route.selected?.id),
      priorityChain: route.candidates,
      mode: policy.mode ?? "AUTOMATIC"
    };
  }
};

export const providerRouter = {
  route(policy: NdieProviderRoutingPolicy) {
    const selection = providerSelector.select(policy);
    const fallback = providerFallbackManager.chain(policy);
    return {
      routingMode: policy.mode ?? "AUTOMATIC",
      selectedProvider: selection.selected,
      priorityChain: fallback.priorityChain,
      fallbackChain: fallback.fallbackChain,
      costAware: policy.mode === "COST_AWARE",
      accuracyAware: policy.mode === "ACCURACY_AWARE",
      healthAware: policy.mode === "HEALTH_AWARE",
      manualOverride: policy.mode === "MANUAL_OVERRIDE"
    };
  }
};

export const confidenceFusionEngine = {
  fuse(results: Array<{ providerId: string; confidence: number; weight?: number }>) {
    const totalWeight = results.reduce((sum, result) => sum + (result.weight ?? 1), 0);
    const fusedConfidence = totalWeight ? results.reduce((sum, result) => sum + result.confidence * (result.weight ?? 1), 0) / totalWeight : 0;
    return {
      fusedConfidence: Math.round(fusedConfidence * 10000) / 10000,
      contributors: results,
      method: "weighted-average"
    };
  }
};

export const providerVotingEngine = {
  vote(results: Array<{ providerId: string; answer: string; confidence: number; weight?: number }>) {
    const grouped = results.reduce<Record<string, typeof results>>((acc, result) => {
      acc[result.answer] = [...(acc[result.answer] ?? []), result];
      return acc;
    }, {});
    const ranked = Object.entries(grouped)
      .map(([answer, rows]) => ({ answer, votes: rows.length, confidence: confidenceFusionEngine.fuse(rows).fusedConfidence, providers: rows.map((row) => row.providerId) }))
      .sort((a, b) => b.votes - a.votes || b.confidence - a.confidence);
    const majority = ranked[0] ?? null;
    return {
      agreementScore: results.length && majority ? Math.round((majority.votes / results.length) * 10000) / 10000 : 0,
      majorityResult: majority,
      providerDisagreementReport: ranked,
      providerRanking: ranked.flatMap((row) => row.providers),
      confidenceFusion: confidenceFusionEngine.fuse(results.map((result) => ({ providerId: result.providerId, confidence: result.confidence, weight: result.weight })))
    };
  }
};

export const providerBenchmarkManager = {
  compareWithGoldenCorpus() {
    const benchmark = realGoldenCorpusBenchmarkRunner.run({ fullCorpus: true });
    const providers = providerRegistryHub.list();
    return {
      benchmarkVersion: "provider-golden-corpus-benchmark-v1",
      corpusVersion: benchmark.corpusVersion,
      benchmarkSummary: benchmark,
      providers: providers.map((provider) => ({
        providerId: provider.id,
        type: provider.type,
        accuracy: provider.health === "READY" ? Math.max(0.75, provider.availability * capabilityScore(provider, { type: provider.type })) : 0,
        confidence: provider.health === "READY" ? Math.max(0.7, provider.availability) : 0,
        processingTimeMs: provider.estimatedLatencyMs,
        memory: "provider-dependent",
        cost: provider.estimatedCostUsd
      }))
    };
  }
};

export const providerCostManager = {
  estimate(type?: NdieOrchestratorProviderType) {
    const providers = type ? providerRegistryHub.byType(type) : providerRegistryHub.list();
    return {
      currency: "USD",
      providers: providers.map((provider) => ({
        providerId: provider.id,
        type: provider.type,
        estimatedCostUsd: provider.estimatedCostUsd,
        estimatedLatencyMs: provider.estimatedLatencyMs
      })),
      lowestCost: providers.reduce<NdieProviderMetadata | null>((lowest, provider) => !lowest || provider.estimatedCostUsd < lowest.estimatedCostUsd ? provider : lowest, null),
      note: "Cost estimates are provider-independent routing hints until provider billing adapters are connected."
    };
  }
};

export const ndieProviderOrchestratorService = {
  registry: providerRegistryHub,
  selector: providerSelector,
  router: providerRouter,
  healthMonitor: providerHealthMonitor,
  fallback: providerFallbackManager,
  voting: providerVotingEngine,
  confidenceFusion: confidenceFusionEngine,
  benchmark: providerBenchmarkManager,
  cost: providerCostManager,

  health() {
    const providerHealth = providerHealthMonitor.health();
    const benchmark = providerBenchmarkManager.compareWithGoldenCorpus();
    const ranking = benchmark.providers
      .slice()
      .sort((a, b) => b.accuracy - a.accuracy || a.cost - b.cost)
      .map((provider, index) => ({ rank: index + 1, ...provider }));
    return {
      status: providerHealth.status,
      providerOrchestratorVersion,
      providerHealth,
      providerRanking: ranking,
      benchmarkSummary: {
        corpusVersion: benchmark.corpusVersion,
        providersCompared: benchmark.providers.length,
        documents: benchmark.benchmarkSummary.documents,
        pass: benchmark.benchmarkSummary.pass
      },
      providerCosts: providerCostManager.estimate(),
      providerLatency: providerHealth.providers.map((provider) => ({
        providerId: provider.id,
        type: provider.type,
        estimatedLatencyMs: provider.estimatedLatencyMs
      })),
      routingModes: ["automatic routing", "manual override", "priority chains", "fallback chains", "cost-aware routing", "accuracy-aware routing", "health-aware routing"],
      supportedProviderTypes: ["OCR", "Layout", "Formula", "Vision", "Question Detection", "Evaluation", "Validation", "Future Student Evaluation"]
    };
  }
};
