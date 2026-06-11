"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  PauseCircle,
  PlayCircle,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  assignTeacherToBatch,
  createAcademyBatch,
  createAcademicCalendarItem,
  getAcademyBatches,
  getAcademyTeachers,
  getAcademicCalendar,
  updateAcademyBatch,
  updateAcademicCalendarItem,
  type AcademyBatch,
  type AcademicCalendarItem,
} from "@/services/academy";

const academicAreas = [
  { title: "Programs", text: "Create and manage course structure", icon: GraduationCap },
  { title: "Batches", text: "Plan offline, online, crash and foundation groups", icon: CalendarDays },
  { title: "Teachers", text: "Allocate subjects and classroom responsibility", icon: Users },
  { title: "Timetable", text: "Build weekly schedule and class rhythm", icon: Clock },
  { title: "Syllabus", text: "Track completion with green, orange and red status", icon: BarChart3 },
  { title: "Reports", text: "Review progress before management decisions", icon: ClipboardCheck },
];

const batchTypes = ["OFFLINE", "ONLINE", "CRASH", "FOUNDATION", "TOPRANK", "GURU"] as const;
const completionOptions = [
  { label: "Green", value: "GREEN", helper: "On track", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { label: "Orange", value: "ORANGE", helper: "Needs attention", className: "bg-orange-50 text-orange-800 border-orange-200" },
  { label: "Red", value: "RED", helper: "Delayed", className: "bg-rose-50 text-rose-800 border-rose-200" },
] as const;

export default function DirectorAcademicDepartmentPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [batchForm, setBatchForm] = useState({
    name: "",
    courseId: "",
    batchType: "OFFLINE",
    startDate: "",
    endDate: "",
    capacity: "",
  });
  const [allocation, setAllocation] = useState({
    batchId: "",
    teacherId: "",
    subject: "",
    role: "Subject Teacher",
  });
  const [calendarForm, setCalendarForm] = useState({
    batchId: "",
    subject: "",
    topic: "",
    plannedDate: "",
    startTime: "",
    endTime: "",
    teacherId: "",
  });

  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const calendarQuery = useQuery({ queryKey: ["academy", "academic-calendar"], queryFn: () => getAcademicCalendar() });

  const batches = batchesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];
  const calendarItems = calendarQuery.data ?? [];

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === calendarForm.batchId),
    [batches, calendarForm.batchId],
  );
  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === calendarForm.teacherId),
    [teachers, calendarForm.teacherId],
  );

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "teachers"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
  };

  const createBatchMutation = useMutation({
    mutationFn: createAcademyBatch,
    onSuccess: () => {
      setBatchForm({ name: "", courseId: "", batchType: "OFFLINE", startDate: "", endDate: "", capacity: "" });
      refresh();
      setNotice("Batch created. The batch is now ready for planning.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not create batch."),
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ batchId, status }: { batchId: string; status: string }) => updateAcademyBatch(batchId, { status }),
    onSuccess: () => {
      refresh();
      setNotice("Batch status updated.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not update batch."),
  });

  const assignTeacherMutation = useMutation({
    mutationFn: ({ batchId, payload }: { batchId: string; payload: { teacherId: string; subject?: string; role?: string } }) =>
      assignTeacherToBatch(batchId, payload),
    onSuccess: () => {
      setAllocation({ batchId: "", teacherId: "", subject: "", role: "Subject Teacher" });
      refresh();
      setNotice("Teacher allocated. The teacher can now see this batch in their dashboard.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not allocate teacher."),
  });

  const createCalendarMutation = useMutation({
    mutationFn: createAcademicCalendarItem,
    onSuccess: () => {
      setCalendarForm({ batchId: "", subject: "", topic: "", plannedDate: "", startTime: "", endTime: "", teacherId: "" });
      refresh();
      setNotice("Calendar planned. The class plan is visible for teachers.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not plan calendar."),
  });

  const updateCalendarMutation = useMutation({
    mutationFn: ({ id, completionStatus }: { id: string; completionStatus: string }) =>
      updateAcademicCalendarItem(id, { completionStatus }),
    onSuccess: () => {
      refresh();
      setNotice("Syllabus tracker updated.");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not update tracker."),
  });

  const submitBatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createBatchMutation.mutate({
      name: batchForm.name,
      courseId: batchForm.courseId || undefined,
      batchType: batchForm.batchType,
      startDate: batchForm.startDate || undefined,
      endDate: batchForm.endDate || undefined,
      capacity: batchForm.capacity ? Number(batchForm.capacity) : undefined,
    });
  };

  const submitAllocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    assignTeacherMutation.mutate({
      batchId: allocation.batchId,
      payload: {
        teacherId: allocation.teacherId,
        subject: allocation.subject || undefined,
        role: allocation.role || undefined,
      },
    });
  };

  const submitCalendar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createCalendarMutation.mutate({
      batchId: calendarForm.batchId,
      batchName: selectedBatch?.name,
      programSlug: selectedBatch?.course?.slug,
      subject: calendarForm.subject,
      topic: calendarForm.topic,
      plannedDate: calendarForm.plannedDate,
      startTime: calendarForm.startTime || undefined,
      endTime: calendarForm.endTime || undefined,
      teacherId: calendarForm.teacherId || undefined,
      teacherName: selectedTeacher?.name,
    });
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Academic Department</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Director planning room</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
                Create batches, allocate teachers, plan the academic calendar, and track syllabus completion before it reaches
                the classrooms.
              </p>
            </div>
            <button onClick={refresh} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-bold">
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Batches" value={batches.length} />
          <StatCard label="Teachers" value={teachers.length} />
          <StatCard label="Planned Classes" value={calendarItems.length} />
          <StatCard label="Active" value={batches.filter((batch) => batch.status === "ACTIVE").length} />
          <StatCard label="Delayed" value={calendarItems.filter((item) => item.completionStatus === "RED").length} />
        </div>

        {notice && (
          <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold text-[var(--navy)]">
            {notice}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {academicAreas.map((area) => {
            const Icon = area.icon;
            return (
              <div key={area.title} className="rounded-2xl border border-[var(--border)] bg-white/85 p-5 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] text-[var(--navy)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-[var(--navy)]">{area.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-blue)]">{area.text}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title="Create Batch" eyebrow="Batch and course control">
            <form onSubmit={submitBatch} className="grid gap-3">
              <Input label="Batch name" value={batchForm.name} onChange={(value) => setBatchForm((form) => ({ ...form, name: value }))} required />
              <Input label="Course ID / Program ID" value={batchForm.courseId} onChange={(value) => setBatchForm((form) => ({ ...form, courseId: value }))} />
              <div className="grid gap-3 md:grid-cols-2">
                <Select label="Batch type" value={batchForm.batchType} onChange={(value) => setBatchForm((form) => ({ ...form, batchType: value }))}>
                  {batchTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
                <Input label="Capacity" type="number" value={batchForm.capacity} onChange={(value) => setBatchForm((form) => ({ ...form, capacity: value }))} />
                <Input label="Start date" type="date" value={batchForm.startDate} onChange={(value) => setBatchForm((form) => ({ ...form, startDate: value }))} />
                <Input label="End date" type="date" value={batchForm.endDate} onChange={(value) => setBatchForm((form) => ({ ...form, endDate: value }))} />
              </div>
              <GoldButton disabled={createBatchMutation.isPending}>Create Batch</GoldButton>
            </form>
          </Panel>

          <Panel title="Teacher Allocation" eyebrow="Ready-made teaching system">
            <form onSubmit={submitAllocation} className="grid gap-3">
              <Select label="Batch" value={allocation.batchId} onChange={(value) => setAllocation((form) => ({ ...form, batchId: value }))} required>
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </Select>
              <Select label="Teacher" value={allocation.teacherId} onChange={(value) => setAllocation((form) => ({ ...form, teacherId: value }))} required>
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.email}</option>
                ))}
              </Select>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Subject" value={allocation.subject} onChange={(value) => setAllocation((form) => ({ ...form, subject: value }))} />
                <Input label="Role" value={allocation.role} onChange={(value) => setAllocation((form) => ({ ...form, role: value }))} />
              </div>
              <GoldButton disabled={assignTeacherMutation.isPending}>Assign Teacher</GoldButton>
            </form>
          </Panel>
        </section>

        <Panel title="Current Batches" eyebrow="Simple batch control">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {batches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} onStatus={(status) => updateBatchMutation.mutate({ batchId: batch.id, status })} />
            ))}
            {!batches.length && <EmptyState text="No batches found. Create the first batch to begin planning." />}
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Plan Syllabus Calendar" eyebrow="Director planned calendar">
            <form onSubmit={submitCalendar} className="grid gap-3">
              <Select label="Batch" value={calendarForm.batchId} onChange={(value) => setCalendarForm((form) => ({ ...form, batchId: value }))} required>
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </Select>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Subject" value={calendarForm.subject} onChange={(value) => setCalendarForm((form) => ({ ...form, subject: value }))} required />
                <Input label="Topic" value={calendarForm.topic} onChange={(value) => setCalendarForm((form) => ({ ...form, topic: value }))} required />
                <Input label="Date" type="date" value={calendarForm.plannedDate} onChange={(value) => setCalendarForm((form) => ({ ...form, plannedDate: value }))} required />
                <Input label="Start time" type="time" value={calendarForm.startTime} onChange={(value) => setCalendarForm((form) => ({ ...form, startTime: value }))} />
                <Input label="End time" type="time" value={calendarForm.endTime} onChange={(value) => setCalendarForm((form) => ({ ...form, endTime: value }))} />
                <Select label="Teacher" value={calendarForm.teacherId} onChange={(value) => setCalendarForm((form) => ({ ...form, teacherId: value }))}>
                  <option value="">Assign later</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </Select>
              </div>
              <GoldButton disabled={createCalendarMutation.isPending}>Add To Calendar</GoldButton>
            </form>
          </Panel>

          <Panel title="Syllabus Tracker" eyebrow="Green orange red progress">
            <div className="grid gap-3">
              {calendarItems.map((item) => (
                <CalendarCard key={item.id} item={item} onStatus={(completionStatus) => updateCalendarMutation.mutate({ id: item.id, completionStatus })} />
              ))}
              {!calendarItems.length && <EmptyState text="No academic calendar items yet. Plan the first class from the left panel." />}
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/85 p-5 shadow-sm">
      <p className="text-sm text-[var(--muted-blue)]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[var(--gold)]">{value}</p>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-[var(--navy)]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--navy)]">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--navy)]">
      {label}
      <select
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        {children}
      </select>
    </label>
  );
}

