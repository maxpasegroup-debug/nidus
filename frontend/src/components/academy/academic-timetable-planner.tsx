"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Plus, RotateCcw, Users } from "lucide-react";
import {
  createAcademicCalendarItem,
  getAcademyBatches,
  getAcademyTeachers,
  getAcademicCalendar,
  updateAcademicCalendarSchedule,
  type AcademicCalendarItem,
} from "@/services/academy";

const classTypes = ["LECTURE", "PRACTICE", "REVISION", "TEST", "MOCK_TEST", "DISCUSSION", "LIVE_CLASS"];

const defaultSlots = [
  { startTime: "09:00", endTime: "10:15" },
  { startTime: "10:30", endTime: "11:45" },
  { startTime: "12:00", endTime: "13:15" },
  { startTime: "14:00", endTime: "16:00" },
];

type Props = {
  audience: "director" | "academic-head";
};

type PlannerSlot = {
  calendarId?: string;
  startTime: string;
  endTime: string;
  batchId: string;
  subject: string;
  topic: string;
  teacherId: string;
  classType: string;
  status: string;
};

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function itemDateKey(item: AcademicCalendarItem) {
  return item.plannedDate.slice(0, 10);
}

function blankSlot(template = defaultSlots[0]): PlannerSlot {
  return {
    startTime: template.startTime,
    endTime: template.endTime,
    batchId: "",
    subject: "",
    topic: "",
    teacherId: "",
    classType: "LECTURE",
    status: "SCHEDULED",
  };
}

function slotFromCalendar(item: AcademicCalendarItem): PlannerSlot {
  return {
    calendarId: item.id,
    startTime: item.startTime ?? "",
    endTime: item.endTime ?? "",
    batchId: item.batchId ?? "",
    subject: item.subject ?? "",
    topic: item.topic ?? "",
    teacherId: item.teacherId ?? "",
    classType: item.classType ?? "LECTURE",
    status: item.status ?? "SCHEDULED",
  };
}

