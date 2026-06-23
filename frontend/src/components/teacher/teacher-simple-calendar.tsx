"use client";

import { useState } from "react";
import { BookOpenCheck, CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, Radio, Users, X } from "lucide-react";
import { TeacherModuleHeader } from "@/components/teacher/teacher-dashboard-primitives";

export type TeacherCalendarTask = {
  id: string;
  kind: "CLASS" | "LIVE_CLASS" | "ASSIGNMENT" | "EXAM" | "MEETING" | "ACTIVITY";
  title: string;
  subtitle?: string;
  date?: string | null;
  time?: string | null;
  endTime?: string | null;
  status?: string | null;
  sourceId?: string;
};

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: first.getDay() + total }, (_, index) => index < first.getDay() ? null : new Date(month.getFullYear(), month.getMonth(), index - first.getDay() + 1));
}

function tone(kind: TeacherCalendarTask["kind"]) {
  if (kind === "EXAM") return "bg-rose-500";
  if (kind === "ASSIGNMENT") return "bg-amber-500";
  if (kind === "LIVE_CLASS") return "bg-blue-500";
  if (kind === "MEETING") return "bg-violet-500";
  if (kind === "ACTIVITY") return "bg-slate-500";
  return "bg-emerald-500";
}

function kindLabel(kind: TeacherCalendarTask["kind"]) {
  return kind.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function TaskIcon({ kind }: { kind: TeacherCalendarTask["kind"] }) {
  if (kind === "EXAM") return <BookOpenCheck size={17} />;
  if (kind === "ASSIGNMENT") return <FileText size={17} />;
  if (kind === "LIVE_CLASS") return <Radio size={17} />;
  if (kind === "MEETING") return <Users size={17} />;
  return <CalendarDays size={17} />;
}

export function TeacherSimpleCalendar({ month, onMonth, tasks, loading, onOpenClass }: {
  month: Date;
  onMonth: (month: Date) => void;
  tasks: Map<string, TeacherCalendarTask[]>;
  loading: boolean;
  onOpenClass: (calendarId: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const days = monthDays(month);
  const selectedTasks = selectedDate ? tasks.get(selectedDate) ?? [] : [];
  const today = dateKey(new Date());

  const moveMonth = (offset: number) => onMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  return (
    <section className="grid gap-5">
      <TeacherModuleHeader eyebrow="Academic Calendar" title="Your monthly schedule" description="Select a date to see assigned classes, exams, assignments, live sessions, meetings and other activities." />

      <section className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black sm:text-2xl">{month.toLocaleDateString([], { month: "long", year: "numeric" })}</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)]"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => onMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-black">Today</button>
            <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)]"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-[0.12em] text-[var(--muted-blue)] sm:text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-2">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-xl border-l border-t border-[var(--border)]">
          {days.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="min-h-16 border-b border-r border-[var(--border)] bg-slate-50/70 sm:min-h-24" />;
            const key = dateKey(day);
            const dayTasks = tasks.get(key) ?? [];
            return (
              <button key={key} type="button" onClick={() => setSelectedDate(key)} className={`min-h-16 border-b border-r border-[var(--border)] p-1.5 text-left transition hover:bg-slate-50 sm:min-h-24 sm:p-2 ${key === today ? "bg-amber-50" : "bg-white"}`}>
                <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-black sm:h-7 sm:w-7 ${key === today ? "bg-slate-950 text-white" : ""}`}>{day.getDate()}</span>
                {dayTasks.length ? (
                  <span className="mt-2 block">
                    <span className="hidden text-xs font-black sm:block">{dayTasks.length} {dayTasks.length === 1 ? "activity" : "activities"}</span>
                    <span className="flex flex-wrap gap-1 sm:mt-2">
                      {dayTasks.slice(0, 4).map((task) => <span key={task.id} title={task.title} className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${tone(task.kind)}`} />)}
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {loading ? <p className="mt-4 text-sm font-bold text-[var(--muted-blue)]">Loading assigned calendar...</p> : null}
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-[var(--muted-blue)]">
          {(["CLASS", "LIVE_CLASS", "ASSIGNMENT", "EXAM", "MEETING"] as TeacherCalendarTask["kind"][]).map((kind) => <span key={kind} className="inline-flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${tone(kind)}`} />{kindLabel(kind)}</span>)}
        </div>
      </section>

      {selectedDate ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Day agenda">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-t-2xl border border-[var(--border)] bg-white shadow-2xl sm:rounded-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
              <div><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Day Agenda</p><h2 className="mt-2 text-2xl font-black">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2><p className="mt-1 text-sm text-[var(--muted-blue)]">{selectedTasks.length} assigned activities</p></div>
              <button type="button" onClick={() => setSelectedDate(null)} aria-label="Close day agenda" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--border)]"><X size={18} /></button>
            </header>
            <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-3">
                {selectedTasks.map((task) => {
                  const isCalendarTask = task.id.startsWith("calendar-") && Boolean(task.sourceId);
                  return (
                    <button key={task.id} type="button" disabled={!isCalendarTask} onClick={() => { if (task.sourceId && isCalendarTask) { setSelectedDate(null); onOpenClass(task.sourceId); } }} className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-4 text-left disabled:cursor-default">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white ${tone(task.kind)}`}><TaskIcon kind={task.kind} /></span>
                      <span className="min-w-0 flex-1"><span className="text-xs font-black uppercase tracking-[0.15em] text-[var(--gold-dark)]">{kindLabel(task.kind)}{task.time ? ` / ${task.time}` : ""}</span><span className="mt-1 block font-black">{task.title}</span>{task.subtitle ? <span className="mt-1 block text-sm text-[var(--muted-blue)]">{task.subtitle}</span> : null}<span className="mt-2 inline-flex rounded-full bg-[var(--page-bg)] px-2 py-1 text-[10px] font-black uppercase">{task.status || "Scheduled"}</span></span>
                    </button>
                  );
                })}
                {!selectedTasks.length ? <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center"><Clock3 className="mx-auto h-6 w-6 text-[var(--gold-dark)]" /><p className="mt-3 font-black">Nothing assigned for this date</p></div> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
