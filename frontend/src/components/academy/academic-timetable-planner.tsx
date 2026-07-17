"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Plus, Trash2 } from "lucide-react";

import {
  createAcademicCalendarItem,
  getAcademicCalendar,
  getAcademyBatches,
  getAcademyTeachers,
  updateAcademicCalendarSchedule,
  type AcademicCalendarItem,
  type AcademyBatch,
  type AcademyTeacher,
} from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";

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

const classTypes = ["LECTURE", "PRACTICE", "REVISION", "TEST", "MOCK_TEST", "DISCUSSION", "LIVE_CLASS", "BREAK"];

const defaultSlots = [
  { startTime: "09:00", endTime: "10:15" },
  { startTime: "10:30", endTime: "11:45" },
  { startTime: "12:00", endTime: "13:15" },
  { startTime: "14:00", endTime: "16:00" },
];

const fallbackSubjects = [
  "Mathematics",
  "English",
  "Reasoning",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Polity",
  "Geography",
  "Economics",
  "Current Affairs",
  "General Knowledge",
  "General Science",
  "Physical Training",
];

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function itemDateKey(item: AcademicCalendarItem) {
  return item.plannedDate.slice(0, 10);
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

function displayTime(time: string) {
  if (!time) return "--:--";
  const [hourRaw, minute = "00"] = time.split(":");
  const hour = Number(hourRaw);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minute} ${suffix}`;
}

function minutesFromTime(time?: string | null) {
  const match = String(time || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function timeRangesOverlap(leftStart?: string | null, leftEnd?: string | null, rightStart?: string | null, rightEnd?: string | null) {
  const aStart = minutesFromTime(leftStart);
  const aEnd = minutesFromTime(leftEnd);
  const bStart = minutesFromTime(rightStart);
  const bEnd = minutesFromTime(rightEnd);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;
  return aStart < bEnd && bStart < aEnd;
}

function blankSlot(template = defaultSlots[0], patch: Partial<PlannerSlot> = {}): PlannerSlot {
  return {
    startTime: template.startTime,
    endTime: template.endTime,
    batchId: "",
    subject: "",
    topic: "",
    teacherId: "",
    classType: "LECTURE",
    status: "SCHEDULED",
    ...patch,
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

function splitSubjects(subject?: string | null) {
  if (!subject) return [];
  return subject
    .split(/[,/&]+|\band\b/gi)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSubject(subject: string) {
  return subject.trim().toLowerCase().replace(/\s+/g, " ");
}

function classTypeLabel(value?: string | null) {
  return String(value || "LECTURE").replaceAll("_", " ");
}

function slotWarnings(slot: PlannerSlot, index: number, slots: PlannerSlot[]) {
  const warnings: string[] = [];
  if (slot.classType === "BREAK") return warnings;
  slots.forEach((other, otherIndex) => {
    if (otherIndex === index || other.classType === "BREAK") return;
    if (!timeRangesOverlap(slot.startTime, slot.endTime, other.startTime, other.endTime)) return;
    if (slot.teacherId && other.teacherId && slot.teacherId === other.teacherId) warnings.push("Teacher clash");
    if (slot.batchId && other.batchId && slot.batchId === other.batchId) warnings.push("Batch clash");
  });
  return [...new Set(warnings)];
}

function isBreakSlot(slot: PlannerSlot) {
  return slot.classType === "BREAK";
}

export function AcademicTimetablePlanner({ audience }: Props) {
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(localDateKey(today));
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [batchFilter, setBatchFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [view, setView] = useState<"calendar" | "day">("calendar");
  const [slots, setSlots] = useState<PlannerSlot[]>([]);
  const [notice, setNotice] = useState("");

  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const calendarQuery = useQuery({
    queryKey: ["academy", "academic-calendar", batchFilter],
    queryFn: () => getAcademicCalendar(batchFilter ? { batchId: batchFilter } : {}),
  });

  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);
  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);
  const calendar = useMemo(() => {
    const items = calendarQuery.data ?? [];
    return teacherFilter ? items.filter((item) => item.teacherId === teacherFilter) : items;
  }, [calendarQuery.data, teacherFilter]);
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

  const allSubjects = useMemo(() => {
    const subjects = new Set<string>();
    batches.forEach((batch) => {
      (batch.teachers ?? []).forEach((entry) => splitSubjects(entry.subject).forEach((subject) => subjects.add(subject)));
    });
    fallbackSubjects.forEach((subject) => subjects.add(subject));
    return [...subjects].sort((first, second) => first.localeCompare(second));
  }, [batches]);

  useEffect(() => {
    setSlots(selectedDayItems.length ? selectedDayItems.map(slotFromCalendar) : [blankSlot(defaultSlots[0])]);
  }, [selectedDayItems]);

  const createMutation = useMutation({
    mutationFn: createAcademicCalendarItem,
    onSuccess: () => {
      setNotice("Timetable slot saved.");
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["academy", "today"] });
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AcademicCalendarItem> }) => updateAcademicCalendarSchedule(id, payload),
    onSuccess: () => {
      setNotice("Timetable slot updated.");
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["academy", "today"] });
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  const selectDate = (date: Date) => {
    setSelectedDate(localDateKey(date));
    setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
    setView("day");
    setNotice("");
  };

  const changeMonth = (offset: number) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const getSubjectsForBatch = (batchId: string) => {
    const batch = batches.find((item) => item.id === batchId);
    if (!batch?.teachers?.length) return allSubjects;
    const subjects = new Set<string>();
    batch.teachers.forEach((entry) => splitSubjects(entry.subject).forEach((subject) => subjects.add(subject)));
    allSubjects.forEach((subject) => subjects.add(subject));
    return [...subjects].sort((first, second) => first.localeCompare(second));
  };

  const getTeachersForSlot = (slot: PlannerSlot) => {
    const batch = batches.find((item) => item.id === slot.batchId);
    const batchTeachers = batch?.teachers ?? [];
    if (!batchTeachers.length) return teachers;
    const subject = normalizeSubject(slot.subject);
    const matched = subject
      ? batchTeachers.filter((entry) => splitSubjects(entry.subject).some((entrySubject) => normalizeSubject(entrySubject) === subject))
      : batchTeachers;
    const source = matched.length ? matched : batchTeachers;
    const unique = new Map<string, AcademyTeacher>();
    source.forEach((entry) => unique.set(entry.teacher.id, entry.teacher));
    return [...unique.values()].sort((first, second) => first.name.localeCompare(second.name));
  };

  const setSlot = (index: number, patch: Partial<PlannerSlot>) => {
    setSlots((current) => current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)));
  };

  const addClassSlot = () => {
    const last = slots[slots.length - 1];
    setSlots((current) => [...current, blankSlot({ startTime: last?.endTime || "16:00", endTime: "17:00" })]);
  };

  const addBreakSlot = () => {
    const last = slots[slots.length - 1];
    setSlots((current) => [
      ...current,
      blankSlot(
        { startTime: last?.endTime || "10:15", endTime: "10:30" },
        { classType: "BREAK", subject: "Break", topic: "Break", status: "SCHEDULED" },
      ),
    ]);
  };

  const removeLocalSlot = (index: number) => {
    setSlots((current) => current.filter((_, slotIndex) => slotIndex !== index));
  };

  const cancelSlot = (slot: PlannerSlot, index: number) => {
    if (!slot.calendarId) {
      removeLocalSlot(index);
      return;
    }
    updateMutation.mutate({
      id: slot.calendarId,
      payload: {
        status: "CANCELLED",
        completionStatus: "CANCELLED",
        nextAction: "Cancelled from timetable planner",
      },
    });
  };

  const saveSlot = (slot: PlannerSlot, index: number) => {
    setNotice("");
    const breakSlot = isBreakSlot(slot);
    if (!slot.startTime || !slot.endTime) {
      setNotice("Start time and end time are required.");
      return;
    }
    if (!breakSlot && (!slot.batchId || !slot.subject || !slot.teacherId)) {
      setNotice("Select batch, subject and teacher before saving this class.");
      return;
    }

    const batch = batches.find((item) => item.id === slot.batchId);
    const teacher = teachers.find((item) => item.id === slot.teacherId);
    const payload = {
      batchId: breakSlot ? undefined : slot.batchId,
      batchName: breakSlot ? "Break" : batch?.name,
      programSlug: breakSlot ? undefined : batch?.programSlug,
      subject: breakSlot ? "Break" : slot.subject.trim(),
      topic: breakSlot ? slot.topic.trim() || "Break" : slot.topic.trim() || `${slot.subject} class`,
      classType: slot.classType,
      plannedDate: selectedDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      teacherId: breakSlot ? undefined : slot.teacherId,
      teacherName: breakSlot ? undefined : teacher?.name,
      status: slot.status || "SCHEDULED",
      completionStatus: "PENDING",
      nextAction: "Scheduled from timetable planner",
    };

    if (slot.calendarId) {
      updateMutation.mutate({ id: slot.calendarId, payload }, {
        onSuccess: (item) => setSlots((current) => current.map((currentSlot, slotIndex) => (slotIndex === index ? slotFromCalendar(item) : currentSlot))),
      });
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (item) => setSlots((current) => current.map((currentSlot, slotIndex) => (slotIndex === index ? slotFromCalendar(item) : currentSlot))),
    });
  };

  const copyDayToTomorrow = () => {
    const source = slots.filter((slot) => slot.calendarId || slot.subject || slot.classType === "BREAK");
    if (!source.length) {
      setNotice("No timetable slots available to copy.");
      return;
    }
    const nextDate = new Date(`${selectedDate}T12:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);
    const dateKey = localDateKey(nextDate);
    source.forEach((slot) => {
      const breakSlot = isBreakSlot(slot);
      const batch = batches.find((item) => item.id === slot.batchId);
      const teacher = teachers.find((item) => item.id === slot.teacherId);
      createMutation.mutate({
        batchId: breakSlot ? undefined : slot.batchId,
        batchName: breakSlot ? "Break" : batch?.name,
        programSlug: breakSlot ? undefined : batch?.programSlug,
        subject: breakSlot ? "Break" : slot.subject.trim(),
        topic: breakSlot ? slot.topic.trim() || "Break" : slot.topic.trim() || `${slot.subject} class`,
        classType: slot.classType,
        plannedDate: dateKey,
        startTime: slot.startTime,
        endTime: slot.endTime,
        teacherId: breakSlot ? undefined : slot.teacherId,
        teacherName: breakSlot ? undefined : teacher?.name,
        status: "SCHEDULED",
        completionStatus: "PENDING",
        nextAction: "Copied from timetable planner",
      });
    });
    setNotice(`Copied ${source.length} slot(s) to ${nextDate.toLocaleDateString("en-IN")}.`);
  };

  const selectedDateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-3 py-3 text-[var(--navy)]">
      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-3">
        <header className="shrink-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">{audience === "director" ? "Director Planner" : "Academic Planner"}</p>
              <h1 className="mt-1 text-2xl font-black">Timetable Calendar</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Use this page only to add, edit, reschedule, cancel and copy timetable slots. Class completion and feedback are tracked in class reports.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-3 xl:w-[680px]">
              <select className="field" value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}>
                <option value="">All batches</option>
                {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
              </select>
              <select className="field" value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}>
                <option value="">All teachers</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name || teacher.email}</option>)}
              </select>
              <button className="btn-primary" type="button" onClick={() => selectDate(today)}>
                <CalendarDays className="h-4 w-4" />
                Today
              </button>
            </div>
          </div>
        </header>

        {notice ? <div className="shrink-0 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-3 text-sm font-black">{notice}</div> : null}

        {view === "calendar" ? (
          <CalendarPage
            calendarByDate={calendarByDate}
            changeMonth={changeMonth}
            monthCells={monthCells}
            monthDate={monthDate}
            selectedDate={selectedDate}
            selectDate={selectDate}
          />
        ) : (
          <DayEditorPage
            allSubjects={allSubjects}
            batches={batches}
            cancelSlot={cancelSlot}
            copyDayToTomorrow={copyDayToTomorrow}
            createPending={createMutation.isPending}
            getSubjectsForBatch={getSubjectsForBatch}
            getTeachersForSlot={getTeachersForSlot}
            label={selectedDateLabel}
            onBack={() => setView("calendar")}
            saveSlot={saveSlot}
            selectedDate={selectedDate}
            setSlot={setSlot}
            setSlots={setSlots}
            slots={slots}
            addBreakSlot={addBreakSlot}
            addClassSlot={addClassSlot}
            updatePending={updateMutation.isPending}
          />
        )}
      </section>

      <style jsx global>{`
        .field {
          min-height: 40px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: white;
          padding: 0.5rem 0.75rem;
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
          min-height: 40px;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 12px;
          padding: 0.5rem 0.85rem;
          font-size: 0.875rem;
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
          width: 40px;
          padding: 0;
        }
      `}</style>
    </main>
  );
}

