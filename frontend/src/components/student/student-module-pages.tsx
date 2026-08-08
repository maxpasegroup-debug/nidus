"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Library,
  PlayCircle,
  Radio,
  Sparkles,
  Timer,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { ExamReportingPanel, ExaminationEngineBanner, ExaminationRoleActions, ExamTypePanel, QuestionBankHierarchyPanel } from "@/components/examination/examination-engine-workspace";
import { WorkflowOsWorkspace, workflowIcons } from "@/components/workflow/workflow-os-workspace";

type StudentBatch = {
  id: string;
  name: string;
  status?: string | null;
  batchType?: string | null;
  course?: { title?: string | null } | null;
};

type CalendarItem = {
  id: string;
  batchName?: string | null;
  subject: string;
  topic: string;
  plannedDate: string;
  startTime?: string | null;
  endTime?: string | null;
  teacherName?: string | null;
  completionStatus?: string | null;
};

type Assignment = {
  id: string;
  batchName?: string | null;
  subject?: string | null;
  title: string;
  topic?: string | null;
  instructions: string;
  dueDate?: string | null;
  attachmentName?: string | null;
  link?: string | null;
  submissionStatus?: string;
  submission?: { status: string; feedback?: string | null; score?: number | null } | null;
};

type Material = {
  id: string;
  batchName?: string | null;
  subject?: string | null;
  topic?: string | null;
  title: string;
  type: string;
  createdAt?: string;
};

type LiveClass = {
  id: string;
  title: string;
  subject?: string | null;
  topic?: string | null;
  instructorName?: string | null;
  scheduledAt: string;
  duration: number;
  meetingLink: string;
  recordingUrl?: string | null;
  batchId?: string | null;
};

type ReminderItem = {
  id: string;
  type: string;
  title: string;
  detail: string;
  at: string;
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
  totalQuestions?: number | null;
  totalMarks?: number | null;
  href: string;
  icon: LucideIcon;
  mode: "start" | "end";
  action: string;
  schedule?: {
    date: string;
    time: string;
    batch: string;
    teacher: string;
    duration: string;
    status: string;
  };
};

type StudentPlan = {
  batches?: StudentBatch[];
  calendar?: CalendarItem[];
  assignments?: Assignment[];
  materials?: Material[];
  liveClasses?: LiveClass[];
  attendance?: {
    summary?: { present: number; absent: number; leave: number; total: number; percentage: number };
    sessions?: Array<{ id: string; batchName?: string | null; subject?: string | null; date?: string; records?: Array<{ status?: string }> }>;
  };
};

type ExamSummary = {
  id: string;
  testId?: string | null;
  title?: string | null;
  name?: string | null;
  examName?: string | null;
  subject?: string | null;
  topic?: string | null;
  publishAt?: string | null;
  scheduledAt?: string | null;
  examDate?: string | null;
  date?: string | null;
  time?: string | null;
  startTime?: string | null;
  durationMinutes?: number | null;
  duration?: number | null;
  totalQuestions?: number | null;
  totalMarks?: number | null;
  batchName?: string | null;
  batch?: { name?: string | null } | null;
  studentStatus?: string | null;
  status?: string | null;
};

type AttemptHistory = {
  id: string;
  testId?: string | null;
  status: string;
  startedAt?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  totalCorrect?: number | null;
  timeTaken?: number | null;
  resultsReleased?: boolean;
  resultStatus?: string | null;
  test: { id?: string | null; title: string; examType?: string | null; subject?: string | null; topic?: string | null; totalMarks: number; duration: number };
};

type AssignmentDraft = {
  answerText: string;
  link: string;
  attachmentName: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapPayload<T>(payload: unknown): T {
  if (isRecord(payload)) {
    if (payload.data !== undefined) return unwrapPayload<T>(payload.data);
    if (payload.result !== undefined) return unwrapPayload<T>(payload.result);
    if (payload.payload !== undefined) return unwrapPayload<T>(payload.payload);
  }
  return payload as T;
}

function listPayload<T>(payload: unknown, key: string): T[] {
  const unwrapped = unwrapPayload<unknown>(payload);
  if (Array.isArray(unwrapped)) return unwrapped as T[];
  if (!isRecord(unwrapped)) return [];
  const keyed = unwrapPayload<unknown>(unwrapped[key]);
  return Array.isArray(keyed) ? (keyed as T[]) : [];
}

async function apiJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Unable to load learner data");
  const payload = await response.json().catch(() => ({}));
  return unwrapPayload<T>(payload);
}

async function apiList<T>(path: string, key: string): Promise<T[]> {
  const payload = await apiJson<unknown>(path);
  return listPayload<T>(payload, key);
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || "Unable to submit");
  }
  const payload = await response.json().catch(() => ({}));
  return unwrapPayload<T>(payload);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function countdownLabel(dateValue?: string | null) {
  const timestamp = toTimestamp(dateValue);
  if (!timestamp) return "Open now";
  const diff = timestamp - Date.now();
  if (diff <= 0) return "Open now";
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} to go`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} to go`;
}

function dueCountdown(dateValue?: string | null) {
  const timestamp = toTimestamp(dateValue, "end");
  if (!timestamp) return "No due date";
  const diff = timestamp - Date.now();
  if (diff <= 0) return "Due now";
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} left`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} left`;
}

function calendarDate(item: CalendarItem) {
  const date = item.plannedDate.slice(0, 10);
  const time = item.startTime?.match(/^\d{2}:\d{2}/)?.[0] ?? "00:00";
  return `${date}T${time}:00`;
}

