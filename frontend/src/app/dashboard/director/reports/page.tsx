"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getAssignmentSummary,
  getAttendanceSummary,
  getExamSummary,
  getMaterialSummary,
  getStudentProgressSummary,
  getSyllabusSummary,
  getTeacherPerformanceSummary,
} from "@/services/academy";
import { getAdmissions, getApprovals, getLeads } from "@/services/crm";
import { getDirectorDashboard } from "@/services/dashboard";
import { getFees, getPaymentAnalytics } from "@/services/payments";

export default function DirectorReportsPage() {
  const directorQuery = useQuery({ queryKey: ["director", "reports", "command"], queryFn: getDirectorDashboard });
  const leadsQuery = useQuery({ queryKey: ["director", "reports", "leads"], queryFn: () => getLeads() });
  const admissionsQuery = useQuery({ queryKey: ["director", "reports", "admissions"], queryFn: getAdmissions });
  const approvalsQuery = useQuery({ queryKey: ["director", "reports", "approvals"], queryFn: getApprovals });
  const attendanceQuery = useQuery({ queryKey: ["director", "reports", "attendance"], queryFn: () => getAttendanceSummary() });
  const assignmentsQuery = useQuery({ queryKey: ["director", "reports", "assignments"], queryFn: () => getAssignmentSummary() });
  const examsQuery = useQuery({ queryKey: ["director", "reports", "exams"], queryFn: () => getExamSummary() });
  const materialsQuery = useQuery({ queryKey: ["director", "reports", "materials"], queryFn: () => getMaterialSummary() });
  const syllabusQuery = useQuery({ queryKey: ["director", "reports", "syllabus"], queryFn: () => getSyllabusSummary() });
  const teachersQuery = useQuery({ queryKey: ["director", "reports", "teacher-performance"], queryFn: getTeacherPerformanceSummary });
  const studentsQuery = useQuery({ queryKey: ["director", "reports", "student-progress"], queryFn: getStudentProgressSummary });
  const financeQuery = useQuery({ queryKey: ["director", "reports", "payment-analytics"], queryFn: getPaymentAnalytics });
  const feesQuery = useQuery({ queryKey: ["director", "reports", "fees"], queryFn: getFees });

  const director = directorQuery.data;
  const command = director?.commandCenter;
  const attendance = attendanceQuery.data?.summary;
  const assignments = assignmentsQuery.data?.summary;
  const exams = examsQuery.data?.summary;
  const materials = materialsQuery.data?.summary;
  const syllabus = syllabusQuery.data?.summary;
  const finance = financeQuery.data;
  const pendingFees = (feesQuery.data ?? []).filter((fee) => fee.paidStatus !== "PAID");
  const activeStudents = command?.students.active ?? 0;
  const activeTeachers = command?.academics.teachers ?? 0;
  const physicalTrainers = command?.staff.physicalTrainers.active ?? 0;

  const reportCards = [
    {
      title: "Admissions",
      icon: ClipboardCheck,
      href: "/dashboard/director/admissions",
      metrics: [
        { label: "Leads", value: leadsQuery.data?.length ?? 0 },
        { label: "Admissions", value: admissionsQuery.data?.length ?? 0 },
        { label: "Approvals", value: approvalsQuery.data?.length ?? 0 },
      ],
    },
    {
      title: "Academics",
      icon: GraduationCap,
      href: "/dashboard/director/academic",
      metrics: [
        { label: "Batches", value: command?.academics.activeBatches ?? 0 },
        { label: "Today Classes", value: command?.learning.liveClasses ?? 0 },
        { label: "Syllabus", value: `${syllabus?.completionPercentage ?? 0}%` },
      ],
    },
    {
      title: "Students",
      icon: Users,
      href: "/dashboard/director/academic/student-progress",
      metrics: [
        { label: "Active", value: activeStudents },
        { label: "Batch Reports", value: studentsQuery.data?.batches.length ?? 0 },
        { label: "Low Attendance", value: command?.operationalAlerts.lowAttendanceAlerts ?? 0 },
      ],
    },
    {
      title: "Team",
      icon: ShieldCheck,
      href: "/dashboard/director/management",
      metrics: [
        { label: "Teachers", value: activeTeachers },
        { label: "Academic Heads", value: command?.staff.academicHeads.active ?? 0 },
        { label: "Physical Trainers", value: physicalTrainers },
      ],
    },
    {
      title: "Finance",
      icon: WalletCards,
      href: "/dashboard/director/accounts",
      metrics: [
        { label: "Collected", value: `Rs ${(finance?.monthlyRevenue ?? 0).toLocaleString()}` },
        { label: "Pending", value: `Rs ${(finance?.pendingDues ?? 0).toLocaleString()}` },
        { label: "Open Fees", value: pendingFees.length },
      ],
    },
    {
      title: "Learning",
      icon: BookOpen,
      href: "/dashboard/director/academic/reports",
      metrics: [
        { label: "Assignments", value: assignments?.assignments ?? 0 },
        { label: "Exams", value: exams?.exams ?? 0 },
        { label: "Library", value: materials?.total ?? 0 },
      ],
    },
  ];

  const readiness = [
    {
      title: "Admissions readiness",
      value: approvalsQuery.data?.length ? "Action" : "Clear",
      text: "No pending approval queue means AO workflow is calm.",
      tone: approvalsQuery.data?.length ? "warn" : "ok",
    },
    {
      title: "Academic readiness",
      value: `${syllabus?.completionPercentage ?? 0}%`,
      text: "Syllabus progress comes from real teacher progress records.",
      tone: (syllabus?.completionPercentage ?? 0) >= 70 ? "ok" : "warn",
    },
    {
      title: "Attendance readiness",
      value: `${attendance?.percentage ?? 0}%`,
      text: "Academy attendance health based on marked sessions.",
      tone: (attendance?.percentage ?? 0) >= 75 ? "ok" : "warn",
    },
    {
      title: "Assessment readiness",
      value: exams?.exams ?? 0,
      text: "Published and scheduled exam records available for monitoring.",
      tone: exams?.exams ? "ok" : "warn",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Director Reports</p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_0.35fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Academy report room.</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
                Live reports for admissions, academics, students, team, finance and learning. This page is built for weekly review and launch certification.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Last Updated</p>
              <p className="mt-2 text-sm font-black">{director?.lastUpdatedAt ? new Date(director.lastUpdatedAt).toLocaleString() : "Live data loading"}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reportCards.map((card) => (
            <ReportCard key={card.title} card={card} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Panel title="Launch readiness" eyebrow="Certification">
            <div className="grid gap-3">
              {readiness.map((item) => (
                <ReadinessRow key={item.title} item={item} />
              ))}
            </div>
          </Panel>

          <Panel title="Director action list" eyebrow="Today">
            <div className="grid gap-3">
              <ActionLink title="Clear admission queue" text="Review leads, approvals, documents and fees." href="/dashboard/director/admissions" value={command?.operationalAlerts.pendingAdmissions ?? 0} />
              <ActionLink title="Review fee pressure" text="Open pending dues and overdue fees." href="/dashboard/director/accounts" value={pendingFees.length} />
              <ActionLink title="Check teacher delivery" text="Open faculty performance and class logs." href="/dashboard/director/academic/teacher-performance" value={teachersQuery.data?.teachers.length ?? 0} />
              <ActionLink title="Run launch QA" text="Open the final module checklist before public launch." href="/dashboard/director/launch-qa" value="QA" />
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function ReportCard({ card }: { card: { title: string; href: string; icon: LucideIcon; metrics: Array<{ label: string; value: string | number }> } }) {
  const Icon = card.icon;
  return (
    <Link href={card.href} className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
          <Icon className="h-6 w-6 text-[var(--navy)]" />
        </div>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">Open</span>
      </div>
      <h2 className="mt-5 text-2xl font-black">{card.title}</h2>
      <div className="mt-5 grid gap-2">
        {card.metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-3">
            <span className="text-sm text-[var(--muted-blue)]">{metric.label}</span>
            <span className="font-black">{metric.value}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ReadinessRow({ item }: { item: { title: string; value: string | number; text: string; tone: string } }) {
  const Icon = item.tone === "ok" ? CheckCircle2 : AlertTriangle;
  const toneClass = item.tone === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Icon className="mt-1 h-5 w-5 shrink-0 text-[var(--gold)]" />
          <div>
            <p className="font-black">{item.title}</p>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.text}</p>
          </div>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-black ${toneClass}`}>{item.value}</span>
      </div>
    </div>
  );
}

function ActionLink({ title, text, href, value }: { title: string; text: string; href: string; value: string | number }) {
  return (
    <Link href={href} className="rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--gold-border)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{text}</p>
        </div>
        <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-sm font-black">{value}</span>
      </div>
    </Link>
  );
}
