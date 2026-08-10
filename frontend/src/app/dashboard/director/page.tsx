"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeIndianRupee,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LineChart,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDirectorDashboard } from "@/services/dashboard";

const dateLabel = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

type Tone = "blue" | "green" | "gold" | "rose" | "amber";

export default function DirectorDashboardPage() {
  const directorQuery = useQuery({ queryKey: ["dashboard", "director", "control-panel"], queryFn: getDirectorDashboard });
  const commandCenter = directorQuery.data?.commandCenter;
  const pendingAdmissions = commandCenter?.operationalAlerts.pendingAdmissions ?? 0;
  const pendingFees = commandCenter?.operationalAlerts.pendingFees ?? 0;
  const lowAttendance = commandCenter?.operationalAlerts.lowAttendanceAlerts ?? 0;
  const activeStudents = commandCenter?.students.active ?? directorQuery.data?.instituteAnalytics.students ?? 0;
  const activeBatches = commandCenter?.academics.activeBatches ?? directorQuery.data?.academyArchitecture.batches ?? 0;
  const facultyCount =
    (commandCenter?.staff?.academicHeads.active ?? 0) +
    (commandCenter?.staff?.teachers.active ?? 0) +
    (commandCenter?.staff?.physicalTrainers.active ?? 0);
  const staffCount =
    facultyCount +
    (commandCenter?.staff?.administrativeOfficers.active ?? 0) +
    (commandCenter?.staff?.businessDevelopmentExecutives.active ?? 0);
  const alerts = pendingAdmissions + pendingFees + lowAttendance;
  const loading = directorQuery.isLoading;
  const aiState = loading ? "Checking" : alerts ? "Action Needed" : "Stable";
  const nidusInsight = loading
    ? "Nidus AI is checking admissions, accounts, academics and people for today's operating picture."
    : alerts
      ? `Nidus AI found ${alerts} priority item(s). Open the highlighted cards and clear them first.`
      : "Nidus AI sees a calm academy today. Admissions, fees and attendance do not need urgent director action.";

  const criticalActions = [
    {
      label: "Admissions",
      title: pendingAdmissions ? "Approve admissions" : "Admissions clear",
      detail: pendingAdmissions ? `${pendingAdmissions} director approval item(s) are waiting.` : "No admission approval is pending.",
      href: "/dashboard/director/admissions",
      value: pendingAdmissions,
      icon: UserPlus,
      tone: pendingAdmissions ? "amber" : "green",
    },
    {
      label: "Accounts",
      title: pendingFees ? "Review pending fees" : "Fees clear",
      detail: pendingFees ? `${pendingFees} fee case(s) need collection follow-up.` : "No fee alert is visible.",
      href: "/dashboard/director/accounts?tab=dues",
      value: pendingFees,
      icon: BadgeIndianRupee,
      tone: pendingFees ? "amber" : "green",
    },
    {
      label: "Academics",
      title: lowAttendance ? "Check attendance risk" : "Attendance calm",
      detail: lowAttendance ? `${lowAttendance} low-attendance alert(s) need review.` : "No attendance risk is visible.",
      href: "/dashboard/director/academic/student-progress",
      value: lowAttendance,
      icon: AlertTriangle,
      tone: lowAttendance ? "rose" : "green",
    },
  ] as const;

  const analytics = [
    { label: "Students", value: activeStudents, detail: "active learners", href: "/dashboard/director/students", icon: Users, tone: "blue" },
    { label: "Batches", value: activeBatches, detail: "running classes", href: "/dashboard/director/academic/batches", icon: GraduationCap, tone: "gold" },
    { label: "Faculty", value: facultyCount, detail: `${staffCount} total staff`, href: "/dashboard/director/academic/teachers", icon: Users, tone: "green" },
    { label: "Alerts", value: alerts, detail: alerts ? "needs attention" : "all clear", href: "/dashboard/director/reports", icon: AlertTriangle, tone: alerts ? "rose" : "blue" },
  ] as const;

  const suggestions = [
    {
      title: alerts ? "Clear priority work first" : "Start with admissions pipeline",
      detail: alerts ? "Nidus AI recommends opening the highlighted action cards before reviewing reports." : "No urgent risk is visible. Review admissions flow if you want to improve conversion.",
      href: alerts ? "/dashboard/director/reports" : "/dashboard/director/admissions",
    },
    {
      title: "Review batch capacity",
      detail: `${activeBatches} active batch(es) are running. Open batches to check student distribution.`,
      href: "/dashboard/director/academic/batches",
    },
    {
      title: "Open executive reports",
      detail: "Use reports when you want the full academy view instead of daily actions.",
      href: "/dashboard/director/reports",
    },
  ];

  const quickOpen = [
    { label: "Programs", href: "/dashboard/director/academic/programs" },
    { label: "Batches", href: "/dashboard/director/academic/batches" },
    { label: "Students", href: "/dashboard/director/students" },
    { label: "Accounts", href: "/dashboard/director/accounts" },
    { label: "Reports", href: "/dashboard/director/reports" },
  ];

  return (
    <main className="h-[calc(100dvh-var(--nav-height)-2rem)] overflow-hidden text-[var(--navy)]">
      <section className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
        <header className="shrink-0 px-1 pt-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Nidus AI Today</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Director Working Panel</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Critical analytics, AI guidance and next actions in one simple command screen.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/75 px-3 py-2 text-xs font-bold text-[var(--muted-blue)] shadow-sm">
              <CalendarDays className="h-4 w-4" />
              {dateLabel}
            </div>
          </div>
        </header>

        <section className="shrink-0 overflow-hidden rounded-3xl border border-[var(--gold-border)] bg-white/90 shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
            <div className="flex min-w-0 items-center gap-4 p-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#08223f] text-white shadow-sm"><BrainCircuit className="h-6 w-6" /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">Nidus AI Briefing</p>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black ${alerts ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{aiState}</span>
                </div>
                <p className="mt-2 text-lg font-black leading-7 text-[var(--navy)]">{nidusInsight}</p>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">Every critical card below opens the exact module needed to act.</p>
              </div>
            </div>
            <div className="grid gap-2 border-t border-[var(--border)] bg-[var(--gold-soft)] p-4 lg:border-l lg:border-t-0">
              <BriefStat label="Students" value={loading ? "..." : activeStudents} />
              <BriefStat label="Batches" value={loading ? "..." : activeBatches} />
              <BriefStat label="Alerts" value={loading ? "..." : alerts} tone={alerts ? "warn" : "ok"} />
            </div>
          </div>
        </section>

        <section className="grid shrink-0 gap-3 md:grid-cols-4">
          {analytics.map((item) => (
            <AnalyticsCard key={item.label} icon={item.icon} href={item.href} label={item.label} value={loading ? "..." : item.value} detail={item.detail} tone={item.tone as Tone} />
          ))}
        </section>

        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[0.98fr_1.02fr]">
          <Panel title="Critical Actions" eyebrow="AI priority list">
            <div className="grid gap-3">
              {criticalActions.map((item) => <ActionCard key={item.label} item={item} />)}
            </div>
          </Panel>

          <Panel title="AI Suggestions" eyebrow="Nidus guidance">
            <div className="grid gap-3">
              {suggestions.map((item) => <SuggestionLink key={item.title} {...item} />)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickOpen.map((item) => (
                <Link key={item.label} href={item.href} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
                  {item.label}
                </Link>
              ))}
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function BriefStat({ label, tone = "ok", value }: { label: string; tone?: "ok" | "warn"; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/82 px-3 py-2 shadow-sm">
      <span className="text-xs font-black text-[var(--muted-blue)]">{label}</span>
      <span className={`text-lg font-black ${tone === "warn" ? "text-amber-700" : "text-[var(--navy)]"}`}>{value}</span>
    </div>
  );
}

function AnalyticsCard({ detail, href, icon: Icon, label, tone, value }: { detail: string; href: string; icon: LucideIcon; label: string; tone: Tone; value: string | number }) {
  const palette = cardPalette(tone);
  return (
    <Link href={href} className={`min-h-28 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${palette.card}`}>
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none">{value}</p>
          <p className="mt-2 truncate text-sm font-bold text-[var(--muted-blue)]">{detail}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${palette.icon}`}><Icon className="h-4 w-4" /></span>
      </div>
    </Link>
  );
}

function Panel({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="min-h-0 rounded-3xl border border-[var(--border)] bg-white/86 p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-black">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ActionCard({ item }: { item: { label: string; title: string; detail: string; href: string; value: number; icon: LucideIcon; tone: "green" | "amber" | "rose" } }) {
  const Icon = item.icon;
  const ok = item.tone === "green";
  const palette = actionPalette(item.tone);
  return (
    <Link href={item.href} className={`rounded-2xl border p-4 transition hover:shadow-md ${palette.card}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${palette.icon}`}>{ok ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>
          <span className="min-w-0">
            <span className="block text-sm font-black">{item.title}</span>
            <span className="mt-0.5 block truncate text-sm text-[var(--muted-blue)]">{item.detail}</span>
          </span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${palette.badge}`}>{item.value}</span>
      </div>
    </Link>
  );
}

function SuggestionLink({ detail, href, title }: { detail: string; href: string; title: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f1ff] text-[#123c6d]"><Sparkles className="h-4 w-4" /></span>
        <span className="min-w-0">
          <span className="block text-sm font-black">{title}</span>
          <span className="mt-1 block text-sm leading-5 text-[var(--muted-blue)]">{detail}</span>
        </span>
      </div>
    </Link>
  );
}

function cardPalette(tone: Tone) {
  const styles: Record<Tone, { card: string; icon: string }> = {
    blue: { card: "border-[#c7dcf5] bg-[#f4f8ff]", icon: "bg-[#dcecff] text-[#123c6d]" },
    green: { card: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-100 text-emerald-800" },
    gold: { card: "border-[var(--gold-border)] bg-[var(--gold-soft)]", icon: "bg-white text-[var(--navy)]" },
    rose: { card: "border-rose-200 bg-rose-50", icon: "bg-rose-100 text-rose-800" },
    amber: { card: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-800" },
  };
  return styles[tone];
}

function actionPalette(tone: "green" | "amber" | "rose") {
  const styles = {
    green: { card: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-100 text-emerald-800", badge: "bg-emerald-100 text-emerald-800" },
    amber: { card: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-800", badge: "bg-amber-100 text-amber-800" },
    rose: { card: "border-rose-200 bg-rose-50", icon: "bg-rose-100 text-rose-800", badge: "bg-rose-100 text-rose-800" },
  };
  return styles[tone];
}
