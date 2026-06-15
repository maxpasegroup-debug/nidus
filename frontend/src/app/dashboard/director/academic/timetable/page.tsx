"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAcademicCalendarItem, getAcademyBatches, getAcademyTeachers, getAcademicCalendar } from "@/services/academy";
import { AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard } from "../_components";

export default function DirectorTimetablePage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ batchId: "", subject: "", topic: "", plannedDate: "", startTime: "", endTime: "", teacherId: "" });
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const calendarQuery = useQuery({ queryKey: ["academy", "academic-calendar"], queryFn: () => getAcademicCalendar() });
  const batches = batchesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];
  const calendar = calendarQuery.data ?? [];

  const createItem = useMutation({
    mutationFn: createAcademicCalendarItem,
    onSuccess: () => {
      setForm({ batchId: "", subject: "", topic: "", plannedDate: "", startTime: "", endTime: "", teacherId: "" });
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
      setNotice("Timetable item added.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not add timetable item."),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createItem.mutate({
      batchId: form.batchId,
      subject: form.subject,
      topic: form.topic,
      plannedDate: form.plannedDate,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      teacherId: form.teacherId || undefined,
    });
  };

  return (
    <AcademicShell>
      <AcademicHero eyebrow="Timetable" title="Plan class schedule." description="Create daily class plans and teacher schedules from a dedicated timetable page." />
      {notice ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{notice}</div> : null}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Planned Classes" value={calendar.length} />
        <StatCard label="Batches" value={batches.length} />
        <StatCard label="Teachers" value={teachers.length} />
      </section>
      <Panel title="Add Timetable Item" eyebrow="Class plan">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Select label="Batch" value={form.batchId} onChange={(value) => setForm((state) => ({ ...state, batchId: value }))} required>
            <option value="">Select batch</option>
            {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </Select>
          <Select label="Teacher" value={form.teacherId} onChange={(value) => setForm((state) => ({ ...state, teacherId: value }))}>
            <option value="">Assign later</option>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </Select>
          <Input label="Subject" value={form.subject} onChange={(value) => setForm((state) => ({ ...state, subject: value }))} required />
          <Input label="Topic" value={form.topic} onChange={(value) => setForm((state) => ({ ...state, topic: value }))} required />
          <Input label="Date" type="date" value={form.plannedDate} onChange={(value) => setForm((state) => ({ ...state, plannedDate: value }))} required />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Start time" type="time" value={form.startTime} onChange={(value) => setForm((state) => ({ ...state, startTime: value }))} />
            <Input label="End time" type="time" value={form.endTime} onChange={(value) => setForm((state) => ({ ...state, endTime: value }))} />
          </div>
          <div className="md:col-span-2"><GoldButton disabled={createItem.isPending}>Add To Timetable</GoldButton></div>
        </form>
      </Panel>
      <Panel title="Upcoming Class Plans" eyebrow="Schedule">
        {!calendar.length ? <EmptyState text="No timetable items yet." /> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {calendar.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.batchName}</p>
              <h3 className="mt-2 text-xl font-black">{item.topic}</h3>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.subject} / {item.teacherName ?? "Teacher pending"}</p>
              <p className="mt-4 text-sm font-bold">{new Date(item.plannedDate).toLocaleDateString()} {item.startTime ? ` / ${item.startTime}` : ""}</p>
            </article>
          ))}
        </div>
      </Panel>
    </AcademicShell>
  );
}
