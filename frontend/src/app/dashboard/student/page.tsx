"use client";

import { motion } from "framer-motion";
import {
  ActivityTimeline,
  AnnouncementCard,
  AttendanceCard,
  DashboardError,
  DashboardSkeleton,
  EmptyState,
  ProgressCard,
  QuickActionCard,
  RoleDashboardGuard,
  SectionHeader,
  StatCard
} from "@/components/dashboard";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { PageHero } from "@/components/layout/page-hero";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { Button } from "@/components/ui/button";
import { useStudentDashboard } from "@/hooks/use-dashboard";

const studentActions = [
  { title: "Continue course", description: "Open your enrolled lessons and complete today's study target.", href: "/my-courses" },
  { title: "Attempt test", description: "Start a mock test, monthly test, or practice set.", href: "/tests" },
  { title: "See progress report", description: "Review your monthly growth score and next actions.", href: "/progress-reports" },
  { title: "Ask NIDUS", description: "Use AI study planner for what to do next.", href: "/ai-study-planner" },
  { title: "Aptitude / psychometric", description: "Take monthly IQ, EQ, OLQ and officer-readiness tests.", href: "/psychometric" },
  { title: "Check leaderboard", description: "See rank, momentum, and batch competition.", href: "/leaderboard" }
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useStudentDashboard();

  if (isLoading) return <RoleDashboardGuard role="STUDENT"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="STUDENT"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  const chartData = data.attendance.trend.map((item) => ({ label: item.month, score: item.attendance, attendance: item.attendance }));
  const activeCourse = data.enrolledCourses[0];

  return (
    <RoleDashboardGuard role="STUDENT">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Student Dashboard"
          title={`Your training plan, ${user?.name ?? "cadet"}`}
          description="A simple daily view for courses, tests, attendance, leaderboard rank, progress report, and Ask NIDUS guidance."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.enrolledCourses.length), label: "courses" },
            { value: `${data.attendance.percentage}%`, label: "attendance" },
            { value: `#${data.leaderboardRank.rank}`, label: data.leaderboardRank.batch }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Current Course" value={activeCourse ? `${activeCourse.progress}%` : "0"} note={activeCourse?.title ?? "No active course"} />
          <StatCard label="Upcoming Tests" value={String(data.upcomingTests.length)} note={data.upcomingTests[0]?.title ?? "No test scheduled"} />
          <StatCard label="Attendance" value={`${data.attendance.percentage}%`} note={`${data.attendance.present}/${data.attendance.total} sessions`} />
          <StatCard label="Leaderboard" value={`#${data.leaderboardRank.rank}`} note={`Top ${100 - data.leaderboardRank.percentile}%`} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <PerformanceChart title="Attendance and consistency" data={chartData} />
          <div className="space-y-4">
            <AttendanceCard title="Attendance summary" present={data.attendance.present} total={data.attendance.total} />
            <ProgressCard title="Course progress" value={activeCourse?.progress ?? 0} label={activeCourse?.nextLesson ?? "Enroll in a course"} />
            <ProgressCard title="Fitness progress" value={data.fitnessProgress.score} label={`${data.fitnessProgress.focus}, ${data.fitnessProgress.streakDays} day streak`} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Ask NIDUS</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">What to do today</h2>
            <div className="mt-5 grid gap-3">
              {data.aiRecommendations.map((item) => <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>)}
            </div>
          </div>
          <ActivityTimeline title="Recent learning activity" items={data.recentActivities} />
        </section>

        <SectionHeader eyebrow="Quick Actions" title="Daily student work" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {studentActions.map((action) => <QuickActionCard key={action.title} title={action.title} description={action.description} href={action.href} />)}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <AnnouncementCard title="Next test" description={data.upcomingTests[0]?.date ?? "Your next test date will appear here."} tag="Exam" />
          <AnnouncementCard title="Progress report" description="Monthly report combines tests, attendance, course progress, aptitude/IQ, EQ, psychometric growth, and teacher remarks." tag="Report" />
          <AnnouncementCard title="Parent visibility" description="Parents can see your progress, attendance, fees, and important remarks." tag="Parent" />
        </section>

        {data.enrolledCourses.length === 0 ? <EmptyState title="No enrolled courses" description="Your courses will appear here after enrollment." /> : null}
      </motion.div>
    </RoleDashboardGuard>
  );
}
