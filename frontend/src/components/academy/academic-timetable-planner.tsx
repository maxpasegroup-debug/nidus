"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, LayoutGrid, ListChecks, MessageCircle, Plus, RotateCcw, Users } from "lucide-react";
import {
  createAcademicCalendarItem,
  type AcademyBatch,
  type AcademyTeacher,
  getAcademyBatches,
  getAcademyTeachers,
  getAcademicCalendar,
  updateAcademicCalendarSchedule,
  type AcademicCalendarItem,
} from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";

const classTypes = ["LECTURE", "PRACTICE", "REVISION", "TEST", "MOCK_TEST", "DISCUSSION", "LIVE_CLASS"];

const defaultSlots = [
  { startTime: "09:00", endTime: "10:15" },
  { startTime: "10:30", endTime: "11:45" },
  { startTime: "12:00", endTime: "13:15" },
  { startTime: "14:00", endTime: "16:00" },
];

const breakRows: Record<string, string> = {
  "10:15": "Break - 10:15 AM to 10:30 AM",
  "11:45": "Break - 11:45 AM to 12:00 PM",
  "13:15": "Lunch - 01:15 PM to 02:00 PM",
};

type DownloadRange = "day" | "week" | "month";
type PlannerView = "daily" | "weekly";

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

function normalizeSubject(subject: string) {
  return subject.trim().toLowerCase().replace(/\s+/g, " ");
}

function splitSubjects(subject?: string | null) {
  if (!subject) return [];
  return subject
    .split(/[,/&]+|\band\b/gi)
    .map((item) => item.trim())
    .filter(Boolean);
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

function classTypeLabel(value?: string | null) {
  return String(value || "LECTURE").replaceAll("_", " ");
}

function weekDaysForDate(selectedDate: string) {
  const base = new Date(`${selectedDate}T12:00:00`);
  const start = new Date(base);
  start.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function slotWarnings(slot: PlannerSlot, index: number, slots: PlannerSlot[]) {
  const warnings: string[] = [];
  slots.forEach((other, otherIndex) => {
    if (otherIndex === index) return;
    if (!timeRangesOverlap(slot.startTime, slot.endTime, other.startTime, other.endTime)) return;
    if (slot.teacherId && other.teacherId && slot.teacherId === other.teacherId) warnings.push("Teacher has another session at this time.");
    if (slot.batchId && other.batchId && slot.batchId === other.batchId) warnings.push("Batch has another session at this time.");
  });
  return [...new Set(warnings)];
}

function missingSlotFields(slot: PlannerSlot) {
  return [
    ["batch", slot.batchId],
    ["subject", slot.subject],
    ["teacher", slot.teacherId],
    ["start time", slot.startTime],
    ["end time", slot.endTime],
  ].filter(([, value]) => !value).map(([label]) => label);
}

function dateRangeForDownload(selectedDate: string, range: DownloadRange) {
  const base = new Date(`${selectedDate}T12:00:00`);
  if (range === "day") return { from: selectedDate, to: selectedDate, label: base.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) };
  if (range === "week") {
    const start = new Date(base);
    start.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: localDateKey(start), to: localDateKey(end), label: `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` };
  }
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { from: localDateKey(start), to: localDateKey(end), label: base.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
}

function filteredDownloadItems(items: AcademicCalendarItem[], selectedDate: string, range: DownloadRange, batchId: string) {
  const { from, to } = dateRangeForDownload(selectedDate, range);
  return items
    .filter((item) => item.plannedDate.slice(0, 10) >= from && item.plannedDate.slice(0, 10) <= to)
    .filter((item) => !batchId || item.batchId === batchId)
    .sort((first, second) => `${first.plannedDate}${first.startTime ?? ""}`.localeCompare(`${second.plannedDate}${second.startTime ?? ""}`));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] ?? char));
}

