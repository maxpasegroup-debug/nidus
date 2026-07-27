"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeIndianRupee,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
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
      title: pendingAdmissions ? "Clear admission approvals" : "Admissions are clear",
      detail: pendingAdmissions ? `${pendingAdmissions} admission item(s) need review.` : "No admission approval queue is visible.",
      href: "/dashboard/director/admissions",
      value: pendingAdmissions,
      icon: UserPlus,
      tone: pendingAdmissions ? "warn" : "ok",
    },
    {
      title: pendingFees ? "Review pending fees" : "Fee alerts are clear",
      detail: pendingFees ? `${pendingFees} fee item(s) need collection follow-up.` : "No fee alert is visible.",
      href: "/dashboard/director/accounts?tab=dues",
      value: pendingFees,
      icon: BadgeIndianRupee,
      tone: pendingFees ? "warn" : "ok",
    },
    {
      title: lowAttendance ? "Check student attendance" : "Attendance looks calm",
      detail: lowAttendance ? `${lowAttendance} attendance alert(s) need academic follow-up.` : "No low-attendance alert is visible.",
      href: "/dashboard/director/students",
      value: lowAttendance,
      icon: AlertTriangle,
      tone: lowAttendance ? "warn" : "ok",
    },
  ] as const;

  const modules = [
    { title: "Academics", detail: "Programs, batches, timetable and progress", href: "/dashboard/director/academic", icon: GraduationCap },
    { title: "Admissions", detail: "Applications, approvals and activation", href: "/dashboard/director/admissions", icon: UserPlus },
    { title: "Students", detail: "Class-wise student profiles and reports", href: "/dashboard/director/students", icon: Users },
    { title: "Staff & Access", detail: "Staff details, roles and PIN reset", href: "/dashboard/director/management", icon: ShieldCheck },
    { title: "Accounts", detail: "Collections, receipts and pending fees", href: "/dashboard/director/accounts", icon: BadgeIndianRupee },
    { title: "Reports", detail: "Simple director review desk", href: "/dashboard/director/reports", icon: BarChart3 },
    { title: "Readiness", detail: "Ready, attention and blocked launch items", href: "/dashboard/director/launch-qa", icon: CheckCircle2 },
  ] as const;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto grid max-w-[1500px] gap-4">
        <header className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm md:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director Dashboard</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">Today's Academy</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Start with urgent work, then open the department you want to review.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm font-bold text-[var(--muted-blue)]">
                <CalendarDays className="h-4 w-4" />
                {dateLabel}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <HeaderButton href="/dashboard/director/notifications" icon={Bell} label="Notifications" />
              <HeaderButton href="/dashboard/settings" icon={Settings} label="Settings" />
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <MetricCard label="Students" value={directorQuery.isLoading ? "..." : activeStudents} detail="active learners" />
          <MetricCard label="Batches" value={directorQuery.isLoading ? "..." : activeBatches} detail="running classes" />
          <MetricCard label="Faculty" value={directorQuery.isLoading ? "..." : facultyCount} detail={`${staffCount} total staff`} />
          <MetricCard label="Alerts" value={directorQuery.isLoading ? "..." : alerts} detail="items to review" tone={alerts ? "warn" : "ok"} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Today's Action List" eyebrow="Start here">
            <div className="grid gap-3">
              {actionItems.map((item) => (
                <ActionRow key={item.title} item={item} />
              ))}
            </div>
          </Panel>

          <Panel title="Open a Department" eyebrow="Main menu">
            <div className="grid gap-3 sm:grid-cols-2">
              {modules.map((module) => (
                <ModuleTile key={module.title} module={module} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <MiniPanel title="Academic Snapshot" icon={GraduationCap}>
            <MiniLine label="Active batches" value={activeBatches} />
            <MiniLine label="Faculty" value={facultyCount} />
            <MiniLink href="/dashboard/director/academic" label="Open academics" />
          </MiniPanel>
          <MiniPanel title="Finance Snapshot" icon={BadgeIndianRupee}>
            <MiniLine label="Fee alerts" value={pendingFees} />
            <MiniLine label="Pending review" value={pendingFees ? "Yes" : "No"} />
            <MiniLink href="/dashboard/director/accounts" label="Open accounts" />
          </MiniPanel>
          <MiniPanel title="Communication" icon={Bell}>
            <MiniLine label="Notifications" value="Ready" />
            <MiniLine label="Audience" value="Staff / students / parents" />
            <MiniLink href="/dashboard/director/notifications" label="Send message" />
          </MiniPanel>
        </section>
      </section>
    </main>
  );
}

function HeaderButton({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black shadow-sm hover:border-[var(--gold-border)]">
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MetricCard({ detail, label, tone = "ok", value }: { detail: string; label: string; tone?: "ok" | "warn"; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{detail}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {tone === "ok" ? "OK" : "Check"}
        </span>
      </div>
    </div>
  );
}

function Panel({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ActionRow({
  item,
}: {
  item: {
    title: string;
    detail: string;
    href: string;
    value: number;
    icon: LucideIcon;
    tone: "ok" | "warn";
  };
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)]">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-black">{item.title}</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--muted-blue)]">{item.detail}</span>
          </span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${item.tone === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {item.value}
        </span>
      </div>
    </Link>
  );
}

function ModuleTile({ module }: { module: { title: string; detail: string; href: string; icon: LucideIcon } }) {
  const Icon = module.icon;
  return (
    <Link href={module.href} className="flex min-h-20 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{module.title}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--muted-blue)]">{module.detail}</span>
      </span>
    </Link>
  );
}

function MiniPanel({ children, icon: Icon, title }: { children: ReactNode; icon: LucideIcon; title: string }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gold-soft)]">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-black">{title}</h2>
      </div>
      <div className="mt-4 grid gap-2">{children}</div>
    </section>
  );
}

function MiniLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2">
      <span className="text-sm font-bold text-[var(--muted-blue)]">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}

function MiniLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mt-1 inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black hover:border-[var(--gold-border)]">
      {label}
    </Link>
  );
}
