type RenderableReport = {
  title?: string;
  audience?: string;
  summary?: {
    assessmentScore?: number;
    readinessScore?: number;
    readinessBand?: string;
    readinessLabel?: string;
    readinessDescription?: string;
  };
  strengths?: string[];
  improvementAreas?: string[];
  riskSignals?: Array<{ type?: string; level?: string; reason?: string | null }>;
  integritySummary?: { score?: number; flags?: Array<{ type?: string; severity?: string; reason?: string | null }> };
  confidenceSummary?: { score?: number; band?: string };
  traits?: Array<{ name?: string; score?: number; confidenceScore?: number }>;
  dimensions?: Array<{ name?: string; trait?: string; score?: number; confidenceScore?: number }>;
  actionRecommendations?: string[];
  retakeRecommendation?: string;
  metadata?: {
    version?: number;
    generatedAt?: string;
  };
};

function asReport(value: unknown): RenderableReport {
  return value && typeof value === "object" ? value as RenderableReport : {};
}

function list(items: unknown[] | undefined) {
  return items?.length ? items : ["No items recorded yet."];
}

export const assessmentReportRendererService = {
  render(snapshot: { id: string; audience: string; report: unknown; createdAt: Date }) {
    const report = asReport(snapshot.report);
    const version = report.metadata?.version ?? 1;
    return {
      id: snapshot.id,
      title: report.title ?? "NIDUS Defence Assessment Report",
      subtitle: `${snapshot.audience} Report v${version}`,
      generatedAt: report.metadata?.generatedAt ?? snapshot.createdAt,
      sections: [
        {
          title: "Assessment Summary",
          rows: [
            ["Assessment Score", `${report.summary?.assessmentScore ?? 0}`],
            ["Readiness Score", `${report.summary?.readinessScore ?? 0}`],
            ["Readiness Band", report.summary?.readinessBand ?? "Not available"],
            ["Readiness", report.summary?.readinessLabel ?? "Not available"],
            ["Meaning", report.summary?.readinessDescription ?? "Not available"]
          ]
        },
        { title: "Strengths", bullets: list(report.strengths) },
        { title: "Improvement Areas", bullets: list(report.improvementAreas) },
        {
          title: "Trait Scores",
          rows: report.traits?.map((trait) => [trait.name ?? "Trait", `${trait.score ?? 0}`, `Confidence ${trait.confidenceScore ?? 0}`]) ?? []
        },
        {
          title: "Dimension Scores",
          rows: report.dimensions?.map((dimension) => [
            dimension.name ?? "Dimension",
            dimension.trait ?? "Trait",
            `${dimension.score ?? 0}`
          ]) ?? []
        },
        {
          title: "Risk Signals",
          bullets: list(report.riskSignals?.map((signal) => `${signal.level ?? "RISK"} ${signal.type ?? "Signal"}: ${signal.reason ?? "Review required."}`))
        },
        {
          title: "Integrity & Confidence",
          rows: [
            ["Integrity Score", `${report.integritySummary?.score ?? 0}`],
            ["Integrity Flags", `${report.integritySummary?.flags?.length ?? 0}`],
            ["Confidence Score", `${report.confidenceSummary?.score ?? 0}`],
            ["Confidence Band", report.confidenceSummary?.band ?? "Not available"]
          ]
        },
        { title: "Recommendations", bullets: list(report.actionRecommendations) },
        { title: "Retake Guidance", bullets: [report.retakeRecommendation ?? "Retake guidance will be generated after mentor review."] }
      ]
    };
  }
};