function buildMonthDays(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const cells: Array<Date | null> = [];
  for (let index = 0; index < first.getDay(); index += 1) cells.push(null);
  for (let day = 1; day <= last.getDate(); day += 1) cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function AcademicTimetablePlanner({ audience }: Props) {
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(localDateKey(today));
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [batchFilter, setBatchFilter] = useState("");
  const [slots, setSlots] = useState<PlannerSlot[]>(defaultSlots.map(blankSlot));
  const [notice, setNotice] = useState("");

  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const calendarQuery = useQuery({
    queryKey: ["academy", "academic-calendar", batchFilter],
    queryFn: () => getAcademicCalendar(batchFilter ? { batchId: batchFilter } : {}),
  });

  const batches = batchesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];
  const calendar = calendarQuery.data ?? [];
  const monthCells = useMemo(() => buildMonthDays(monthDate), [monthDate]);

  const calendarByDate = useMemo(() => {
    const map = new Map<string, AcademicCalendarItem[]>();
    calendar.forEach((item) => {
      const key = itemDateKey(item);
      const items = map.get(key) ?? [];
      items.push(item);
      map.set(key, items);
    });
    return map;
  }, [calendar]);

  const selectedDayItems = useMemo(
    () => [...(calendarByDate.get(selectedDate) ?? [])].sort((first, second) => String(first.startTime ?? "").localeCompare(String(second.startTime ?? ""))),
    [calendarByDate, selectedDate],
  );

  const summary = useMemo(() => {
    const monthKey = localDateKey(monthDate).slice(0, 7);
    const monthItems = calendar.filter((item) => itemDateKey(item).startsWith(monthKey));
    return {
      month: monthItems.length,
      selected: selectedDayItems.length,
      teachers: new Set(monthItems.map((item) => item.teacherId).filter(Boolean)).size,
      batches: new Set(monthItems.map((item) => item.batchId).filter(Boolean)).size,
    };
  }, [calendar, monthDate, selectedDayItems.length]);

  useEffect(() => {
    if (selectedDayItems.length) {
      setSlots(selectedDayItems.map(slotFromCalendar));
      return;
    }
    setSlots(defaultSlots.map(blankSlot));
  }, [selectedDayItems]);

  const createMutation = useMutation({
    mutationFn: createAcademicCalendarItem,
    onSuccess: () => {
      setNotice("Timetable session saved. Teacher dashboard and student calendar will use this session.");
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["academy", "today"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not save timetable session."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AcademicCalendarItem> }) => updateAcademicCalendarSchedule(id, payload),
    onSuccess: () => {
      setNotice("Timetable session updated.");
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["academy", "today"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not update timetable session."),
  });

  const setSlot = (index: number, patch: Partial<PlannerSlot>) => {
    setSlots((current) => current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)));
  };

  const saveSlot = (slot: PlannerSlot, index: number) => {
    setNotice("");
    if (!slot.batchId || !slot.subject || !slot.teacherId || !slot.startTime || !slot.endTime) {
      setNotice("Select batch, subject, teacher, start time and end time before saving this session.");
      return;
    }
    const batch = batches.find((item) => item.id === slot.batchId);
    const teacher = teachers.find((item) => item.id === slot.teacherId);
    const topic = slot.topic.trim() || `${slot.subject} class`;
    const payload = {
      batchId: slot.batchId,
      batchName: batch?.name,
      programSlug: batch?.programSlug,
      subject: slot.subject.trim(),
      topic,
      classType: slot.classType,
      plannedDate: selectedDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      teacherId: slot.teacherId,
      teacherName: teacher?.name,
      status: slot.status || "SCHEDULED",
      completionStatus: "PENDING",
      nextAction: "Class scheduled from timetable planner",
    };
    if (slot.calendarId) {
      updateMutation.mutate({ id: slot.calendarId, payload });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (item) => {
          setSlots((current) => current.map((currentSlot, slotIndex) => (slotIndex === index ? slotFromCalendar(item) : currentSlot)));
        },
      });
    }
  };

  const addCustomSlot = () => {
    const last = slots[slots.length - 1];
    setSlots((current) => [...current, blankSlot({ startTime: last?.endTime || "16:00", endTime: "17:00" })]);
  };

  const resetDefaultSlots = () => setSlots(defaultSlots.map(blankSlot));

  const changeMonth = (offset: number) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectDate = (date: Date) => {
    setSelectedDate(localDateKey(date));
    setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{audience === "director" ? "Director Planner" : "Academic Head Planner"}</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Plan timetable by day.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Open a date, edit the day&apos;s class slots, choose batch, subject and teacher, then save. Teachers and students receive the timetable automatically.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Metric label="Month classes" value={summary.month} />
              <Metric label="Selected day" value={summary.selected} />
              <Metric label="Teachers" value={summary.teachers} />
              <Metric label="Batches" value={summary.batches} />
            </div>
          </div>
        </section>

        {notice ? <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--navy)] shadow-sm">{notice}</div> : null}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Calendar</p>
                <h2 className="text-2xl font-black">{monthLabel(monthDate)}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <select className="field min-w-[220px]" value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}>
                  <option value="">All batches</option>
                  {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                </select>
                <button type="button" className="icon-button" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" className="btn-light" onClick={() => selectDate(today)}>Today</button>
                <button type="button" className="icon-button" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day}>{day}</div>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthCells.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="min-h-24 rounded-xl border border-transparent" />;
                const key = localDateKey(date);
                const items = calendarByDate.get(key) ?? [];
                const isSelected = key === selectedDate;
                const isToday = key === localDateKey(today);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectDate(date)}
                    className={`min-h-24 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${isSelected ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--border)] bg-white"} ${isToday && !isSelected ? "ring-2 ring-[var(--gold)]" : ""}`}
                  >
                    <span className="text-sm font-black">{date.getDate()}</span>
                    <span className={`mt-4 block text-xs font-black ${isSelected ? "text-white" : "text-[var(--muted-blue)]"}`}>
                      {items.length ? `${items.length} class${items.length === 1 ? "" : "es"}` : "Plan day"}
                    </span>
                    {items[0] ? <span className="mt-1 block truncate text-xs">{items[0].subject}</span> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Daily Slots</p>
                <h2 className="text-2xl font-black">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-light" type="button" onClick={resetDefaultSlots}><RotateCcw className="h-4 w-4" /> Default day</button>
                <button className="btn-primary" type="button" onClick={addCustomSlot}><Plus className="h-4 w-4" /> Add session</button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {slots.map((slot, index) => {
                const currentBatch = batches.find((batch) => batch.id === slot.batchId);
                const subjects = Array.from(new Set((currentBatch?.teachers ?? []).map((teacher) => teacher.subject).filter(Boolean)));
                const teacherOptions = currentBatch?.teachers?.length ? currentBatch.teachers.map((entry) => entry.teacher) : teachers;
                return (
                  <article key={`${slot.calendarId ?? "new"}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="inline-flex items-center gap-2 text-sm font-black">
                        <Clock className="h-4 w-4" />
                        Session {index + 1}
                        {slot.calendarId ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">Saved</span> : <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">New</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:w-56">
                        <input className="field" type="time" value={slot.startTime} onChange={(event) => setSlot(index, { startTime: event.target.value })} />
                        <input className="field" type="time" value={slot.endTime} onChange={(event) => setSlot(index, { endTime: event.target.value })} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Label title="Batch">
                        <select className="field" value={slot.batchId} onChange={(event) => setSlot(index, { batchId: event.target.value, subject: "", teacherId: "" })}>
                          <option value="">Select batch</option>
                          {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                        </select>
                      </Label>
                      <Label title="Subject">
                        <select className="field" value={slot.subject} onChange={(event) => setSlot(index, { subject: event.target.value })}>
                          <option value="">Select subject</option>
                          {subjects.length ? subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>) : null}
                          <option value="Mathematics">Mathematics</option>
                          <option value="English">English</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Biology">Biology</option>
                          <option value="History">History</option>
                          <option value="Polity">Polity</option>
                          <option value="Geography">Geography</option>
                          <option value="Economics">Economics</option>
                          <option value="Current Affairs">Current Affairs</option>
                          <option value="Reasoning">Reasoning</option>
                        </select>
                      </Label>
                      <Label title="Teacher">
                        <select className="field" value={slot.teacherId} onChange={(event) => setSlot(index, { teacherId: event.target.value })}>
                          <option value="">Select teacher</option>
                          {teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                        </select>
                      </Label>
                      <Label title="Session type">
                        <select className="field" value={slot.classType} onChange={(event) => setSlot(index, { classType: event.target.value })}>
                          {classTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                        </select>
                      </Label>
                      <Label title="Topic / chapter">
                        <input className="field" value={slot.topic} onChange={(event) => setSlot(index, { topic: event.target.value })} placeholder="Algebra - continued" />
                      </Label>
                      <Label title="Status">
                        <select className="field" value={slot.status} onChange={(event) => setSlot(index, { status: event.target.value })}>
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="PLANNED">Planned</option>
                          <option value="RESCHEDULED">Rescheduled</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </Label>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-between gap-2">
                      <button className="btn-light" type="button" onClick={() => setSlots((current) => current.filter((_, slotIndex) => slotIndex !== index))}>Remove</button>
                      <button className="btn-primary" type="button" onClick={() => saveSlot(slot, index)} disabled={createMutation.isPending || updateMutation.isPending}>
                        <CheckCircle2 className="h-4 w-4" /> Save session
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">What Gets Updated</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Info title="Teacher timetable" body="Saved sessions appear in the assigned teacher's Today, My Classes and calendar views." />
            <Info title="Student schedule" body="Students in the selected batch receive the class in their calendar and upcoming work." />
            <Info title="Editable day plan" body="Any day can be opened again to change times, teacher, subject, topic or status." />
          </div>
        </section>
      </section>
      <style jsx>{`
        .field {
          min-height: 44px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: white;
          padding: 0.65rem 0.85rem;
          color: var(--navy);
          outline: none;
        }
        .field:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(186, 141, 54, 0.16);
        }
        .btn-primary,
        .btn-light,
        .icon-button {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 12px;
          padding: 0.65rem 1rem;
          font-weight: 900;
          transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }
        .btn-primary {
          background: var(--navy);
          color: white;
        }
        .btn-light,
        .icon-button {
          border: 1px solid var(--border);
          background: white;
          color: var(--navy);
        }
        .btn-primary:hover,
        .btn-light:hover,
        .icon-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
        }
        .icon-button {
          width: 44px;
          padding: 0;
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