function GoldButton({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      type="submit"
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}

function BatchCard({ batch, onStatus }: { batch: AcademyBatch; onStatus: (status: string) => void }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{batch.batchType ?? "Batch"}</p>
          <h3 className="mt-2 text-xl font-black text-[var(--navy)]">{batch.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.course?.title ?? "Program not linked"}</p>
        </div>
        <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black text-[var(--navy)]">
          {batch.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-[var(--muted-blue)]">
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{batch._count?.students ?? 0} students</span>
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{batch._count?.teachers ?? 0} teachers</span>
        <span className="rounded-xl bg-[var(--page-bg)] p-2">{batch.capacity ?? "-"} seats</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-800" onClick={() => onStatus("ACTIVE")}>
          <PlayCircle className="mr-1 inline h-4 w-4" />
          Active
        </button>
        <button className="rounded-lg border border-orange-200 px-3 py-2 text-sm font-bold text-orange-800" onClick={() => onStatus("PAUSED")}>
          <PauseCircle className="mr-1 inline h-4 w-4" />
          Pause
        </button>
        <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800" onClick={() => onStatus("COMPLETED")}>
          <CheckCircle2 className="mr-1 inline h-4 w-4" />
          Complete
        </button>
      </div>
    </article>
  );
}

function CalendarCard({ item, onStatus }: { item: AcademicCalendarItem; onStatus: (status: string) => void }) {
  const status = completionOptions.find((option) => option.value === item.completionStatus) ?? completionOptions[1];
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{item.batchName ?? "Batch"} / {item.subject}</p>
          <h3 className="mt-2 text-lg font-black text-[var(--navy)]">{item.topic}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">
            {new Date(item.plannedDate).toLocaleDateString()} {item.startTime ? ` / ${item.startTime}` : ""} {item.teacherName ? ` / ${item.teacherName}` : ""}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${status.className}`}>{status.label}</span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {completionOptions.map((option) => (
          <button key={option.value} className={`rounded-xl border px-3 py-2 text-sm font-bold ${option.className}`} onClick={() => onStatus(option.value)}>
            {option.label} - {option.helper}
          </button>
        ))}
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-6 text-sm text-[var(--muted-blue)]">
      <ShieldCheck className="mb-3 h-5 w-5 text-[var(--gold)]" />
      {text}
    </div>
  );
}
