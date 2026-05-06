"use client";

import { motion } from "framer-motion";
import {
  ActivityTimeline,
  AnnouncementCard,
  AttendanceCard,
  DashboardError,
  DashboardSkeleton,
  EmptyState,
  ExamHomepageCards,
  ProgressCard,
  QuickActionCard,
  RoleDashboardGuard,
  SectionHeader,
  StatCard
} from "@/components/dashboard";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { PageHero } from "@/components/layout/page-hero";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { useStudentDashboard } from "@/hooks/use-dashboard";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useStudentDashboard();

  if (isLoading) {
    return (
      <RoleDashboardGuard role="STUDENT">
        <DashboardSkeleton />
      </RoleDashboardGuard>
    );
  }

  if (error || !data) {
    return (
      <RoleDashboardGuard role="STUDENT">
        <DashboardError error={error} onRefresh={() => refetch()} />
      </RoleDashboardGuard>
    );
  }

  const chartData = data.attendance.trend.map((item) => ({
    label: item.month,
    score: item.attendance,
    attendance: item.attendance
  }));

  return (
    <RoleDashboardGuard role="STUDENT">
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Student Command Deck"
        title={`Welcome back, ${user?.name ?? "cadet"}`}
        description="Your daily study plan, performance signals, attendance, tests, and AI recommendations are aligned for today's training cycle."
        actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh dashboard"}</Button>}
        stats={[
          { value: String(data.enrolledCourses.length), label: "enrolled courses" },
          { value: `${data.attendance.percentage}%`, label: "attendance readiness" },
          { value: `#${data.leaderboardRank.rank}`, label: "leaderboard rank" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Enrolled Courses" value={String(data.enrolledCourses.length)} note={data.enrolledCourses[0]?.nextLesson ?? "No active courses"} />
        <StatCard label="Upcoming Tests" value={String(data.upcomingTests.length)} note={data.upcomingTests[0]?.title ?? "No upcoming tests"} />
        <StatCard label="Leaderboard Rank" value={`#${data.leaderboardRank.rank}`} note={`Top ${100 - data.leaderboardRank.percentile}% in ${data.leaderboardRank.batch}`} />
      </section>

      <SectionHeader eyebrow="Exam Tracks" title="Dashboard homepage cards" action="Explore active preparation paths" />
      <ExamHomepageCards />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <PerformanceChart title="Performance analytics" data={chartData} />
        <div className="space-y-4">
          <AttendanceCard title="Attendance summary" present={data.attendance.present} total={data.attendance.total} />
          <ProgressCard title="Daily study plan" value={data.enrolledCourses[0]?.progress ?? 0} label={data.enrolledCourses[0]?.title ?? "No course plan"} />
          <ProgressCard title="Fitness tracker preview" value={data.fitnessProgress.score} label={`${data.fitnessProgress.focus}, ${data.fitnessProgress.streakDays} day streak`} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <AnnouncementCard title="Current affairs widget" description={data.upcomingTests[0]?.title ?? "No active test brief today."} tag="Brief" />
        <AnnouncementCard title="AI recommendations" description={data.aiRecommendations.join(" ")} tag="AI" />
        <ActivityTimeline title="Recent learning activity" items={data.recentActivities} />
      </section>

      <SectionHeader eyebrow="Quick Actions" title="Move fast through your study loop" />
      <section className="grid gap-4 md:grid-cols-3">
        <QuickActionCard title="Start mock test" description="Launch the next NDA timed assessment." href="/tests" />
        <QuickActionCard title="Open study planner" description="Review today's academic and fitness targets." href="/ai-study-planner" />
        <QuickActionCard title="View leaderboard" description="Compare quiz momentum with your batch." href="/leaderboard" />
      </section>

      {data.enrolledCourses.length === 0 ? (
        <EmptyState title="No enrolled courses" description="Your courses will appear here after enrollment." />
      ) : null}
    </motion.div>
    </RoleDashboardGuard>
  );
}
