"use client";

import { useQuery } from "@tanstack/react-query";
import { getAcademicCalendarMonitor } from "@/services/academy";
import { AcademicCard, AcademicHero, AcademicPill, AcademicShell, EmptyState, Panel, StatCard } from "../_components";
import { CalendarCheck } from "lucide-react";

export default function DirectorCalendarMonitorPage() {
  const monitorQuery = useQuery({ queryKey: ["academy", "academic-calendar-monitor"], queryFn: getAcademicCalendarMonitor });
  const items = monitorQuery.data?.items ?? [];

  return (
    <AcademicShell>
      <AcademicHero eyebrow="Academic Calendar Monitor" title="Track class execution and syllabus completion." description="Director view of planned, completed, delayed and missed classes grouped by batch, teacher and subject." />
      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Tracked Lines" value={items.length} />
        <StatCard label="Completed Classes" value={items.reduce((sum, item) => sum + item.completedClasses, 0)} />
        <StatCard label="Delayed Classes" value={items.reduce((sum, item) => sum + item.delayedClasses, 0)} />
        <StatCard label="Missed Classes" value={items.reduce((sum, item) => sum + item.missedClasses, 0)} />
      </section>
      <Panel title="Calendar Execution" eyebrow="Real timetable records">
        {!items.length ? <EmptyState text="No timetable records are available yet. Calendar monitor will appear after class plans are created." /> : null}
        <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <AcademicCard
              key={`${item.batchId}-${item.teacherId}-${item.subject}`}
              icon={CalendarCheck}
              eyebrow={item.subject}
              title={item.batchName ?? "Batch"}
              status={<AcademicPill>{item.status}</AcademicPill>}
              description={item.teacherName ?? "Teacher pending"}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <CalendarMetric label="Planned" value={item.plannedClasses} />
                <CalendarMetric label="Completed" value={item.completedClasses} />
                <CalendarMetric label="Delayed" value={item.delayedClasses} />
                <CalendarMetric label="Missed" value={item.missedClasses} />
                <CalendarMetric label="Completion" value={`${item.completionPercentage}%`} />
              </div>
            </AcademicCard>
          ))}
        </div>
      </Panel>
    </AcademicShell>
  );
}

function CalendarMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] px-3 py-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</span>
      <span className="mt-0.5 block text-sm font-black">{value}</span>
    </div>
  );
}
