"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/courses/empty-state";
import { NidusAiOrbit } from "@/components/nidus-ai/nidus-ai-orbit";
import { nidusFinalInterpretation, nidusGenerateReport } from "@/components/psychometric/nidus-ai-assessment-engine";
import { NidusAiReportView } from "@/components/psychometric/nidus-ai-report-view";
import { AnalysisCard } from "@/components/psychometric/analysis-card";
import { PersonalityInsight } from "@/components/psychometric/personality-insight";
import { SectionHeader } from "@/components/dashboard";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { usePsychometricResults } from "@/hooks/use-psychometric";
import { getApiErrorMessage } from "@/services/api";
import { downloadPsychometricReportPdf } from "@/services/psychometric";

function safeReportName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "psychometric-report";
}

export default function PsychometricResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId ?? "";
  const { data, isLoading, error } = usePsychometricResults(attemptId);
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-[#071d36]/10" />;
  if (error || !data) return <EmptyState title="Unable to load result" description={getApiErrorMessage(error)} />;
  const report = nidusGenerateReport(data);

  async function handleDownloadPdf() {
    if (!data) return;
    try {
      setIsDownloading(true);
      const blob = await downloadPsychometricReportPdf(attemptId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nidus-${safeReportName(data.attempt.test.title)}-${attemptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("PDF report downloaded.", "success");
    } catch (downloadError) {
      showToast(getApiErrorMessage(downloadError), "error");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Psychometric Result" title={data.attempt.test.title} action={`Score ${data.attempt.score}`} />
      <div className="flex flex-col gap-3 rounded-lg border border-[#071d36]/10 bg-white p-4 shadow-[0_18px_45px_rgba(7,29,54,0.10)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#071d36]">Detailed NIDUS AI report is ready</p>
          <p className="mt-1 text-sm text-[#40516a]">Download the assessment interpretation, dimension scores, counselling summary, and action plan as a PDF.</p>
        </div>
        <Button type="button" variant="secondary" onClick={handleDownloadPdf} disabled={isDownloading} className="shrink-0">
          {isDownloading ? "Preparing PDF..." : "Download PDF Report"}
        </Button>
      </div>
      <NidusAiOrbit message={nidusFinalInterpretation(data)} mood="report" />
      <NidusAiReportView report={report} />
      <AnalysisCard title="Personality insights" body={data.attempt.aiAnalysis ?? "Analysis pending."} />
      <AnalysisCard title="Behavioral analysis" body={data.attempt.overallRemark ?? "Remark pending."} />
      <PersonalityInsight items={data.recommendations} />
    </div>
  );
}
