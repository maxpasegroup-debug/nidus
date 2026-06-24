import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, Clock3, FileText, Library, Users } from "lucide-react";
import { TeacherModuleHeader } from "@/components/teacher/teacher-dashboard-primitives";

export type TeacherTodayScheduleItem = {
  id: string;
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
};

function dateTimeValue(item: TeacherTodayScheduleItem, useEnd = false) {
  const time = useEnd ? item.endTime || item.startTime : item.startTime;
  const value = new Date(`${item.date.slice(0, 10)}T${time || "00:00"}:00`);
  return Number.isNaN(value.getTime()) ? 0 : value.getTime();
}

function statusLabel(item: TeacherTodayScheduleItem) {
  const completion = item.completionStatus.toUpperCase();
  const status = item.status.toUpperCase();
  if (completion === "COMPLETED" || status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  const now = Date.now();
  const start = dateTimeValue(item);
  const end = dateTimeValue(item, true) || start + 60 * 60 * 1000;
  if (start && now >= start && now <= end) return "Now";
  if (start && now > end) return "Pending update";
  return "Upcoming";
}

function statusClass(label: string) {
  if (label === "Completed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (label === "Now") return "border-blue-200 bg-blue-50 text-blue-800";
  if (label === "Cancelled") return "border-rose-200 bg-rose-50 text-rose-800";
  if (label === "Pending update") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function displayDate(value: string) {
  return new Date(value).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

function displayTime(value?: string | null) {
  if (!value) return "Time pending";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours)) return value;
  return new Date(2000, 0, 1, hours, minutes || 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function TeacherTodayView({ today, upcoming, loading }: { today: TeacherTodayScheduleItem[]; upcoming: TeacherTodayScheduleItem[]; loading: boolean }) {
  const current = today.find((item) => statusLabel(item) === "Now");
  const next = today.find((item) => statusLabel(item) === "Upcoming") ?? upcoming[0];
  const focus = current ?? next ?? null;
  const afterClassActions = [
    { label: "Attendance", note: "Mark present, absent, leave", href: "/dashboard/teacher/attendance", icon: ClipboardCheck },
    { label: "Upload Lesson", note: "Add recording or notes", href: "/dashboard/teacher/library", icon: Library },
    { label: "Homework", note: "Publish worksheet", href: "/dashboard/teacher/assignments", icon: FileText },
    { label: "Exam", note: "Create class test", href: "/dashboard/teacher/exams", icon: CheckCircle2 },
    { label: "Students", note: "Open class roster", href: "/dashboard/teacher/students", icon: Users },
  ];

  if (loading) {
    return <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm font-bold text-[var(--muted-blue)]">Loading today&apos;s timetable...</div>;
  }

  return (
    <section className="grid gap-5">
      <TeacherModuleHeader eyebrow="Today" title="Start today's teaching" description="See the next class, open the batch, and finish the after-class work from one simple place." />

      {focus ? (
        <article className="rounded-2xl border border-slate-950 bg-slate-950 p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e7c873]">{current ? "Teach now" : "Next class"}</p>
              <p className="mt-3 text-3xl font-black sm:text-4xl">{displayTime(focus.startTime)}</p>
              <h2 className="mt-3 text-xl font-black sm:text-2xl">{focus.batchName} / {focus.subject}</h2>
              <p className="mt-2 text-sm text-slate-300">Topic: {focus.topic}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{focus.classType.replaceAll("_", " ")} / {focus.programName}</p>
            </div>
            <Link href={focus.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white bg-white px-5 py-3 text-sm font-black text-slate-950">
              Open Class <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-6">
          <CalendarClock className="h-6 w-6 text-[var(--gold-dark)]" />
          <h2 className="mt-3 text-xl font-black">No program scheduled today</h2>
          <p className="mt-2 text-sm text-[var(--muted-blue)]">Your next assigned timetable entry will appear here when the Academic Head publishes it.</p>
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">After Class</p>
            <h2 className="mt-2 text-2xl font-black">Finish the class work</h2>
          </div>
          <p className="text-sm font-bold text-[var(--muted-blue)]">Recommended order: attendance, lesson, homework.</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {afterClassActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className="min-h-28 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:-translate-y-0.5 hover:border-slate-950 hover:bg-white">
                <Icon className="h-5 w-5 text-[var(--gold-dark)]" />
                <h3 className="mt-3 font-black">{action.label}</h3>
                <p className="mt-1 text-sm leading-5 text-[var(--muted-blue)]">{action.note}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Today&apos;s timetable</p>
            <h2 className="mt-2 text-2xl font-black">Programs and activities</h2>
          </div>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{today.length}</span>
        </div>
        <div className="mt-5 grid gap-3">
          {today.map((item) => {
            const label = statusLabel(item);
            return (
              <Link key={item.id} href={item.href} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:border-slate-950 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                <div className="flex items-center gap-2 sm:block">
                  <Clock3 className="h-4 w-4 sm:hidden" />
                  <p className="font-black">{displayTime(item.startTime)}</p>
                  <p className="text-xs text-[var(--muted-blue)] sm:mt-1">{item.endTime ? `to ${displayTime(item.endTime)}` : ""}</p>
                </div>
                <div className="min-w-0">
                  <h3 className="font-black">{item.batchName} / {item.subject}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.topic}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted-blue)]">{item.classType.replaceAll("_", " ")}</p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClass(label)}`}>{label}</span>
              </Link>
            );
          })}
          {!today.length ? <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted-blue)]">No dated timetable entries for today.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Coming up</p>
        <h2 className="mt-2 text-2xl font-black">Next assigned programs</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {upcoming.slice(0, 8).map((item) => (
            <Link key={item.id} href={item.href} className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--border)] p-4 transition hover:border-slate-950">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--page-bg)]"><CheckCircle2 size={18} /></span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--gold-dark)]">{displayDate(item.date)} / {displayTime(item.startTime)}</p>
                <h3 className="mt-1 font-black">{item.batchName} / {item.subject}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-blue)]">{item.topic} / {item.classType.replaceAll("_", " ")}</p>
              </div>
            </Link>
          ))}
          {!upcoming.length ? <p className="text-sm text-[var(--muted-blue)]">No later activities have been assigned yet.</p> : null}
        </div>
      </section>
    </section>
  );
}
