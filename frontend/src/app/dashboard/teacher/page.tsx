"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BarChart3, CalendarCheck, CalendarRange, ClipboardCheck, ClipboardList, FileText, HelpCircle, Library, Megaphone, MonitorPlay, Presentation, UserRound, Users } from "lucide-react";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { getAcademyToday } from "@/services/academy";

function displayTime(value?: string | null) {
  if (!value) return "Time pending";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours)) return value;
  return new Date(2000, 0, 1, hours, minutes || 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function taskHref(task?: { batchId?: string | null } | null) {
  if (!task?.batchId) return "/dashboard/teacher/classes";
  return `/dashboard/teacher/classes/assigned-program/${task.batchId}`;
}

export default function TeacherDashboardPage() {
  const todayQuery = useQuery({ queryKey: ["teacher", "starter-today"], queryFn: () => getAcademyToday() });
  const today = todayQuery.data;
  const todayTasks = today?.todayTasks ?? [];
  const upcomingTasks = today?.upcomingTasks ?? [];
  const nextTask = today?.nextUpcomingTask ?? todayTasks.find((task) => !task.done) ?? upcomingTasks[0] ?? null;
  const remaining = todayTasks.filter((task) => !task.done).length;
  const pendingEvaluation = todayTasks.filter((task) => !task.done && String(task.type || "").toUpperCase().includes("EXAM")).length;

  return (
    <WorkspaceDashboard
      roleTitle="Teacher Workspace"
      greeting="Today's teaching work"
      subtitle="Open your class, mark attendance, enter NDP marks, give homework and upload study materials from one clean place."
      focus={[
        {
          label: "Next Class",
          title: nextTask ? nextTask.batchName || "Assigned class" : "No class assigned",
          detail: nextTask ? `${displayTime(nextTask.time)}${nextTask.endTime ? ` to ${displayTime(nextTask.endTime)}` : ""} / ${nextTask.subject || "Subject"} / ${nextTask.topic || nextTask.detail || "Topic pending"}` : "Your next class appears here when the timetable is published.",
          href: taskHref(nextTask),
          icon: MonitorPlay,
          tone: nextTask ? "info" : "default",
        },
        {
          label: "NDP Marks",
          title: "Add Progress",
          detail: "Enter term exam marks and performance notes for assigned students.",
          href: "/dashboard/teacher/ndp",
          icon: ClipboardCheck,
          tone: "info",
        },
        {
          label: "Attendance",
          title: `${remaining} pending`,
          detail: "Mark attendance and close today's class register.",
          href: "/dashboard/teacher/attendance?action=mark-attendance",
          icon: CalendarCheck,
          tone: remaining ? "warning" : "success",
        },
      ]}
      actions={[
        { label: "My Classes", href: "/dashboard/teacher/my-classes", icon: MonitorPlay },
        { label: "Mark Attendance", href: "/dashboard/teacher/attendance?action=mark-attendance", icon: CalendarCheck },
        { label: "Add NDP / Marks", href: "/dashboard/teacher/ndp", icon: ClipboardCheck },
        { label: "Homework", href: "/dashboard/teacher/assignments", icon: ClipboardList },
        { label: "Exams", href: "/dashboard/teacher/exams", icon: FileText },
        { label: "Study Materials", href: "/dashboard/teacher/library?action=upload-lesson", icon: Library },
      ]}
      metrics={[
        { label: "Classes Today", value: todayQuery.isLoading ? "..." : todayTasks.length },
        { label: "Remaining", value: todayQuery.isLoading ? "..." : remaining, tone: remaining ? "warning" : "success" },
        { label: "Upcoming", value: todayQuery.isLoading ? "..." : upcomingTasks.length },
        { label: "Pending Evaluation", value: todayQuery.isLoading ? "..." : pendingEvaluation },
      ]}
      activity={todayTasks.slice(0, 5).map((task) => ({
        title: task.batchName || task.title || "Class task",
        detail: `${task.subject || "Subject"} / ${task.topic || task.detail || "Topic pending"}`,
        href: taskHref(task),
        meta: task.done ? "Done" : displayTime(task.time),
      }))}
      upcoming={upcomingTasks.slice(0, 5).map((task) => ({
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
          <Link href="/dashboard/teacher/workspace" className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] px-4 py-3 text-sm font-black">
            All tools
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Lesson Planner", href: "/dashboard/teacher/lesson-planner", icon: CalendarRange },
            { label: "Students", href: "/dashboard/teacher/students", icon: Users },
            { label: "Reports", href: "/dashboard/teacher/reports", icon: BarChart3 },
            { label: "Doubts", href: "/dashboard/teacher/doubts", icon: HelpCircle },
            { label: "Announcements", href: "/dashboard/teacher/communications", icon: Megaphone },
            { label: "PPT Generator", href: "/dashboard/teacher/ppt-generator", icon: Presentation },
            { label: "Profile", href: "/dashboard/teacher/profile", icon: UserRound },
            { label: "Question Bank", href: "/dashboard/teacher/question-bank", icon: FileText },
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
