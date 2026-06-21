"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock, Pencil, Plus, Trash2, Users } from "lucide-react";
import {
  generateAcademicCalendarPlan,
  getAcademyBatches,
  getAcademyTeachers,
  getAcademicCalendar,
  updateAcademicCalendarSchedule,
  type AcademicCalendarItem,
  type AcademicCalendarPlannerSession,
} from "@/services/academy";

const days = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const classTypes = ["LECTURE", "PRACTICE", "REVISION", "TEST", "MOCK_TEST", "DISCUSSION", "LIVE_CLASS"];

const blankSession = (): AcademicCalendarPlannerSession => ({
  dayOfWeek: 1,
  subject: "",
  topic: "",
  classType: "LECTURE",
  startTime: "09:30",
  endTime: "10:30",
  teacherId: "",
});

type Props = {
  audience: "director" | "academic-head";
};

export function AcademicTimetablePlanner({ audience }: Props) {
  const queryClient = useQueryClient();
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [startDate, setStartDate] = useState("2026-06-22");
  const [endDate, setEndDate] = useState("2026-09-30");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [sessions, setSessions] = useState<AcademicCalendarPlannerSession[]>([blankSession()]);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Record<string, Partial<AcademicCalendarItem>>>({});

  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const calendarQuery = useQuery({
    queryKey: ["academy", "academic-calendar", selectedBatchId],
    queryFn: () => getAcademicCalendar(selectedBatchId ? { batchId: selectedBatchId } : {}),
  });

  const batches = batchesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];
  const calendar = calendarQuery.data ?? [];
  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId);

  const summary = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return {
      planned: calendar.length,
      today: calendar.filter((item) => item.plannedDate.slice(0, 10) === todayKey).length,
      completed: calendar.filter((item) => String(item.completionStatus).toUpperCase() === "COMPLETED").length,
      pending: calendar.filter((item) => String(item.completionStatus).toUpperCase() !== "COMPLETED").length,
    };
  }, [calendar]);

  const generateMutation = useMutation({
    mutationFn: generateAcademicCalendarPlan,
    onSuccess: (result) => {
      setNotice(`Planner saved: ${result.createdCount} classes created, ${result.skippedCount} skipped, ${result.conflictCount} conflicts.`);
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not generate timetable."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AcademicCalendarItem> }) => updateAcademicCalendarSchedule(id, payload),
    onSuccess: () => {
      setNotice("Class plan updated.");
      setEditing({});
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not update class plan."),
  });

  const updateSession = (index: number, patch: Partial<AcademicCalendarPlannerSession>) => {
    setSessions((current) => current.map((session, itemIndex) => itemIndex === index ? { ...session, ...patch } : session));
  };

  const submitPlanner = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBatchId) {
      setNotice("Select a batch first.");
      return;
    }
    generateMutation.mutate({
      batchId: selectedBatchId,
      startDate,
      endDate,
      academicYear,
      sessions,
    });
  };

  const saveEdit = (item: AcademicCalendarItem) => {
    const draft = editing[item.id] ?? {};
    updateMutation.mutate({
      id: item.id,
      payload: {
        subject: draft.subject ?? item.subject,
        topic: draft.topic ?? item.topic,
        classType: draft.classType ?? item.classType ?? "LECTURE",
        plannedDate: draft.plannedDate ?? item.plannedDate.slice(0, 10),
        startTime: draft.startTime ?? item.startTime ?? "",
        endTime: draft.endTime ?? item.endTime ?? "",
        teacherId: draft.teacherId ?? item.teacherId ?? "",
        status: draft.status ?? item.status,
        completionStatus: draft.completionStatus ?? item.completionStatus,
      },
    });
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{audience === "director" ? "Director Planner" : "Academic Head Planner"}</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Timetable command center</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Build weekly timetables, assign faculty, edit sessions and keep the academic calendar live from one practical workspace.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Metric label="Planned" value={summary.planned} />
              <Metric label="Today" value={summary.today} />
              <Metric label="Completed" value={summary.completed} />
              <Metric label="Pending" value={summary.pending} />
            </div>
          </div>
        </section>

        {notice ? (
          <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--navy)] shadow-sm">
            {notice}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-1 h-5 w-5" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Plan Batch</p>
                <h2 className="text-2xl font-black">Generate weekly timetable</h2>
              </div>
            </div>

            <form onSubmit={submitPlanner} className="mt-5 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <Label title="Batch">
                  <select className="field" value={selectedBatchId} onChange={(event) => setSelectedBatchId(event.target.value)} required>
                    <option value="">Select batch</option>
                    {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                  </select>
                </Label>
                <Label title="Academic year">
                  <input className="field" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
                </Label>
                <Label title="Start date">
                  <input className="field" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
                </Label>
                <Label title="End date">
                  <input className="field" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
                </Label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-black">Weekly sessions</h3>
                  <button type="button" className="btn-light" onClick={() => setSessions((current) => [...current, blankSession()])}>
                    <Plus className="h-4 w-4" /> Add slot
                  </button>
                </div>
                {sessions.map((session, index) => (
                  <div key={index} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Label title="Day">
                        <select className="field" value={session.dayOfWeek} onChange={(event) => updateSession(index, { dayOfWeek: Number(event.target.value) })}>
                          {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                        </select>
                      </Label>
                      <Label title="Teacher">
                        <select className="field" value={session.teacherId ?? ""} onChange={(event) => updateSession(index, { teacherId: event.target.value })}>
                          <option value="">Assign later</option>
                          {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                        </select>
                      </Label>
                      <Label title="Subject">
                        <input className="field" value={session.subject} onChange={(event) => updateSession(index, { subject: event.target.value })} placeholder="Mathematics" required />
                      </Label>
                      <Label title="Topic">
                        <input className="field" value={session.topic} onChange={(event) => updateSession(index, { topic: event.target.value })} placeholder="Number System" required />
                      </Label>
                      <Label title="Class type">
                        <select className="field" value={session.classType} onChange={(event) => updateSession(index, { classType: event.target.value })}>
                          {classTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                        </select>
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Label title="Start">
                          <input className="field" type="time" value={session.startTime} onChange={(event) => updateSession(index, { startTime: event.target.value })} required />
                        </Label>
                        <Label title="End">
                          <input className="field" type="time" value={session.endTime ?? ""} onChange={(event) => updateSession(index, { endTime: event.target.value })} />
                        </Label>
                      </div>
                    </div>
                    {sessions.length > 1 ? (
                      <button type="button" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-red-600" onClick={() => setSessions((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        <Trash2 className="h-4 w-4" /> Remove slot
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <button className="btn-primary w-full" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? "Generating..." : "Generate Timetable"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Live Calendar</p>
                <h2 className="text-2xl font-black">{selectedBatch?.name ?? "All scheduled classes"}</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-black">
                <Users className="h-4 w-4" /> {selectedBatch?._count?.students ?? selectedBatch?.students?.length ?? 0} students
              </div>
            </div>

            <div className="mt-5 max-h-[720px] space-y-3 overflow-y-auto pr-1">
              {!calendar.length ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted-blue)]">
                  No classes found for this scope. Generate the official timetable from the left panel.
                </div>
              ) : null}
              {calendar.slice(0, 80).map((item) => {
                const draft = editing[item.id] ?? {};
                const isEditing = Boolean(editing[item.id]);
                return (
                  <article key={item.id} className="rounded-xl border border-[var(--border)] bg-white p-4">
                    {!isEditing ? (
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.batchName}</p>
                          <h3 className="mt-1 text-xl font-black">{item.subject}</h3>
                          <p className="text-sm text-[var(--muted-blue)]">{item.topic} / {item.teacherName ?? "Teacher pending"}</p>
                          <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold">
                            <Clock className="h-4 w-4" />
                            {new Date(item.plannedDate).toLocaleDateString()} {item.startTime ?? ""}{item.endTime ? ` - ${item.endTime}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{item.status}</span>
                          <button className="btn-light" type="button" onClick={() => setEditing({ [item.id]: {
                            subject: item.subject,
                            topic: item.topic,
                            classType: item.classType ?? "LECTURE",
                            plannedDate: item.plannedDate.slice(0, 10),
                            startTime: item.startTime ?? "",
                            endTime: item.endTime ?? "",
                            teacherId: item.teacherId ?? "",
                            status: item.status,
                            completionStatus: item.completionStatus,
                          } })}>
                            <Pencil className="h-4 w-4" /> Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <Label title="Subject"><input className="field" value={draft.subject ?? ""} onChange={(event) => setEditing({ [item.id]: { ...draft, subject: event.target.value } })} /></Label>
                          <Label title="Topic"><input className="field" value={draft.topic ?? ""} onChange={(event) => setEditing({ [item.id]: { ...draft, topic: event.target.value } })} /></Label>
                          <Label title="Teacher">
                            <select className="field" value={draft.teacherId ?? ""} onChange={(event) => setEditing({ [item.id]: { ...draft, teacherId: event.target.value } })}>
                              <option value="">Assign later</option>
                              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                            </select>
                          </Label>
                          <Label title="Class type">
                            <select className="field" value={draft.classType ?? "LECTURE"} onChange={(event) => setEditing({ [item.id]: { ...draft, classType: event.target.value } })}>
                              {classTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                            </select>
                          </Label>
                          <Label title="Date"><input className="field" type="date" value={String(draft.plannedDate ?? "")} onChange={(event) => setEditing({ [item.id]: { ...draft, plannedDate: event.target.value } })} /></Label>
                          <div className="grid grid-cols-2 gap-3">
                            <Label title="Start"><input className="field" type="time" value={draft.startTime ?? ""} onChange={(event) => setEditing({ [item.id]: { ...draft, startTime: event.target.value } })} /></Label>
                            <Label title="End"><input className="field" type="time" value={draft.endTime ?? ""} onChange={(event) => setEditing({ [item.id]: { ...draft, endTime: event.target.value } })} /></Label>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="btn-primary" type="button" onClick={() => saveEdit(item)}><CheckCircle2 className="h-4 w-4" /> Save Class</button>
                          <button className="btn-light" type="button" onClick={() => setEditing({})}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Operating Model</p>
          <h2 className="mt-2 text-2xl font-black">How this planner runs the academy</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Info title="Existing batches" body="Select any active or upcoming batch and generate its full academic plan without creating another calendar system." />
            <Info title="Faculty sync" body="When a teacher is attached to a session, the batch-subject allocation is kept active for dashboard visibility." />
            <Info title="Execution ready" body="Generated sessions immediately feed teacher calendars, attendance, class logs, assignments, exams and library actions." />
          </div>
        </section>
      </section>
      <style jsx>{`
        .field {
          min-height: 46px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: white;
          padding: 0.7rem 0.9rem;
          color: var(--navy);
          outline: none;
        }
        .field:focus {
          border-color: var(--gold);
        }
        .btn-primary,
        .btn-light {
          display: inline-flex;
          min-height: 46px;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 12px;
          padding: 0.7rem 1rem;
          font-weight: 900;
        }
        .btn-primary {
          background: var(--navy);
          color: white;
        }
        .btn-light {
          border: 1px solid var(--border);
          background: white;
          color: var(--navy);
        }
      `}</style>
    </main>
  );
}

function Label({ title, children }: { title: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-[var(--navy)]">
      {title}
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{body}</p>
    </div>
  );
}
