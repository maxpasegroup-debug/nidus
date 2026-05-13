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

  return (
    <RoleDashboardGuard role="DIRECTOR">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Director Command Center"
          title="Executive institute control"
          description="Institute, admissions, revenue, CBT, faculty, attendance, operational risk, performance, and growth forecasting signals for branch-specific leadership."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.instituteAnalytics.students), label: "students" },
            { value: `${data.admissionsAnalytics.conversionRate}%`, label: "conversion" },
            { value: `Rs ${Math.round(data.revenueAnalytics.collected / 100000)}L`, label: "revenue" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Attendance" value={`${data.instituteAnalytics.attendance}%`} note="Institute average" />
          <StatCard label="CBT Completion" value={`${data.instituteAnalytics.cbtCompletion}%`} note="Assessment completion" />
          <StatCard label="Faculty Utilization" value={`${data.facultyAnalytics.utilization}%`} note={`${data.facultyAnalytics.reviewDue} reviews due`} />
          <StatCard label="Forecast" value={`Rs ${Math.round(data.revenueAnalytics.forecast / 100000)}L`} note="Growth forecasting shell" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <PerformanceChart title="Growth forecasting" data={chartData} />
          <div className="space-y-4">
            <ProgressCard title="Admissions conversion" value={data.admissionsAnalytics.conversionRate} label={`${data.admissionsAnalytics.admissions}/${data.admissionsAnalytics.leads} leads admitted`} />
            <ProgressCard title="Faculty analytics" value={data.facultyAnalytics.utilization} label={`${data.facultyAnalytics.active} active teachers`} />
            <ActivityTimeline title="Operational risk alerts" items={data.riskAlerts} />
          </div>
        </section>

        <SectionHeader eyebrow="Executive Modules" title="Command-center shortcuts" />
        <section className="grid gap-4 md:grid-cols-3">
          <AnnouncementCard title="AI executive insights" description={data.executiveInsights.join(" ")} tag="AI" />
          <QuickActionCard title="Admissions analytics" description="Inspect lead, counselling, and admissions funnels." href="/crm/admissions" />
          <QuickActionCard title="Staff performance" description="Review faculty and operations team signals." href="/admin-center" />
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
