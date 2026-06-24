"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeIndianRupee,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  KeyRound,
  Megaphone,
  PieChart,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDirectorDashboard } from "@/services/dashboard";
import { getAssignmentSummary, getAttendanceSummary, getExamSummary, getMaterialSummary, getSyllabusSummary } from "@/services/academy";

type DirectorAction = {
  title: string;
  text: string;
  href: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "gold" | "red";
};

const primaryActions: DirectorAction[] = [
  {
    title: "Admissions",
    text: "Leads, applications, documents, fees and student activation.",
    href: "/dashboard/admission-cell",
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
    href: "/dashboard/director/academic/reports",
    icon: BarChart3,
    tone: "gold",
  },
];

export default function DirectorDashboardPage() {
  const directorQuery = useQuery({ queryKey: ["dashboard", "director", "command-center"], queryFn: getDirectorDashboard });
  const attendanceQuery = useQuery({ queryKey: ["academy", "attendance-summary", "director"], queryFn: () => getAttendanceSummary() });
  const assignmentQuery = useQuery({ queryKey: ["academy", "assignment-summary", "director"], queryFn: () => getAssignmentSummary() });
  const materialQuery = useQuery({ queryKey: ["academy", "material-summary", "director"], queryFn: () => getMaterialSummary() });
  const examQuery = useQuery({ queryKey: ["academy", "exam-summary", "director"], queryFn: () => getExamSummary() });
  const syllabusQuery = useQuery({ queryKey: ["academy", "syllabus-summary", "director"], queryFn: () => getSyllabusSummary() });

  const director = directorQuery.data;
  const commandCenter = director?.commandCenter;
  const attendance = attendanceQuery.data?.summary;
  const assignments = assignmentQuery.data?.summary;
  const materials = materialQuery.data?.summary;
  const exams = examQuery.data?.summary;
  const syllabus = syllabusQuery.data?.summary;

  const attentionItems = useMemo(
    () => [
      {
        label: "Admissions waiting",
        value: commandCenter?.operationalAlerts.pendingAdmissions ?? 0,
        href: "/dashboard/admission-cell",
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
    { label: "Admissions", value: commandCenter?.admissions.newLeads ?? director?.admissionsAnalytics.leads ?? 0, hint: "new leads" },
    { label: "Active Batches", value: commandCenter?.academics.activeBatches ?? director?.academyArchitecture.batches ?? 0, hint: "running now" },
    { label: "Teachers", value: commandCenter?.academics.teachers ?? director?.instituteAnalytics.teachers ?? 0, hint: "academic faculty" },
    { label: "Students", value: commandCenter?.students.active ?? director?.instituteAnalytics.students ?? 0, hint: "active learners" },
    { label: "Pending Fees", value: `Rs ${(commandCenter?.finance.pendingFees ?? director?.revenueAnalytics.pending ?? 0).toLocaleString()}`, hint: "to collect" },
    { label: "Syllabus", value: `${syllabus?.completionPercentage ?? 0}%`, hint: "completion" },
  ];

  const healthRows = [
    { label: "Admissions", value: director?.admissionsAnalytics.conversionRate ?? 0, suffix: "%", text: "lead to admission conversion" },
    { label: "Attendance", value: attendance?.percentage ?? director?.instituteAnalytics.attendance ?? 0, suffix: "%", text: "academy attendance" },
    { label: "Assignments", value: completionPercent(assignments?.submitted ?? 0, assignments?.totalExpected ?? 0), suffix: "%", text: "homework submission" },
    { label: "Exams", value: exams?.averageScore ?? director?.instituteAnalytics.cbtCompletion ?? 0, suffix: "%", text: "exam performance" },
    { label: "Library", value: materials?.published ?? materials?.approved ?? 0, suffix: "", text: "published learning items" },
    { label: "Revenue", value: completionPercent(director?.revenueAnalytics.collected ?? 0, (director?.revenueAnalytics.collected ?? 0) + (director?.revenueAnalytics.pending ?? 0)), suffix: "%", text: "fee collection health" },
  ];

  const staffRows = [
    ["Academic Heads", commandCenter?.staff.academicHeads.active ?? 0],
    ["Teachers", commandCenter?.staff.teachers.active ?? director?.facultyAnalytics.active ?? 0],
    ["Physical Trainers", commandCenter?.staff.physicalTrainers.active ?? 0],
    ["Admission Officers", commandCenter?.staff.administrativeOfficers.active ?? 0],
    ["BDE Team", commandCenter?.staff.businessDevelopmentExecutives.active ?? 0],
  ] as const;

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

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Attention</p>
                <h2 className="text-2xl font-black">What needs action now</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
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
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Academy Health</p>
            <h2 className="mt-2 text-2xl font-black">Operational score lanes</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {healthRows.map((row) => (
                <HealthLane key={row.label} label={row.label} value={row.value} suffix={row.suffix} text={row.text} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {primaryActions.map((action) => (
            <CommandCard key={action.title} action={action} />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Team</p>
            <h2 className="mt-2 text-2xl font-black">People running the academy</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {staffRows.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <p className="text-sm font-black text-[var(--muted-blue)]">{label}</p>
                  <p className="mt-2 text-3xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Students</p>
            <h2 className="mt-2 text-2xl font-black">Program spread</h2>
            <div className="mt-5 space-y-3">
              {(commandCenter?.students.batchDistribution ?? []).slice(0, 6).map((item) => (
                <div key={item.program} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
                  <span className="font-black">{item.program}</span>
                  <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-sm font-black">{item.count}</span>
                </div>
              ))}
              {!(commandCenter?.students.batchDistribution ?? []).length ? (
                <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-4 text-sm font-semibold text-[var(--muted-blue)]">
                  Student distribution appears here after batch allocation.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Director Manual</p>
          <h2 className="mt-2 text-2xl font-black">How to use this dashboard</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ManualCard icon={ShieldCheck} title="Start With Attention" text="Clear pending admissions, fees, batch allocation, low attendance and exam delays before reviewing reports." />
            <ManualCard icon={GraduationCap} title="Check Academics" text="Open Academics for batches, timetable, syllabus, teacher allocation, exams and learning materials." />
            <ManualCard icon={WalletCards} title="Watch Money" text="Use Finance to monitor collected fees, pending dues, receipts and operational expenses." />
            <ManualCard icon={KeyRound} title="Control Access" text="Use Team to create staff, reset passwords, unlock accounts, assign roles and archive employees." />
          </div>
        </section>
      </section>
    </main>
  );
}

function completionPercent(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
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

function HealthLane({ label, value, suffix, text }: { label: string; value: number; suffix: string; text: string }) {
  const capped = Math.max(0, Math.min(100, value));
  const color = capped >= 75 ? "bg-emerald-600" : capped >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black">{label}</p>
        <span className="font-black">{value}{suffix}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${capped}%` }} />
      </div>
      <p className="mt-2 text-sm text-[var(--muted-blue)]">{text}</p>
    </div>
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

function ManualCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <Icon className="h-6 w-6 text-[var(--navy)]" />
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
    </div>
  );
}