function CalendarPage({
  calendarByDate,
  changeMonth,
  monthCells,
  monthDate,
  selectedDate,
  selectDate,
}: {
  calendarByDate: Map<string, AcademicCalendarItem[]>;
  changeMonth: (offset: number) => void;
  monthCells: Array<Date | null>;
  monthDate: Date;
  selectedDate: string;
  selectDate: (date: Date) => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Full Calendar</p>
          <h2 className="mt-1 text-3xl font-black">{monthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
          <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">Click any date to add or edit that day&apos;s timetable.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="icon-button" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" className="icon-button" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] text-center text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="border-r border-[var(--border)] p-2 last:border-r-0">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 rounded-b-2xl border-x border-b border-[var(--border)]">
        {monthCells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="min-h-32 border-r border-t border-[var(--border)] bg-[var(--page-bg)]/50 last:border-r-0" />;
          const key = localDateKey(date);
          const items = calendarByDate.get(key) ?? [];
          const classCount = items.filter((item) => item.status !== "CANCELLED" && item.classType !== "BREAK").length;
          const breakCount = items.filter((item) => item.classType === "BREAK").length;
          const cancelledCount = items.filter((item) => item.status === "CANCELLED").length;
          const isSelected = key === selectedDate;
          return (
            <button
              key={key}
              type="button"
              onClick={() => selectDate(date)}
              className={`min-h-32 border-r border-t border-[var(--border)] p-2 text-left transition hover:bg-[var(--gold-soft)] ${isSelected ? "bg-[var(--navy)] text-white" : "bg-white"}`}
            >
              <span className="text-lg font-black">{date.getDate()}</span>
              <div className="mt-3 grid gap-1">
                <CalendarBadge label={classCount ? `${classCount} class${classCount === 1 ? "" : "es"}` : "Plan day"} active={isSelected} />
                {breakCount ? <CalendarBadge label={`${breakCount} break`} active={isSelected} /> : null}
                {cancelledCount ? <CalendarBadge label={`${cancelledCount} cancelled`} active={isSelected} /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CalendarBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`w-fit rounded-full px-2 py-1 text-[10px] font-black ${active ? "bg-white/15 text-white" : "border border-[var(--border)] bg-[var(--page-bg)] text-[var(--navy)]"}`}>
      {label}
    </span>
  );
}

function DayEditorPage({
  addBreakSlot,
  addClassSlot,
  allSubjects,
  batches,
  cancelSlot,
  copyDayToTomorrow,
  createPending,
  getSubjectsForBatch,
  getTeachersForSlot,
  label,
  onBack,
  saveSlot,
  selectedDate,
  setSlot,
  setSlots,
  slots,
  updatePending,
}: {
  addBreakSlot: () => void;
  addClassSlot: () => void;
  allSubjects: string[];
  batches: AcademyBatch[];
  cancelSlot: (slot: PlannerSlot, index: number) => void;
  copyDayToTomorrow: () => void;
  createPending: boolean;
  getSubjectsForBatch: (batchId: string) => string[];
  getTeachersForSlot: (slot: PlannerSlot) => AcademyTeacher[];
  label: string;
  onBack: () => void;
  saveSlot: (slot: PlannerSlot, index: number) => void;
  selectedDate: string;
  setSlot: (index: number, patch: Partial<PlannerSlot>) => void;
  setSlots: Dispatch<SetStateAction<PlannerSlot[]>>;
  slots: PlannerSlot[];
  updatePending: boolean;
}) {
  const visibleSlots = slots.length ? slots : [blankSlot()];
  const sortedSlots = [...visibleSlots].sort((left, right) => left.startTime.localeCompare(right.startTime));

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm font-black text-[var(--muted-blue)]">
            <ArrowLeft className="h-4 w-4" />
            Full Calendar
          </button>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Day Timetable</p>
          <h2 className="mt-1 text-3xl font-black">{label}</h2>
          <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">Add classes, breaks, teacher, subject and batch for this date only.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-light" type="button" onClick={addClassSlot}><Plus className="h-4 w-4" /> Add Class</button>
          <button className="btn-light" type="button" onClick={addBreakSlot}><Clock className="h-4 w-4" /> Add Break</button>
          <button className="btn-primary" type="button" onClick={copyDayToTomorrow}>Copy To Next Day</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {sortedSlots.map((slot, displayIndex) => {
          const index = slots.indexOf(slot);
          return (
            <SlotEditor
              key={`${slot.calendarId ?? "new"}-${displayIndex}-${slot.startTime}`}
              allSubjects={allSubjects}
              batches={batches}
              cancelSlot={cancelSlot}
              createPending={createPending}
              getSubjectsForBatch={getSubjectsForBatch}
              getTeachersForSlot={getTeachersForSlot}
              index={index}
              saveSlot={saveSlot}
              selectedDate={selectedDate}
              setSlot={setSlot}
              setSlots={setSlots}
              slot={slot}
              slots={slots}
              updatePending={updatePending}
            />
          );
        })}
      </div>
    </section>
  );
}

function SlotEditor({
  allSubjects,
  batches,
  cancelSlot,
  createPending,
  getSubjectsForBatch,
  getTeachersForSlot,
  index,
  saveSlot,
  setSlot,
  setSlots,
  slot,
  slots,
  updatePending,
}: {
  allSubjects: string[];
  batches: AcademyBatch[];
  cancelSlot: (slot: PlannerSlot, index: number) => void;
  createPending: boolean;
  getSubjectsForBatch: (batchId: string) => string[];
  getTeachersForSlot: (slot: PlannerSlot) => AcademyTeacher[];
  index: number;
  saveSlot: (slot: PlannerSlot, index: number) => void;
  selectedDate: string;
  setSlot: (index: number, patch: Partial<PlannerSlot>) => void;
  setSlots: Dispatch<SetStateAction<PlannerSlot[]>>;
  slot: PlannerSlot;
  slots: PlannerSlot[];
  updatePending: boolean;
}) {
  const breakSlot = isBreakSlot(slot);
  const warnings = slotWarnings(slot, index, slots);
  const subjects = slot.batchId ? getSubjectsForBatch(slot.batchId) : allSubjects;
  const teacherOptions = getTeachersForSlot(slot);

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${breakSlot ? "border-amber-200 bg-amber-50" : "border-[var(--border)] bg-[var(--page-bg)]"}`}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid w-[145px] gap-2 text-sm font-black">
          Start
          <input className="field" type="time" value={slot.startTime} onChange={(event) => setSlot(index, { startTime: event.target.value })} />
        </label>
        <label className="grid w-[145px] gap-2 text-sm font-black">
          End
          <input className="field" type="time" value={slot.endTime} onChange={(event) => setSlot(index, { endTime: event.target.value })} />
        </label>
        <label className="grid w-[180px] gap-2 text-sm font-black">
          Type
          <select
            className="field"
            value={slot.classType}
            onChange={(event) => {
              const classType = event.target.value;
              setSlot(index, {
                classType,
                ...(classType === "BREAK" ? { subject: "Break", topic: "Break", batchId: "", teacherId: "" } : {}),
              });
            }}
          >
            {classTypes.map((type) => <option key={type} value={type}>{classTypeLabel(type)}</option>)}
          </select>
        </label>
        <div className="min-h-10 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
          {displayTime(slot.startTime)} - {displayTime(slot.endTime)}
        </div>
      </div>

      {!breakSlot ? (
        <>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-black">
              Batch
              <select className="field" value={slot.batchId} onChange={(event) => setSlot(index, { batchId: event.target.value, subject: "", teacherId: "" })}>
                <option value="">Select batch</option>
                {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black">
              Subject
              <select className="field" value={slot.subject} onChange={(event) => setSlot(index, { subject: event.target.value, teacherId: "" })}>
                <option value="">Select subject</option>
                {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black">
              Teacher
              <select className="field" value={slot.teacherId} onChange={(event) => setSlot(index, { teacherId: event.target.value })}>
                <option value="">Select teacher</option>
                {teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-3 grid gap-2 text-sm font-black">
            Topic / Chapter
            <input className="field" value={slot.topic} onChange={(event) => setSlot(index, { topic: event.target.value })} placeholder="Topic / chapter" />
          </label>
        </>
      ) : (
        <label className="mt-3 grid gap-2 text-sm font-black">
          Break Name
          <input className="field" value={slot.topic} onChange={(event) => setSlot(index, { topic: event.target.value, subject: "Break" })} placeholder="Break / Lunch" />
        </label>
      )}

      {warnings.length ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-700">
          <AlertTriangle className="h-4 w-4" />
          {warnings.join(", ")}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-3">
        <button className="btn-light" type="button" onClick={() => cancelSlot(slot, index)}>
          <Trash2 className="h-4 w-4" />
          {slot.calendarId ? "Cancel Slot" : "Remove"}
        </button>
        <button className="btn-primary" type="button" onClick={() => saveSlot(slot, index)} disabled={createPending || updatePending}>
          <CheckCircle2 className="h-4 w-4" />
          {slot.calendarId ? "Update Slot" : "Save Slot"}
        </button>
      </div>
    </article>
  );
}
