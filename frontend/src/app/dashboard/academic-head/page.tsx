"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BarChart3, BookOpenCheck, CalendarCheck, CalendarClock, CalendarRange, ClipboardCheck, ClipboardList, FileText, GraduationCap, HelpCircle, Library, Megaphone, Presentation, UserRound, Users } from "lucide-react";
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
        { label: "Timetable", href: "/dashboard/academic-head/hod/timetable", icon: CalendarRange },
        { label: "Teacher Allocation", href: "/dashboard/academic-head/hod/teacher-allocation", icon: Users },
        { label: "Approvals", href: "/dashboard/academic-head/hod/approvals", icon: ClipboardCheck },
        { label: "Students", href: "/dashboard/academic-head/students", icon: GraduationCap },
        { label: "NDP Reviews", href: "/dashboard/academic-head/ndp", icon: FileText },
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
            <p className="ds-text-label text-[var(--ds-color-primary)]">More Tools</p>
            <h2 className="mt-1 text-xl font-black">Open only when needed</h2>
          </div>
          <Link href="/dashboard/academic-head/workspace" className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] px-4 py-3 text-sm font-black">
            All tools
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "My Classes", href: "/dashboard/academic-head/my-classes", icon: BookOpenCheck },
            { label: "Attendance", href: "/dashboard/academic-head/attendance", icon: CalendarCheck },
            { label: "Assignments", href: "/dashboard/academic-head/assignments", icon: ClipboardList },
            { label: "Exams", href: "/dashboard/academic-head/exams", icon: FileText },
            { label: "Library", href: "/dashboard/academic-head/library", icon: Library },
            { label: "Lesson Planner", href: "/dashboard/academic-head/lesson-planner", icon: CalendarClock },
            { label: "Doubts", href: "/dashboard/academic-head/doubts", icon: HelpCircle },
            { label: "Announcements", href: "/dashboard/academic-head/communications", icon: Megaphone },
            { label: "PPT Generator", href: "/dashboard/academic-head/ppt-generator", icon: Presentation },
            { label: "Question Bank", href: "/dashboard/academic-head/question-bank", icon: FileText },
            { label: "Leave", href: "/dashboard/academic-head/leave-requests", icon: ClipboardCheck },
            { label: "Profile", href: "/dashboard/academic-head/profile", icon: UserRound },
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
