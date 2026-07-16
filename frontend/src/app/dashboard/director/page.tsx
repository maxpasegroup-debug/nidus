"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  BadgeIndianRupee,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileArchive,
  FileText,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  Megaphone,
  MessageCircle,
  PhoneCall,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDirectorDashboard } from "@/services/dashboard";

type SubModule = {
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | number;
  muted?: boolean;
};

type Department = {
  title: string;
  icon: LucideIcon;
  href: string;
  tone: string;
  modules: SubModule[];
};

export default function DirectorDashboardPage() {
  const directorQuery = useQuery({ queryKey: ["dashboard", "director", "control-panel"], queryFn: getDirectorDashboard });
  const commandCenter = directorQuery.data?.commandCenter;
  const pendingAdmissions = commandCenter?.operationalAlerts.pendingAdmissions ?? 0;
  const pendingFees = commandCenter?.operationalAlerts.pendingFees ?? 0;
  const activeStudents = commandCenter?.students.active ?? directorQuery.data?.instituteAnalytics.students ?? 0;
  const staffCount =
    (commandCenter?.staff?.academicHeads.active ?? 0) +
    (commandCenter?.staff?.teachers.active ?? 0) +
    (commandCenter?.staff?.physicalTrainers.active ?? 0) +
    (commandCenter?.staff?.administrativeOfficers.active ?? 0) +
    (commandCenter?.staff?.businessDevelopmentExecutives.active ?? 0);

  const departments: Department[] = [
    {
      title: "Academics",
      icon: GraduationCap,
      href: "/dashboard/director/academic",
      tone: "bg-amber-50 text-amber-700",
      modules: [
        { label: "Academic Control", href: "/dashboard/director/academic", icon: Building2 },
        { label: "Timetable", href: "/dashboard/director/academic/timetable", icon: CalendarDays },
        { label: "Batches", href: "/dashboard/director/academic/batches", icon: Users },
        { label: "Teachers", href: "/dashboard/director/academic/teachers", icon: UserCheck },
        { label: "Students", href: "/dashboard/director/academic/student-progress", icon: BookOpen },
        { label: "Reports", href: "/dashboard/director/academic/reports", icon: BarChart3 },
        { label: "Materials", href: "/dashboard/director/materials", icon: FileArchive },
        { label: "Exams", href: "/dashboard/director/exams", icon: ClipboardCheck },
      ],
    },
    {
      title: "HRM",
      icon: UserCog,
      href: "/dashboard/director/hrm",
      tone: "bg-sky-50 text-sky-700",
      modules: [
        { label: "Add Employee", href: "/dashboard/director/management?mode=add", icon: UserPlus },
        { label: "Manage Staff", href: "/dashboard/director/management?mode=manage", icon: Users, badge: staffCount || undefined },
        { label: "Archive Staff", href: "/dashboard/director/management?mode=archive", icon: Archive },
        { label: "Lock Access", href: "/dashboard/director/management?mode=access", icon: LockKeyhole },
        { label: "Reset Password", href: "/dashboard/director/management?mode=access", icon: KeyRound },
        { label: "Roles", href: "/dashboard/director/management?mode=roles", icon: ShieldCheck },
      ],
    },
    {
      title: "Marketing & Sales",
      icon: Megaphone,
      href: "/dashboard/director/marketing-sales",
      tone: "bg-emerald-50 text-emerald-700",
      modules: [
        { label: "Telecallers", href: "/dashboard/business-development?tab=CALLING", icon: PhoneCall },
        { label: "BDE Team", href: "/dashboard/business-development?tab=TEAM", icon: Users },
        { label: "Sales Booster", href: "/dashboard/sales-booster", icon: Megaphone },
        { label: "Leads", href: "/dashboard/business-development?tab=LEADS", icon: ClipboardCheck },
        { label: "Follow-ups", href: "/dashboard/business-development?tab=FOLLOWUPS", icon: PhoneCall },
        { label: "Reports", href: "/dashboard/business-development?tab=REPORTS", icon: BarChart3 },
        { label: "WhatsApp", icon: MessageCircle, muted: true },
      ],
    },
    {
      title: "Admin & Accounts",
      icon: BadgeIndianRupee,
      href: "/dashboard/director/admin-accounts",
      tone: "bg-violet-50 text-violet-700",
      modules: [
        { label: "Admissions", href: "/dashboard/director/admissions", icon: UserPlus, badge: pendingAdmissions || undefined },
        { label: "Applications", href: "/dashboard/admission-cell#applications", icon: ClipboardCheck },
        { label: "Approvals", href: "/crm/admissions", icon: ClipboardCheck },
        { label: "Add Student", href: "/dashboard/admission-cell#activation", icon: PlusCircle },
        { label: "Finance", href: "/dashboard/director/accounts?mode=overview", icon: BadgeIndianRupee, badge: pendingFees || undefined },
        { label: "Email Report", href: "/dashboard/director/accounts?mode=reports", icon: Mail },
        { label: "Custom Report", href: "/dashboard/director/reports?mode=custom", icon: FileText },
        { label: "Accounts", href: "/dashboard/director/accounts?mode=invoices", icon: WalletCards },
      ],
    },
    {
      title: "Communication & Reports",
      icon: Bell,
      href: "/dashboard/director/notifications",
      tone: "bg-rose-50 text-rose-700",
      modules: [
        { label: "Notifications", href: "/dashboard/director/notifications", icon: Bell },
        { label: "Students", href: "/dashboard/director/notifications", icon: Users },
        { label: "Teachers", href: "/dashboard/director/notifications", icon: UserCheck },
        { label: "Batch Message", href: "/dashboard/director/notifications", icon: ClipboardCheck },
        { label: "Reports", href: "/dashboard/director/reports", icon: BarChart3 },
        { label: "Custom Report", href: "/dashboard/director/reports?mode=custom", icon: FileText },
      ],
    },
    {
      title: "Operations",
      icon: ShieldCheck,
      href: "/dashboard/director/launch-qa",
      tone: "bg-slate-100 text-slate-800",
      modules: [
        { label: "Teaching Mode", href: "/dashboard/director/teaching", icon: BookOpen },
        { label: "Classes", href: "/dashboard/director/teaching/classes", icon: GraduationCap },
        { label: "Attendance", href: "/dashboard/director/teaching/attendance", icon: ClipboardCheck },
        { label: "Launch QA", href: "/dashboard/director/launch-qa", icon: ShieldCheck },
        { label: "Full Reports", href: "/dashboard/director/reports", icon: BarChart3 },
      ],
    },
  ];

  return (
    <main className="flex min-h-[calc(100vh-var(--nav-height)-2rem)] flex-col overflow-hidden bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col gap-4">
        <header className="shrink-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_560px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director</p>
              <h1 className="mt-1 text-3xl font-black leading-tight md:text-4xl">NIDUS Control Panel</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">
                Main departments with direct submodule access. Open the exact control you need in one click.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Metric label="Admissions" value={directorQuery.isLoading ? "..." : pendingAdmissions} />
              <Metric label="Students" value={directorQuery.isLoading ? "..." : activeStudents} />
              <Metric label="Fees Due" value={directorQuery.isLoading ? "..." : pendingFees} />
            </div>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 lg:grid-cols-2">
          {departments.map((department) => (
            <DepartmentPanel key={department.title} department={department} />
          ))}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function DepartmentPanel({ department }: { department: Department }) {
  const Icon = department.icon;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <Link href={department.href} className="flex min-w-0 items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] ${department.tone}`}>
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="truncate text-2xl font-black">{department.title}</h2>
        </Link>
        <Link href={department.href} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-xs font-black uppercase tracking-[0.14em]">
          Open All
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {department.modules.map((module) => (
          <ModuleButton key={module.label} module={module} />
        ))}
      </div>
    </section>
  );
}

function ModuleButton({ module }: { module: SubModule }) {
  const Icon = module.icon;
  const content = (
    <>
      {module.badge ? <span className="absolute right-2 top-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700">{module.badge}</span> : null}
      <Icon className={`h-6 w-6 ${module.muted ? "text-[var(--muted-blue)]" : "text-[var(--navy)]"}`} />
      <span className="mt-3 text-center text-sm font-black leading-tight">{module.label}</span>
      {module.muted ? <span className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">Future API</span> : null}
    </>
  );
  const className = `relative flex min-h-24 flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
    module.muted
      ? "cursor-not-allowed border-dashed border-[var(--border)] bg-[var(--page-bg)] text-[var(--muted-blue)]"
      : "border-[var(--border)] bg-white hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)] hover:shadow-sm"
  }`;

  if (!module.href || module.muted) {
    return (
      <button type="button" disabled className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={module.href} className={className}>
      {content}
    </Link>
  );
}
