"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAcademicCalendar, getSyllabusSummary, updateAcademicCalendarItem } from "@/services/academy";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "../_components";

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
      <AcademicHero eyebrow="Syllabus & Progress" title="Syllabus & Progress" description="Track batch completion and topic status with simple green, orange and red signals." />
      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Completion" value={`${summary?.completionPercentage ?? 0}%`} />
        <StatCard label="Green" value={summary?.green ?? 0} />
        <StatCard label="Orange" value={summary?.orange ?? 0} />
        <StatCard label="Red" value={summary?.red ?? 0} />
      </section>
      <Panel title="Batch Progress" eyebrow="Progress by batch">
        {!syllabusQuery.data?.batches.length ? <EmptyState text="No syllabus progress is available yet." /> : null}
        <div className="max-h-52 overflow-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 bg-[var(--page-bg)] text-left">
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Batch</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Completion</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Green</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Orange</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Red</th>
              </tr>
            </thead>
            <tbody>
              {(syllabusQuery.data?.batches ?? []).map((batch) => (
                <tr key={batch.batchId ?? batch.batchName ?? "batch"} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-3 py-2 font-black">{batch.batchName ?? "Batch"}</td>
                  <td className="px-3 py-2 font-black">{batch.completionPercentage}%</td>
                  <td className="px-3 py-2 text-emerald-700">{batch.green}</td>
                  <td className="px-3 py-2 text-orange-700">{batch.orange}</td>
                  <td className="px-3 py-2 text-rose-700">{batch.red}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Topic Status" eyebrow="Calendar-linked tracker">
        {!calendar.length ? <EmptyState text="No academic calendar items yet. Plan classes from Timetable first." /> : null}
        <div className="max-h-[46vh] overflow-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="sticky top-0 bg-[var(--page-bg)] text-left">
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Date</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Batch</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Subject</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Topic</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Teacher</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Status</th>
                <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Update</th>
              </tr>
            </thead>
            <tbody>
          {calendar.map((item) => {
            const active = completionOptions.find((option) => option.value === item.completionStatus) ?? completionOptions[1];
            return (
              <tr key={item.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-3 py-2">{new Date(item.plannedDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{item.batchName}</td>
                <td className="px-3 py-2">{item.subject}</td>
                <td className="px-3 py-2 font-black">{item.topic}</td>
                <td className="px-3 py-2">{item.teacherName ?? "Teacher pending"}</td>
                <td className="px-3 py-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${active.className}`}>{active.label}</span></td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                  {completionOptions.map((option) => (
                    <button key={option.value} className={`rounded-lg border px-2.5 py-1.5 text-xs font-black ${option.className}`} onClick={() => updateStatus.mutate({ id: item.id, completionStatus: option.value })} type="button">
                      {option.label}
                    </button>
                  ))}
                  </div>
                </td>
              </tr>
            );
          })}
            </tbody>
          </table>
        </div>
      </Panel>
    </AcademicShell>
  );
}
