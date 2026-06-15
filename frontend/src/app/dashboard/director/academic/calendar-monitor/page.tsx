"use client";

import { useQuery } from "@tanstack/react-query";
import { getAcademicCalendarMonitor } from "@/services/academy";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "../_components";

export default function DirectorCalendarMonitorPage() {
  const monitorQuery = useQuery({ queryKey: ["academy", "academic-calendar-monitor"], queryFn: getAcademicCalendarMonitor });
  const items = monitorQuery.data?.items ?? [];

  return (
    <AcademicShell>
      <AcademicHero eyebrow="Academic Calendar Monitor" title="Track class execution and syllabus completion." description="Director view of planned, completed, delayed and missed classes grouped by batch, teacher and subject." />
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tracked Lines" value={items.length} />
        <StatCard label="Completed Classes" value={items.reduce((sum, item) => sum + item.completedClasses, 0)} />
        <StatCard label="Delayed Classes" value={items.reduce((sum, item) => sum + item.delayedClasses, 0)} />
        <StatCard label="Missed Classes" value={items.reduce((sum, item) => sum + item.missedClasses, 0)} />
      </section>
      <Panel title="Calendar Execution" eyebrow="Real timetable records">
        {!items.length ? <EmptyState text="No timetable records are available yet. Calendar monitor will appear after class plans are created." /> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={`${item.batchId}-${item.teacherId}-${item.subject}`} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.subject}</p>
                  <h3 className="mt-2 text-xl font-black">{item.batchName ?? "Batch"}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.teacherName ?? "Teacher pending"}</p>
                </div>
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{item.status}</span>
              </div>
              <div className="mt-5 grid gap-2 text-sm">
                <p><b>Planned:</b> {item.plannedClasses}</p>
                <p><b>Completed:</b> {item.completedClasses}</p>
                <p><b>Delayed:</b> {item.delayedClasses}</p>
                <p><b>Missed:</b> {item.missedClasses}</p>
                <p><b>Completion:</b> {item.completionPercentage}%</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </AcademicShell>
  );
}
