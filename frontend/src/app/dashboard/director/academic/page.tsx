"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  LineChart,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getAcademyBatches } from "@/services/academy";
import { useCourses } from "@/hooks/use-courses";
import { AcademicShell } from "./_components";
import { parseBatchAcademicPlanner, parseCourseDescription } from "./academic-planner-utils";

type Tone = "blue" | "green" | "gold" | "amber" | "rose";

const academicModules = [
  {
    label: "Programs",
    detail: "Courses, syllabus and academic planner",
    href: "/dashboard/director/academic/programs",
    icon: GraduationCap,
    tone: "gold",
  },
  {
    label: "Batches",
    detail: "Live classes, setup and student strength",
    href: "/dashboard/director/academic/batches",
    icon: Users,
    tone: "blue",
  },
  {
    label: "Timetable",
    detail: "Class schedule and teacher allocation",
    href: "/dashboard/director/academic/timetable",
    icon: CalendarDays,
    tone: "green",
  },
  {
    label: "Exams",
    detail: "Question papers, tests and results",
    href: "/dashboard/director/exams",
    icon: ClipboardCheck,
    tone: "rose",
  },
  {
    label: "Calendar",
    detail: "Events, milestones and academic dates",
    href: "/dashboard/director/teaching/academic-calendar",
    icon: BookOpenCheck,
    tone: "amber",
  },
] as const;

export default function DirectorAcademicDepartmentPage() {
  const coursesQuery = useCourses();
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });

  const courses = coursesQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const activeBatches = batches.filter((batch) => batch.status !== "ARCHIVED");
  const students = activeBatches.reduce((total, batch) => total + (batch._count?.students ?? batch.students?.length ?? 0), 0);
  const teachers = activeBatches.reduce((total, batch) => total + (batch._count?.teachers ?? batch.teachers?.length ?? 0), 0);
  const programsWithoutPlanner = courses.filter((course) => !parseCourseDescription(course).academicPlanner?.modules.length);
  const batchesWithoutPlanner = activeBatches.filter((batch) => !parseBatchAcademicPlanner(batch.schedule?.academicPlanner));
  const plannerIssues = programsWithoutPlanner.length + batchesWithoutPlanner.length;
  const loading = coursesQuery.isLoading || batchesQuery.isLoading;
  const aiMessage = loading
    ? "Nidus AI is checking programs, batches, planners and timetable readiness."
    : plannerIssues
      ? `Nidus AI found ${plannerIssues} academic setup item(s) needing attention. Complete planners before reviewing delivery.`
      : "Nidus AI sees a stable academic system. Programs, batches and planner setup look ready.";

  const healthCards = [
    { label: "Programs", value: courses.length, detail: programsWithoutPlanner.length ? `${programsWithoutPlanner.length} planner pending` : "planner ready", href: "/dashboard/director/academic/programs", icon: GraduationCap, tone: programsWithoutPlanner.length ? "amber" : "gold" },
    { label: "Batches", value: activeBatches.length, detail: batchesWithoutPlanner.length ? `${batchesWithoutPlanner.length} setup pending` : "running classes", href: "/dashboard/director/academic/batches", icon: Users, tone: batchesWithoutPlanner.length ? "amber" : "blue" },
    { label: "Students", value: students, detail: "active learners", href: "/dashboard/director/students", icon: Users, tone: "green" },
    { label: "Teachers", value: teachers, detail: "batch allocations", href: "/dashboard/director/academic/teachers", icon: BookOpenCheck, tone: "rose" },
  ] as const;

  const actionItems = [
    {
      title: programsWithoutPlanner.length ? "Complete program planners" : "Program planners ready",
      detail: programsWithoutPlanner.length ? `${programsWithoutPlanner.length} program(s) need syllabus planner setup.` : "No program planner issue is visible.",
      href: "/dashboard/director/academic/programs",
      value: programsWithoutPlanner.length,
      icon: GraduationCap,
      tone: programsWithoutPlanner.length ? "amber" : "green",
    },
    {
      title: batchesWithoutPlanner.length ? "Finish batch setup" : "Batches look ready",
      detail: batchesWithoutPlanner.length ? `${batchesWithoutPlanner.length} batch(es) need academic planner setup.` : "No batch setup issue is visible.",
      href: "/dashboard/director/academic/batches",
      value: batchesWithoutPlanner.length,
      icon: Users,
      tone: batchesWithoutPlanner.length ? "amber" : "green",
    },
    {
      title: "Review timetable health",
      detail: "Open timetable to verify live class schedule and teacher availability.",
      href: "/dashboard/director/academic/timetable",
      value: activeBatches.length,
      icon: CalendarDays,
      tone: "blue",
    },
  ] as const;

  const suggestions = [
    {
      title: plannerIssues ? "Fix setup before expansion" : "Review academic delivery rhythm",
      detail: plannerIssues ? "Nidus AI recommends completing planner setup before adding new batches." : "Academic setup is calm. Check timetable and exam rhythm next.",
      href: plannerIssues ? "/dashboard/director/academic/programs" : "/dashboard/director/academic/timetable",
    },
    {
      title: "Open live batches",
      detail: `${activeBatches.length} active batch(es) are running. Review strength, teachers and planner readiness.`,
      href: "/dashboard/director/academic/batches",
    },
    {
      title: "Check academic reports",
      detail: "Use reports for progress, attendance, exams and syllabus review.",
      href: "/dashboard/director/academic/reports",
    },
  ];

  return (
    <AcademicShell>
      <header className="shrink-0 px-1 pt-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Nidus AI Academics</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Academic Command</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Programs, batches, timetable, exams and calendar in one simple academic control panel.</p>
          </div>
          <Link href="/dashboard/director/academic/reports" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--navy)] px-4 text-sm font-black text-white shadow-sm">
            Academic Reports
          </Link>
        </div>
      </header>

      <section className="shrink-0 overflow-hidden rounded-3xl border border-[var(--gold-border)] bg-white/90 shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
          <div className="flex min-w-0 items-center gap-4 p-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#08223f] text-white shadow-sm"><BrainCircuit className="h-6 w-6" /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">Nidus AI Academic Briefing</p>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black ${plannerIssues ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{plannerIssues ? "Setup Needed" : "Stable"}</span>
              </div>
              <p className="mt-2 text-lg font-black leading-7 text-[var(--navy)]">{aiMessage}</p>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">Each academic card opens the exact module needed to act.</p>
            </div>
          </div>
          <div className="grid gap-2 border-t border-[var(--border)] bg-[var(--gold-soft)] p-4 lg:border-l lg:border-t-0">
            <BriefStat label="Programs" value={loading ? "..." : courses.length} />
            <BriefStat label="Batches" value={loading ? "..." : activeBatches.length} />
            <BriefStat label="Setup Items" value={loading ? "..." : plannerIssues} tone={plannerIssues ? "warn" : "ok"} />
          </div>
        </div>
      </section>

      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        {healthCards.map((item) => <AnalyticsCard key={item.label} {...item} value={loading ? "..." : item.value} tone={item.tone as Tone} />)}
      </section>

      <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[0.98fr_1.02fr]">
        <Panel title="Academic Actions" eyebrow="AI priority list">
          <div className="grid gap-3">
            {actionItems.map((item) => <ActionCard key={item.title} item={item} />)}
          </div>
        </Panel>

        <Panel title="Academic Modules" eyebrow="Click to open">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {academicModules.map((module) => <ModuleLink key={module.label} module={module} />)}
          </div>
          <div className="mt-4 grid gap-3">
            {suggestions.map((item) => <SuggestionLink key={item.title} {...item} />)}
          </div>
        </Panel>
      </section>
    </AcademicShell>
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
  const palette = tonePalette(tone);
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

