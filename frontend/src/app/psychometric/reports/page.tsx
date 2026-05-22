"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, FileText, ShieldCheck, Sparkles, Target } from "lucide-react";
import { DashboardError, DashboardSkeleton, EmptyState, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { usePsychometricReportHistory } from "@/hooks/use-psychometric";
import { getApiErrorMessage } from "@/services/api";
import { downloadPsychometricReportPdf } from "@/services/psychometric";

function safeReportName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "assessment-report";
}

function formatDate(value: string) {
  if (!value) return "Date pending";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function PsychometricReportVaultPage() {
  const { data, isLoading, error, refetch } = usePsychometricReportHistory();
  const { showToast } = useToast();
  const [downloadingAttemptId, setDownloadingAttemptId] = useState<string | null>(null);

  async function handleDownload(attemptId: string, title: string) {
    try {
      setDownloadingAttemptId(attemptId);
      const blob = await downloadPsychometricReportPdf(attemptId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nidus-${safeReportName(title)}-${attemptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("PDF report downloaded.", "success");
    } catch (downloadError) {
      showToast(getApiErrorMessage(downloadError), "error");
    } finally {
      setDownloadingAttemptId(null);
    }
  }

  if (isLoading) return <RoleDashboardGuard role={["STUDENT", "GUEST", "ADMIN"]}><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role={["STUDENT", "GUEST", "ADMIN"]}><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  return (
    <RoleDashboardGuard role={["STUDENT", "GUEST", "ADMIN"]}>
      <div className="space-y-8">
        <section className="premium-surface rounded-lg p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Assessment Report Vault</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">Every completed assessment report in one command view.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Review NIDUS AI interpretations, open full result pages, download PDFs, and keep the Digital Profile connected with completed assessment signals.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button href="/psychometric" variant="secondary">Take Assessment</Button>
              <Button href="/digital-profile" variant="secondary">Open Digital Profile</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Completed" value={`${data.summary.completedCount}/${data.summary.totalAssessments}`} note="assessment reports connected" />
          <StatCard label="Profile Accuracy" value={`${data.summary.profileAccuracy}%`} note="digital profile signal strength" />
          <StatCard label="Average Score" value={`${data.summary.averageScore}/100`} note={data.summary.readinessBand} />
          <StatCard label="Reports Ready" value={String(data.summary.reportReadyCount)} note={data.summary.latestReport?.title ?? "Complete first assessment"} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">NIDUS AI Summary</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{data.summary.readinessBand}</h2>
              </div>
              <ShieldCheck className="h-6 w-6 text-gold" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded border border-white/10 bg-navy-deep/50 p-4">
                <p className="text-sm text-muted">Strongest report</p>
                <p className="mt-2 text-lg font-semibold text-white">{data.summary.strongestReport?.title ?? "Awaiting assessment"}</p>
                <p className="mt-1 text-sm text-gold-soft">{data.summary.strongestReport ? `${data.summary.strongestReport.score}/100` : "Complete any test to unlock"}</p>
              </div>
              <div className="rounded border border-white/10 bg-navy-deep/50 p-4">
                <p className="text-sm text-muted">Latest report</p>
                <p className="mt-2 text-lg font-semibold text-white">{data.summary.latestReport?.title ?? "No completed report"}</p>
                <p className="mt-1 text-sm text-gold-soft">{data.summary.latestReport ? formatDate(data.summary.latestReport.completedAt) : "Reports will appear here"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gold/20 bg-gold/10 p-5">
            <Sparkles className="h-6 w-6 text-gold" />
            <h3 className="mt-4 text-xl font-semibold text-white">Next best move</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Keep completing assessments until the Digital Profile reaches 100% assessment accuracy, then use Guru missions and counselling to convert insights into action.
            </p>
            <Link href="/guru" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold">
              Open NIDUS Guru <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <SectionHeader eyebrow="Completed Reports" title="Open, compare, and download" action={`${data.reports.length} reports`} />
        {data.reports.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.reports.map((report) => (
              <article key={report.attemptId} className="flex h-full flex-col rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.20)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded border border-gold/25 bg-gold/10 text-gold">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="rounded border border-gold/25 bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">{report.score}/100</span>
                </div>
                <p className="mt-5 text-lg font-semibold leading-tight text-white">{report.title}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-soft">{report.readinessBand}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{report.overallRemark || report.description}</p>
                <div className="mt-5 grid gap-2 rounded border border-white/10 bg-navy-deep/45 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted">Completed</span>
                    <span className="font-semibold text-white">{formatDate(report.completedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted">Answers</span>
                    <span className="font-semibold text-white">{report.answerCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted">Type</span>
                    <span className="font-semibold text-white">{report.type}</span>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button href={report.reportHref} size="sm" variant="secondary">Open Report</Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(report.attemptId, report.title)}
                    disabled={downloadingAttemptId === report.attemptId}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {downloadingAttemptId === report.attemptId ? "Preparing" : "PDF"}
                  </Button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <EmptyState title="No assessment reports yet" description="Complete one psychometric assessment to generate your first NIDUS AI report and downloadable PDF." />
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/psychometric/officer-readiness" className="flex min-h-14 items-center justify-between rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
            <span className="flex items-center gap-3"><Target className="h-5 w-5" /> Officer Readiness</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/psychometric/leadership-dna" className="flex min-h-14 items-center justify-between rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
            <span className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> Leadership DNA</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/psychometric/dream-addiction-index" className="flex min-h-14 items-center justify-between rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
            <span className="flex items-center gap-3"><Sparkles className="h-5 w-5" /> Dream Addiction Index</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </RoleDashboardGuard>
  );
}
