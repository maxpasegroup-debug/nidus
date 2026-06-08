"use client";

import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, BarChart3, CheckCircle2, FileText, ShieldCheck, Users } from "lucide-react";
import { AnnouncementCard, DashboardError, DashboardSkeleton, ProgressCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { usePsychometricAdminOverview, usePsychometricAnalytics, usePsychometricReadiness } from "@/hooks/use-psychometric";

function formatDate(value: string) {
  if (!value) return "Date pending";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function PsychometricAdminPage() {
  const { data, isLoading, error, refetch, isFetching } = usePsychometricAdminOverview();
  const analytics = usePsychometricAnalytics();
  const readiness = usePsychometricReadiness();

  if (isLoading) return <RoleDashboardGuard role={["ADMIN", "DIRECTOR"]}><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role={["ADMIN", "DIRECTOR"]}><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  return (
    <RoleDashboardGuard role={["ADMIN", "DIRECTOR"]}>
      <div className="space-y-8">
        <PageHero
          eyebrow="Assessment Command"
          title="Psychometric ecosystem performance"
          description="Track assessment adoption, completed reports, low-score signals, student engagement, and the reports that need counselling attention."
          actions={<Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}>{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.summary.completedReports), label: "reports ready" },
            { value: `${data.summary.adoptionRate}%`, label: "student adoption" },
            { value: `${data.summary.averageScore}/100`, label: data.summary.readinessBand }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard label="Assessments" value={String(data.summary.totalAssessments)} note="Seeded psychometric ecosystem" />
          <StatCard label="Active Students" value={String(data.summary.activeStudents)} note={`${data.summary.totalStudents} total students`} />
          <StatCard label="Attempts" value={String(data.summary.totalAttempts)} note={`${data.summary.completionRate}% completion rate`} />
          <StatCard label="Average Score" value={`${data.summary.averageScore}/100`} note={data.summary.readinessBand} />
          <StatCard label="Needs Review" value={String(data.summary.lowScoreCount)} note="Scores below 55" />
        </section>

        <section className="premium-surface rounded-lg p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Production Readiness</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Assessment release health</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Verifies catalog count, active status, 30-question minimum, access tier mix, and durable report snapshot coverage.
              </p>
            </div>
            <div className="rounded border border-gold/25 bg-gold/10 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-soft">{readiness.data?.status ?? "Checking"}</p>
              <p className="mt-1 text-3xl font-semibold text-gold">{readiness.data ? `${readiness.data.readinessScore}/100` : "--"}</p>
            </div>
          </div>
          {readiness.data ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Catalog", `${readiness.data.summary.totalAssessments}/${readiness.data.expectedAssessments}`],
                  ["Active", `${readiness.data.summary.activeAssessments}/${readiness.data.summary.totalAssessments}`],
                  ["30+ Questions", `${readiness.data.summary.questionReadyAssessments}/${readiness.data.summary.totalAssessments}`],
                  ["Snapshot Cover", `${readiness.data.summary.reportSnapshotCoverage}%`]
                ].map(([label, value]) => (
                  <div key={label} className="rounded border border-white/10 bg-navy-deep/55 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded border border-white/10 bg-navy-deep/55 p-4">
                <p className="text-sm font-semibold text-white">Release issues</p>
                <div className="mt-3 grid gap-2">
                  {readiness.data.issues.length ? readiness.data.issues.map((issue) => (
                    <div key={issue} className="flex items-start gap-3 rounded border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm leading-6 text-amber-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{issue}</span>
                    </div>
                  )) : (
                    <div className="flex items-start gap-3 rounded border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm leading-6 text-emerald-100">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>All release checks are clear.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-muted">{readiness.isLoading ? "Checking readiness..." : "Readiness check unavailable."}</p>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <ProgressCard title="Adoption Rate" value={data.summary.adoptionRate} label={`${data.summary.activeStudents}/${data.summary.totalStudents} students have completed reports`} />
            <ProgressCard title="Report Completion" value={data.summary.completionRate} label={`${data.summary.completedReports}/${data.summary.totalAttempts} attempts completed`} />
            <ProgressCard title="Readiness Average" value={data.summary.averageScore} label={data.summary.readinessBand} />
          </div>
          <div className="premium-surface rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">NIDUS AI Operations Summary</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">Counselling and adoption signals</h2>
              </div>
              <BarChart3 className="h-6 w-6 text-gold" />
            </div>
            <div className="mt-5 grid gap-3">
              {[
                `${data.summary.completedReports} completed assessment reports are available for review.`,
                `${data.summary.lowScoreCount} reports are below 55 and should be checked for counselling or mentor follow-up.`,
                `Average assessment readiness is ${data.summary.averageScore}/100, classified as ${data.summary.readinessBand.toLowerCase()}.`,
                `${data.summary.adoptionRate}% of students have at least one completed psychometric report.`
              ].map((item) => (
                <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>
              ))}
            </div>
          </div>
        </section>

        {analytics.data ? (
          <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1.2fr]">
            <div className="premium-surface rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Readiness Bands</p>
              <h2 className="mt-3 text-xl font-semibold text-ink">Student distribution</h2>
              <div className="mt-5 space-y-3">
                {analytics.data.readinessBands.length ? analytics.data.readinessBands.map((band) => (
                  <div key={band.band} className="rounded border border-white/10 bg-navy-deep/55 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-white">{band.band}</span>
                      <span className="text-gold-soft">{band.count}</span>
                    </div>
                  </div>
                )) : <p className="text-sm leading-6 text-muted">No completed reports yet.</p>}
              </div>
            </div>

            <div className="premium-surface rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Dimension Analytics</p>
              <h2 className="mt-3 text-xl font-semibold text-ink">Weakest average signals</h2>
              <div className="mt-5 space-y-3">
                {analytics.data.dimensionAverages.slice(0, 6).map((dimension) => (
                  <div key={dimension.dimension} className="rounded border border-white/10 bg-navy-deep/55 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-white">{dimension.label}</span>
                      <span className="text-gold-soft">{dimension.averageScore}/100</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${dimension.averageScore}%` }} />
                    </div>
                  </div>
                ))}
                {!analytics.data.dimensionAverages.length ? <p className="text-sm leading-6 text-muted">Dimension averages will appear after report snapshots are generated.</p> : null}
              </div>
            </div>

            <div className="premium-surface rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Counselling Priority</p>
              <h2 className="mt-3 text-xl font-semibold text-ink">Reports needing action</h2>
              <div className="mt-5 space-y-3">
                {analytics.data.counsellingPriority.length ? analytics.data.counsellingPriority.slice(0, 5).map((report) => (
                  <Link key={report.attemptId} href={report.reportHref} className="block rounded border border-white/10 bg-navy-deep/55 p-4 transition hover:-translate-y-0.5 hover:border-gold/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{report.studentName}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">{report.testTitle}</p>
                      </div>
                      <span className="rounded border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-100">{report.score}/100</span>
                    </div>
                  </Link>
                )) : <p className="text-sm leading-6 text-muted">No low-score counselling priorities in the current sample.</p>}
              </div>
            </div>
          </section>
        ) : null}

        <SectionHeader eyebrow="Top Assessments" title="Most used psychometric tests" action={`${data.topAssessments.length} active`} />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.topAssessments.length ? data.topAssessments.map((assessment) => (
            <AnnouncementCard
              key={assessment.testId}
              title={assessment.title}
              description={`${assessment.attempts} completed reports with ${assessment.averageScore}/100 average score.`}
              tag={assessment.type}
            />
          )) : (
            <AnnouncementCard title="No assessment usage yet" description="Completed student reports will appear here after the first submission." tag="Pending" />
          )}
        </section>

        <SectionHeader eyebrow="Recent Reports" title="Reports needing visibility" action={`${data.recentReports.length} latest`} />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.recentReports.length ? data.recentReports.map((report) => (
            <article key={report.attemptId} className="flex h-full flex-col rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.20)]">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded border border-gold/25 bg-gold/10 text-gold">
                  {report.score < 55 ? <AlertTriangle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <span className="rounded border border-gold/25 bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">{report.score}/100</span>
              </div>
              <p className="mt-5 text-sm font-semibold text-gold-soft">{report.studentName}</p>
              <h3 className="mt-2 text-lg font-semibold leading-tight text-white">{report.title}</h3>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-soft">{report.readinessBand}</p>
              <div className="mt-5 grid gap-2 rounded border border-white/10 bg-navy-deep/45 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Completed</span>
                  <span className="font-semibold text-white">{formatDate(report.completedAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Answers</span>
                  <span className="font-semibold text-white">{report.answerCount}</span>
                </div>
              </div>
              <Link href={report.reportHref} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
                Open Report <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          )) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 md:col-span-2 xl:col-span-3">
              <p className="text-sm font-semibold text-white">No completed reports yet.</p>
              <p className="mt-2 text-sm leading-6 text-muted">Ask students to start Officer Readiness, Discipline Index, Leadership DNA, or Dream Addiction Index.</p>
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Link href="/psychometric/admin/manage" className="flex min-h-14 items-center justify-between rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
            <span className="flex items-center gap-3"><BarChart3 className="h-5 w-5" /> Manage Assessments</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/dashboard/admin" className="flex min-h-14 items-center justify-between rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
            <span className="flex items-center gap-3"><Users className="h-5 w-5" /> Management Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/progress-reports" className="flex min-h-14 items-center justify-between rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
            <span className="flex items-center gap-3"><Activity className="h-5 w-5" /> Progress Reports</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/psychometric" className="flex min-h-14 items-center justify-between rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
            <span className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> Assessment Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </RoleDashboardGuard>
  );
}
