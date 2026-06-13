"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileArchive,
  FileText,
  GraduationCap,
  KeyRound,
  Megaphone,
  MessageCircle,
  PieChart,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDirectorDashboard } from "@/services/dashboard";
import { getAssignmentSummary, getAttendanceSummary, getExamSummary, getMaterialSummary, getSyllabusSummary } from "@/services/academy";

type DirectorSubArea = {
  title: string;
  text: string;
  href: string;
  icon: LucideIcon;
  status?: "Ready" | "Manage" | "Monitor";
};

type DirectorArea = {
  title: string;
  label: string;
  text: string;
  icon: LucideIcon;
  accent: string;
  subAreas: DirectorSubArea[];
};

const directorAreas: DirectorArea[] = [
  {
    title: "Academics",
    label: "Courses, batches and teaching",
    text: "Plan programs, assign teachers, prepare timetables and track syllabus progress.",
    icon: GraduationCap,
    accent: "from-amber-200 via-white to-emerald-100",
    subAreas: [
      { title: "Programs & Courses", text: "Manage Academy programs and course structure.", href: "/dashboard/director/academic#programs", icon: BookOpen, status: "Ready" },
      { title: "Batches", text: "Create offline, online, crash and foundation batches.", href: "/dashboard/director/academic#batches", icon: Users, status: "Ready" },
      { title: "Timetable Planner", text: "Plan weekly class schedules and teacher calendars.", href: "/dashboard/director/academic#calendar", icon: CalendarDays, status: "Ready" },
      { title: "Teacher Allocation", text: "Assign subject teachers and trainers to batches.", href: "/dashboard/director/academic#teacher-allocation", icon: UserCheck, status: "Ready" },
      { title: "Syllabus Tracker", text: "Track topic completion with green, orange and red status.", href: "/dashboard/director/academic#tracker", icon: BarChart3, status: "Ready" },
      { title: "Exams & Tests", text: "Create, approve, publish and monitor exams.", href: "/dashboard/director/exams", icon: ClipboardCheck, status: "Ready" },
      { title: "Study Materials", text: "Control notes, recorded classes and batch library.", href: "/dashboard/director/materials", icon: FileArchive, status: "Ready" },
      { title: "Student Progress", text: "Review batch-wise and student-wise academic progress.", href: "/dashboard/director/academic#progress", icon: PieChart, status: "Monitor" },
    ],
  },
  {
    title: "Admission Cell",
    label: "Enquiries to admissions",
    text: "Convert enquiries into students and assign them to the right batch.",
    icon: ClipboardCheck,
    accent: "from-sky-100 via-white to-amber-100",
    subAreas: [
      { title: "New Enquiries", text: "Website, WhatsApp, calls, social media and walk-in leads.", href: "/dashboard/admission-cell#enquiries", icon: MessageCircle, status: "Manage" },
      { title: "Applications", text: "Students who applied for Academy programs.", href: "/dashboard/admission-cell#applications", icon: FileText, status: "Ready" },
      { title: "Counselling", text: "Parent discussion, student needs and course suggestions.", href: "/dashboard/admission-cell#counselling", icon: Users, status: "Manage" },
      { title: "Admission Approval", text: "Approve application and activate student dashboard.", href: "/dashboard/admission-cell", icon: ShieldCheck, status: "Ready" },
      { title: "Fee Follow-Up", text: "Pending fee reminders and payment coordination.", href: "/fees", icon: BadgeIndianRupee, status: "Manage" },
      { title: "Documents", text: "Student documents, ID proof and academic details.", href: "/dashboard/admission-cell#documents", icon: FileArchive, status: "Manage" },
      { title: "Admission Reports", text: "Course-wise admissions and conversion status.", href: "/dashboard/admission-cell#reports", icon: BarChart3, status: "Monitor" },
    ],
  },
  {
    title: "Advertisement & Marketing",
    label: "Campaigns and growth",
    text: "Run campaigns, manage creatives, track leads and marketing performance.",
    icon: Megaphone,
    accent: "from-orange-100 via-white to-green-100",
    subAreas: [
      { title: "Sales Booster", text: "AI campaign creation and marketing automation.", href: "/dashboard/marketing", icon: Sparkles, status: "Ready" },
      { title: "Campaigns", text: "Academy, TOPRANK, NIDUS Guru and assessment campaigns.", href: "/dashboard/marketing", icon: Megaphone, status: "Manage" },
      { title: "Creative Library", text: "Posters, videos, brochures and reels.", href: "/media-library", icon: FileArchive, status: "Manage" },
      { title: "Social Media", text: "Facebook, Instagram, Threads and YouTube posting.", href: "/dashboard/marketing", icon: MessageCircle, status: "Manage" },
      { title: "WhatsApp Campaigns", text: "Bulk messages, templates and counsellor routing.", href: "/dashboard/marketing", icon: MessageCircle, status: "Manage" },
      { title: "Campaign Leads", text: "Track campaign-wise leads and source quality.", href: "/crm/leads", icon: UserPlus, status: "Monitor" },
      { title: "Marketing Reports", text: "Reach, engagement, conversion and best creatives.", href: "/dashboard/marketing", icon: BarChart3, status: "Monitor" },
    ],
  },
  {
    title: "HRM",
    label: "Employees and team",
    text: "Create employees, generate credentials, assign roles and archive safely.",
    icon: Users,
    accent: "from-emerald-100 via-white to-slate-100",
    subAreas: [
      { title: "Employee Control", text: "Add teachers, heads, trainers, admin and staff.", href: "/dashboard/director/management", icon: UserPlus, status: "Ready" },
      { title: "Credentials", text: "Generate login, reset password and manage access.", href: "/dashboard/director/management", icon: KeyRound, status: "Ready" },
      { title: "Roles & Departments", text: "Assign role, department, dashboard and access level.", href: "/dashboard/director/management", icon: ShieldCheck, status: "Ready" },
      { title: "Full-Time / Part-Time / Hourly", text: "Manage employment type and hourly trainers.", href: "/dashboard/director/management", icon: Users, status: "Ready" },
      { title: "Attendance & Leave", text: "Staff attendance, leave and approvals.", href: "/dashboard/director/management#attendance", icon: CalendarDays, status: "Manage" },
      { title: "Performance Review", text: "Class completion, student feedback and staff output.", href: "/dashboard/director/management#performance", icon: PieChart, status: "Monitor" },
      { title: "Archive History", text: "Archive employees safely instead of deleting.", href: "/dashboard/director/management", icon: FileArchive, status: "Ready" },
    ],
  },
  {
    title: "Admin & Accounts",
    label: "Finance and operations",
    text: "Monitor payments, invoices, expenses, subscriptions, reports and system settings.",
    icon: WalletCards,
    accent: "from-slate-100 via-white to-amber-100",
    subAreas: [
      { title: "Fee Management", text: "Course fees, student payments and pending dues.", href: "/fees", icon: BadgeIndianRupee, status: "Ready" },
      { title: "Invoices & Receipts", text: "Generate and track payment receipts.", href: "/invoices", icon: ReceiptText, status: "Ready" },
      { title: "Expenses", text: "Office, salary, rent, marketing and operations.", href: "/dashboard/director/accounts#expenses", icon: CreditCard, status: "Manage" },
      { title: "Subscriptions", text: "TOPRANK, assessments and premium module subscriptions.", href: "/subscriptions", icon: WalletCards, status: "Ready" },
      { title: "Reports & Launch QA", text: "Academic, admissions, marketing, finance, staff reports and launch checklist.", href: "/dashboard/director/launch-qa", icon: BarChart3, status: "Ready" },
      { title: "Settings", text: "Company details, contact number and system controls.", href: "/dashboard/director/accounts#settings", icon: Settings, status: "Ready" },
      { title: "Audit Logs", text: "Track important staff and management actions.", href: "/admin-center/audit-logs", icon: FileText, status: "Monitor" },
    ],
  },
];

