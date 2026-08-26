"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, CalendarRange, ClipboardCheck, FileText, GraduationCap, UserCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAcademyToday } from "@/services/academy";

const dateLabel = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

const workLinks = [
  { label: "My Classes", href: "/dashboard/academic-head/my-classes", icon: CalendarDays },
  { label: "Programs", href: "/dashboard/academic-head/hod/programs", icon: GraduationCap },
  { label: "Batches", href: "/dashboard/academic-head/hod/batches", icon: Users },
  { label: "Students", href: "/dashboard/academic-head/students", icon: UserCheck },
  { label: "Planner", href: "/dashboard/academic-head/hod/timetable", icon: CalendarRange },
  { label: "Faculty", href: "/dashboard/academic-head/hod/teacher-allocation", icon: ClipboardCheck },
  { label: "NDP", href: "/dashboard/academic-head/ndp", icon: FileText },
  { label: "Reports", href: "/dashboard/academic-head/hod/reports", icon: BarChart3 },
];

export default function AcademicHeadDashboardPage() {
  const todayQuery = useQuery({ queryKey: ["academic-head", "simple-dashboard"], queryFn: () => getAcademyToday() });
  const today = todayQuery.data;
  const tasks = today?.todayTasks ?? [];
  const upcoming = today?.upcomingTasks ?? [];
  const pendingTasks = tasks.filter((task) => !task.done);
  const pendingReviews = (today?.diagnostics?.pendingAssignmentReviews ?? 0) + (today?.diagnostics?.pendingExamReviews ?? 0);
  const attendancePending = today?.diagnostics?.attendancePendingCount ?? 0;
  const nextTask = today?.nextUpcomingTask ?? pendingTasks[0] ?? upcoming[0] ?? null;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto grid max-w-[1500px] gap-4">
        <header className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Academic Head</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">Today&apos;s Academic Work</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Open classes, finish reviews, manage batches and check reports from one simple page.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm font-bold text-[var(--muted-blue)]">
            <CalendarDays className="h-4 w-4" />
            {dateLabel}
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-3">
          <PriorityCard
            label="Next class"
            title={todayQuery.isLoading ? "Loading..." : nextTask?.batchName || nextTask?.title || "No class pending"}
            detail={nextTask ? `${nextTask.subject || "Subject"} / ${nextTask.topic || nextTask.detail || "Topic pending"}` : "Published timetable tasks will appear here."}
            href="/dashboard/academic-head/my-classes"
            value={tasks.length}
          />
          <PriorityCard
            label="Reviews"
            title={`${pendingReviews} pending`}
            detail="Assignments and exams waiting for Academic Head approval."
            href="/dashboard/academic-head/hod/approvals"
            value={pendingReviews}
            tone={pendingReviews ? "warn" : "ok"}
          />
          <PriorityCard
            label="Attendance"
            title={`${attendancePending} pending`}
            detail="Class attendance items that still need completion."
            href="/dashboard/academic-head/hod/reports"
            value={attendancePending}
            tone={attendancePending ? "warn" : "ok"}
          />
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Main Work</p>
          <h2 className="mt-1 text-xl font-black">Choose one</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {workLinks.map((item) => <WorkTile key={item.href} item={item} />)}
          </div>
        </section>
      </section>
    </main>
  );
}

function PriorityCard({
  detail,
  href,
  label,
  title,
  tone = "ok",
  value,
}: {
  detail: string;
  href: string;
  label: string;
  title: string;
  tone?: "ok" | "warn";
  value: number | string;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--gold)]">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone === "warn" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{value}</span>
      </div>
      <h2 className="mt-4 text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{detail}</p>
      <span className="mt-4 inline-flex text-sm font-black text-[var(--gold-dark)]">Open</span>
    </Link>
  );
}

function WorkTile({ item }: { item: { href: string; icon: LucideIcon; label: string } }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
      <Icon className="h-4 w-4 text-[var(--gold-dark)]" />
      {item.label}
    </Link>
  );
}
