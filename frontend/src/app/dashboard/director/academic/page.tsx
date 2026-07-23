"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  UserCheck,
  Users,
} from "lucide-react";

import { getAcademicCalendarMonitor, getAcademyBatches, getStudentProgressSummary } from "@/services/academy";
import { useCourses } from "@/hooks/use-courses";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "./_components";
import { livePlannerMetrics, parseBatchAcademicPlanner, parseCourseDescription } from "./academic-planner-utils";

const directorActions = [
  {
    title: "Programs",
    text: "Add or edit courses and their master planner.",
    href: "/dashboard/director/academic/programs",
    icon: GraduationCap,
    primary: "Manage Programs",
  },
  {
    title: "Batches",
    text: "Create running batches, edit setup and archive old batches.",
    href: "/dashboard/director/academic/batches",
    icon: Users,
    primary: "Manage Batches",
  },
  {
    title: "Timetable",
    text: "Publish class dates and teacher schedules.",
    href: "/dashboard/director/academic/timetable",
    icon: CalendarDays,
    primary: "Open Timetable",
  },
  {
    title: "Teachers",
    text: "Allocate teachers and check delivery.",
    href: "/dashboard/director/academic/teachers",
    icon: UserCheck,
    primary: "Manage Faculty",
  },
  {
    title: "Syllabus",
    text: "Track chapter and topic completion.",
    href: "/dashboard/director/academic/syllabus",
    icon: BookOpenCheck,
    primary: "Track Syllabus",
  },
  {
    title: "Reports",
    text: "Review attendance, exams, assignments and materials.",
    href: "/dashboard/director/academic/reports",
    icon: BarChart3,
    primary: "View Reports",
  },
];

