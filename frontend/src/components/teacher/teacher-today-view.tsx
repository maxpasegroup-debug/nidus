import Link from "next/link";
import { CalendarClock, CheckCircle2, Circle, Clock3, Radio } from "lucide-react";

export type TeacherTodayScheduleItem = {
  id: string;
  batchId: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  batchName: string;
  programName: string;
  subject: string;
  topic: string;
  classType: string;
  status: string;
  completionStatus: string;
  href: string;
  done?: boolean;
  actions?: Array<{ key: string; label: string; href?: string }>;
};

type TeacherTodayDiagnostics = {
  emptyReason?: string | null;
  batchCount?: number;
  rawTodayCalendarRows?: number;
  visibleTodayCalendarRows?: number;
  visibleUpcomingCalendarRows?: number;
};

function displayTime(value?: string | null) {
  if (!value) return "Time pending";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours)) return value;
  return new Date(2000, 0, 1, hours, minutes || 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function taskLabel(item: TeacherTodayScheduleItem) {
  const type = item.classType.toUpperCase();
  if (type.includes("RECORD")) return "Course recording";
  if (type.includes("ASSIGN")) return "Assignment";
  if (type.includes("EXAM") || type.includes("TEST") || type.includes("MOCK")) return "Examination";
  if (type.includes("MEETING") || type.includes("PTA")) return "Meeting";
  if (type.includes("ATTENDANCE")) return "Attendance";
  return "Class";
}

function isComplete(item: TeacherTodayScheduleItem) {
  if (typeof item.done === "boolean") return item.done;
  return [item.status, item.completionStatus].some((value) => String(value).toUpperCase() === "COMPLETED");
}

function emptyMessage(reason?: string | null) {
  if (reason === "NO_ASSIGNED_BATCHES") return "No batches are assigned to this teacher yet.";
  if (reason === "NO_ACTIVE_BATCHES") return "No active batches are available today.";
  if (reason === "CALENDAR_ROWS_NOT_VISIBLE_TO_USER") return "Timetable exists, but it is not mapped to this teacher's assigned subjects.";
  if (reason === "NO_CLASSES_TODAY") return "No class is scheduled for today. Your next upcoming class is shown above.";
  if (reason === "NO_CALENDAR_IN_RANGE") return "No timetable is generated for the next two weeks.";
  if (reason === "TODAY_API_FAILED") return "Today's work could not be loaded from the server. Use Refresh once, then check the API if this continues.";
  return "New classes, recordings, examinations, assignments, or meetings will appear here.";
}

function typeLabel(item: TeacherTodayScheduleItem) {
  return taskLabel(item).replaceAll("_", " ");
}

export function TeacherTodayView({ today, upcoming, nextUpcoming, loading, diagnostics, onStartLive, onTaskAction }: {
  today: TeacherTodayScheduleItem[];
  upcoming: TeacherTodayScheduleItem[];
  nextUpcoming?: TeacherTodayScheduleItem | null;
  loading: boolean;
  diagnostics?: TeacherTodayDiagnostics | null;
  onStartLive: (batchId: string) => void;
  onTaskAction?: (item: TeacherTodayScheduleItem, action: { key: string; label: string; href?: string }) => void;
}) {
  const ordered = [...today].sort((first, second) => String(first.startTime || "99:99").localeCompare(String(second.startTime || "99:99")));
  const remaining = ordered.filter((item) => !isComplete(item)).length;
  const next = nextUpcoming ?? upcoming[0] ?? null;

  if (loading) {
    return <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm font-bold text-[var(--muted-blue)]">Loading today&apos;s work...</div>;
  }

  return (
    <section className="mx-auto grid w-full max-w-4xl gap-4">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Today</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">My to-do list</h1>
            <p className="mt-2 text-sm text-[var(--muted-blue)]">Classes and academy work assigned for today.</p>
          </div>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{remaining} remaining</span>
        </div>
      </header>

      {next ? (
        <section className="rounded-2xl border border-slate-950 bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Next upcoming</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-[110px_1fr_auto] sm:items-center">
            <div>
              <p className="text-2xl font-black">{displayTime(next.startTime)}</p>
              {next.endTime ? <p className="text-xs text-white/70">to {displayTime(next.endTime)}</p> : null}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold)]">{typeLabel(next)}</p>
              <h2 className="mt-1 text-xl font-black">{next.batchName} / {next.subject}</h2>
              <p className="mt-1 text-sm text-white/75">{next.topic}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={next.href} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-slate-950">Open</Link>
              {next.batchId ? (
                <button type="button" onClick={() => onStartLive(next.batchId)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-black text-white">
                  <Radio size={16} /> Go Live
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3">
        {ordered.map((item, index) => {
          const complete = isComplete(item);
          return (
            <article key={item.id} className={`grid gap-3 rounded-2xl border p-4 transition sm:grid-cols-[96px_1fr_auto] sm:items-center ${complete ? "border-emerald-200 bg-emerald-50/60" : index === 0 ? "border-slate-950 bg-white shadow-sm" : "border-[var(--border)] bg-white"}`}>
              <div className="flex items-center gap-2 sm:block">
                <Clock3 className="h-4 w-4 sm:hidden" />
                <p className="font-black">{displayTime(item.startTime)}</p>
                {item.endTime ? <p className="text-xs text-[var(--muted-blue)] sm:mt-1">to {displayTime(item.endTime)}</p> : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-dark)]">{typeLabel(item)}</p>
                <Link href={item.href} className="mt-1 block font-black hover:underline">{item.batchName} / {item.subject}</Link>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.topic}</p>
                {item.actions?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.actions.map((action) => ["COMPLETE", "ATTENDANCE", "LIVE_CLASS", "RECORDING_UPLOADED"].includes(action.key) ? (
                      <button key={action.key} type="button" onClick={() => onTaskAction?.(item, action)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black hover:border-slate-950">{action.label}</button>
                    ) : action.key === "LIVE_CLASS" && item.batchId ? (
                      <button key={action.key} type="button" onClick={() => onStartLive(item.batchId)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black hover:border-slate-950">{action.label}</button>
                    ) : (
                      <Link key={action.key} href={action.href || item.href} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black hover:border-slate-950">{action.label}</Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${complete ? "border-emerald-200 bg-white text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                {complete ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {complete ? "Done" : "To do"}
              </span>
            </article>
          );
        })}

        {!ordered.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center">
            <CalendarClock className="mx-auto h-7 w-7 text-[var(--gold-dark)]" />
            <h2 className="mt-3 text-xl font-black">Nothing assigned for today</h2>
            <p className="mt-2 text-sm text-[var(--muted-blue)]">{emptyMessage(diagnostics?.emptyReason)}</p>
            {diagnostics ? (
              <p className="mt-3 text-xs font-bold text-[var(--muted-blue)]">
                Batches {diagnostics.batchCount ?? 0} / Today rows {diagnostics.visibleTodayCalendarRows ?? 0}/{diagnostics.rawTodayCalendarRows ?? 0} / Upcoming {diagnostics.visibleUpcomingCalendarRows ?? 0}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