export default function DirectorDashboardPage() {
  const [selectedArea, setSelectedArea] = useState<DirectorArea>(directorAreas[0]);
  const SelectedIcon = selectedArea.icon;
  const directorQuery = useQuery({ queryKey: ["dashboard", "director", "command-room"], queryFn: getDirectorDashboard });
  const attendanceQuery = useQuery({ queryKey: ["academy", "attendance-summary", "director-command"], queryFn: () => getAttendanceSummary() });
  const assignmentQuery = useQuery({ queryKey: ["academy", "assignment-summary", "director-command"], queryFn: () => getAssignmentSummary() });
  const materialQuery = useQuery({ queryKey: ["academy", "material-summary", "director-command"], queryFn: () => getMaterialSummary() });
  const examQuery = useQuery({ queryKey: ["academy", "exam-summary", "director-command"], queryFn: () => getExamSummary() });
  const syllabusQuery = useQuery({ queryKey: ["academy", "syllabus-summary", "director-command"], queryFn: () => getSyllabusSummary() });
  const director = directorQuery.data;
  const areaMetrics = metricsForArea(selectedArea.title, {
    director,
    attendance: attendanceQuery.data?.summary,
    assignments: assignmentQuery.data?.summary,
    materials: materialQuery.data?.summary,
    exams: examQuery.data?.summary,
    syllabus: syllabusQuery.data?.summary,
  });

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white/90 shadow-xl">
          <div className="relative p-6 md:p-10">
            <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] md:block" />
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Director Command Room</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              Manage the whole company from five clear areas.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
              A simple glossy control room for Academics, Admission Cell, Advertisement & Marketing, HRM, and Admin & Accounts.
            </p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <CommandMetric label="Students" value={director?.instituteAnalytics.students ?? 0} />
          <CommandMetric label="Teachers" value={director?.instituteAnalytics.teachers ?? 0} />
          <CommandMetric label="Admissions" value={director?.admissionsAnalytics.admissions ?? 0} />
          <CommandMetric label="Collected" value={`Rs ${(director?.revenueAnalytics.collected ?? 0).toLocaleString()}`} />
          <CommandMetric label="Academic Completion" value={`${syllabusQuery.data?.summary.completionPercentage ?? 0}%`} />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {directorAreas.map((area) => {
            const Icon = area.icon;
            const active = selectedArea.title === area.title;
            return (
              <button
                key={area.title}
                className={`group min-h-48 rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:p-5 ${
                  active ? "border-[var(--gold-border)] bg-white shadow-xl" : "border-[var(--border)] bg-white/80"
                }`}
                onClick={() => setSelectedArea(area)}
                type="button"
              >
                <div className={`h-full rounded-2xl bg-gradient-to-br ${area.accent} p-4 shadow-inner`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/70 shadow-sm">
                    <Icon className="h-6 w-6 text-[var(--navy)]" />
                  </div>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{area.label}</p>
                  <h2 className="mt-2 text-xl font-black text-[var(--navy)] md:text-2xl">{area.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-blue)]">{area.text}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-xl md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Selected Area</p>
              <div className="mt-3 flex items-center gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedArea.accent} shadow-inner`}>
                  <SelectedIcon className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-black">{selectedArea.title}</h2>
                  <p className="text-sm text-[var(--muted-blue)]">{selectedArea.text}</p>
                </div>
              </div>
            </div>
            <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">
              {selectedArea.subAreas.length} controls
            </span>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {selectedArea.subAreas.map((subArea) => (
              <SubAreaCard key={subArea.title} subArea={subArea} />
            ))}
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {areaMetrics.map((metric) => (
              <CommandMetric key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

type MetricContext = {
  director?: Awaited<ReturnType<typeof getDirectorDashboard>>;
  attendance?: { percentage: number; sessions: number };
  assignments?: { assignments: number; pending: number; submitted: number };
  materials?: { total: number; pendingReview: number; approved: number };
  exams?: { exams: number; liveTests: number; submitted: number; averageScore: number };
  syllabus?: { completionPercentage: number; green: number; orange: number; red: number };
};

function metricsForArea(title: string, context: MetricContext) {
  if (title === "Academics") {
    return [
      { label: "Programs", value: context.director?.academyArchitecture.programs ?? 0 },
      { label: "Batches", value: context.director?.academyArchitecture.batches ?? 0 },
      { label: "Live Tests", value: context.exams?.liveTests ?? context.director?.academyArchitecture.liveTests ?? 0 },
      { label: "Syllabus", value: `${context.syllabus?.completionPercentage ?? 0}%` },
    ];
  }
  if (title === "Admission Cell") {
    return [
      { label: "Leads", value: context.director?.admissionsAnalytics.leads ?? 0 },
      { label: "Admissions", value: context.director?.admissionsAnalytics.admissions ?? 0 },
      { label: "Conversion", value: `${context.director?.admissionsAnalytics.conversionRate ?? 0}%` },
      { label: "Students", value: context.director?.instituteAnalytics.students ?? 0 },
    ];
  }
  if (title === "Advertisement & Marketing") {
    return [
      { label: "Campaign Leads", value: context.director?.admissionsAnalytics.leads ?? 0 },
      { label: "Admissions", value: context.director?.admissionsAnalytics.admissions ?? 0 },
      { label: "Conversion", value: `${context.director?.admissionsAnalytics.conversionRate ?? 0}%` },
      { label: "Forecast", value: `Rs ${(context.director?.revenueAnalytics.forecast ?? 0).toLocaleString()}` },
    ];
  }
  if (title === "HRM") {
    return [
      { label: "Faculty", value: context.director?.facultyAnalytics.active ?? 0 },
      { label: "Utilization", value: `${context.director?.facultyAnalytics.utilization ?? 0}%` },
      { label: "Review Due", value: context.director?.facultyAnalytics.reviewDue ?? 0 },
      { label: "Attendance", value: `${context.attendance?.percentage ?? 0}%` },
    ];
  }
  return [
    { label: "Collected", value: `Rs ${(context.director?.revenueAnalytics.collected ?? 0).toLocaleString()}` },
    { label: "Pending", value: `Rs ${(context.director?.revenueAnalytics.pending ?? 0).toLocaleString()}` },
    { label: "Forecast", value: `Rs ${(context.director?.revenueAnalytics.forecast ?? 0).toLocaleString()}` },
    { label: "Transactions", value: context.exams?.submitted ?? 0 },
  ];
}

function CommandMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[var(--navy)]">{value}</p>
    </div>
  );
}

function SubAreaCard({ subArea }: { subArea: DirectorSubArea }) {
  const Icon = subArea.icon;
  const status = subArea.status ?? "Ready";
  const statusClass =
    status === "Ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "Manage"
        ? "border-orange-200 bg-orange-50 text-orange-800"
        : "border-sky-200 bg-sky-50 text-sky-800";
  return (
    <Link
      className="group rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
      href={subArea.href}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] shadow-inner">
          <Icon className="h-6 w-6 text-[var(--navy)]" />
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${statusClass}`}>
          {status}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-black text-[var(--navy)]">{subArea.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{subArea.text}</p>
      <span className="mt-5 inline-flex font-black text-[var(--navy)]">Open +</span>
    </Link>
  );
}
