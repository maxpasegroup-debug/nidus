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

  if (isLoading) {
    return (
      <RoleDashboardGuard role="PARENT">
        <DashboardSkeleton />
      </RoleDashboardGuard>
    );
  }

  if (error || !data) {
    return (
      <RoleDashboardGuard role="PARENT">
        <DashboardError error={error} onRefresh={() => refetch()} />
      </RoleDashboardGuard>
    );
  }

  const chartData = data.studentPerformance.trend.map((item) => ({
    label: item.month,
    score: item.score ?? 0,
    attendance: item.attendance ?? 0
  }));

  return (
    <RoleDashboardGuard role="PARENT">
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Parent Oversight"
        title="Student performance and wellbeing"
        description="A calm executive view of academics, attendance, discipline, fees, notifications, and counselling pathways."
        actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
        stats={[
          { value: `${data.studentPerformance.averageScore}%`, label: "performance" },
          { value: `${data.attendance.percentage}%`, label: "attendance" },
          { value: data.disciplineScore.grade, label: "discipline grade" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Performance" value={`${data.studentPerformance.averageScore}%`} note={`${data.studentPerformance.improvement}% improvement this month`} />
        <StatCard label="Attendance" value={`${data.attendance.percentage}%`} note="Class and drill participation" />
        <StatCard label="Discipline" value={data.disciplineScore.grade} note={data.disciplineScore.notes} />
        <StatCard label="Fees" value={data.feeStatus.status} note={`Next due ${data.feeStatus.nextDueDate}`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <PerformanceChart title="Progress charts" data={chartData} />
        <div className="space-y-4">
          <AttendanceCard title="Attendance tracking" present={data.attendance.present} total={data.attendance.total} />
          <ProgressCard title="Discipline score" value={data.disciplineScore.score} label={data.disciplineScore.notes} />
          <AnnouncementCard title="Payment status" description={`Due amount: ${data.feeStatus.dueAmount}`} tag="Finance" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ActivityTimeline title="Recent activity" items={data.notifications} />
        <AnnouncementCard title="Student" description={data.linkedStudent?.name ?? "No linked student found"} tag="Profile" />
        <QuickActionCard title="Book counselling" description="Reserve a parent-counsellor review slot." href="/crm/counselling" />
      </section>
    </motion.div>
    </RoleDashboardGuard>
  );
}