function ActionCard({ item }: { item: { title: string; detail: string; href: string; value: number; icon: LucideIcon; tone: "green" | "amber" | "blue" } }) {
  const Icon = item.icon;
  const palette = actionPalette(item.tone);
  const ok = item.tone === "green";
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

function ModuleLink({ module }: { module: { label: string; detail: string; href: string; icon: LucideIcon; tone: string } }) {
  const Icon = module.icon;
  return (
    <Link href={module.href} className="rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)] hover:shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)] text-[var(--navy)]"><Icon className="h-4 w-4" /></span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black">{module.label}</span>
          <span className="mt-1 block truncate text-xs font-bold text-[var(--muted-blue)]">{module.detail}</span>
        </span>
      </div>
    </Link>
  );
}

function SuggestionLink({ detail, href, title }: { detail: string; href: string; title: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-[var(--border)] bg-white p-3 transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e8f1ff] text-[#123c6d]"><Sparkles className="h-4 w-4" /></span>
        <span className="min-w-0">
          <span className="block text-sm font-black">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--muted-blue)]">{detail}</span>
        </span>
      </div>
    </Link>
  );
}

function tonePalette(tone: Tone) {
  const styles: Record<Tone, { card: string; icon: string }> = {
    blue: { card: "border-[#c7dcf5] bg-[#f4f8ff]", icon: "bg-[#dcecff] text-[#123c6d]" },
    green: { card: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-100 text-emerald-800" },
    gold: { card: "border-[var(--gold-border)] bg-[var(--gold-soft)]", icon: "bg-white text-[var(--navy)]" },
    rose: { card: "border-rose-200 bg-rose-50", icon: "bg-rose-100 text-rose-800" },
    amber: { card: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-800" },
  };
  return styles[tone];
}

function actionPalette(tone: "green" | "amber" | "blue") {
  const styles = {
    green: { card: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-100 text-emerald-800", badge: "bg-emerald-100 text-emerald-800" },
    amber: { card: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-800", badge: "bg-amber-100 text-amber-800" },
    blue: { card: "border-[#c7dcf5] bg-[#f4f8ff]", icon: "bg-[#dcecff] text-[#123c6d]", badge: "bg-[#dcecff] text-[#123c6d]" },
  };
  return styles[tone];
}
