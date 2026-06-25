"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDirectorDashboard } from "@/services/dashboard";

type DirectorAction = {
  title: string;
  text: string;
  href: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "gold" | "red";
};

type DirectorDecision = {
  title: string;
  value: string | number;
  text: string;
  href: string;
  action: string;
  status: "clear" | "watch" | "urgent";
};

const primaryActions: DirectorAction[] = [
  {
    title: "Admissions",
    text: "Leads, applications, documents, fees and student activation.",
    href: "/dashboard/director/admissions",
    icon: UserPlus,
    tone: "green",
  },
  {
    title: "Academics",
    text: "Programs, batches, timetable, teachers, syllabus and reports.",
    href: "/dashboard/director/academic",
    icon: GraduationCap,
    tone: "gold",
  },
  {
    title: "Students",
    text: "Student progress, attendance, exam health and risk signals.",
    href: "/dashboard/director/academic/student-progress",
    icon: Users,
    tone: "blue",
  },
  {
    title: "Team",
    text: "Teachers, academic heads, trainers, staff roles and credentials.",
    href: "/dashboard/director/management",
    icon: UserCheck,
    tone: "blue",
  },
  {
    title: "Finance",
    text: "Collected fees, pending dues, receipts, expenses and accounts.",
    href: "/dashboard/director/accounts",
    icon: WalletCards,
    tone: "green",
  },
  {
    title: "Reports",
    text: "Academic, admissions, finance, staff and launch readiness reports.",
    href: "/dashboard/director/reports",
    icon: BarChart3,
    tone: "gold",
  },
  {
    title: "Launch QA",
    text: "Live readiness board for CRM, LMS, staff, finance, admissions and launch blockers.",
    href: "/dashboard/director/launch-qa",
    icon: ShieldCheck,
    tone: "green",
  },
  {
    title: "Teaching Mode",
    text: "Open your own classes, students, attendance, assignments, exams, library and live teaching tools.",
    href: "/dashboard/director/teaching",
    icon: BookOpen,
    tone: "blue",
  },
];

