"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock, Plus, Search, Sparkles, UserCheck, X } from "lucide-react";

import { AcademicActionButton, AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard, TextArea } from "../_components";
import {
  createAcademicCalendarItem,
  getAcademicCalendar,
  getAcademyBatches,
  getAcademyTeachers,
  updateAcademicCalendarSchedule,
  type AcademicCalendarItem,
} from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";

const classTypes = ["LECTURE", "PRACTICE", "REVISION", "TEST", "MOCK_TEST", "DISCUSSION", "LIVE_CLASS", "BREAK"];
const statuses = ["SCHEDULED", "COMPLETED", "RESCHEDULED", "CANCELLED"];
const fallbackSubjects = ["Mathematics", "English", "Reasoning", "Physics", "Chemistry", "Biology", "History", "Polity", "Geography", "Current Affairs", "General Knowledge"];

const defaultForm = {
  batchId: "",
  subject: "Mathematics",
  topic: "",
  classType: "LECTURE",
  plannedDate: todayKey(),
  startTime: "09:00",
  endTime: "10:00",
  teacherId: "",
  teacherName: "",
  notes: "",
};

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function itemDateKey(item: AcademicCalendarItem) {
  return item.plannedDate.slice(0, 10);
}

function displayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function displayTime(value?: string | null) {
  if (!value) return "Time not set";
  const [hourRaw, minute = "00"] = value.split(":");
  const hour = Number(hourRaw);
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function cleanLabel(value?: string | null) {
  return String(value || "Class").replaceAll("_", " ");
}

function getTeacherName(item: AcademicCalendarItem) {
  return item.teacherName || "Teacher not assigned";
}

export default function DirectorTimetablePage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [teacherFilter, setTeacherFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const calendarQuery = useQuery({
    queryKey: ["academy", "academic-calendar", batchFilter],
    queryFn: () => getAcademicCalendar(batchFilter !== "ALL" ? { batchId: batchFilter } : {}),
  });

  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);
  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);
  const calendar = useMemo(() => calendarQuery.data ?? [], [calendarQuery.data]);
  const activeBatches = batches.filter((batch) => batch.status !== "ARCHIVED");
  const selectedBatch = batches.find((batch) => batch.id === form.batchId);

  const subjects = useMemo(() => {
    const values = new Set(fallbackSubjects);
    batches.forEach((batch) => {
      const raw = batch.schedule?.subjects;
      if (Array.isArray(raw)) raw.forEach((subject) => values.add(String(subject)));
      if (typeof raw === "string") raw.split(",").map((item) => item.trim()).filter(Boolean).forEach((subject) => values.add(subject));
    });
    return [...values].sort((first, second) => first.localeCompare(second));
  }, [batches]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return calendar
      .filter((item) => itemDateKey(item) === selectedDate)
      .filter((item) => teacherFilter === "ALL" || item.teacherId === teacherFilter)
      .filter((item) => !term || `${item.batchName} ${item.subject} ${item.topic} ${item.teacherName}`.toLowerCase().includes(term))
      .sort((first, second) => String(first.startTime ?? "").localeCompare(String(second.startTime ?? "")));
  }, [calendar, searchTerm, selectedDate, teacherFilter]);

  const todayItems = calendar.filter((item) => itemDateKey(item) === todayKey());
  const completedToday = todayItems.filter((item) => item.status === "COMPLETED" || item.completionStatus === "COMPLETED").length;
  const cancelledToday = todayItems.filter((item) => item.status === "CANCELLED").length;
  const missingTeacher = filteredItems.filter((item) => !item.teacherId && item.classType !== "BREAK").length;
  const timetableHealth = missingTeacher || cancelledToday ? "Review needed" : "Calm";

  const invalidateCalendar = () => {
    void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "today"] });
  };

  const createSlot = useMutation({
    mutationFn: createAcademicCalendarItem,
    onSuccess: () => {
      setNotice("Class added to timetable.");
      setShowCreate(false);
      setForm(defaultForm);
      invalidateCalendar();
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  const updateSlot = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAcademicCalendarSchedule(id, { status, completionStatus: status === "COMPLETED" ? "COMPLETED" : status }),
    onSuccess: () => {
      setNotice("Timetable updated.");
      invalidateCalendar();
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const teacher = teachers.find((item) => item.id === form.teacherId);
    const batch = batches.find((item) => item.id === form.batchId);
    createSlot.mutate({
      batchId: form.batchId || undefined,
      batchName: batch?.name || selectedBatch?.name || "Director timetable",
      programSlug: batch?.programSlug,
      subject: form.subject,
      topic: form.topic,
      classType: form.classType,
      plannedDate: form.plannedDate,
      startTime: form.startTime,
      endTime: form.endTime,
      teacherId: form.teacherId || undefined,
      teacherName: teacher?.name || form.teacherName || undefined,
      status: "SCHEDULED",
      completionStatus: "PENDING",
      nextAction: form.notes || undefined,
    });
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="NIDUS AI Academics"
        title="Timetable"
        description="Daily class rhythm, teacher allocation and timetable health from one clean Director page."
        action={
          <AcademicActionButton onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Class
          </AcademicActionButton>
        }
      />

      {notice ? <div className="shrink-0 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3 text-sm font-bold">{notice}</div> : null}
      {calendarQuery.isError ? <div className="shrink-0 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-900">{getApiErrorMessage(calendarQuery.error)}</div> : null}

      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Today Classes" value={todayItems.length} />
        <StatCard label="Completed" value={completedToday} />
        <StatCard label="Live Batches" value={activeBatches.length} />
        <StatCard label="Teachers" value={teachers.length} />
      </section>

      <section className="shrink-0 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[var(--navy)] shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Nidus AI</p>
              <p className="text-sm font-bold leading-6 text-[var(--muted-blue)]">
                {timetableHealth === "Calm"
                  ? "Nidus AI sees a calm timetable today. Review the day plan or add classes if needed."
                  : `${missingTeacher} class(es) need teacher allocation or schedule attention.`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[340px]">
            <MiniMetric label="Health" value={timetableHealth} />
            <MiniMetric label="Missing teacher" value={missingTeacher} />
            <MiniMetric label="Cancelled" value={cancelledToday} />
          </div>
        </div>
      </section>

      <Panel title={displayDate(selectedDate)} eyebrow="Daily Timetable">
        <div className="mb-4 grid gap-3 lg:grid-cols-[180px_1fr_220px_220px_auto] lg:items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-[var(--navy)] outline-none focus:border-[var(--gold)]"
          />
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-blue)]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search batch, subject, topic or teacher"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 text-sm font-bold text-[var(--navy)] outline-none focus:border-[var(--gold)]"
            />
          </label>
          <select
            value={batchFilter}
            onChange={(event) => setBatchFilter(event.target.value)}
            className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-[var(--navy)] outline-none focus:border-[var(--gold)]"
          >
            <option value="ALL">All Batches</option>
            {activeBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </select>
          <select
            value={teacherFilter}
            onChange={(event) => setTeacherFilter(event.target.value)}
            className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-[var(--navy)] outline-none focus:border-[var(--gold)]"
          >
            <option value="ALL">All Teachers</option>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name || teacher.email}</option>)}
          </select>
          <AcademicActionButton onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Class
          </AcademicActionButton>
        </div>

        {calendarQuery.isLoading || batchesQuery.isLoading || teachersQuery.isLoading ? <EmptyState text="Loading timetable." /> : null}
        {!calendarQuery.isLoading && !filteredItems.length ? <EmptyState text="No classes are scheduled for this selection." /> : null}

        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)] text-[var(--navy)]">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-base font-black text-[var(--navy)]">{item.subject}</h3>
                    <p className="mt-1 line-clamp-1 text-xs font-bold text-[var(--muted-blue)]">{item.topic || cleanLabel(item.classType)}</p>
                  </div>
                </div>
                <select
                  value={item.status || "SCHEDULED"}
                  onChange={(event) => updateSlot.mutate({ id: item.id, status: event.target.value })}
                  className="h-9 rounded-xl border border-[var(--border)] bg-white px-2 text-xs font-black text-[var(--navy)]"
                >
                  {statuses.map((status) => <option key={status} value={status}>{cleanLabel(status)}</option>)}
                </select>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <TimetableFact icon={Clock} label="Time" value={`${displayTime(item.startTime)} - ${displayTime(item.endTime)}`} />
                <TimetableFact icon={UserCheck} label="Teacher" value={getTeacherName(item)} />
                <TimetableFact icon={CheckCircle2} label="Type" value={cleanLabel(item.classType)} />
              </div>
              <div className="mt-3 rounded-xl bg-[var(--page-bg)] px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">Batch</p>
                <p className="mt-0.5 line-clamp-1 text-sm font-black text-[var(--navy)]">{item.batchName || "General timetable"}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      {showCreate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <section className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-auto rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xl md:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">New Class</p>
                <h2 className="mt-1 text-xl font-black text-[var(--navy)]">Add timetable slot</h2>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white" aria-label="Close timetable editor">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <Select label="Batch" value={form.batchId} onChange={(value) => setForm((state) => ({ ...state, batchId: value }))}>
                <option value="">General timetable</option>
                {activeBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
              </Select>
              <Select label="Class type" value={form.classType} onChange={(value) => setForm((state) => ({ ...state, classType: value }))}>
                {classTypes.map((type) => <option key={type} value={type}>{cleanLabel(type)}</option>)}
              </Select>
              <Select label="Subject" value={form.subject} onChange={(value) => setForm((state) => ({ ...state, subject: value }))}>
                {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </Select>
              <Select label="Teacher" value={form.teacherId} onChange={(value) => setForm((state) => ({ ...state, teacherId: value }))}>
                <option value="">Assign later</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name || teacher.email}</option>)}
              </Select>
              <Input label="Date" type="date" value={form.plannedDate} onChange={(value) => setForm((state) => ({ ...state, plannedDate: value }))} required />
              <Input label="Topic" value={form.topic} onChange={(value) => setForm((state) => ({ ...state, topic: value }))} required placeholder="Algebra practice / Weekly mock" />
              <Input label="Start time" type="time" value={form.startTime} onChange={(value) => setForm((state) => ({ ...state, startTime: value }))} required />
              <Input label="End time" type="time" value={form.endTime} onChange={(value) => setForm((state) => ({ ...state, endTime: value }))} required />
              <div className="md:col-span-2">
                <TextArea label="Note" value={form.notes} onChange={(value) => setForm((state) => ({ ...state, notes: value }))} placeholder="Optional note for follow-up." />
              </div>
              <div className="md:col-span-2 flex justify-end border-t border-[var(--border)] pt-4">
                <GoldButton disabled={createSlot.isPending}>Save Class</GoldButton>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </AcademicShell>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
      <p className="text-lg font-black text-[var(--navy)]">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function TimetableFact({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-2 py-2">
      <Icon className="h-3.5 w-3.5 text-[var(--gold)]" />
      <p className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.1em] text-[var(--muted-blue)]">{label}</p>
      <p className="truncate text-xs font-black text-[var(--navy)]">{value}</p>
    </div>
  );
}

