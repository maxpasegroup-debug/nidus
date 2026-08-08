"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeIndianRupee, CalendarDays, CheckCircle2, GraduationCap, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDirectorDashboard } from "@/services/dashboard";

const dateLabel = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

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

  const actionItems = [
    {
      label: "Admissions",
      title: pendingAdmissions ? "Clear admission approvals" : "Admissions are clear",
      detail: pendingAdmissions ? `${pendingAdmissions} admission item(s) need review.` : "No approval pending.",
      href: "/dashboard/director/admissions",
      value: pendingAdmissions,
      icon: UserPlus,
      tone: pendingAdmissions ? "warn" : "ok",
    },
    {
      label: "Fees",
      title: pendingFees ? "Review pending fees" : "Fee alerts are clear",
      detail: pendingFees ? `${pendingFees} fee item(s) need collection follow-up.` : "No fee alerts.",
      href: "/dashboard/director/accounts?tab=dues",
      value: pendingFees,
      icon: BadgeIndianRupee,
      tone: pendingFees ? "warn" : "ok",
    },
    {
      label: "Attendance",
      title: lowAttendance ? "Check student attendance" : "Attendance looks calm",
      detail: lowAttendance ? `${lowAttendance} attendance alert(s) need academic follow-up.` : "No low-attendance alert.",
      href: "/dashboard/director/academic/student-progress",
      value: lowAttendance,
      icon: AlertTriangle,
      tone: lowAttendance ? "warn" : "ok",
    },
  ] as const;

  return (
    <main className="h-[calc(100dvh-var(--nav-height)-2rem)] overflow-hidden text-[var(--navy)]">
      <section className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
        <header className="shrink-0 px-1 pt-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Director Command Center</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Today</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Start with urgent work, then use the left menu when you need a department.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-3 py-2 text-xs font-bold text-[var(--muted-blue)]">
              <CalendarDays className="h-4 w-4" />
              {dateLabel}
            </div>
          </div>
        </header>

        <section className="grid shrink-0 gap-3 md:grid-cols-4">
          <MetricCard icon={Users} label="Students" value={directorQuery.isLoading ? "..." : activeStudents} detail="active learners" />
          <MetricCard icon={GraduationCap} label="Batches" value={directorQuery.isLoading ? "..." : activeBatches} detail="running classes" />
          <MetricCard icon={Users} label="Faculty" value={directorQuery.isLoading ? "..." : facultyCount} detail={`${staffCount} total staff`} />
          <MetricCard icon={AlertTriangle} label="Alerts" value={directorQuery.isLoading ? "..." : alerts} detail="items to review" tone={alerts ? "warn" : "ok"} />
        </section>

        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Today&apos;s Attention" eyebrow="Start here">
            <div className="divide-y divide-[var(--border)]">
              {actionItems.map((item) => (
                <ActionRow key={item.label} item={item} />
              ))}
            </div>
          </Panel>

          <Panel title="Academy Overview" eyebrow="Status">
            <div className="grid gap-3 sm:grid-cols-2">
              <OverviewLine label="Admissions" value={pendingAdmissions ? `${pendingAdmissions} need review` : "Clear"} tone={pendingAdmissions ? "warn" : "ok"} />
              <OverviewLine label="Fee alerts" value={pendingFees ? `${pendingFees} pending` : "Clear"} tone={pendingFees ? "warn" : "ok"} />
              <OverviewLine label="Attendance" value={lowAttendance ? `${lowAttendance} alerts` : "Calm"} tone={lowAttendance ? "warn" : "ok"} />
              <OverviewLine label="Academy" value={`${activeBatches} batches / ${activeStudents} students`} />
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ detail, icon: Icon, label, tone = "ok", value }: { detail: string; icon: LucideIcon; label: string; tone?: "ok" | "warn"; value: string | number }) {
  return (
    <div className="min-h-28 rounded-2xl border border-[var(--border)] bg-white/86 p-4 shadow-sm">
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none">{value}</p>
          <p className="mt-2 truncate text-sm text-[var(--muted-blue)]">{detail}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone === "warn" ? "bg-amber-100 text-amber-800" : "bg-[var(--gold-soft)] text-[var(--navy)]"}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function Panel({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="min-h-0 rounded-2xl border border-[var(--border)] bg-white/82 p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-black">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function OverviewLine({ label, tone = "ok", value }: { label: string; tone?: "ok" | "warn"; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--page-bg)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[var(--navy)]">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${tone === "warn" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
          {tone === "warn" ? "Check" : "OK"}
        </span>
      </div>
      <p className="mt-2 text-sm font-bold text-[var(--muted-blue)]">{value}</p>
    </div>
  );
}

function ActionRow({
  item,
}: {
  item: {
    label: string;
    title: string;
    detail: string;
    href: string;
    value: number;
    icon: LucideIcon;
    tone: "ok" | "warn";
  };
}) {
  const Icon = item.icon;
  const ok = item.tone === "ok";
  return (
    <Link href={item.href} className="block py-3 transition hover:bg-[var(--gold-soft)]/45">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            {ok ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black">{item.label}</span>
            <span className="mt-0.5 block truncate text-sm text-[var(--muted-blue)]">{item.detail}</span>
          </span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {item.value}
        </span>
      </div>
    </Link>
  );
}
