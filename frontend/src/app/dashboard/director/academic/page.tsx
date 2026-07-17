"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
} from "lucide-react";

import { getAcademicCalendarMonitor, getAcademyBatches, getStudentProgressSummary } from "@/services/academy";
import { useCourses } from "@/hooks/use-courses";
import { AcademicEngineBanner, AcademicEngineRoleActions } from "@/components/academy/academic-engine-workspace";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "./_components";
import { livePlannerMetrics, parseBatchAcademicPlanner, parseCourseDescription } from "./academic-planner-utils";

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
        title="Academic Control"
        description="Planner health, batch execution, delayed sessions, syllabus progress and resource readiness in one director view."
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

      <AcademicEngineBanner
        role="DIRECTOR"
        title="Planner-first Academic Engine"
        description="Program planner is the master source. Batch planner, timetable, class completion, attendance, materials, homework, tests and performance reports should follow this same flow."
        metrics={[
          { label: "Planner Progress", value: `${averagePlannerCompletion}%`, tone: averagePlannerCompletion >= 75 ? "success" : "warning" },
          { label: "Batch Progress", value: `${completedSessionCount}/${generatedSessionCount || 0}` },
          { label: "Faculty Progress", value: `${calendarItems.reduce((sum, item) => sum + item.completedClasses, 0)} completed`, tone: "info" },
          { label: "Alerts", value: delayedBatches.length + batchesWithoutPlanner.length, tone: delayedBatches.length + batchesWithoutPlanner.length ? "warning" : "success" },
        ]}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Academic Engine Entry Points" eyebrow="Planner to performance">
          <AcademicEngineRoleActions role="DIRECTOR" />
        </Panel>

        <Panel title="Batch Planner Execution" eyebrow="Director tracking">
          {!plannerCards.length ? <EmptyState text="No active batches are available yet." /> : null}
          <div className="max-h-[48vh] overflow-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[860px] border-collapse text-sm">
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
                      <Link href={`/dashboard/director/academic/batches/${item.batch.id}/planner`} className="inline-flex rounded-lg bg-[var(--navy)] px-3 py-1.5 text-xs font-black text-white">
                        Open Planner
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
