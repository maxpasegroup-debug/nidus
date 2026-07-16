"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAcademicCalendar, getSyllabusSummary, updateAcademicCalendarItem } from "@/services/academy";
import { AcademicCard, AcademicHero, AcademicPill, AcademicShell, EmptyState, Panel, StatCard } from "../_components";
import { BarChart3, CalendarCheck } from "lucide-react";

const completionOptions = [
  { label: "Green", value: "GREEN", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  { label: "Orange", value: "ORANGE", className: "border-orange-200 bg-orange-50 text-orange-800" },
  { label: "Red", value: "RED", className: "border-rose-200 bg-rose-50 text-rose-800" },
];

export default function DirectorSyllabusPage() {
  const queryClient = useQueryClient();
  const syllabusQuery = useQuery({ queryKey: ["academy", "syllabus-summary"], queryFn: () => getSyllabusSummary() });
  const calendarQuery = useQuery({ queryKey: ["academy", "academic-calendar"], queryFn: () => getAcademicCalendar() });
  const summary = syllabusQuery.data?.summary;
  const calendar = calendarQuery.data ?? [];
  const updateStatus = useMutation({
    mutationFn: ({ id, completionStatus }: { id: string; completionStatus: string }) => updateAcademicCalendarItem(id, { completionStatus }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["academy", "syllabus-summary"] });
    },
  });

  return (
    <AcademicShell>
      <AcademicHero eyebrow="Syllabus Tracker" title="Track academic progress." description="Dedicated green, orange and red syllabus view for batches, topics and teacher execution." />
      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Completion" value={`${summary?.completionPercentage ?? 0}%`} />
        <StatCard label="Green" value={summary?.green ?? 0} />
        <StatCard label="Orange" value={summary?.orange ?? 0} />
        <StatCard label="Red" value={summary?.red ?? 0} />
      </section>
      <Panel title="Batch Health" eyebrow="Progress by batch">
        {!syllabusQuery.data?.batches.length ? <EmptyState text="No syllabus progress is available yet." /> : null}
        <div className="grid max-h-52 gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {(syllabusQuery.data?.batches ?? []).map((batch) => (
            <AcademicCard
              key={batch.batchId ?? batch.batchName ?? "batch"}
              icon={BarChart3}
              eyebrow="Batch"
              title={batch.batchName ?? "Batch"}
              status={<AcademicPill>{batch.completionPercentage}%</AcademicPill>}
              description={`Green ${batch.green} / Orange ${batch.orange} / Red ${batch.red}`}
            />
          ))}
        </div>
      </Panel>
      <Panel title="Topic Status" eyebrow="Calendar-linked tracker">
        {!calendar.length ? <EmptyState text="No academic calendar items yet. Plan classes from Timetable first." /> : null}
        <div className="grid max-h-[46vh] gap-3 overflow-y-auto pr-1">
          {calendar.map((item) => {
            const active = completionOptions.find((option) => option.value === item.completionStatus) ?? completionOptions[1];
            return (
              <AcademicCard
                key={item.id}
                icon={CalendarCheck}
                eyebrow={`${item.batchName} / ${item.subject}`}
                title={item.topic}
                status={<span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${active.className}`}>{active.label}</span>}
                description={`${item.teacherName ?? "Teacher pending"} / ${new Date(item.plannedDate).toLocaleDateString()}`}
              >
                <div className="flex flex-wrap gap-2">
                  {completionOptions.map((option) => (
                    <button key={option.value} className={`rounded-xl border px-3 py-2 text-xs font-black ${option.className}`} onClick={() => updateStatus.mutate({ id: item.id, completionStatus: option.value })} type="button">
                      {option.label}
                    </button>
                  ))}
                </div>
              </AcademicCard>
            );
          })}
        </div>
      </Panel>
    </AcademicShell>
  );
}
