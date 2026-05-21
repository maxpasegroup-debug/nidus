"use client";

import { motion } from "framer-motion";
import { ActivityTimeline, AnnouncementCard, DashboardError, DashboardSkeleton, ProgressCard, QuickActionCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useDirectorDashboard } from "@/hooks/use-dashboard";

export default function DirectorDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useDirectorDashboard();

  if (isLoading) return <RoleDashboardGuard role="DIRECTOR"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="DIRECTOR"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  const chartData = data.growthForecast.map((item) => ({ label: item.month, score: item.forecast, attendance: data.instituteAnalytics.attendance }));
  const focusAreas = data.customDashboard.focusAreas.length ? data.customDashboard.focusAreas : ["Admissions", "Revenue", "Academics", "Staff"];

  return (
    <RoleDashboardGuard role="DIRECTOR">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Director Control Room"
          title="Institution performance and decisions"
          description={`A clear executive dashboard for ${focusAreas.join(", ").toLowerCase()}, risk alerts, growth forecast, and Ask NIDUS institution summary.`}
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.instituteAnalytics.students), label: "students" },
            { value: `${data.admissionsAnalytics.conversionRate}%`, label: "admission conversion" },
            { value: `Rs ${Math.round(data.revenueAnalytics.collected / 100000)}L`, label: "collected" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Attendance" value={`${data.instituteAnalytics.attendance}%`} note="Institution average" />
          <StatCard label="CBT Completion" value={`${data.instituteAnalytics.cbtCompletion}%`} note="Assessment completion" />
          <StatCard label="Faculty Usage" value={`${data.facultyAnalytics.utilization}%`} note={`${data.facultyAnalytics.reviewDue} reviews due`} />
          <StatCard label="Pending Revenue" value={`Rs ${Math.round(data.revenueAnalytics.pending / 100000)}L`} note="Needs fee follow-up" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
          <PerformanceChart title="Growth forecast" data={chartData} />
          <div className="space-y-4">
            <ProgressCard title="Admissions conversion" value={data.admissionsAnalytics.conversionRate} label={`${data.admissionsAnalytics.admissions}/${data.admissionsAnalytics.leads} admitted`} />
            <ProgressCard title="Faculty performance" value={data.facultyAnalytics.utilization} label={`${data.facultyAnalytics.active} active teachers`} />
            <ActivityTimeline title="Risk alerts" items={data.riskAlerts} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Ask NIDUS</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Executive summary</h2>
            <div className="mt-5 grid gap-3">
              {data.executiveInsights.map((item) => <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AnnouncementCard title="Admissions health" description={`${data.admissionsAnalytics.leads} leads and ${data.admissionsAnalytics.admissions} admissions in the current view.`} tag="CRM" />
            <AnnouncementCard title="Revenue forecast" description={`Forecast is Rs ${Math.round(data.revenueAnalytics.forecast / 100000)}L.`} tag="Finance" />
            <AnnouncementCard title="Teacher review" description={`${data.facultyAnalytics.reviewDue} teacher reviews need attention.`} tag="Staff" />
            <AnnouncementCard title="Student performance" description="Use progress reports to inspect monthly growth and risk students." tag="Reports" />
          </div>
        </section>

        <SectionHeader eyebrow="Personal Command" title={`${data.customDashboard.designation || "Director"} focus areas`} action={data.customDashboard.department} />
        <section className="grid gap-4 md:grid-cols-4">
          {focusAreas.map((area) => (
            <AnnouncementCard key={area} title={area} description="Pinned to this director dashboard for daily review and decision making." tag="Focus" />
          ))}
        </section>

        <SectionHeader eyebrow="Executive Actions" title="Control important areas" />
        <section className="grid gap-4 md:grid-cols-3">
          <QuickActionCard title="Admissions analytics" description="Inspect lead, counselling, and admission movement." href="/crm/admissions" />
          <QuickActionCard title="Progress reports" description="Review monthly growth and risk students." href="/progress-reports" />
          <QuickActionCard title="Staff and HR" description="Review team structure, roles, and staff documents." href="/staff-hr" />
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
