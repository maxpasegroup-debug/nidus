"use client";

import { EmptyState } from "@/components/courses/empty-state";
import { OLQProgressBar } from "@/components/psychometric/olq-progress-bar";
import { RadarChart } from "@/components/psychometric/radar-chart";
import { AnalysisCard } from "@/components/psychometric/analysis-card";
import { SectionHeader } from "@/components/dashboard";
import { useOLQReport } from "@/hooks/use-psychometric";
import { getApiErrorMessage } from "@/services/api";

const labels: Record<string, string> = {
  effectiveIntelligence: "Effective Intelligence",
  reasoningAbility: "Reasoning Ability",
  organizingAbility: "Organizing Ability",
  socialAdaptability: "Social Adaptability",
  cooperation: "Cooperation",
  senseOfResponsibility: "Responsibility",
  initiative: "Initiative",
  selfConfidence: "Self Confidence",
  speedOfDecision: "Speed of Decision",
  abilityToInfluence: "Influence",
  liveliness: "Liveliness",
  determination: "Determination",
  courage: "Courage",
  stamina: "Stamina",
  emotionalStability: "Emotional Stability"
};

export default function OLQReportPage() {
  const { data, isLoading, error } = useOLQReport();
  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-white/[0.06]" />;
  if (error || !data) return <EmptyState title="Unable to load OLQ report" description={getApiErrorMessage(error)} />;

  const chartData = Object.entries(labels).map(([key, label]) => ({
    trait: label,
    value: Number(data.score[key] ?? 0)
  }));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="OLQ Dashboard" title="Officer readiness report" action={`${data.insights.officerReadinessScore}% readiness`} />
      <RadarChart data={chartData} />
      <AnalysisCard title="AI assessment summary" body={data.insights.summary} />
      <section className="grid gap-4 lg:grid-cols-2">
        {chartData.map((item) => <OLQProgressBar key={item.trait} label={item.trait} value={item.value} />)}
      </section>
    </div>
  );
}
