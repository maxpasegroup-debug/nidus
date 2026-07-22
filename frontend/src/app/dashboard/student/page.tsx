"use client";

import { BookOpen, BrainCircuit, CalendarDays, ClipboardCheck, ClipboardList, FileText, GraduationCap, Trophy } from "lucide-react";
import { RoleDashboardGuard, DashboardError, DashboardSkeleton } from "@/components/dashboard";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { useStudentDashboard } from "@/hooks/use-dashboard";

function formatClassTime(value?: string | null) {
  if (!value) return "Time pending";
  return value;
}

export default function StudentDashboardPage() {
  const dashboard = useStudentDashboard();
  const data = dashboard.data;

  if (dashboard.isLoading) {
    return (
      <RoleDashboardGuard role="STUDENT">
        <DashboardSkeleton />
      </RoleDashboardGuard>
    );
  }

  if (dashboard.error || !data) {
    return (
      <RoleDashboardGuard role="STUDENT">
        <DashboardError error={dashboard.error} onRefresh={() => dashboard.refetch()} />
      </RoleDashboardGuard>
    );
  }

  const todayClasses = data.academyProfile.todayClasses ?? [];
  const upcomingClasses = data.academyProfile.upcomingClasses ?? [];
  const nextClass = todayClasses[0] ?? upcomingClasses[0] ?? null;
  const nextTest = data.upcomingTests[0] ?? null;
  const pendingLessons = data.enrolledCourses.filter((course) => course.progress < 100);
  const assessment = data.assessmentProfile;

  return (
    <RoleDashboardGuard role="STUDENT">
      <WorkspaceDashboard
        roleTitle="Student Workspace"
        greeting={data.profile?.name ? `Today, ${data.profile.name}` : "Today's Learning"}
        subtitle="Classes, practice, exams, assignments and progress in one simple student view."
        focus={[
          {
            label: "Class",
            title: nextClass ? nextClass.subject || nextClass.title : "No class now",
            detail: nextClass ? `${nextClass.batch} / ${nextClass.instructor} / ${formatClassTime(nextClass.startTime)}` : "Your next class will appear after timetable publishing.",
            href: "/dashboard/student/classes",
            icon: CalendarDays,
            tone: nextClass ? "info" : "success",
          },
          {
            label: "Practice",
            title: nextTest ? nextTest.title : "Daily practice",
            detail: nextTest ? `${nextTest.durationMinutes} minute test is coming next.` : "Open practice and complete today's quiz or assignment before night.",
            href: nextTest ? `/tests/${nextTest.id}` : "/tests",
            icon: ClipboardList,
            tone: nextTest ? "warning" : "info",
          },
          {
            label: "Progress",
            title: `${data.attendance.percentage}% attendance`,
            detail: `${data.leaderboardRank.rank ? `Rank ${data.leaderboardRank.rank}` : "Leaderboard pending"} / fitness ${data.fitnessProgress.score}%.`,
            href: "/dashboard/student/progress",
            icon: Trophy,
            tone: data.attendance.percentage >= 75 ? "success" : "warning",
          },
        ]}
        actions={[
          { label: "Classes", href: "/dashboard/student/classes", icon: CalendarDays },
          { label: "Learning", href: "/dashboard/student/learning", icon: BookOpen },
          { label: "Homework", href: "/dashboard/student/assignments", icon: FileText },
          { label: "Practice", href: "/tests", icon: ClipboardList },
          { label: "Exams", href: "/dashboard/student/exams", icon: GraduationCap },
          { label: "Attendance", href: "/dashboard/student/attendance", icon: ClipboardCheck },
          { label: "Calendar", href: "/dashboard/student/calendar", icon: CalendarDays },
          { label: "Progress / NDP", href: "/dashboard/student/progress", icon: Trophy },
          { label: "Assessments", href: "/dashboard/student/assessments", icon: BrainCircuit },
        ]}
        metrics={[
          { label: "Attendance", value: `${data.attendance.percentage}%`, tone: data.attendance.percentage >= 75 ? "success" : "warning" },
          { label: "Courses", value: data.enrolledCourses.length },
          { label: "Pending Lessons", value: pendingLessons.length, tone: pendingLessons.length ? "warning" : "success" },
          { label: "Assessments", value: assessment ? `${assessment.completedCount}/${assessment.totalAssessments}` : "0/0" },
        ]}
        activity={data.recentActivities.slice(0, 5).map((activity) => ({
          title: activity,
          detail: "Recent student activity",
          href: "/dashboard/student/progress",
          meta: "Update",
        }))}
        upcoming={[
          ...todayClasses.slice(0, 3).map((item) => ({
            title: item.subject || item.title,
            detail: `${item.batch} / ${item.instructor}`,
            href: "/dashboard/student/classes",
            meta: formatClassTime(item.startTime),
          })),
          ...data.upcomingTests.slice(0, 2).map((test) => ({
            title: test.title,
            detail: `${test.durationMinutes} minutes`,
            href: `/tests/${test.id}`,
            meta: new Date(test.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          })),
        ]}
      />
    </RoleDashboardGuard>
  );
}
