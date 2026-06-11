"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type BatchSummary = {
  id: string;
  name: string;
  status?: string | null;
  batchType?: string | null;
  _count?: {
    students?: number;
    teachers?: number;
  };
};

type CalendarSummary = {
  id: string;
  completionStatus?: string | null;
};

async function apiJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Unable to load management data");
  }

  return response.json() as Promise<T>;
}

const managementAreas = [
  {
    title: "Employee Control",
    label: "Management",
    description: "Add employees, generate credentials, assign dashboards, reset passwords and archive safely.",
    href: "/dashboard/director/management",
    icon: Users,
  },
  {
    title: "Academy",
    label: "Programs",
    description: "Create batches, plan courses, monitor offline and online academic delivery.",
    href: "/dashboard/director/academic",
    icon: GraduationCap,
  },
  {
    title: "Academic Department",
    label: "Planning",
    description: "Allocate teachers, publish calendars, and track syllabus status.",
    href: "/dashboard/director/academic",
    icon: CalendarDays,
  },
  {
    title: "Admission Cell",
    label: "Approvals",
    description: "Approve applicants, assign batches, and activate student dashboards.",
    href: "/dashboard/admission-cell",
    icon: ClipboardCheck,
  },
  {
    title: "Sales Booster",
    label: "Growth",
    description: "Campaigns, leads, creatives, WhatsApp follow-up and reports.",
    href: "/dashboard/sales-booster",
    icon: Megaphone,
  },
  {
    title: "TOPRANK",
    label: "Exam AI",
    description: "AI-powered exam coaching subscriptions and training access.",
    href: "/dashboard/toprank",
    icon: ShieldCheck,
  },
  {
    title: "NIDUS Guru",
    label: "Quests",
    description: "Recorded transformation quests and active learning programs.",
    href: "/dashboard/guru",
    icon: Sparkles,
  },
  {
    title: "Assessments",
    label: "Reports",
    description: "Psychometric attempts, student reports and readiness insights.",
    href: "/psychometric/reports",
    icon: BarChart3,
  },
  {
    title: "Team",
    label: "People",
    description: "Teachers, trainers, staff roles and department accountability.",
    href: "/staff-hr",
    icon: Users,
  },
  {
    title: "Finance",
    label: "Accounts",
    description: "Fees, subscriptions, invoices and payment tracking.",
    href: "/payments",
    icon: WalletCards,
  },
] as const;

export default function DirectorDashboardPage() {
  const batchesQuery = useQuery({ queryKey: ["management", "batches"], queryFn: () => apiJson<BatchSummary[]>("/api/academy/batches") });
  const calendarQuery = useQuery({
    queryKey: ["management", "academic-calendar"],
    queryFn: () => apiJson<CalendarSummary[]>("/api/academy/academic-calendar"),
  });

  const batches = batchesQuery.data ?? [];
  const calendar = calendarQuery.data ?? [];
  const studentCount = batches.reduce((total, batch) => total + (batch._count?.students ?? 0), 0);
  const teacherCount = batches.reduce((total, batch) => total + (batch._count?.teachers ?? 0), 0);
  const delayedItems = calendar.filter((item) => item.completionStatus === "RED").length;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Management</p>
          <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Company control room</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
                Manage Academy, Admissions, Academic Department, Sales Booster, TOPRANK, NIDUS Guru, Assessments, Team and Finance
                without demo numbers or confusing dashboards.
              </p>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg"
              href="/dashboard/director/academic"
            >
              Open Academic Department
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Active Batches" value={batches.filter((batch) => batch.status === "ACTIVE").length} icon={Building2} />
          <Metric label="Students In Batches" value={studentCount} icon={GraduationCap} />
          <Metric label="Teacher Allocations" value={teacherCount} icon={Users} />
          <Metric label="Delayed Calendar Items" value={delayedItems} icon={CalendarDays} />
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managementAreas.map((area) => (
            <ManagementCard key={area.title} area={area} />
          ))}
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Today</p>
          <h2 className="mt-2 text-2xl font-black">Live academic attention</h2>
          <div className="mt-5 grid gap-3">
            {delayedItems > 0 ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
                {delayedItems} academic calendar item{delayedItems === 1 ? "" : "s"} need management attention.
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted-blue)]">
                No delayed academic calendar item is reported right now.
              </div>
            )}
            {!batches.length && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4 text-sm text-[var(--muted-blue)]">
                No batches found. Start from Academic Department and create the first real batch.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/85 p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black text-[var(--navy)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function ManagementCard({ area }: { area: (typeof managementAreas)[number] }) {
  const Icon = area.icon;
  return (
    <Link className="group rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl" href={area.href}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{area.label}</p>
      <h3 className="mt-2 text-2xl font-black text-[var(--navy)]">{area.title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">{area.description}</p>
      <span className="mt-5 inline-flex font-black text-[var(--navy)]">Open area +</span>
    </Link>
  );
}
