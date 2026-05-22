"use client";

import { motion } from "framer-motion";
import {
  ActivityTimeline,
  AnnouncementCard,
  AttendanceCard,
  DashboardError,
  DashboardSkeleton,
  ProgressCard,
  QuickActionCard,
  RoleDashboardGuard,
  SectionHeader,
  StatCard
} from "@/components/dashboard";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useParentDashboard } from "@/hooks/use-dashboard";

export default function ParentDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useParentDashboard();

  if (isLoading) return <RoleDashboardGuard role="PARENT"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="PARENT"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  const chartData = data.studentPerformance.trend.map((item) => ({ label: item.month, score: item.score ?? 0, attendance: item.attendance ?? 0 }));
  const assessmentProfile = data.assessmentProfile;

  return (
    <RoleDashboardGuard role="PARENT">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Parent Dashboard"
          title={data.linkedStudent ? `${data.linkedStudent.name}'s progress` : "Student progress and wellbeing"}
          description="A simple trust view for marks, attendance, discipline, fees, monthly reports, and academy communication."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: `${data.studentPerformance.averageScore}%`, label: "academic score" },
            { value: `${data.attendance.percentage}%`, label: "attendance" },
            { value: assessmentProfile ? `${assessmentProfile.profileAccuracy}%` : data.disciplineScore.grade, label: assessmentProfile ? "assessment profile" : "discipline" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard label="Academic Progress" value={`${data.studentPerformance.averageScore}%`} note={`${data.studentPerformance.improvement}% improvement this month`} />
          <StatCard label="Attendance" value={`${data.attendance.percentage}%`} note={`${data.attendance.present}/${data.attendance.total} sessions`} />
          <StatCard label="Assessment Reports" value={`${assessmentProfile?.completedCount ?? 0}/${assessmentProfile?.totalAssessments ?? 15}`} note={assessmentProfile?.latestReport?.title ?? "No report completed"} />
          <StatCard label="Discipline" value={data.disciplineScore.grade} note={data.disciplineScore.notes} />
          <StatCard label="Fee Status" value={data.feeStatus.status} note={`Due Rs ${data.feeStatus.dueAmount}`} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <PerformanceChart title="Monthly progress trend" data={chartData} />
          <div className="space-y-4">
            <AttendanceCard title="Attendance tracking" present={data.attendance.present} total={data.attendance.total} />
            <ProgressCard title="Assessment profile" value={assessmentProfile?.profileAccuracy ?? 0} label={assessmentProfile?.readinessBand ?? "Assessment reports pending"} />
            <ProgressCard title="Discipline score" value={data.disciplineScore.score} label={data.disciplineScore.notes} />
            <AnnouncementCard title="Next fee date" description={data.feeStatus.nextDueDate} tag="Finance" />
          </div>
        </section>

        <SectionHeader eyebrow="Assessment Intelligence" title="Psychometric report visibility" action={`${assessmentProfile?.reportReadyCount ?? 0} ready`} />
        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">NIDUS AI Report Summary</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">{assessmentProfile?.readinessBand ?? "Reports pending"}</h2>
            <div className="mt-5 grid gap-3">
              {[
                assessmentProfile ? `Completed reports: ${assessmentProfile.completedCount}/${assessmentProfile.totalAssessments}.` : "No psychometric report has been completed yet.",
                assessmentProfile?.averageScore ? `Average assessment score: ${assessmentProfile.averageScore}/100.` : "Average assessment score will appear after completion.",
                assessmentProfile?.strongestSignal ? `Strongest signal: ${assessmentProfile.strongestSignal.title} at ${assessmentProfile.strongestSignal.score}/100.` : "Strongest signal is pending.",
                assessmentProfile?.latestReport ? `Latest report: ${assessmentProfile.latestReport.title}.` : "Latest report will appear here."
              ].map((item) => <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>)}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(assessmentProfile?.completed ?? []).slice(0, 4).map((report) => (
              <AnnouncementCard key={report.attemptId} title={report.title} description={`${report.score}/100 • ${report.readinessBand}`} tag="Report" />
            ))}
            {assessmentProfile?.completed.length ? null : (
              <AnnouncementCard title="Start Officer Readiness" description="Ask the student to complete the first free assessment to unlock parent-friendly report intelligence." tag="Action" />
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Ask NIDUS</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Parent summary</h2>
            <div className="mt-5 grid gap-3">
              {[
                "Check the monthly progress report before the next counselling call.",
                assessmentProfile ? `Review ${assessmentProfile.latestReport?.title ?? "the latest assessment report"} before counselling.` : "Ask the student to complete a psychometric assessment for deeper guidance.",
                "Attendance is the fastest signal for discipline and performance consistency.",
                "Use messages for fee, report, or teacher follow-up questions."
              ].map((item) => <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>)}
            </div>
          </div>
          <ActivityTimeline title="Notifications" items={data.notifications} />
        </section>

        <SectionHeader eyebrow="Quick Actions" title="Parent actions" />
        <section className="grid gap-4 md:grid-cols-4">
          <QuickActionCard title="Open progress report" description="See marks, attendance, discipline, aptitude, and AI recommendations." href="/progress-reports" />
          <QuickActionCard title="Assessment guidance" description="Ask academy support to explain completed psychometric report signals." href="/messages" />
          <QuickActionCard title="Pay or view fees" description="Check dues, invoices, subscriptions, and receipts." href="/payments" />
          <QuickActionCard title="Message academy" description="Contact teacher, counsellor, or admin team." href="/messages" />
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