function timetableHtml(items: AcademicCalendarItem[], title: string) {
  const rows = items.map((item) => `
    <tr>
      <td>${escapeHtml(new Date(`${item.plannedDate.slice(0, 10)}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }))}</td>
      <td>${escapeHtml(`${displayTime(item.startTime ?? "")} - ${displayTime(item.endTime ?? "")}`)}</td>
      <td>${escapeHtml(item.batchName ?? "Batch")}</td>
      <td>${escapeHtml(item.subject)}</td>
      <td>${escapeHtml(item.teacherName ?? "Faculty")}</td>
      <td>${escapeHtml(item.topic)}</td>
    </tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#071d36;padding:24px}h1{margin:0 0 6px;font-size:26px}p{margin:0 0 18px;color:#52647a}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8d4c8;padding:10px;text-align:left;font-size:13px}th{background:#071d36;color:#fff}tr:nth-child(even){background:#f7f3ea}</style></head><body><h1>${escapeHtml(title)}</h1><p>Generated from NIDUS Academic Timetable Planner</p><table><thead><tr><th>Date</th><th>Time</th><th>Batch</th><th>Subject</th><th>Teacher</th><th>Topic</th></tr></thead><tbody>${rows || `<tr><td colspan="6">No sessions found.</td></tr>`}</tbody></table></body></html>`;
}

