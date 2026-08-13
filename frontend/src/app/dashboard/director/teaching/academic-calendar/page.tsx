"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, CalendarDays, CheckCircle2, Clock, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import TeacherDashboardClient from "../../../teacher/TeacherDashboardClient";
import { getAcademicCalendar } from "@/services/academy";
import { AcademicShell } from "../../academic/_components";

type Tone = "blue" | "green" | "gold" | "amber";

const calendarActions: Array<{ title: string; detail: string; href: string; icon: LucideIcon; tone: Tone; primary?: boolean }> = [
  { title: "Open Calendar Workspace", detail: "Create or edit academic events", href: "/dashboard/director/teaching/academic-calendar?mode=workspace", icon: CalendarDays, tone: "amber", primary: true },
  { title: "Open Timetable", detail: "Use this for daily class schedule", href: "/dashboard/director/academic/timetable", icon: Clock, tone: "blue", primary: true },
  { title: "Academic Home", detail: "Return to the academic command", href: "/dashboard/director/academic", icon: BookOpenCheck, tone: "gold" },
];

function dateKey(value: string) {
  return value.slice(0, 10);
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", weekday: "short" });
}

export default function DirectorTeachingCalendarPage() {
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode");
  const calendarQuery = useQuery({ queryKey: ["academy", "academic-calendar", "director-calendar-entry"], queryFn: () => getAcademicCalendar() });

  if (mode === "workspace") return <TeacherDashboardClient view="academic-calendar" />;

  const items = calendarQuery.data ?? [];
  const today = todayKey();
  const upcoming = items.filter((item) => dateKey(item.plannedDate) >= today).sort((first, second) => first.plannedDate.localeCompare(second.plannedDate)).slice(0, 8);
  const todayItems = items.filter((item) => dateKey(item.plannedDate) === today).length;
  const completed = items.filter((item) => item.status === "COMPLETED" || item.completionStatus === "COMPLETED").length;

  return (
    <AcademicShell>
      <header className="shrink-0 px-1 pt-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Nidus AI Calendar</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Academic Calendar</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Events, exam dates, holidays and milestones stay here. Daily classes remain inside Timetable.</p>
          </div>
          <Link href="/dashboard/director/academic" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black shadow-sm">
            Academics Home
          </Link>
        </div>
      </header>

      <section className="shrink-0 rounded-3xl border border-[var(--gold-border)] bg-white/92 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#08223f] text-white"><Sparkles className="h-6 w-6" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">Nidus AI Calendar Briefing</p>
              <p className="mt-2 text-lg font-black leading-7 text-[var(--navy)]">{calendarQuery.isLoading ? "Nidus AI is checking academic dates." : `${upcoming.length} upcoming date item(s) are visible. Use Timetable for daily class slots.`}</p>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">This separates the Director calendar from daily timetable work so navigation stays clear.</p>
            </div>
          </div>
          <div className="grid min-w-[280px] gap-2 sm:grid-cols-3 lg:w-[420px]">
            <MiniStat label="Today" value={calendarQuery.isLoading ? "..." : todayItems} />
            <MiniStat label="Upcoming" value={calendarQuery.isLoading ? "..." : upcoming.length} />
            <MiniStat label="Completed" value={calendarQuery.isLoading ? "..." : completed} />
          </div>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Calendar Actions" eyebrow="Start here">
          <div className="grid gap-3">
            {calendarActions.map((action) => <ActionCard key={action.title} action={action} />)}
          </div>
        </Panel>
        <Panel title="Upcoming Dates" eyebrow="Calendar preview">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)] text-[var(--navy)]"><CalendarDays className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[var(--navy)]">{item.subject || item.classType || "Academic date"}</p>
                    <p className="mt-1 line-clamp-1 text-xs font-bold text-[var(--muted-blue)]">{item.topic || item.batchName || "Calendar item"}</p>
                    <p className="mt-2 text-xs font-black text-[var(--gold)]">{displayDate(dateKey(item.plannedDate))}</p>
                  </div>
                </div>
              </article>
            ))}
            {!calendarQuery.isLoading && !upcoming.length ? <EmptyState text="No upcoming calendar item is visible." href="/dashboard/director/teaching/academic-calendar?mode=workspace" label="Open Calendar" /> : null}
          </div>
        </Panel>
      </section>
    </AcademicShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--gold-soft)] px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p><p className="text-xl font-black text-[var(--navy)]">{value}</p></div>;
}

function Panel({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return <section className="min-h-0 rounded-3xl border border-[var(--border)] bg-white/86 p-4 shadow-sm"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{eyebrow}</p><h2 className="mt-1 text-lg font-black">{title}</h2><div className="mt-3 max-h-[58vh] overflow-y-auto pr-1">{children}</div></section>;
}

function ActionCard({ action }: { action: { title: string; detail: string; href: string; icon: LucideIcon; tone: Tone; primary?: boolean } }) {
  const Icon = action.icon;
  const palette = tonePalette(action.tone);
  return <Link href={action.href} className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${action.primary ? palette.card : "border-[var(--border)] bg-white"}`}><div className="flex items-start gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${palette.icon}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-sm font-black text-[var(--navy)]">{action.title}</span><span className="mt-1 block text-xs leading-5 text-[var(--muted-blue)]">{action.detail}</span></span></div></Link>;
}

function EmptyState({ href, label, text }: { href: string; label: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4"><p className="text-sm font-bold text-[var(--muted-blue)]">{text}</p><Link href={href} className="mt-3 inline-flex min-h-9 items-center rounded-xl bg-[var(--navy)] px-3 text-sm font-black text-white">{label}</Link></div>;
}

function tonePalette(tone: Tone) {
  const styles: Record<Tone, { card: string; icon: string }> = {
    blue: { card: "border-[#c7dcf5] bg-[#f4f8ff]", icon: "bg-[#dcecff] text-[#123c6d]" },
    green: { card: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-100 text-emerald-800" },
    gold: { card: "border-[var(--gold-border)] bg-[var(--gold-soft)]", icon: "bg-white text-[var(--navy)]" },
    amber: { card: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-800" },
  };
  return styles[tone];
}