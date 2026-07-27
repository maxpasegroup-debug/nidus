"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BarChart3, CalendarClock, CalendarRange, ClipboardCheck, FileText, GraduationCap, UserCheck, Users } from "lucide-react";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { getAcademyToday, type AcademyTodayTask } from "@/services/academy";

function displayTime(value?: string | null) {
  if (!value) return "Time pending";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours)) return value;
  return new Date(2000, 0, 1, hours, minutes || 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function taskHref(task?: AcademyTodayTask | null) {
  if (!task?.batchId) return "/dashboard/academic-head/hod/timetable";
  return `/dashboard/academic-head/classes/assigned-program/${task.batchId}`;
}

export default function AcademicHeadDashboardPage() {
  const todayQuery = useQuery({ queryKey: ["academic-head", "simple-dashboard"], queryFn: () => getAcademyToday() });
  const today = todayQuery.data;
  const tasks = today?.todayTasks ?? [];
  const upcoming = today?.upcomingTasks ?? [];
  const nextTask = today?.nextUpcomingTask ?? tasks.find((task) => !task.done) ?? upcoming[0] ?? null;
  const pending = tasks.filter((task) => !task.done);
  const pendingReviews = today?.diagnostics.pendingAssignmentReviews ?? 0;
  const pendingExamReviews = today?.diagnostics.pendingExamReviews ?? 0;
  const attendancePending = today?.diagnostics.attendancePendingCount ?? 0;

  return (
    <WorkspaceDashboard
      roleTitle="Academic Head Workspace"
      greeting="Run academics today"
      subtitle="Timetable, teacher allocation, approvals, students, NDP and reports in one clean academic workspace."
      focus={[
        {
          label: "Classes",
          title: nextTask ? nextTask.batchName || "Class pending" : "No class pending",
          detail: nextTask ? `${displayTime(nextTask.time)} / ${nextTask.subject || "Subject"} / ${nextTask.topic || nextTask.detail || "Topic pending"}` : "Published timetable tasks will appear here.",
          href: taskHref(nextTask),
          icon: CalendarClock,
          tone: nextTask ? "info" : "success",
        },
        {
          label: "Reviews",
          title: `${pendingReviews + pendingExamReviews} pending`,
          detail: "Approve assignments and exams before they reach students.",
          href: "/dashboard/academic-head/hod/approvals",
          icon: ClipboardCheck,
          tone: pendingReviews + pendingExamReviews ? "warning" : "success",
        },
        {
          label: "NDP",
          title: "Review Progress",
          detail: "Check and publish student digital profile records.",
          href: "/dashboard/academic-head/ndp",
          icon: FileText,
          tone: pending.length ? "warning" : "success",
        },
      ]}
      actions={[
        { label: "Programs", href: "/dashboard/academic-head/hod/programs", icon: GraduationCap },
        { label: "Batches", href: "/dashboard/academic-head/hod/batches", icon: Users },
        { label: "Students", href: "/dashboard/academic-head/students", icon: UserCheck },
        { label: "Timetable", href: "/dashboard/academic-head/hod/timetable", icon: CalendarRange },
        { label: "Teacher Allocation", href: "/dashboard/academic-head/hod/teacher-allocation", icon: Users },
        { label: "Reports", href: "/dashboard/academic-head/hod/reports", icon: BarChart3 },
      ]}
      metrics={[
        { label: "Classes Today", value: todayQuery.isLoading ? "..." : tasks.length },
        { label: "Open Tasks", value: todayQuery.isLoading ? "..." : pending.length, tone: pending.length ? "warning" : "success" },
        { label: "Attendance Pending", value: todayQuery.isLoading ? "..." : attendancePending, tone: attendancePending ? "warning" : "success" },
        { label: "Reviews", value: todayQuery.isLoading ? "..." : pendingReviews + pendingExamReviews, tone: pendingReviews + pendingExamReviews ? "warning" : "success" },
      ]}
      activity={tasks.slice(0, 5).map((task) => ({
        title: task.batchName || task.title || "Academic task",
        detail: `${task.subject || "Subject"} / ${task.topic || task.detail || "Topic pending"}`,
        href: taskHref(task),
        meta: task.done ? "Done" : displayTime(task.time),
      }))}
      upcoming={upcoming.slice(0, 5).map((task) => ({
        title: task.batchName || task.title || "Upcoming class",
        detail: `${task.subject || "Subject"} / ${task.topic || task.detail || "Topic pending"}`,
        href: taskHref(task),
        meta: displayTime(task.time),
      }))}
    >
      <section className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-5 shadow-[var(--ds-shadow-soft)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ds-text-label text-[var(--ds-color-primary)]">Academic Setup</p>
            <h2 className="mt-1 text-xl font-black">Core workflow</h2>
          </div>
          <Link href="/dashboard/academic-head/hod" className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] px-4 py-3 text-sm font-black">
            Academic Control
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Programs", href: "/dashboard/academic-head/hod/programs", icon: GraduationCap },
            { label: "Batches", href: "/dashboard/academic-head/hod/batches", icon: Users },
            { label: "Students", href: "/dashboard/academic-head/students", icon: UserCheck },
            { label: "Planner", href: "/dashboard/academic-head/hod/timetable", icon: CalendarRange },
            { label: "Faculty", href: "/dashboard/academic-head/hod/teacher-allocation", icon: ClipboardCheck },
            { label: "Reports", href: "/dashboard/academic-head/hod/reports", icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="inline-flex min-h-12 items-center gap-3 rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-raised)] px-4 text-sm font-black hover:border-[var(--ds-color-border-strong)]">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>
    </WorkspaceDashboard>
  );
}