export function AcademicTimetablePlanner({ audience }: Props) {
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(localDateKey(today));
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [batchFilter, setBatchFilter] = useState("");
  const [slots, setSlots] = useState<PlannerSlot[]>(defaultSlots.map(blankSlot));
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [downloadRange, setDownloadRange] = useState<DownloadRange>("day");
  const [plannerView, setPlannerView] = useState<PlannerView>("daily");

  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const calendarQuery = useQuery({
    queryKey: ["academy", "academic-calendar", batchFilter],
    queryFn: () => getAcademicCalendar(batchFilter ? { batchId: batchFilter } : {}),
  });

  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);
  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);
  const calendar = useMemo(() => calendarQuery.data ?? [], [calendarQuery.data]);
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
  const weekDays = useMemo(() => weekDaysForDate(selectedDate), [selectedDate]);
  const weekItems = useMemo(() => filteredDownloadItems(calendar, selectedDate, "week", batchFilter), [batchFilter, calendar, selectedDate]);
  const weekSlotTimes = useMemo(() => {
    const values = new Set(defaultSlots.map((slot) => `${slot.startTime}-${slot.endTime}`));
    weekItems.forEach((item) => {
      if (item.startTime && item.endTime) values.add(`${item.startTime}-${item.endTime}`);
    });
    return [...values]
      .map((value) => {
        const [startTime, endTime] = value.split("-");
        return { startTime, endTime };
      })
      .sort((first, second) => String(first.startTime).localeCompare(String(second.startTime)));
  }, [weekItems]);

  const fallbackSubjects = useMemo(
    () => [
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
    ],
    [],
  );

  const allSubjects = useMemo(() => {
    const subjects = new Set<string>();
    batches.forEach((batch) => {
      (batch.teachers ?? []).forEach((entry) => {
        splitSubjects(entry.subject).forEach((subject) => subjects.add(subject));
      });
    });
    fallbackSubjects.forEach((subject) => subjects.add(subject));
    return [...subjects].sort((first, second) => first.localeCompare(second));
  }, [batches, fallbackSubjects]);

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
      setActiveSlotIndex(0);
      return;
    }
    setSlots(defaultSlots.map(blankSlot));
    setActiveSlotIndex(0);
  }, [selectedDayItems]);

  const createMutation = useMutation({
    mutationFn: createAcademicCalendarItem,
    onSuccess: () => {
      setNotice("Timetable session saved. Teacher dashboard and student calendar will use this session.");
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["academy", "today"] });
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AcademicCalendarItem> }) => updateAcademicCalendarSchedule(id, payload),
    onSuccess: () => {
      setNotice("Timetable session updated.");
      void queryClient.invalidateQueries({ queryKey: ["academy", "academic-calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["academy", "today"] });
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  const setSlot = (index: number, patch: Partial<PlannerSlot>) => {
    setSlots((current) => current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)));
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
      updateMutation.mutate({ id: slot.calendarId, payload }, {
        onSuccess: (item) => {
          setSlots((current) => current.map((currentSlot, slotIndex) => (slotIndex === index ? slotFromCalendar(item) : currentSlot)));
        },
      });
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
    setSlots((current) => {
      const next = [...current, blankSlot({ startTime: last?.endTime || "16:00", endTime: "17:00" })];
      setActiveSlotIndex(next.length - 1);
      return next;
    });
  };

  const resetDefaultSlots = () => {
    setSlots(defaultSlots.map(blankSlot));
    setActiveSlotIndex(0);
  };

  const changeMonth = (offset: number) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const changeWeek = (offset: number) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + offset * 7);
    selectDate(date);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(localDateKey(date));
    setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const openDailyDate = (date: Date) => {
    selectDate(date);
    setPlannerView("daily");
  };

  const downloadItems = useMemo(() => filteredDownloadItems(calendar, selectedDate, downloadRange, batchFilter), [batchFilter, calendar, downloadRange, selectedDate]);
  const downloadTitle = `NIDUS Timetable - ${dateRangeForDownload(selectedDate, downloadRange).label}`;

  const downloadTimetable = () => {
    const blob = new Blob([timetableHtml(downloadItems, downloadTitle)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${downloadTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const shareOnWhatsApp = () => {
    const preview = downloadItems.slice(0, 8).map((item) => `${new Date(`${item.plannedDate.slice(0, 10)}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${displayTime(item.startTime ?? "")}: ${item.batchName ?? "Batch"} - ${item.subject} (${item.teacherName ?? "Faculty"})`).join("\n");
    const text = `${downloadTitle}\n${preview || "No sessions found."}${downloadItems.length > 8 ? `\n+${downloadItems.length - 8} more session(s)` : ""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-3 py-3 text-[var(--navy)] lg:h-[calc(100vh-var(--nav-height)-2rem)] lg:min-h-0 lg:overflow-hidden">
      <section className="mx-auto flex h-full w-full max-w-[1500px] flex-col gap-3">
        <section className="shrink-0 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{audience === "director" ? "Director Planner" : "Academic Head Planner"}</p>
              <h1 className="mt-1 text-2xl font-black">Timetable Planner</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Open a date, edit the day&apos;s class slots, choose batch, subject and teacher, then save. Teachers and students receive the timetable automatically.
              </p>
              <div className="mt-2 inline-grid rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-1 sm:grid-cols-2">
                <button type="button" onClick={() => setPlannerView("daily")} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black ${plannerView === "daily" ? "bg-white text-[var(--navy)] shadow-sm" : "text-[var(--muted-blue)]"}`}>
                  <ListChecks className="h-4 w-4" /> Daily editor
                </button>
                <button type="button" onClick={() => setPlannerView("weekly")} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black ${plannerView === "weekly" ? "bg-white text-[var(--navy)] shadow-sm" : "text-[var(--muted-blue)]"}`}>
                  <LayoutGrid className="h-4 w-4" /> Weekly board
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <Metric label="Month classes" value={summary.month} />
              <Metric label="Selected day" value={summary.selected} />
              <Metric label="Teachers" value={summary.teachers} />
              <Metric label="Batches" value={summary.batches} />
            </div>
          </div>
        </section>

        {notice ? <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--navy)] shadow-sm">{notice}</div> : null}

        {plannerView === "daily" ? (
        <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="min-h-0 overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Calendar</p>
                <h2 className="text-xl font-black">{monthLabel(monthDate)}</h2>
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

            <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day}>{day}</div>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {monthCells.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="min-h-14 rounded-xl border border-transparent" />;
                const key = localDateKey(date);
                const items = calendarByDate.get(key) ?? [];
                const isSelected = key === selectedDate;
                const isToday = key === localDateKey(today);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectDate(date)}
                    className={`min-h-14 rounded-xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${isSelected ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--border)] bg-white"} ${isToday && !isSelected ? "ring-2 ring-[var(--gold)]" : ""}`}
                  >
                    <span className="text-sm font-black">{date.getDate()}</span>
                    <span className={`mt-1 block text-[10px] font-black ${isSelected ? "text-white" : "text-[var(--muted-blue)]"}`}>
                      {items.length ? `${items.length} class${items.length === 1 ? "" : "es"}` : "Plan day"}
                    </span>
                    {items[0] ? <span className="mt-0.5 block truncate text-[11px]">{items[0].subject}</span> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="min-h-0 overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Daily Timetable</p>
                <h2 className="text-xl font-black">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</h2>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">Edit the day exactly like the academy timetable sheet.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select className="field min-h-11 min-w-32" style={{ width: "auto" }} value={downloadRange} onChange={(event) => setDownloadRange(event.target.value as DownloadRange)} aria-label="Download timetable range">
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
                <button className="btn-light" type="button" onClick={downloadTimetable}><Download className="h-4 w-4" /> Download</button>
                <button className="btn-light" type="button" onClick={shareOnWhatsApp}><MessageCircle className="h-4 w-4" /> WhatsApp</button>
                <button className="btn-light" type="button" onClick={resetDefaultSlots}><RotateCcw className="h-4 w-4" /> Default</button>
                <button className="btn-primary" type="button" onClick={addCustomSlot}><Plus className="h-4 w-4" /> Add</button>
              </div>
            </div>

            <SessionEditor
              activeSlotIndex={activeSlotIndex}
              allSubjects={allSubjects}
              batches={batches}
              createPending={createMutation.isPending}
              getSubjectsForBatch={getSubjectsForBatch}
              getTeachersForSlot={getTeachersForSlot}
              saveSlot={saveSlot}
              setActiveSlotIndex={setActiveSlotIndex}
              setSlot={setSlot}
              setSlots={setSlots}
              slots={slots}
              updatePending={updateMutation.isPending}
            />
          </section>
        </section>
        ) : (
          <WeeklyTimetableBoard
            batchFilter={batchFilter}
            batches={batches}
            changeWeek={changeWeek}
            openDailyDate={openDailyDate}
            selectDate={selectDate}
            selectedDate={selectedDate}
            setBatchFilter={setBatchFilter}
            today={today}
            weekDays={weekDays}
            weekItems={weekItems}
            weekSlotTimes={weekSlotTimes}
          />
        )}

        <section className="hidden shrink-0 rounded-2xl border border-[var(--border)] bg-white px-3 py-2 shadow-sm xl:block">
          <div className="flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1.5">Teacher timetable updates</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1.5">Student schedule updates</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1.5">Daily, weekly, monthly download</span>
          </div>
        </section>
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
        .compact-field {
          min-height: 40px;
          border-radius: 10px;
          padding: 0.5rem 0.65rem;
          font-size: 0.85rem;
          font-weight: 800;
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

function WeeklyTimetableBoard({
  batchFilter,
  batches,
  changeWeek,
  openDailyDate,
  selectDate,
  selectedDate,
  setBatchFilter,
  today,
  weekDays,
  weekItems,
  weekSlotTimes,
}: {
  batchFilter: string;
  batches: AcademyBatch[];
  changeWeek: (offset: number) => void;
  openDailyDate: (date: Date) => void;
  selectDate: (date: Date) => void;
  selectedDate: string;
  setBatchFilter: (value: string) => void;
  today: Date;
  weekDays: Date[];
  weekItems: AcademicCalendarItem[];
  weekSlotTimes: Array<{ startTime: string; endTime: string }>;
}) {
  const selectedKey = selectedDate;
  const weekLabel = `${weekDays[0]?.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${weekDays[6]?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  const itemsFor = (date: Date, startTime: string, endTime: string) => {
    const key = localDateKey(date);
    return weekItems.filter((item) => itemDateKey(item) === key && timeRangesOverlap(item.startTime, item.endTime, startTime, endTime));
  };

  return (
    <section className="min-h-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Weekly Board</p>
          <h2 className="mt-1 text-2xl font-black">{weekLabel}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">Review the full week. Click any class or empty slot to edit that day.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="field min-w-[220px]" value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}>
            <option value="">All batches</option>
            {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </select>
          <button type="button" className="icon-button" onClick={() => changeWeek(-1)} aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" className="btn-light" onClick={() => selectDate(today)}>Today</button>
          <button type="button" className="icon-button" onClick={() => changeWeek(1)} aria-label="Next week"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-3 max-h-[calc(100vh-var(--nav-height)-15rem)] overflow-auto">
        <div className="min-w-[1040px] rounded-2xl border border-[var(--border)]">
          <div className="grid grid-cols-[110px_repeat(7,minmax(125px,1fr))] border-b border-[var(--border)] bg-[var(--page-bg)]">
            <div className="p-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Time</div>
            {weekDays.map((date) => {
              const key = localDateKey(date);
              const isSelected = key === selectedKey;
              return (
                <button key={key} type="button" onClick={() => openDailyDate(date)} className={`border-l border-[var(--border)] p-2.5 text-left transition hover:bg-white ${isSelected ? "bg-white" : ""}`}>
                  <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[var(--gold)]">{date.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                  <span className="mt-1 block text-lg font-black">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          {weekSlotTimes.map((slot) => (
            <div key={`${slot.startTime}-${slot.endTime}`} className="grid min-h-24 grid-cols-[110px_repeat(7,minmax(125px,1fr))] border-b border-[var(--border)] last:border-b-0">
              <div className="border-r border-[var(--border)] bg-white p-2.5">
                <p className="text-sm font-black">{displayTime(slot.startTime)}</p>
                <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">to {displayTime(slot.endTime)}</p>
              </div>
              {weekDays.map((date) => {
                const key = `${localDateKey(date)}-${slot.startTime}`;
                const items = itemsFor(date, slot.startTime, slot.endTime);
                return (
                  <div key={key} className="border-r border-[var(--border)] p-2 last:border-r-0">
                    {items.length ? (
                      <div className="grid gap-2">
                        {items.map((item) => (
                          <button key={item.id} type="button" onClick={() => openDailyDate(date)} className="w-full rounded-xl border border-sky-200 bg-sky-50 p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                            <span className="block truncate text-[11px] font-black uppercase tracking-[0.14em] text-sky-700">{item.batchName ?? "Batch"}</span>
                            <span className="mt-1 block truncate text-sm font-black text-sky-950">{item.subject}</span>
                            <span className="mt-1 block truncate text-xs font-bold text-sky-800">{item.teacherName ?? "Faculty"}</span>
                            <span className="mt-1.5 inline-flex rounded-full bg-white px-2 py-1 text-[0.65rem] font-black text-sky-900">{classTypeLabel(item.classType)}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button type="button" onClick={() => openDailyDate(date)} className="grid min-h-20 w-full place-items-center rounded-xl border border-dashed border-[var(--border)] bg-white text-xs font-black text-[var(--muted-blue)] transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]">
                        <span className="inline-flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SessionEditor({
  activeSlotIndex,
  allSubjects,
  batches,
  createPending,
  getSubjectsForBatch,
  getTeachersForSlot,
  saveSlot,
  setActiveSlotIndex,
  setSlot,
  setSlots,
  slots,
  updatePending,
}: {
  activeSlotIndex: number;
  allSubjects: string[];
  batches: AcademyBatch[];
  createPending: boolean;
  getSubjectsForBatch: (batchId: string) => string[];
  getTeachersForSlot: (slot: PlannerSlot) => AcademyTeacher[];
  saveSlot: (slot: PlannerSlot, index: number) => void;
  setActiveSlotIndex: (index: number) => void;
  setSlot: (index: number, patch: Partial<PlannerSlot>) => void;
  setSlots: Dispatch<SetStateAction<PlannerSlot[]>>;
  slots: PlannerSlot[];
  updatePending: boolean;
}) {
  const removeSlot = (index: number) => {
    setSlots((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((_, slotIndex) => slotIndex !== index);
      setActiveSlotIndex(Math.max(0, Math.min(index, next.length - 1)));
      return next;
    });
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="space-y-3">
        {slots.map((slot, index) => {
          const subjects = slot.batchId ? getSubjectsForBatch(slot.batchId) : allSubjects;
          const teacherOptions = getTeachersForSlot(slot);
          const isActive = index === activeSlotIndex;
          const breakLabel = breakRows[slot.endTime];
          const warnings = slotWarnings(slot, index, slots);
          const missingFields = missingSlotFields(slot);
          const saved = Boolean(slot.calendarId);
          const selectedBatch = batches.find((batch) => batch.id === slot.batchId);
          const selectedTeacher = teacherOptions.find((teacher) => teacher.id === slot.teacherId);
          return (
            <div key={`${slot.calendarId ?? "new"}-${index}`} className="space-y-3">
              {!isActive ? (
                <button
                  type="button"
                  className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md"
                  onClick={() => setActiveSlotIndex(index)}
                  onFocus={() => setActiveSlotIndex(index)}
                  onMouseEnter={() => setActiveSlotIndex(index)}
                >
                  <div className="relative flex h-12 items-center justify-center bg-[var(--gold-soft)]">
                    <Clock className="h-5 w-5 text-[var(--navy)]" />
                    <span className={`absolute right-3 top-2 rounded-full px-2.5 py-1 text-[10px] font-black ${saved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                      {saved ? "Saved" : missingFields.length ? `${missingFields.length} pending` : "Ready"}
                    </span>
                  </div>
                  <div className="grid gap-3 p-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">Session {index + 1} / {displayTime(slot.startTime)} - {displayTime(slot.endTime)}</p>
                      <h3 className="mt-1 text-base font-black">{slot.subject || "Subject pending"}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">{selectedBatch?.name || "Batch pending"} / {selectedTeacher?.name || "Teacher pending"}</p>
                      {slot.topic ? <p className="mt-1 line-clamp-1 text-xs font-bold text-[var(--muted-blue)]">{slot.topic}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
                      <span className="rounded-full border border-[var(--border)] px-2.5 py-1">{classTypeLabel(slot.classType)}</span>
                      <span className="rounded-full border border-[var(--border)] px-2.5 py-1">{slot.status}</span>
                      {warnings.length ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700"><AlertTriangle className="h-3.5 w-3.5" /> Clash</span> : null}
                    </div>
                  </div>
                </button>
              ) : null}

              {isActive ? (
              <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--page-bg)] p-3 shadow-sm">
                <div className="grid gap-3 border-b border-[var(--border)] pb-3 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">Edit Session {index + 1}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--muted-blue)]">Choose batch, subject and teacher for this slot.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[120px_120px]">
                    <label className="grid gap-1">
                      <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Start</span>
                      <input className="field compact-field" type="time" value={slot.startTime} onChange={(event) => setSlot(index, { startTime: event.target.value })} />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">End</span>
                      <input className="field compact-field" type="time" value={slot.endTime} onChange={(event) => setSlot(index, { endTime: event.target.value })} />
                    </label>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 xl:grid-cols-3">
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Batch</span>
                    <select className="field" value={slot.batchId} onChange={(event) => setSlot(index, { batchId: event.target.value, subject: "", teacherId: "" })}>
                      <option value="">Select batch</option>
                      {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Subject</span>
                    <select className="field" value={slot.subject} onChange={(event) => setSlot(index, { subject: event.target.value, teacherId: "" })}>
                      <option value="">Select subject</option>
                      {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Teacher</span>
                    <select className="field" value={slot.teacherId} onChange={(event) => setSlot(index, { teacherId: event.target.value })}>
                      <option value="">Select teacher</option>
                      {teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                    </select>
                  </label>
                </div>

                <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_180px_180px]">
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Topic / chapter</span>
                    <input className="field" value={slot.topic} onChange={(event) => setSlot(index, { topic: event.target.value })} placeholder="Topic / chapter" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Type</span>
                    <select className="field" value={slot.classType} onChange={(event) => setSlot(index, { classType: event.target.value })}>
                      {classTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">Status</span>
                    <select className="field" value={slot.status} onChange={(event) => setSlot(index, { status: event.target.value })}>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="PLANNED">Planned</option>
                      <option value="RESCHEDULED">Rescheduled</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </label>
                </div>

                {warnings.length ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">
                    {warnings.join(" ")}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:justify-end">
                  <button className="btn-light px-4" type="button" onClick={() => removeSlot(index)} disabled={slots.length <= 1}>Remove</button>
                  <button className="btn-primary px-4" type="button" onClick={() => saveSlot(slot, index)} disabled={createPending || updatePending}>
                    <CheckCircle2 className="h-4 w-4" /> {saved ? "Update session" : "Save session"}
                  </button>
                </div>
              </div>
              ) : null}

              {breakLabel ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-amber-800">
                  {breakLabel}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-xs font-black">
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5">Click a session to edit</span>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5">Breaks stay visible</span>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5">One session, one save</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-0.5 text-xl font-black">{value}</p>
    </div>
  );
}
