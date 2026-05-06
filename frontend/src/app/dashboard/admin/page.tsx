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
import { useAdminDashboard } from "@/hooks/use-dashboard";

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useAdminDashboard();

  if (isLoading) {
    return (
      <RoleDashboardGuard role="ADMIN">
        <DashboardSkeleton />
      </RoleDashboardGuard>
    );
  }

  if (error || !data) {
    return (
      <RoleDashboardGuard role="ADMIN">
        <DashboardError error={error} onRefresh={() => refetch()} />
      </RoleDashboardGuard>
    );
  }

  const chartData = data.attendanceAnalytics.trend.map((item) => ({
    label: item.month,
    score: item.attendance,
    attendance: item.attendance
  }));

  return (
    <RoleDashboardGuard role="ADMIN">
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Admin Command"
        title="Institution operations overview"
        description="Live admissions, attendance, revenue, hostel, staff, and operational readiness signals for management review."
        actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
        stats={[
          { value: String(data.totalStudents), label: "students" },
          { value: `${data.attendanceAnalytics.average}%`, label: "attendance" },
          { value: String(data.staffSummary.totalStaff), label: "staff strength" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Students" value={String(data.totalStudents)} note="Registered student users" />
        <StatCard label="Attendance" value={`${data.attendanceAnalytics.average}%`} note="Average attendance analytics" />
        <StatCard label="Revenue" value={`Rs ${Math.round(data.totalRevenue.amount / 100000)}L`} note={`${data.totalRevenue.quarter} collected revenue`} />
        <StatCard label="Staff" value={String(data.staffSummary.totalStaff)} note="Faculty, mentors and operations team" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <PerformanceChart title="Graphs and reports" data={chartData} />
        <div className="space-y-4">
          <AttendanceCard title="Attendance analytics" present={data.attendanceAnalytics.presentToday} total={data.attendanceAnalytics.totalMarked} />
          <ProgressCard title="Hostel occupancy" value={data.hostelStats.occupancyPercentage} label={`${data.hostelStats.occupiedBeds}/${data.hostelStats.totalBeds} beds occupied`} />
          <ProgressCard title="Faculty coverage" value={Math.round((data.staffSummary.faculty / data.staffSummary.totalStaff) * 100)} label="Faculty share of staff" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ActivityTimeline title="Recent admissions" items={data.recentAdmissions.map((user) => `${user.name} joined as ${user.role}`)} />
        <AnnouncementCard title="Notifications panel" description={`${data.recentAdmissions.length} recent admissions loaded from backend.`} tag="Ops" />
        <AnnouncementCard title="Staff overview" description={`${data.staffSummary.faculty} faculty, ${data.staffSummary.mentors} mentors, ${data.staffSummary.operations} operations staff.`} tag="Staff" />
      </section>

      <SectionHeader eyebrow="Management" title="Quick management shortcuts" />
      <section className="grid gap-4 md:grid-cols-3">
        <QuickActionCard title="Admissions" description="Review new applications and lead source reports." href="/crm/admissions" />
        <QuickActionCard title="Courses" description="Manage modules, tests, batches and faculty ownership." href="/courses" />
        <QuickActionCard title="Reports" description="Open executive controls, audit logs, and system settings." href="/admin-center" />
      </section>
    </motion.div>
    </RoleDashboardGuard>
  );
}