function toTimestamp(value?: string | null, dateOnlyMode: "start" | "end" = "start") {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T${dateOnlyMode === "end" ? "23:59:00" : "00:00:00"}` : value;
  const time = new Date(normalized).getTime();
  return Number.isFinite(time) ? time : null;
}

function examDateTime(exam: ExamSummary) {
  if (exam.publishAt || exam.scheduledAt) return exam.publishAt ?? exam.scheduledAt ?? "";
  const date = exam.examDate ?? exam.date;
  const time = exam.time ?? exam.startTime;
  if (date && time) return `${date.slice(0, 10)}T${time.match(/^\d{2}:\d{2}/)?.[0] ?? "00:00"}:00`;
  return date ?? "";
}

function examWindow(exam: ExamSummary) {
  const startsAt = examDateTime(exam);
  const start = toTimestamp(startsAt);
  const duration = Number(exam.durationMinutes ?? exam.duration ?? 0);
  const end = start && duration > 0 ? start + duration * 60_000 : null;
  return { startsAt, start, end };
}

function studentAverageScore(attempts: AttemptHistory[]) {
  const percentages = attempts
    .map((attempt) => {
      const total = Number(attempt.test?.totalMarks ?? 0);
      const score = Number(attempt.score ?? attempt.totalCorrect ?? 0);
      return total > 0 ? Math.round((score / total) * 100) : 0;
    })
    .filter((value) => value > 0);
  return percentages.length ? percentages.reduce((total, value) => total + value, 0) / percentages.length : 0;
}

function liveClassWindow(item: LiveClass) {
  const start = toTimestamp(item.scheduledAt);
  const end = start ? start + Math.max(1, Number(item.duration || 60)) * 60_000 : null;
  return { start, end };
}

function useCurrentTime(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);
  return now;
}

function Countdown({ value, mode = "start", activeLabel = "Now" }: { value?: string | null; mode?: "start" | "end"; activeLabel?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const timestamp = toTimestamp(value, mode);
  const diff = timestamp ? timestamp - now : 0;
  const label = !value || diff <= 0
    ? activeLabel
    : diff < 3_600_000
      ? `${Math.max(1, Math.ceil(diff / 60_000))}m`
      : diff < 86_400_000
        ? `${Math.floor(diff / 3_600_000)}h ${Math.ceil((diff % 3_600_000) / 60_000)}m`
        : `${Math.ceil(diff / 86_400_000)}d`;
  const hot = diff > 0 && diff < 86_400_000;
  return (
    <span className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-black shadow-sm ${hot ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[var(--gold-border)] bg-[var(--gold-soft)] text-[var(--ink)]"}`}>
      <Timer className={`h-4 w-4 ${hot ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

function clockParts(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function examTimeLabel(startsAt?: string | null, endsAt?: string | null) {
  const start = toTimestamp(startsAt);
  const end = toTimestamp(endsAt);
  if (!start) return "Time not scheduled";
  const date = new Date(start).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const startTime = new Date(start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const endTime = end ? new Date(end).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null;
  return `${date} / ${startTime}${endTime ? ` - ${endTime}` : ""}`;
}

function ExamCountdownClock({ startsAt, endsAt, compact = false }: { startsAt?: string | null; endsAt?: string | null; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const start = toTimestamp(startsAt);
  const end = toTimestamp(endsAt);
  const upcoming = Boolean(start && start > now);
  const live = Boolean(start && start <= now && (!end || end > now));
  const closed = Boolean(end && end <= now);
  const target = upcoming ? start : live && end ? end : null;
  const remaining = target ? target - now : 0;
  const parts = clockParts(remaining);
  const urgent = remaining > 0 && remaining < 60 * 60 * 1000;
  const soon = remaining >= 60 * 60 * 1000 && remaining < 24 * 60 * 60 * 1000;
  const tone = closed
    ? "border-slate-200 bg-slate-100 text-slate-500"
    : live
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : urgent
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : soon
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-[var(--gold-border)] bg-[var(--gold-soft)] text-[var(--ink)]";
  const label = closed ? "Exam closed" : live ? "Exam ends in" : upcoming ? "Exam starts in" : "Exam open";

  if (!target && !closed) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${tone}`}>
        <Timer className="h-4 w-4" />
        {label}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
          <Timer className={`h-4 w-4 ${!closed && remaining < 24 * 60 * 60 * 1000 ? "animate-pulse" : ""}`} />
          {label}
        </span>
        {!closed ? <span className="h-2 w-2 rounded-full bg-current shadow-[0_0_0_4px_rgba(255,255,255,0.7)]" /> : null}
      </div>
      {closed ? (
        <p className="mt-2 text-lg font-black">00:00:00</p>
      ) : (
        <div className={`mt-3 grid ${compact ? "grid-cols-3 gap-1.5" : "grid-cols-3 gap-2"}`}>
          {[
            ["HH", parts.hours],
            ["MM", parts.minutes],
            ["SS", parts.seconds],
          ].map(([labelText, value]) => (
            <div key={labelText} className="rounded-xl border border-current/15 bg-white/80 px-2 py-2 text-center">
              <p className={`${compact ? "text-lg" : "text-2xl"} font-black tabular-nums leading-none`}>{value}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] opacity-70">{labelText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExamReminderCard({ item }: { item: ReminderItem }) {
  const start = toTimestamp(item.startsAt);
  const end = toTimestamp(item.endsAt);
  const now = useCurrentTime(1000);
  const upcoming = Boolean(start && start > now);
  const open = Boolean(start && start <= now && (!end || end > now));
  const closed = Boolean(end && end <= now);
  return (
    <Link href={item.href} className="group rounded-[26px] border border-[var(--gold-border)] bg-gradient-to-br from-[var(--gold-soft)] via-white to-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--gold-border)] bg-white shadow-sm">
          <ClipboardCheck className="h-5 w-5 text-[var(--gold)]" />
        </span>
        <ExamCountdownClock startsAt={item.startsAt} endsAt={item.endsAt} compact />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Exam</p>
      <h2 className="mt-2 line-clamp-2 text-xl font-black">{item.title}</h2>
      <p className="mt-2 text-sm font-bold text-[var(--muted-blue)]">{item.detail}</p>
      <div className="mt-4 grid gap-2 rounded-2xl border border-[var(--gold-border)] bg-white/85 p-3 text-xs font-bold text-[var(--muted-blue)]">
        <span>{examTimeLabel(item.startsAt, item.endsAt)}</span>
        <span>
          {item.totalQuestions ? `${item.totalQuestions} questions` : "Question paper ready"}
          {item.totalMarks ? ` / ${item.totalMarks} marks` : ""}
          {item.durationMinutes ? ` / ${item.durationMinutes} min` : ""}
        </span>
      </div>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-black">
        {closed ? "View exam" : open ? "Start exam" : upcoming ? "Get ready" : item.action}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function reminderUrgency(at: string | null | undefined, mode: "start" | "end", now: number) {
  const timestamp = toTimestamp(at, mode);
  if (!timestamp) return 4;
  const diff = timestamp - now;
  if (diff <= 0) return 0;
  if (diff <= 3_600_000) return 1;
  if (diff <= 86_400_000) return 2;
  return 3;
}

function reminderTone(type: string, at: string | null | undefined, mode: "start" | "end", now: number) {
  const urgency = reminderUrgency(at, mode, now);
  if (type === "Exam") return urgency <= 2 ? "border-rose-200 bg-rose-50" : "border-[var(--border)] bg-white";
  if (type === "Assignment") return urgency <= 2 ? "border-amber-200 bg-amber-50" : "border-[var(--gold-border)] bg-[var(--gold-soft)]";
  if (type === "Live Class") return "border-emerald-200 bg-emerald-50";
  return "border-sky-200 bg-sky-50";
}

function useStudentPlan() {
  const { user } = useAuth();
  const router = useRouter();
  const plan = useQuery({ queryKey: ["student", "module-plan"], queryFn: () => apiJson<StudentPlan>("/api/academy/my-plan") });
  const activeBatches = (plan.data?.batches ?? []).filter((batch) => batch.status === "ACTIVE");

  useEffect(() => {
    if (!plan.isLoading && (!activeBatches.length || user?.role === "GUEST")) router.replace("/dashboard/guest");
  }, [activeBatches.length, plan.isLoading, router, user?.role]);

  return { plan, activeBatches };
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-[calc(100dvh-var(--nav-height))] bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto grid max-w-7xl gap-4">
        <section className="rounded-[24px] border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Student Module</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <QuickPill href="/dashboard/student" label="Today" />
              <QuickPill href="/dashboard/student/classes" label="Classes" />
              <QuickPill href="/dashboard/student/learning" label="Lessons" />
              <QuickPill href="/dashboard/student/calendar" label="Timetable" />
            </div>
          </div>
        </section>
        {children}
      </section>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-white/80 p-5 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[var(--gold-soft)] text-[var(--gold)]">
          <Sparkles className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-bold text-[var(--muted-blue)]">{text}</p>
      </div>
    </div>
  );
}

export function StudentClassesPage() {
  const { plan, activeBatches } = useStudentPlan();
  const now = useCurrentTime();
  const calendar = plan.data?.calendar ?? [];
  const materials = plan.data?.materials ?? [];
  const liveClasses = (plan.data?.liveClasses ?? []).filter((item) => {
    const window = liveClassWindow(item);
    return Boolean(window.end && window.end > now);
  });
  const subjects = Array.from(new Set([...calendar.map((item) => item.subject), ...materials.map((item) => item.subject ?? "General")])).sort();

  return (
    <Shell title="My Classes" subtitle="Open a subject to see its timetable, teacher and learning resources.">
      {liveClasses.length ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {liveClasses.map((item) => <LiveCard key={item.id} item={item} />)}
        </section>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {subjects.map((subject) => {
          const sessions = calendar.filter((item) => item.subject === subject).sort((a, b) => calendarDate(a).localeCompare(calendarDate(b)));
          const next = sessions.find((item) => new Date(calendarDate(item)).getTime() >= now);
          const resourceCount = materials.filter((item) => (item.subject ?? "General") === subject).length;
          return (
            <article key={subject} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)]">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)]"><PlayCircle className="h-5 w-5 text-[var(--gold)]" /></span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1 text-xs font-black">{sessions.length} classes</span>
              </div>
              <h2 className="mt-4 line-clamp-2 text-xl font-black">{subject}</h2>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">{sessions[0]?.teacherName ?? "Faculty assigned"}</p>
              <p className="mt-1 line-clamp-2 text-xs font-bold text-[var(--muted-blue)]">{activeBatches.map((batch) => batch.name).join(" / ")}</p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4 text-xs font-black">
                <span>{resourceCount} resources</span>
                <span>{next ? new Date(calendarDate(next)).toLocaleDateString() : "No class due"}</span>
              </div>
            </article>
          );
        })}
        {!subjects.length ? <Empty text="Subjects will appear after your timetable is published." /> : null}
      </section>
    </Shell>
  );
}

export function StudentTodayPage() {
  const { plan, activeBatches } = useStudentPlan();
  const now = useCurrentTime();
  const availableExams = useQuery({ queryKey: ["student", "available-exams"], queryFn: () => apiList<ExamSummary>("/api/tests/available", "tests") });
  const today = todayKey();
  const calendar = plan.data?.calendar ?? [];
  const assignments = plan.data?.assignments ?? [];
  const materials = plan.data?.materials ?? [];
  const liveClasses = plan.data?.liveClasses ?? [];
  const exams = availableExams.data ?? [];
  const pendingAssignments = assignments.filter((assignment) => assignment.submissionStatus !== "SUBMITTED");
  const upcomingClasses = calendar.filter((item) => item.plannedDate.slice(0, 10) >= today).sort((left, right) => calendarDate(left).localeCompare(calendarDate(right)));
  const nextClass = upcomingClasses[0];
  const latestLesson = [...materials].sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")))[0];
  const attendance = plan.data?.attendance?.summary;
  const reminders: ReminderItem[] = [
    ...exams.map((item) => {
      const window = examWindow(item);
      const isUpcoming = Boolean(window.start && window.start > now);
      const isOpen = Boolean(window.start && window.start <= now && (!window.end || window.end > now));
      const at = isUpcoming ? window.startsAt : isOpen && window.end ? new Date(window.end).toISOString() : window.startsAt || today;
      const examId = item.testId || item.id;
      return {
        id: `exam-${examId}`,
        type: "Exam",
        title: item.examName ?? item.title ?? item.name ?? "Assigned exam",
        detail: `${item.subject ?? "Exam"}${item.batchName || item.batch?.name ? ` / ${item.batchName ?? item.batch?.name}` : ""}`,
        at,
        startsAt: window.startsAt,
        endsAt: window.end ? new Date(window.end).toISOString() : null,
        durationMinutes: item.durationMinutes ?? item.duration ?? null,
        totalQuestions: item.totalQuestions ?? null,
        totalMarks: item.totalMarks ?? null,
        href: "/dashboard/student/exams",
        icon: ClipboardCheck,
        mode: (isUpcoming ? "start" : "end") as "start" | "end",
        action: isUpcoming ? "Get ready" : isOpen ? "Start now" : "View exam",
      };
    }),
    ...pendingAssignments.map((item) => ({
      id: `assignment-${item.id}`,
      type: "Assignment",
      title: item.title,
      detail: `${item.subject ?? "Homework"}${item.batchName ? ` / ${item.batchName}` : ""}`,
      at: item.dueDate ?? "",
      href: "/dashboard/student/assignments",
      icon: FileText,
      mode: "end" as const,
      action: "Submit",
    })),
    ...liveClasses.flatMap((item) => {
      const window = liveClassWindow(item);
      if (!window.end || window.end <= now) return [];
      const upcoming = Boolean(window.start && window.start > now);
      const canJoin = Boolean(window.start && window.start <= now + 10 * 60_000);
      const startsAt = new Date(item.scheduledAt);
      const endsAt = new Date(window.end);
      const batch = activeBatches.find((entry) => entry.id === item.batchId)?.name ?? "Assigned batch";
      return [{
        id: `live-${item.id}`,
        type: "Live Class",
        title: item.topic || item.title,
        detail: item.subject ?? "Live session",
        at: upcoming ? item.scheduledAt : new Date(window.end).toISOString(),
        href: canJoin ? item.meetingLink : "/dashboard/student/classes",
        icon: Radio,
        mode: (upcoming ? "start" : "end") as "start" | "end",
        action: canJoin ? "Join class" : "View schedule",
        schedule: {
          date: startsAt.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
          time: `${startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          batch,
          teacher: item.instructorName ?? "Faculty assigned",
          duration: `${item.duration || 60} minutes`,
          status: upcoming ? "Upcoming" : "Live now",
        },
      }];
    }),
    ...calendar.filter((item) => item.plannedDate.slice(0, 10) >= today).map((item) => ({
      id: `class-${item.id}`,
      type: "Class",
      title: `${item.subject}: ${item.topic}`,
      detail: `${item.batchName ?? "Assigned class"}${item.teacherName ? ` / ${item.teacherName}` : ""}`,
      at: calendarDate(item),
      href: "/dashboard/student/classes",
      icon: PlayCircle,
      mode: "start" as const,
      action: "Open",
    })),
  ].sort((a, b) => {
    const priority = { Exam: 0, Assignment: 1, "Live Class": 2, Class: 3 } as Record<string, number>;
    const urgency = reminderUrgency(a.at, a.mode, now) - reminderUrgency(b.at, b.mode, now);
    if (urgency !== 0) return urgency;
    const typePriority = (priority[a.type] ?? 9) - (priority[b.type] ?? 9);
    if (typePriority !== 0) return typePriority;
    return (toTimestamp(a.at, a.mode) ?? Number.MAX_SAFE_INTEGER) - (toTimestamp(b.at, b.mode) ?? Number.MAX_SAFE_INTEGER);
  }).slice(0, 8);
  const focusCards = [
    {
      label: "Next Class",
      title: nextClass ? `${nextClass.subject}: ${nextClass.topic}` : "No class scheduled",
      detail: nextClass ? `${nextClass.batchName ?? "Assigned batch"}${nextClass.teacherName ? ` / ${nextClass.teacherName}` : ""}` : "Your timetable will appear after the academy publishes it.",
      meta: nextClass ? new Date(calendarDate(nextClass)).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Timetable pending",
      href: "/dashboard/student/classes",
      icon: PlayCircle,
    },
    {
      label: "Homework",
      title: pendingAssignments[0]?.title ?? "No homework pending",
      detail: pendingAssignments[0] ? `${pendingAssignments[0].subject ?? "Homework"}${pendingAssignments[0].batchName ? ` / ${pendingAssignments[0].batchName}` : ""}` : "Submitted and future assignments will be tracked here.",
      meta: pendingAssignments[0] ? dueCountdown(pendingAssignments[0].dueDate) : "All clear",
      href: "/dashboard/student/assignments",
      icon: FileText,
    },
    {
      label: "Lessons & Videos",
      title: latestLesson?.title ?? "No lesson uploaded yet",
      detail: latestLesson ? `${latestLesson.subject ?? "Lesson"}${latestLesson.batchName ? ` / ${latestLesson.batchName}` : ""}` : "Batch videos and study materials will appear after upload.",
      meta: latestLesson?.type ?? "Learning library",
      href: "/dashboard/student/learning",
      icon: Library,
    },
    {
      label: "Progress",
      title: attendance ? `${attendance.percentage}% attendance` : "Progress will build soon",
      detail: activeBatches.map((batch) => batch.name).join(" / ") || "Active batch pending",
      meta: attendance ? `${attendance.present} present / ${attendance.total} marked` : "No attendance yet",
      href: "/dashboard/student/progress",
      icon: ClipboardCheck,
    },
  ];
  const firstReminder = reminders[0];

  return (
    <WorkspaceDashboard
      roleTitle="Student Workspace"
      greeting="Today's Learning"
      subtitle={activeBatches.length ? `Active in ${activeBatches.map((batch) => batch.name).join(", ")}.` : "Full classes and videos open after office activation."}
      focus={[
        {
          label: "Today",
          title: firstReminder?.title ?? nextClass?.subject ?? "You are clear for now",
          detail: firstReminder?.detail ?? "When the academy publishes classes, homework, exams or videos, your next action will appear here first.",
          href: firstReminder?.href ?? "/dashboard/student/calendar",
          icon: firstReminder?.icon ?? PlayCircle,
          tone: firstReminder ? "warning" : "success",
        },
        {
          label: "Continue Learning",
          title: latestLesson?.title ?? "No lesson uploaded yet",
          detail: latestLesson ? `${latestLesson.subject ?? "Lesson"}${latestLesson.batchName ? ` / ${latestLesson.batchName}` : ""}` : "Batch videos and study materials will appear after upload.",
          href: "/dashboard/student/learning",
          icon: Library,
          tone: "info",
        },
        {
          label: "Upcoming Exam",
          title: exams[0]?.examName ?? exams[0]?.title ?? exams[0]?.name ?? "No exam due now",
          detail: exams[0] ? `${exams[0].subject ?? "Exam"} / ${countdownLabel(examDateTime(exams[0]))}` : "Published exams appear here first.",
          href: "/dashboard/student/exams",
          icon: ClipboardCheck,
          tone: exams.length ? "warning" : "success",
        },
      ]}
      actions={[
        { label: "Learning", href: "/dashboard/student/learning", icon: Library },
        { label: "Practice", href: "/tests", icon: Sparkles },
        { label: "Exams", href: "/dashboard/student/exams", icon: ClipboardCheck },
        { label: "Homework", href: "/dashboard/student/assignments", icon: FileText },
        { label: "Classes", href: "/dashboard/student/classes", icon: PlayCircle },
        { label: "Progress", href: "/dashboard/student/progress", icon: CalendarDays },
      ]}
      metrics={[
        { label: "Active Batches", value: activeBatches.length },
        { label: "Pending Homework", value: pendingAssignments.length, tone: pendingAssignments.length ? "warning" : "success" },
        { label: "Lessons", value: materials.length },
        { label: "Attendance", value: attendance ? `${attendance.percentage}%` : "Pending" },
      ]}
      activity={focusCards.slice(0, 4).map((card) => ({
        title: card.title,
        detail: card.detail,
        href: card.href,
        meta: card.meta,
      }))}
      upcoming={reminders.slice(0, 5).map((item) => ({
        title: item.title,
        detail: item.detail,
        href: item.href,
        meta: item.type,
      }))}
    >
      <WorkflowOsWorkspace
        title="Student Workflow"
        description="Today's learning, upcoming classes, assignment reminders, exam reminders and achievement notifications are organized from your existing student plan."
        metrics={[
          { label: "Today's Learning", value: firstReminder ? "Action" : "Clear", note: firstReminder?.title ?? "No urgent workflow item", tone: firstReminder ? "warning" : "success" },
          { label: "Upcoming Classes", value: upcomingClasses.length, note: nextClass ? `${nextClass.subject} / ${nextClass.topic}` : "No class due", tone: upcomingClasses.length ? "info" : "success" },
          { label: "Assignments", value: pendingAssignments.length, note: "Pending homework reminders", tone: pendingAssignments.length ? "warning" : "success" },
          { label: "Exam Reminder", value: exams.length, note: "Available exam workflow items", tone: exams.length ? "warning" : "success" },
        ]}
        approvals={[
          { title: "Assignment reminder", detail: pendingAssignments[0] ? `${pendingAssignments[0].title} is pending.` : "No assignment reminder is pending.", href: "/dashboard/student/assignments", icon: workflowIcons.assignment, tone: pendingAssignments.length ? "warning" : "success" },
          { title: "Exam reminder", detail: exams[0] ? `${exams[0].examName ?? exams[0].title ?? exams[0].name ?? "Exam"} is available.` : "No exam reminder is pending.", href: "/dashboard/student/exams", icon: workflowIcons.exam, tone: exams.length ? "warning" : "success" },
          { title: "Class reminder", detail: nextClass ? `${nextClass.subject}: ${nextClass.topic}` : "No upcoming class reminder is visible.", href: "/dashboard/student/classes", icon: workflowIcons.reminder, tone: nextClass ? "info" : "success" },
        ]}
        recent={reminders.slice(0, 3).map((item) => ({
          title: item.title,
          detail: item.detail,
          href: item.href,
          icon: item.type === "Exam" ? workflowIcons.exam : item.type === "Assignment" ? workflowIcons.assignment : workflowIcons.task,
          tone: item.type === "Assignment" || item.type === "Exam" ? "warning" : "info",
        }))}
      />
    </WorkspaceDashboard>
  );
}

export function StudentAssignmentsPage() {
  const { plan } = useStudentPlan();
  const [drafts, setDrafts] = useState<Record<string, AssignmentDraft>>({});
  const [message, setMessage] = useState<string | null>(null);
  const assignments = plan.data?.assignments ?? [];
  const sorted = [...assignments].sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));

  return (
    <Shell title="Assignments" subtitle="Published homework, due date countdown and one-screen submission.">
      <section className="grid gap-3 xl:grid-cols-2">
        {sorted.map((assignment) => {
          const submitted = assignment.submissionStatus === "SUBMITTED";
          const draft = drafts[assignment.id] ?? { answerText: "", link: "", attachmentName: "" };
          return (
            <article key={assignment.id} className={`rounded-[22px] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${submitted ? "border-[var(--border)] bg-white" : "border-[var(--gold-border)] bg-[var(--gold-soft)]"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{assignment.subject ?? "Homework"}</p>
                  <h2 className="mt-2 text-2xl font-black">{assignment.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{assignment.batchName ?? "Assigned batch"} / {assignment.topic ?? "General"}</p>
                </div>
                {submitted ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Submitted</span>
                ) : (
                  <div className="grid justify-items-end gap-2">
                    <Countdown value={assignment.dueDate} mode="end" />
                    <span className="text-xs font-black text-[var(--muted-blue)]">{dueCountdown(assignment.dueDate)}</span>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm leading-6">{assignment.instructions}</p>
              {assignment.attachmentName || assignment.link ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--muted-blue)]">
                  <span>{assignment.attachmentName || "Attachment available"}</span>
                  {assignment.link ? <a href={assignment.link} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black text-[var(--ink)]">Open Attachment</a> : null}
                </div>
              ) : null}
              {!submitted ? (
                <div className="mt-4 grid gap-3">
                  <textarea value={draft.answerText} onChange={(event) => setDrafts((value) => ({ ...value, [assignment.id]: { ...draft, answerText: event.target.value } }))} rows={3} placeholder="Type answer or notes" className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={draft.link} onChange={(event) => setDrafts((value) => ({ ...value, [assignment.id]: { ...draft, link: event.target.value } }))} placeholder="Paste file/link if any" className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
                    <input type="file" onChange={(event) => setDrafts((value) => ({ ...value, [assignment.id]: { ...draft, attachmentName: event.target.files?.[0]?.name ?? "" } }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm" />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setMessage("Submitting assignment...");
                      try {
                        await apiPost(`/api/academy/assignments/${assignment.id}/submit`, draft);
                        setMessage("Assignment submitted.");
                        await plan.refetch();
                      } catch (error) {
                        setMessage(error instanceof Error ? error.message : "Could not submit assignment.");
                      }
                    }}
                    className="min-h-12 rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black"
                  >
                    Submit Assignment
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-3 text-sm font-bold">
                  {assignment.submission?.feedback ? `Feedback: ${assignment.submission.feedback}` : "Teacher review pending."}
                </div>
              )}
            </article>
          );
        })}
        {!sorted.length ? <Empty text="No published assignments are available." /> : null}
      </section>
      {message ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-black">{message}</div> : null}
    </Shell>
  );
}

export function StudentExamsPage() {
  useStudentPlan();
  const now = useCurrentTime();
  const [view, setView] = useState<"active" | "attended" | "missed">("active");
  const availableExams = useQuery({ queryKey: ["student", "available-exams"], queryFn: () => apiList<ExamSummary>("/api/tests/available", "tests") });
  const attemptHistory = useQuery({ queryKey: ["student", "exam-attempt-history"], queryFn: () => apiList<AttemptHistory>("/api/tests/attempts/history", "attempts") });
  const exams = availableExams.data ?? [];
  const results = attemptHistory.data ?? [];
  const attemptedIds = new Set(results.map((attempt) => attempt.testId || attempt.test?.id).filter(Boolean));
  const activeExams = exams.filter((exam) => {
    const id = exam.testId || exam.id;
    const window = examWindow(exam);
    return exam.studentStatus !== "SUBMITTED" && !attemptedIds.has(id) && (!window.end || window.end > now);
  });
  const missedExams = exams.filter((exam) => {
    const id = exam.testId || exam.id;
    const window = examWindow(exam);
    return exam.studentStatus !== "SUBMITTED" && !attemptedIds.has(id) && Boolean(window.end && window.end <= now);
  });
  const attendedExams = results.filter((attempt) => attempt.status === "SUBMITTED" || attempt.submittedAt);
  const tabs = [
    { id: "active" as const, label: "Upcoming / Live", count: activeExams.length },
    { id: "attended" as const, label: "Attended History", count: attendedExams.length },
    { id: "missed" as const, label: "Unattended / Practice", count: missedExams.length },
  ];

  return (
    <Shell title="Exam Arena" subtitle="Upcoming tests, attended results, missed exams and practice history in one calm place.">
      <ExaminationEngineBanner
        role="STUDENT"
        title="My Examination Engine"
        description="Today's quiz, upcoming exams, mock tests, practice papers, CBT attempts, history, performance and leaderboard are connected here."
        metrics={[
          { label: "Today's Quiz", value: activeExams.length, tone: activeExams.length ? "warning" : "success" },
          { label: "Upcoming Exam", value: activeExams.length, tone: activeExams.length ? "info" : "default" },
          { label: "Exam History", value: attendedExams.length, tone: attendedExams.length ? "success" : "default" },
          { label: "Practice Tests", value: missedExams.length, tone: missedExams.length ? "warning" : "default" },
        ]}
      />
      <ExaminationRoleActions role="STUDENT" />
      <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <ExamReportingPanel attempts={attendedExams.length} averageScore={studentAverageScore(attendedExams)} reports={attendedExams.length} />
        <ExamTypePanel />
      </section>
      <QuestionBankHierarchyPanel questionCount={exams.reduce((total, exam) => total + Number(exam.totalQuestions ?? 0), 0)} />

      <section className="grid gap-3 md:grid-cols-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
              view === tab.id ? "border-[var(--gold-border)] bg-[var(--gold-soft)] shadow-sm" : "border-[var(--border)] bg-white"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{tab.label}</p>
            <p className="mt-2 text-3xl font-black">{tab.count}</p>
          </button>
        ))}
      </section>

      <section className="mt-4">
        {view === "active" ? (
          <ModuleCard title={`Upcoming and live exams (${activeExams.length})`}>
            <div className="grid gap-3">
              {activeExams.map((exam) => <ExamCard key={exam.id || exam.testId || exam.title || "exam"} exam={exam} />)}
              {!activeExams.length ? <Empty text="No active exam is waiting now. Check history or practice missed papers." /> : null}
            </div>
          </ModuleCard>
        ) : null}

        {view === "attended" ? (
          <ModuleCard title={`Attended exam history (${attendedExams.length})`}>
            <div className="grid gap-3 md:grid-cols-2">
              {attendedExams.map((attempt) => <AttemptHistoryCard key={attempt.id} attempt={attempt} />)}
              {!attendedExams.length ? <Empty text="Submitted exams and released result papers will appear here." /> : null}
            </div>
          </ModuleCard>
        ) : null}

        {view === "missed" ? (
          <ModuleCard title={`Unattended and practice papers (${missedExams.length})`}>
            <div className="grid gap-3">
              {missedExams.map((exam) => <MissedExamCard key={exam.id || exam.testId || exam.title || "exam"} exam={exam} />)}
              {!missedExams.length ? <Empty text="No missed exam is available for practice right now." /> : null}
            </div>
          </ModuleCard>
        ) : null}
      </section>
    </Shell>
  );
}

export function StudentCalendarPage() {
  const { plan } = useStudentPlan();
  const now = useCurrentTime();
  const availableExams = useQuery({ queryKey: ["student", "calendar-exams"], queryFn: () => apiList<ExamSummary>("/api/tests/available", "tests") });
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const calendarItems = plan.data?.calendar ?? [];
  const assignments = plan.data?.assignments ?? [];
  const liveClasses = plan.data?.liveClasses ?? [];
  const exams = availableExams.data ?? [];
  const events = [
    ...calendarItems.map((item) => ({
      id: `class-${item.id}`,
      kind: "Class",
      title: `${item.subject}: ${item.topic}`,
      detail: `${item.batchName ?? "Assigned batch"}${item.teacherName ? ` / ${item.teacherName}` : ""}`,
      at: calendarDate(item),
      date: item.plannedDate.slice(0, 10),
      time: item.startTime ?? "",
      status: item.completionStatus ?? "Scheduled",
      href: "/dashboard/student/classes",
      tone: "blue",
    })),
    ...liveClasses.map((item) => ({
      id: `live-${item.id}`,
      kind: "Live Class",
      title: item.topic || item.title,
      detail: `${item.subject ?? "Live session"}${item.instructorName ? ` / ${item.instructorName}` : ""}`,
      at: item.scheduledAt,
      date: item.scheduledAt.slice(0, 10),
      time: new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "Join",
      href: item.meetingLink,
      tone: "green",
    })),
    ...assignments.map((item) => ({
      id: `assignment-${item.id}`,
      kind: "Assignment",
      title: item.title,
      detail: `${item.subject ?? "Homework"}${item.batchName ? ` / ${item.batchName}` : ""}`,
      at: item.dueDate ?? `${todayKey()}T23:59:00`,
      date: (item.dueDate ?? todayKey()).slice(0, 10),
      time: item.dueDate ? new Date(item.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Due",
      status: item.submissionStatus === "SUBMITTED" ? "Submitted" : "Pending",
      href: "/dashboard/student/assignments",
      tone: item.submissionStatus === "SUBMITTED" ? "green" : "gold",
    })),
    ...exams.map((item) => ({
      id: `exam-${item.id || item.testId}`,
      kind: "Exam",
      title: item.examName ?? item.title ?? item.name ?? "Assigned exam",
      detail: `${item.subject ?? "Exam"}${item.batchName || item.batch?.name ? ` / ${item.batchName ?? item.batch?.name}` : ""}`,
      at: item.publishAt ?? `${todayKey()}T00:00:00`,
      date: (item.publishAt ?? todayKey()).slice(0, 10),
      time: item.publishAt ? new Date(item.publishAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Open",
      status: item.publishAt && new Date(item.publishAt).getTime() > now ? "Scheduled" : "Open",
      href: "/dashboard/student/exams",
      tone: "red",
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const selected = new Date(`${selectedDate}T00:00:00`);
  const weekStart = new Date(selected);
  weekStart.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const monthSlots = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(monthStart);
    date.setDate(index - ((monthStart.getDay() + 6) % 7) + 1);
    return date;
  });
  const keyFor = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <Shell title="Academic Calendar" subtitle="Your classes, exams, assignments and academy events in one timetable.">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-white p-3 shadow-sm">
        <div className="flex gap-2">
          {(["day", "week", "month"] as const).map((mode) => <button key={mode} type="button" onClick={() => setView(mode)} className={`min-h-11 rounded-xl px-4 text-sm font-black capitalize transition hover:-translate-y-0.5 ${view === mode ? "bg-[var(--ink)] text-white shadow-sm" : "border border-[var(--border)] bg-white"}`}>{mode}</button>)}
        </div>
        <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold" />
      </section>

      {view === "day" ? (
        <ModuleCard title={selected.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}>
          <div className="grid gap-3 md:grid-cols-2">
            {events.filter((item) => item.date === selectedDate).map((item) => <StudentCalendarEventCard key={item.id} event={item} />)}
            {!events.some((item) => item.date === selectedDate) ? <Empty text="No class, exam, assignment or live session is scheduled for this date." /> : null}
          </div>
        </ModuleCard>
      ) : null}

      {view === "week" ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {weekDays.map((date) => {
            const key = keyFor(date);
            const dayItems = events.filter((item) => item.date === key);
            return (
              <article key={key} className="min-h-48 rounded-[22px] border border-[var(--border)] bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">{date.toLocaleDateString(undefined, { weekday: "short" })}</p>
                <h2 className="mt-1 text-xl font-black">{date.getDate()}</h2>
                <div className="mt-3 grid gap-2">
                  {dayItems.map((item) => (
                    <button key={item.id} type="button" onClick={() => { setSelectedDate(key); setView("day"); }} className={`rounded-xl border p-3 text-left transition hover:-translate-y-0.5 ${calendarEventTone(item.tone)}`}>
                      <span className="block text-xs font-black">{item.time || item.kind}</span>
                      <span className="mt-1 block line-clamp-2 text-sm font-black">{item.title}</span>
                    </button>
                  ))}
                  {!dayItems.length ? <p className="text-xs text-[var(--muted-blue)]">No activity</p> : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {view === "month" ? (
        <section className="rounded-[22px] border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-2xl font-black">{selected.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
          <div className="grid grid-cols-7 gap-1">
            {monthSlots.map((date) => {
              const key = keyFor(date);
              const dayItems = events.filter((item) => item.date === key);
              const currentMonth = date.getMonth() === selected.getMonth();
              return (
                <button key={key} type="button" onClick={() => { setSelectedDate(key); setView("day"); }} className={`min-h-20 rounded-xl border p-2 text-left transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] ${currentMonth ? "border-[var(--border)] bg-white" : "border-transparent bg-slate-50 text-slate-400"}`}>
                  <span className="text-sm font-black">{date.getDate()}</span>
                  {dayItems.length ? (
                    <span className="mt-2 block rounded-lg bg-[var(--gold-soft)] px-2 py-1 text-[0.65rem] font-black">
                      {dayItems.length} item{dayItems.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  <span className="mt-1 block truncate text-[0.65rem] font-bold text-[var(--muted-blue)]">{dayItems[0]?.kind ?? ""}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}

function calendarEventTone(tone: string) {
  if (tone === "red") return "border-rose-200 bg-rose-50 text-rose-900";
  if (tone === "green") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "gold") return "border-[var(--gold-border)] bg-[var(--gold-soft)] text-[var(--ink)]";
  return "border-sky-200 bg-sky-50 text-sky-950";
}

function StudentCalendarEventCard({ event }: { event: { kind: string; title: string; detail: string; at: string; time: string; status: string; href: string; tone: string } }) {
  const isExternal = event.href.startsWith("http");
  const className = `block rounded-[22px] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${calendarEventTone(event.tone)}`;
  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-75">{event.kind}</p>
          <h3 className="mt-2 text-lg font-black">{event.title}</h3>
          <p className="mt-1 text-sm font-bold opacity-75">{event.detail}</p>
        </div>
        <span className="rounded-full border border-current/15 bg-white/70 px-3 py-1 text-xs font-black">{event.status}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-current/10 pt-3 text-sm font-black">
        <span>{event.time || new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <Countdown value={event.at} />
      </div>
    </>
  );

  if (isExternal) {
    return <a href={event.href} target="_blank" rel="noreferrer" className={className}>{content}</a>;
  }

  return <Link href={event.href} className={className}>{content}</Link>;
}

export function StudentAttendancePage() {
  const { plan, activeBatches } = useStudentPlan();
  const [leaveForm, setLeaveForm] = useState({ fromDate: "", toDate: "", reason: "", attachmentName: "" });
  const [message, setMessage] = useState<string | null>(null);
  const summary = plan.data?.attendance?.summary ?? { present: 0, absent: 0, leave: 0, total: 0, percentage: 0 };
  const sessions = plan.data?.attendance?.sessions ?? [];
  const leaveRequests = useQuery({
    queryKey: ["student", "leave-requests"],
    queryFn: () => apiList<{ id: string; fromDate: string; toDate: string; status: string; reason: string }>("/api/academy/leave-requests", "leaves"),
  });

  return (
    <Shell title="Attendance & Leave" subtitle="Track attendance and apply leave without opening the full dashboard.">
      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <ModuleCard title="Attendance Summary">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Attendance" value={`${summary.percentage}%`} />
            <Metric label="Present" value={summary.present} />
            <Metric label="Absent" value={summary.absent} />
            <Metric label="Leave" value={summary.leave} />
          </div>
          <div className="mt-4 grid gap-2">
            {sessions.slice(0, 6).map((session) => (
              <div key={session.id} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
                <span className="font-black">{session.subject ?? "Class"}</span>
                <span className="text-[var(--muted-blue)]"> / {session.date ? new Date(session.date).toLocaleDateString() : "Date pending"}</span>
                <span className="ml-2 font-black">{session.records?.[0]?.status ?? "MARKED"}</span>
              </div>
            ))}
            {!sessions.length ? <Empty text="Attendance records will appear after teachers mark your class." /> : null}
          </div>
        </ModuleCard>
        <ModuleCard title="Apply Leave">
          <div className="grid gap-3 md:grid-cols-2">
            <input type="date" value={leaveForm.fromDate} onChange={(event) => setLeaveForm((form) => ({ ...form, fromDate: event.target.value }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <input type="date" value={leaveForm.toDate} onChange={(event) => setLeaveForm((form) => ({ ...form, toDate: event.target.value }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <textarea value={leaveForm.reason} onChange={(event) => setLeaveForm((form) => ({ ...form, reason: event.target.value }))} rows={3} placeholder="Reason" className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm md:col-span-2" />
            <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(event) => setLeaveForm((form) => ({ ...form, attachmentName: event.target.files?.[0]?.name ?? "" }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm md:col-span-2" />
            <button
              type="button"
              onClick={async () => {
                setMessage("Submitting leave request...");
                try {
                  await apiPost("/api/academy/leave-requests", { ...leaveForm, batchId: activeBatches[0]?.id });
                  setLeaveForm({ fromDate: "", toDate: "", reason: "", attachmentName: "" });
                  setMessage("Leave request submitted.");
                  await leaveRequests.refetch();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Could not submit leave request.");
                }
              }}
              className="min-h-12 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black md:col-span-2"
            >
              Submit Leave
            </button>
          </div>
          {message ? <div className="mt-3 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3 text-sm font-black">{message}</div> : null}
          <div className="mt-4 grid gap-2">
            {(leaveRequests.data ?? []).slice(0, 4).map((leave) => (
              <div key={leave.id} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
                <span className="font-black">{leave.status}</span>
                <span className="text-[var(--muted-blue)]"> / {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()} / {leave.reason}</span>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </Shell>
  );
}

function ModuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[var(--border)] bg-white/95 p-5 shadow-sm">
      <h2 className="text-xl font-black md:text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof PlayCircle }) {
  return (
    <Link href={href} className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <span className="mt-3 block">{label}</span>
    </Link>
  );
}

function QuickPill({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-9 items-center rounded-full border border-[var(--border)] bg-white px-3 text-xs font-black text-[var(--navy)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
      {label}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-2xl font-black md:text-3xl">{value}</p>
      <p className="text-sm text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function ClassCard({ item }: { item: CalendarItem }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">{item.startTime ?? new Date(item.plannedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <h3 className="mt-1 text-lg font-black">{item.subject}</h3>
          <p className="text-sm text-[var(--muted-blue)]">{item.batchName ?? "Batch"} / {item.topic}</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1 text-xs font-black">{item.completionStatus ?? "Scheduled"}</span>
      </div>
    </article>
  );
}

function LiveCard({ item }: { item: LiveClass }) {
  const now = useCurrentTime();
  const window = liveClassWindow(item);
  const upcoming = Boolean(window.start && window.start > now);
  const countdownAt = upcoming ? item.scheduledAt : window.end ? new Date(window.end).toISOString() : item.scheduledAt;
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">{item.subject ?? "Live Class"}</p>
      <h3 className="mt-2 text-lg font-black">{item.topic || item.title}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.instructorName ?? "NIDUS Teacher"} / {new Date(item.scheduledAt).toLocaleString()}</p>
      <div className="mt-3"><Countdown value={countdownAt} mode={upcoming ? "start" : "end"} activeLabel="Live now" /></div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={item.meetingLink} target="_blank" rel="noreferrer" className="rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black">Join Class</a>
        {item.recordingUrl ? <a href={item.recordingUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">Watch Recording</a> : null}
      </div>
    </article>
  );
}

function ExamCard({ exam }: { exam: ExamSummary }) {
  const router = useRouter();
  const now = useCurrentTime(1000);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const examId = exam.testId || exam.id;
  const window = examWindow(exam);
  const locked = window.start ? window.start > now : false;
  const expired = window.end ? window.end <= now : false;
  const startsAt = window.startsAt;
  const endsAt = window.end ? new Date(window.end).toISOString() : null;

  async function startExam() {
    if (!examId || starting) return;
    setStarting(true);
    setError("");
    try {
      const payload = await apiPost<{ attempt?: { id?: string }; id?: string }>("/api/tests/start", { testId: examId });
      const attemptId = payload.attempt?.id || payload.id;
      if (!attemptId) throw new Error("Exam attempt could not be opened.");
      router.push(`/test-attempt/${attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exam could not be opened.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <article className={`rounded-[26px] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${locked ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--gold-border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gold)]">{exam.subject ?? "Exam"}</span>
            <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">{expired ? "Closed" : locked ? "Upcoming" : "Open"}</span>
          </div>
          <h3 className="mt-3 text-2xl font-black">{exam.examName ?? exam.title ?? exam.name ?? "Assigned Exam"}</h3>
          <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">{exam.batchName ?? exam.batch?.name ?? "Assigned batch"} / {exam.topic ?? "General"}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[var(--muted-blue)]">
            <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">{examTimeLabel(startsAt, endsAt)}</span>
            <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">{exam.totalQuestions ? `${exam.totalQuestions} questions` : "Question paper ready"}</span>
            <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">{exam.totalMarks ? `${exam.totalMarks} marks` : "Marks set"}</span>
            <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">{exam.durationMinutes ?? exam.duration ?? "Timed"} min</span>
          </div>
        </div>
        <ExamCountdownClock startsAt={startsAt} endsAt={endsAt} />
      </div>
      {locked ? (
        <button type="button" disabled className="mt-4 rounded-xl border border-[var(--gold-border)] bg-white px-4 py-2 text-sm font-black text-[var(--gold-dark)]">
          Opens when countdown reaches 00:00:00
        </button>
      ) : expired ? (
        <button type="button" disabled className="mt-4 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-black text-slate-500">
          Exam closed
        </button>
      ) : (
        <button type="button" onClick={startExam} disabled={starting} className="mt-4 inline-flex rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black disabled:opacity-60">
          {starting ? "Opening..." : "Start Exam"} <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      )}
      {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
    </article>
  );
}

function AttemptHistoryCard({ attempt }: { attempt: AttemptHistory }) {
  const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Submitted";
  const released = attempt.resultsReleased !== false;
  const score = `${attempt.score ?? 0}/${attempt.test.totalMarks}`;
  const minutesTaken = attempt.timeTaken ? Math.max(1, Math.round(attempt.timeTaken / 60)) : null;
  return (
    <article className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Attended</span>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">{submittedAt}</span>
      </div>
      <h3 className="mt-3 text-xl font-black">{attempt.test.title}</h3>
      <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">{attempt.test.subject ?? attempt.test.examType ?? "Exam"} / {attempt.test.topic ?? "General"}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-black">
        <span className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">Score<br />{released ? score : "Pending"}</span>
        <span className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">Correct<br />{released ? attempt.totalCorrect ?? "-" : "Locked"}</span>
        <span className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">Time<br />{minutesTaken ? `${minutesTaken} min` : `${attempt.test.duration} min`}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {released ? (
          <Link href={`/results/${attempt.id}`} className="rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black">
            View solved paper
          </Link>
        ) : (
          <Link href={`/results/${attempt.id}`} className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-sm font-black text-[var(--gold-dark)]">
            Result under review
          </Link>
        )}
        <button type="button" disabled className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black text-[var(--muted-blue)] opacity-70">
          Timed retest coming next
        </button>
      </div>
      {!released ? <p className="mt-3 text-xs font-bold text-[var(--muted-blue)]">Score, rank, answer key and explanations appear after faculty releases the result.</p> : null}
    </article>
  );
}

function MissedExamCard({ exam }: { exam: ExamSummary }) {
  const window = examWindow(exam);
  const endedAt = window.end ? new Date(window.end).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Closed";
  return (
    <article className="rounded-[24px] border border-orange-200 bg-orange-50/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">Unattended</span>
        <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">Closed {endedAt}</span>
      </div>
      <h3 className="mt-3 text-xl font-black">{exam.examName ?? exam.title ?? exam.name ?? "Assigned Exam"}</h3>
      <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">{exam.batchName ?? exam.batch?.name ?? "Assigned batch"} / {exam.subject ?? "Exam"} / {exam.topic ?? "General"}</p>
      <p className="mt-4 text-sm text-[var(--muted-blue)]">This exam was not attempted in the official window. Keep it here for practice visibility and future timed retest mode.</p>
      <button type="button" disabled className="mt-4 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-black text-orange-700 opacity-80">
        Practice retest coming next
      </button>
    </article>
  );
}