export default function DirectorAcademicDepartmentPage() {
  const coursesQuery = useCourses();
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const progressQuery = useQuery({ queryKey: ["academy", "student-progress-summary"], queryFn: getStudentProgressSummary });
  const monitorQuery = useQuery({ queryKey: ["academy", "academic-calendar-monitor"], queryFn: getAcademicCalendarMonitor });

  const courses = coursesQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const activeBatches = batches.filter((batch) => batch.status !== "ARCHIVED");
  const programsWithoutPlanner = courses.filter((course) => !parseCourseDescription(course).academicPlanner?.modules.length);
  const batchesWithoutPlanner = activeBatches.filter((batch) => !parseBatchAcademicPlanner(batch.schedule?.academicPlanner));
  const plannerCards = activeBatches.map((batch) => {
    const planner = parseBatchAcademicPlanner(batch.schedule?.academicPlanner);
    const metrics = livePlannerMetrics(planner?.sessions ?? []);
    const health = progressQuery.data?.batches.find((item) => item.batchId === batch.id);
    return {
      batch,
      planner,
      metrics,
      health,
      delayed: metrics.delayed,
      score: metrics.completionPercentage,
    };
  });
  const delayedBatches = plannerCards.filter((item) => item.delayed > 0);
  const generatedSessionCount = plannerCards.reduce((total, item) => total + item.metrics.total, 0);
  const completedSessionCount = plannerCards.reduce((total, item) => total + item.metrics.completed, 0);
  const trackedPlannerCards = plannerCards.filter((item) => item.metrics.total > 0);
  const averagePlannerCompletion = trackedPlannerCards.length
    ? Math.round(trackedPlannerCards.reduce((sum, item) => sum + item.metrics.completionPercentage, 0) / trackedPlannerCards.length)
    : 0;
  const calendarItems = monitorQuery.data?.items ?? [];

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Academics"
        title="Academic Desk"
        description="Manage programs, batches, timetable, faculty, syllabus and student progress from one simple place."
        action={
          <Link href="/dashboard/director" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
            <ArrowLeft className="h-4 w-4" />
            Control Panel
          </Link>
        }
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Programs Missing Planner" value={programsWithoutPlanner.length} />
        <StatCard label="Batches Missing Planner" value={batchesWithoutPlanner.length} />
        <StatCard label="Live Planner Sessions" value={generatedSessionCount} />
        <StatCard label="Completed Sessions" value={completedSessionCount} />
        <StatCard label="Delayed Batches" value={delayedBatches.length} />
        <StatCard label="Avg Completion" value={`${averagePlannerCompletion}%`} />
      </section>

      <Panel title="What do you want to manage?" eyebrow="Director actions">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {directorActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group grid min-h-36 gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)] hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                    <Icon className="h-5 w-5 text-[var(--navy)]" />
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[10px] font-black text-[var(--navy)]">Open</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--navy)]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-[var(--muted-blue)]">{item.text}</p>
                </div>
                <p className="mt-auto text-sm font-black text-[var(--gold-dark)]">{item.primary}</p>
              </Link>
            );
          })}
        </div>
      </Panel>

      <section className="grid gap-3 lg:grid-cols-[0.8fr_1.4fr]">
        <Panel title="NDP and student progress" eyebrow="Student review">
          <Link href="/dashboard/director/academic/ndp" className="mt-3 flex min-h-14 items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex items-center gap-3"><ClipboardCheck className="h-5 w-5 text-[var(--gold-dark)]" /> NDP Monitor</span>
            <span>Open</span>
          </Link>
          <Link href="/dashboard/director/academic/student-progress" className="mt-3 flex min-h-14 items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-[var(--gold-dark)]" /> Student Progress</span>
            <span>Open</span>
          </Link>
        </Panel>

        <Panel title="Batch Planner Execution" eyebrow="Director tracking">
          {!plannerCards.length ? <EmptyState text="No active batches are available yet." /> : null}
          <div className="max-h-[48vh] overflow-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="sticky top-0 bg-[var(--page-bg)] text-left">
                <tr className="border-b border-[var(--border)]">
                  {["Batch", "Planner", "Completion", "Delayed", "Health", "Action"].map((heading) => (
                    <th key={heading} className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plannerCards.map((item) => (
                  <tr key={item.batch.id} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-3 py-2 font-black">{item.batch.name}</td>
                    <td className="px-3 py-2">{item.metrics.total ? `${item.metrics.total} sessions` : "Not generated"}</td>
                    <td className="px-3 py-2 font-black">{item.metrics.completionPercentage}%</td>
                    <td className="px-3 py-2 text-orange-700">{item.metrics.delayed}</td>
                    <td className="px-3 py-2">{item.health?.overallStatus ?? "No Data"}</td>
                    <td className="px-3 py-2">
                      <Link href={`/dashboard/director/academic/batches/${item.batch.id}/planner`} className="inline-flex min-w-24 items-center justify-center rounded-lg bg-[var(--navy)] px-3 py-2 text-xs font-black text-white">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Panel title="Planner Gaps" eyebrow="Action required">
          <div className="grid gap-2">
            {programsWithoutPlanner.slice(0, 6).map((course) => (
              <Link key={course.id} href="/dashboard/director/academic/programs" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
                {course.title}
              </Link>
            ))}
            {!programsWithoutPlanner.length ? <EmptyState text="All saved programs have planner templates." /> : null}
          </div>
        </Panel>

        <Panel title="Delayed Planner Sessions" eyebrow="Efficiency">
          <div className="grid gap-2">
            {delayedBatches.slice(0, 6).map((item) => (
              <Link key={item.batch.id} href={`/dashboard/director/academic/batches/${item.batch.id}/planner`} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-black text-orange-900">
                {item.batch.name}: {item.metrics.delayed} delayed/rescheduled
              </Link>
            ))}
            {!delayedBatches.length ? <EmptyState text="No delayed planner sessions detected." /> : null}
          </div>
        </Panel>

        <Panel title="Calendar Monitor" eyebrow="Published classes">
          <div className="grid gap-2 text-sm">
            <MetricLine label="Tracked lines" value={calendarItems.length} />
            <MetricLine label="Planned classes" value={calendarItems.reduce((sum, item) => sum + item.plannedClasses, 0)} />
            <MetricLine label="Completed classes" value={calendarItems.reduce((sum, item) => sum + item.completedClasses, 0)} />
            <MetricLine label="Missed classes" value={calendarItems.reduce((sum, item) => sum + item.missedClasses, 0)} />
          </div>
        </Panel>
      </section>
    </AcademicShell>
  );
}

function MetricLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white px-3 py-2">
      <span className="font-bold text-[var(--muted-blue)]">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}
