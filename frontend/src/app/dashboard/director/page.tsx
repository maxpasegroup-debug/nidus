"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  BadgeIndianRupee,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Camera,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Globe2,
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

type ControlAction = {
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | number;
  muted?: boolean;
};

type ControlGroup = {
  title: string;
  icon: LucideIcon;
  tone: string;
  actions: ControlAction[];
};

export default function DirectorDashboardPage() {
  const directorQuery = useQuery({ queryKey: ["dashboard", "director", "control-panel"], queryFn: getDirectorDashboard });
  const director = directorQuery.data;
  const commandCenter = director?.commandCenter;

  const pendingAdmissions = commandCenter?.operationalAlerts.pendingAdmissions ?? 0;
  const pendingFees = commandCenter?.operationalAlerts.pendingFees ?? 0;
  const studentRisks = commandCenter?.operationalAlerts.lowAttendanceAlerts ?? 0;
  const batchIssues = commandCenter?.operationalAlerts.pendingBatchAllocation ?? 0;
  const staffCount = (commandCenter?.staff.teachers.active ?? 0) + (commandCenter?.staff.physicalTrainers.active ?? 0);
  const activeStudents = commandCenter?.students.active ?? director?.instituteAnalytics.students ?? 0;

  const groups: ControlGroup[] = [
    {
      title: "Academics",
      icon: GraduationCap,
      tone: "bg-amber-50 text-amber-800",
      actions: [
        { label: "Academic Control", href: "/dashboard/director/academic", icon: Building2 },
        { label: "Timetable", href: "/dashboard/director/academic/timetable", icon: CalendarDays },
        { label: "Batches", href: "/dashboard/director/academic/batches", icon: Users, badge: batchIssues || undefined },
        { label: "Teachers", href: "/dashboard/director/academic/teachers", icon: UserCheck },
        { label: "Students", href: "/dashboard/director/academic/student-progress", icon: BookOpen, badge: studentRisks || undefined },
        { label: "Reports", href: "/dashboard/director/academic/reports", icon: BarChart3 },
      ],
    },
    {
      title: "HRM",
      icon: UserCog,
      tone: "bg-sky-50 text-sky-800",
      actions: [
        { label: "Add Employee", href: "/dashboard/director/management", icon: UserPlus },
        { label: "Manage Staff", href: "/dashboard/director/management", icon: Users, badge: staffCount || undefined },
        { label: "Archive Staff", href: "/dashboard/director/management", icon: Archive },
        { label: "Lock Access", href: "/admin-center/users", icon: LockKeyhole },
        { label: "Reset Password", href: "/admin-center/users", icon: KeyRound },
        { label: "Roles", href: "/admin-center/roles", icon: ShieldCheck },
      ],
    },
    {
      title: "Marketing & Sales",
      icon: Megaphone,
      tone: "bg-emerald-50 text-emerald-800",
      actions: [
        { label: "Telecallers", href: "/dashboard/business-development", icon: PhoneCall },
        { label: "BDE Team", href: "/dashboard/business-development", icon: Users },
        { label: "Sales Booster", href: "/dashboard/sales-booster", icon: Megaphone },
        { label: "Leads", href: "/crm/leads", icon: ClipboardCheck },
        { label: "Instagram", icon: Camera, muted: true },
        { label: "Facebook", icon: Globe2, muted: true },
        { label: "WhatsApp", icon: MessageCircle, muted: true },
        { label: "Campaign Reports", href: "/dashboard/director/reports", icon: BarChart3 },
      ],
    },
    {
      title: "Admin & Accounts",
      icon: WalletCards,
      tone: "bg-violet-50 text-violet-800",
      actions: [
        { label: "Admissions", href: "/dashboard/director/admissions", icon: UserPlus, badge: pendingAdmissions || undefined },
        { label: "Approvals", href: "/crm/admissions", icon: ClipboardCheck },
        { label: "Add Student", href: "/dashboard/admission-cell#activation", icon: PlusCircle },
        { label: "Admission Cell", href: "/dashboard/admission-cell", icon: Building2 },
        { label: "Finance", href: "/dashboard/director/accounts", icon: BadgeIndianRupee, badge: pendingFees || undefined },
        { label: "Email Report", href: "/dashboard/director/accounts", icon: Mail },
        { label: "Custom Report", href: "/dashboard/director/reports", icon: FileText },
        { label: "Accounts", href: "/dashboard/director/accounts", icon: WalletCards },
      ],
    },
  ];

  return (
    <main className="min-h-screen overflow-y-auto bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] lg:h-[calc(100vh-80px)] lg:min-h-0 lg:overflow-hidden lg:px-6">
      <section className="mx-auto flex h-full max-w-7xl flex-col gap-4">
        <header className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director</p>
              <h1 className="mt-1 text-2xl font-black md:text-3xl">NIDUS Control Panel</h1>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[560px]">
              <StatusPill label="Admissions" value={directorQuery.isLoading ? "..." : pendingAdmissions} />
              <StatusPill label="Students" value={directorQuery.isLoading ? "..." : activeStudents} />
              <StatusPill label="Fees Due" value={directorQuery.isLoading ? "..." : pendingFees} />
            </div>
          </div>
        </header>

        {directorQuery.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
            Director data could not be loaded. Buttons are still available.
          </div>
        ) : null}

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <ControlPanel key={group.title} group={group} />
          ))}
        </section>
      </section>
    </main>
  );
}

function StatusPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}

function ControlPanel({ group }: { group: ControlGroup }) {
  const Icon = group.icon;
  return (
    <section className="min-h-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${group.tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black">{group.title}</h2>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
        {group.actions.map((action) => (
          <ControlButton key={`${group.title}-${action.label}`} action={action} />
        ))}
      </div>
    </section>
  );
}

function ControlButton({ action }: { action: ControlAction }) {
  const Icon = action.icon;
  const className = `relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border px-3 text-center text-sm font-black transition ${
    action.muted
      ? "border-dashed border-[var(--border)] bg-[var(--page-bg)] text-[var(--muted-blue)]"
      : "border-[var(--border)] bg-white hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]"
  }`;

  const content = (
    <>
      {action.badge ? <span className="absolute right-2 top-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700">{action.badge}</span> : null}
      <Icon className="h-6 w-6" />
      <span>{action.label}</span>
      {action.muted ? <span className="text-[10px] uppercase tracking-[0.16em]">Future API</span> : null}
    </>
  );

  if (!action.href || action.muted) {
    return (
      <button type="button" disabled className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={action.href} className={className}>
      {content}
    </Link>
  );
}
