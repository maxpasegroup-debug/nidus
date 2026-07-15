"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Library,
  Megaphone,
  MonitorPlay,
  Presentation,
  Radio,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAcademyToday } from "@/services/academy";

type TeacherAction = {
  title: string;
  note: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
};

function displayTime(value?: string | null) {
  if (!value) return "Time pending";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours)) return value;
  return new Date(2000, 0, 1, hours, minutes || 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function taskHref(task?: { batchId?: string | null; subject?: string | null } | null) {
  if (!task?.batchId) return "/dashboard/teacher/classes";
  return `/dashboard/teacher/classes/assigned-program/${task.batchId}`;
}

export default function TeacherDashboardPage() {
  const todayQuery = useQuery({ queryKey: ["teacher", "starter-today"], queryFn: () => getAcademyToday() });
  const today = todayQuery.data;
  const nextTask = today?.nextUpcomingTask ?? today?.todayTasks.find((task) => !task.done) ?? today?.upcomingTasks[0] ?? null;
  const remaining = today?.todayTasks.filter((task) => !task.done).length ?? 0;

  const dailyActions = useMemo<TeacherAction[]>(() => [
    { title: "Open Class", note: "Start from your next class", href: taskHref(nextTask), icon: MonitorPlay, primary: true },
    { title: "Mark Attendance", note: "Take today’s register", href: "/dashboard/teacher/attendance?action=mark-attendance", icon: CalendarCheck, primary: true },
    { title: "Give Homework", note: "Create and publish work", href: "/dashboard/teacher/assignments", icon: ClipboardList, primary: true },
    { title: "Upload Lesson", note: "Notes, video, PDF or link", href: "/dashboard/teacher/library?action=upload-lesson", icon: Library, primary: true },
    { title: "Create Exam", note: "Test, quiz or question paper", href: "/dashboard/teacher/exams", icon: FileText },
    { title: "View Students", note: "Open assigned students", href: "/dashboard/teacher/students", icon: Users },
  ], [nextTask]);

  const moreActions: TeacherAction[] = [
    { title: "My Classes", note: "All batches and subjects", href: "/dashboard/teacher/my-classes", icon: BookOpen },
    { title: "Lesson Planner", note: "Plan topics and syllabus", href: "/dashboard/teacher/lesson-planner", icon: BarChart3 },
    { title: "Question Bank", note: "Prepare questions", href: "/dashboard/teacher/question-bank", icon: FileText },
    { title: "PPT Generator", note: "Create teaching slides", href: "/dashboard/teacher/ppt-generator", icon: Presentation },
    { title: "Reports", note: "Class and student progress", href: "/dashboard/teacher/reports", icon: BarChart3 },
    { title: "Messages", note: "Notices and communication", href: "/dashboard/teacher/communications", icon: Megaphone },
  ];

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-5 text-[var(--navy)] md:px-6">
      <section className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Teacher</p>
              <h1 className="mt-2 text-3xl font-black">Today’s teaching desk</h1>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">Open class, mark attendance, give homework, upload lessons.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[520px]">
              <Metric label="Today" value={todayQuery.isLoading ? "..." : today?.todayTasks.length ?? 0} />
              <Metric label="Remaining" value={todayQuery.isLoading ? "..." : remaining} />
              <Metric label="Upcoming" value={todayQuery.isLoading ? "..." : today?.upcomingTasks.length ?? 0} />
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-950 bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Next Class</p>
          {nextTask ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[120px_1fr_auto] lg:items-center">
              <div>
                <p className="text-3xl font-black">{displayTime(nextTask.time)}</p>
                {nextTask.endTime ? <p className="text-xs text-white/70">to {displayTime(nextTask.endTime)}</p> : null}
              </div>
              <div>
                <h2 className="text-2xl font-black">{nextTask.batchName || "Assigned class"}</h2>
                <p className="mt-1 text-sm text-white/75">{nextTask.subject || "Subject"} / {nextTask.topic || nextTask.detail || "Topic pending"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={taskHref(nextTask)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-slate-950">Open Class</Link>
                <Link href="/dashboard/teacher/classes" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-black text-white">
                  <Radio className="h-4 w-4" /> Go Live
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/15 p-5 text-sm text-white/75">No class is assigned right now. Use Quick Actions below when you need teacher tools.</div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Quick Actions</p>
              <h2 className="mt-1 text-2xl font-black">Choose one action</h2>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dailyActions.map((action) => <ActionTile key={action.title} action={action} />)}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">More Tools</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {moreActions.map((action) => <ActionTile key={action.title} action={action} compact />)}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function ActionTile({ action, compact = false }: { action: TeacherAction; compact?: boolean }) {
  const Icon = action.icon;
  return (
    <Link href={action.href} className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)] ${action.primary ? "border-slate-950 bg-white" : "border-[var(--border)] bg-white"} ${compact ? "min-h-28" : "min-h-32"}`}>
      <Icon className="h-6 w-6 text-[var(--gold)]" />
      <div>
        <h3 className="text-lg font-black">{action.title}</h3>
        <p className="mt-1 text-sm leading-5 text-[var(--muted-blue)]">{action.note}</p>
      </div>
    </Link>
  );
}
