"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/courses/empty-state";
import { AnalysisCard } from "@/components/psychometric/analysis-card";
import { PersonalityInsight } from "@/components/psychometric/personality-insight";
import { SectionHeader } from "@/components/dashboard";
import { usePsychometricResults } from "@/hooks/use-psychometric";
import { getApiErrorMessage } from "@/services/api";

export default function PsychometricResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId ?? "";
  const { data, isLoading, error } = usePsychometricResults(attemptId);

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-white/[0.06]" />;
  if (error || !data) return <EmptyState title="Unable to load result" description={getApiErrorMessage(error)} />;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Psychometric Result" title={data.attempt.test.title} action={`Score ${data.attempt.score}`} />
      <AnalysisCard title="Personality insights" body={data.attempt.aiAnalysis ?? "Analysis pending."} />
      <AnalysisCard title="Behavioral analysis" body={data.attempt.overallRemark ?? "Remark pending."} />
      <PersonalityInsight items={data.recommendations} />
    </div>
  );
}
