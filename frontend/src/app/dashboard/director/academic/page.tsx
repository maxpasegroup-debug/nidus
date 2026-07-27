"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, BookOpenCheck, CalendarDays, GraduationCap, UserCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getAcademyBatches } from "@/services/academy";
import { useCourses } from "@/hooks/use-courses";
import { AcademicHero, AcademicShell, StatCard } from "./_components";
import { parseBatchAcademicPlanner, parseCourseDescription } from "./academic-planner-utils";

type AcademicAction = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: "Setup" | "Execution" | "Review";
};

const actions: AcademicAction[] = [
  {
    title: "Programs",
    description: "Create courses and publish the master syllabus planner.",
    href: "/dashboard/director/academic/programs",
    icon: GraduationCap,
    group: "Setup",
  },
  {
    title: "Batches",
    description: "Create active batches, running batches and archive old batches.",
    href: "/dashboard/director/academic/batches",
    icon: Users,
    group: "Setup",
  },
  {
    title: "Students",
    description: "Add students, reset PINs, transfer or copy between batches.",
    href: "/dashboard/director/students",
    icon: UserCheck,
    group: "Setup",
  },
  {
    title: "Timetable",
    description: "Publish class dates and teacher schedules.",
    href: "/dashboard/director/academic/timetable",
    icon: CalendarDays,
    group: "Execution",
  },
  {
    title: "Faculty",
    description: "Assign teachers and monitor academic delivery ownership.",
    href: "/dashboard/director/academic/teachers",
    icon: BookOpenCheck,
    group: "Execution",
  },
  {
    title: "Reports",
    description: "Review attendance, exams, assignments and syllabus progress.",
    href: "/dashboard/director/academic/reports",
    icon: BarChart3,
    group: "Review",
  },
];

export default function DirectorAcademicDepartmentPage() {
  const coursesQuery = useCourses();
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });

  const courses = coursesQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const activeBatches = batches.filter((batch) => batch.status !== "ARCHIVED");
  const students = activeBatches.reduce((total, batch) => total + (batch._count?.students ?? batch.students?.length ?? 0), 0);
  const programsWithoutPlanner = courses.filter((course) => !parseCourseDescription(course).academicPlanner?.modules.length);
  const batchesWithoutPlanner = activeBatches.filter((batch) => !parseBatchAcademicPlanner(batch.schedule?.academicPlanner));
  const groupedActions = ["Setup", "Execution", "Review"].map((group) => ({
    group,
    items: actions.filter((action) => action.group === group),
  }));

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Academics"
        title="Academic Control"
        description="A simple control desk for programs, batches, students, timetable, faculty and reports."
        action={
          <Link href="/dashboard/director" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
            <ArrowLeft className="h-4 w-4" />
            Control Panel
          </Link>
        }
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Programs" value={coursesQuery.isLoading ? "..." : courses.length} />
        <StatCard label="Active Batches" value={batchesQuery.isLoading ? "..." : activeBatches.length} />
        <StatCard label="Students" value={batchesQuery.isLoading ? "..." : students} />
        <StatCard label="Planner Pending" value={programsWithoutPlanner.length + batchesWithoutPlanner.length} />
      </section>

      <section className="grid shrink-0 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          {groupedActions.map(({ group, items }) => (
            <section key={group} className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{group}</p>
                  <h2 className="mt-1 text-xl font-black text-[var(--navy)]">{group === "Setup" ? "Build the academic structure" : group === "Execution" ? "Run the academic system" : "Check performance"}</h2>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {items.map((item) => <ActionTile key={item.href} action={item} />)}
              </div>
            </section>
          ))}
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Attention</p>
            <h2 className="mt-1 text-xl font-black text-[var(--navy)]">Planner Setup</h2>
            <div className="mt-4 grid gap-2">
              <AttentionLine label="Programs missing planner" value={programsWithoutPlanner.length} href="/dashboard/director/academic/programs" />
              <AttentionLine label="Batches missing planner" value={batchesWithoutPlanner.length} href="/dashboard/director/academic/batches" />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Student Review</p>
            <h2 className="mt-1 text-xl font-black text-[var(--navy)]">Progress</h2>
            <div className="mt-4 grid gap-2">
              <Link href="/dashboard/director/academic/ndp" className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm font-black transition hover:border-[var(--gold-border)]">
                NDP Monitor
              </Link>
              <Link href="/dashboard/director/academic/student-progress" className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm font-black transition hover:border-[var(--gold-border)]">
                Student Progress
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </AcademicShell>
  );
}

function ActionTile({ action }: { action: AcademicAction }) {
  const Icon = action.icon;
  return (
    <Link href={action.href} className="group grid min-h-36 rounded-2xl border border-[var(--border)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)] hover:shadow-md">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-5 w-5 text-[var(--navy)]" />
      </span>
      <span>
        <span className="mt-3 block text-lg font-black text-[var(--navy)]">{action.title}</span>
        <span className="mt-1 block text-sm leading-5 text-[var(--muted-blue)]">{action.description}</span>
      </span>
      <span className="mt-auto text-xs font-black uppercase tracking-[0.16em] text-[var(--gold)]">Open</span>
    </Link>
  );
}

function AttentionLine({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black transition hover:border-[var(--gold-border)]">
      <span>{label}</span>
      <span className={value ? "text-orange-700" : "text-emerald-700"}>{value}</span>
    </Link>
  );
}