export default function DirectorDashboardPage() {
  const directorQuery = useQuery({ queryKey: ["dashboard", "director", "command-center"], queryFn: getDirectorDashboard });

  const director = directorQuery.data;
  const commandCenter = director?.commandCenter;
  const displayValue = (value: string | number | undefined | null) => directorQuery.isLoading ? "..." : value ?? 0;

  const attentionItems = useMemo(
    () => [
      {
        label: "Admissions waiting",
        value: commandCenter?.operationalAlerts.pendingAdmissions ?? 0,
        href: "/dashboard/director/admissions",
        action: "Open admissions",
      },
      {
        label: "Documents pending",
        value: commandCenter?.operationalAlerts.pendingDocuments ?? 0,
        href: "/dashboard/admission-cell#document-verification",
        action: "Verify documents",
      },
      {
        label: "Fees pending",
        value: commandCenter?.operationalAlerts.pendingFees ?? 0,
        href: "/dashboard/director/accounts",
        action: "Check accounts",
      },
      {
        label: "Batch allocation pending",
        value: commandCenter?.operationalAlerts.pendingBatchAllocation ?? 0,
        href: "/dashboard/director/academic/batches",
        action: "Allocate batch",
      },
      {
        label: "Low attendance alerts",
        value: commandCenter?.operationalAlerts.lowAttendanceAlerts ?? 0,
        href: "/dashboard/director/academic/student-progress",
        action: "Review students",
      },
      {
        label: "Exam publication delays",
        value: commandCenter?.operationalAlerts.examPublicationDelays ?? 0,
        href: "/dashboard/director/exams",
        action: "Review exams",
      },
    ],
    [commandCenter],
  );

  const todayMetrics = [
    { label: "Admissions", value: displayValue(commandCenter?.admissions.newLeads ?? director?.admissionsAnalytics.leads), hint: "new leads today" },
    { label: "Active Batches", value: displayValue(commandCenter?.academics.activeBatches ?? director?.academyArchitecture.batches), hint: "running now" },
    { label: "Students", value: displayValue(commandCenter?.students.active ?? director?.instituteAnalytics.students), hint: "active learners" },
    { label: "Pending Fees", value: directorQuery.isLoading ? "..." : `Rs ${(commandCenter?.finance.pendingFees ?? director?.revenueAnalytics.pending ?? 0).toLocaleString()}`, hint: "to collect" },
    { label: "Staff Available", value: displayValue((commandCenter?.staff.teachers.active ?? 0) + (commandCenter?.staff.physicalTrainers.active ?? 0)), hint: "teachers + trainers" },
    { label: "Critical Alerts", value: displayValue(attentionItems.filter((item) => item.value > 0).length), hint: "needs action" },
  ];

  const decisionBoard: DirectorDecision[] = [
    {
      title: "Admission follow-up",
      value: commandCenter?.admissions.newLeads ?? director?.admissionsAnalytics.leads ?? 0,
      text: "New enquiries and applications requiring counselling or AO action.",
      href: "/dashboard/director/admissions",
      action: "Review pipeline",
      status: (commandCenter?.admissions.newLeads ?? 0) > 0 ? "watch" : "clear",
    },
    {
      title: "Academic review",
      value: commandCenter?.academics.activeBatches ?? director?.academyArchitecture.batches ?? 0,
      text: "Active batches that should have classes, teachers, timetable and syllabus plans.",
      href: "/dashboard/director/academic",
      action: "Open academics",
      status: (commandCenter?.academics.activeBatches ?? 0) > 0 ? "clear" : "urgent",
    },
    {
      title: "Fee collection",
      value: `Rs ${(commandCenter?.finance.pendingFees ?? director?.revenueAnalytics.pending ?? 0).toLocaleString()}`,
      text: "Pending amount to be followed up by accounts/admission team.",
      href: "/dashboard/director/accounts",
      action: "Check fees",
      status: (commandCenter?.finance.pendingFees ?? director?.revenueAnalytics.pending ?? 0) > 0 ? "urgent" : "clear",
    },
    {
      title: "Team readiness",
      value: (commandCenter?.staff.teachers.active ?? 0) + (commandCenter?.staff.physicalTrainers.active ?? 0),
      text: "Teaching and training staff available for academic delivery.",
      href: "/dashboard/director/management",
      action: "Open team",
      status: ((commandCenter?.staff.teachers.active ?? 0) + (commandCenter?.staff.physicalTrainers.active ?? 0)) > 0 ? "clear" : "urgent",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-5 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        {directorQuery.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
            Director data could not be loaded. Please refresh after backend is online.
          </div>
        ) : null}

        <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-[var(--gold)]">Director Command Center</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Run NIDUS from one calm control room.</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted-blue)]">
                See admissions, academics, students, team, finance and reports without opening ten different admin screens.
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--muted-blue)]">
                Last updated: {director?.lastUpdatedAt ? new Date(director.lastUpdatedAt).toLocaleString() : directorQuery.isLoading ? "Loading..." : "Not available"}
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--gold)]">First Action Today</p>
              <h2 className="mt-3 text-2xl font-black">{nextAction(attentionItems)}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">Use the attention list first. Everything else is secondary.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {todayMetrics.map((metric) => (
            <MetricTile key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
          ))}
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Today's Operations</p>
              <h2 className="mt-2 text-2xl font-black">Director decision board</h2>
            </div>
            <p className="text-sm font-semibold text-[var(--muted-blue)]">Four checks before the day starts.</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {decisionBoard.map((decision) => (
              <DecisionCard key={decision.title} decision={decision} />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Attention</p>
              <h2 className="text-2xl font-black">What needs action now</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {attentionItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:border-[var(--gold-border)] hover:bg-white md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-black">{item.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.action}</p>
                </div>
                <span className={item.value > 0 ? "rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700" : "rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800"}>
                  {item.value}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {primaryActions.map((action) => (
            <CommandCard key={action.title} action={action} />
          ))}
        </section>

      </section>
    </main>
  );
}

function nextAction(items: Array<{ label: string; value: number }>) {
  const first = items.find((item) => item.value > 0);
  return first ? first.label : "Academy is clear";
}

function MetricTile({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--muted-blue)]">{hint}</p>
    </div>
  );
}

function DecisionCard({ decision }: { decision: DirectorDecision }) {
  const statusClass =
    decision.status === "urgent"
      ? "bg-red-100 text-red-800"
      : decision.status === "watch"
        ? "bg-amber-100 text-amber-800"
        : "bg-emerald-100 text-emerald-800";
  const statusText = decision.status === "urgent" ? "Action" : decision.status === "watch" ? "Watch" : "Clear";
  return (
    <Link href={decision.href} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:border-[var(--gold-border)] hover:bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[var(--muted-blue)]">{decision.title}</p>
          <p className="mt-2 text-3xl font-black">{decision.value}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>{statusText}</span>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--muted-blue)]">{decision.text}</p>
      <span className="mt-4 inline-flex rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">{decision.action}</span>
    </Link>
  );
}

function CommandCard({ action }: { action: DirectorAction }) {
  const Icon = action.icon;
  const toneClass =
    action.tone === "green"
      ? "bg-emerald-50 text-emerald-800"
      : action.tone === "gold"
        ? "bg-amber-50 text-amber-800"
        : action.tone === "red"
          ? "bg-red-50 text-red-800"
          : "bg-sky-50 text-sky-800";
  return (
    <Link href={action.href} className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-lg">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-2xl font-black">{action.title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted-blue)]">{action.text}</p>
      <span className="mt-5 inline-flex rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-black text-[var(--navy)]">Open</span>
    </Link>
  );
}
