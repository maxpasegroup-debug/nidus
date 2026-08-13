"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, BookOpenCheck, ClipboardCheck, FileQuestion, PlayCircle, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getExaminationAnalytics } from "@/services/examination";
import { AcademicShell } from "../academic/_components";

type Tone = "blue" | "green" | "gold" | "rose" | "amber";

const primaryExamActions: Array<{ title: string; detail: string; href: string; icon: LucideIcon; tone: Tone; primary?: boolean }> = [
  { title: "Create Exam", detail: "Build a test and publish to batches", href: "/examination-center/exams", icon: ClipboardCheck, tone: "rose", primary: true },
  { title: "Question Bank", detail: "Create, review and organize questions", href: "/examination-center/question-bank", icon: FileQuestion, tone: "gold", primary: true },
  { title: "Published Exams", detail: "View scheduled, live and completed exams", href: "/examination-center/published", icon: PlayCircle, tone: "green", primary: true },
  { title: "Results", detail: "Review scores and submissions", href: "/examination-center/results", icon: Trophy, tone: "blue" },
  { title: "Analytics", detail: "Check performance and question quality", href: "/examination-center/analytics", icon: BarChart3, tone: "amber" },
  { title: "Full Exam Center", detail: "Open the complete examination workspace", href: "/examination-center", icon: BookOpenCheck, tone: "blue" },
];

const launchFlow = [
  "Prepare questions or import a paper",
  "Create exam settings",
  "Publish to selected batch",
  "Students attempt from CBT",
  "Review results and analytics",
];

export default function DirectorExamControlPage() {
  const analyticsQuery = useQuery({ queryKey: ["director", "examination-engine", "analytics"], queryFn: getExaminationAnalytics });
  const totals = analyticsQuery.data?.totals;
  const upcomingExams = analyticsQuery.data?.examBreakdown.filter((exam) => ["PUBLISHED", "SCHEDULED", "LIVE"].includes(String(exam.status || "").toUpperCase())).length ?? 0;
  const loading = analyticsQuery.isLoading;

  return (
    <AcademicShell>
      <header className="shrink-0 px-1 pt-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Nidus AI Exams</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Exam Control</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Create exams, manage question banks, publish tests and review results from one simple Director entry.</p>
          </div>
          <Link href="/dashboard/director/academic" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black shadow-sm">
            Academics Home
          </Link>
        </div>
      </header>

      <section className="shrink-0 rounded-3xl border border-[var(--gold-border)] bg-white/92 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#08223f] text-white"><Sparkles className="h-6 w-6" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">Nidus AI Exam Briefing</p>
              <p className="mt-2 text-lg font-black leading-7 text-[var(--navy)]">{loading ? "Nidus AI is checking exam health." : `${upcomingExams} upcoming exam(s), ${totals?.attempts ?? 0} attempt(s), and ${totals?.questionBank ?? totals?.questions ?? 0} question bank item(s) are visible.`}</p>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">This page is the simple Director doorway. The examination engine and CBT flow remain unchanged.</p>
            </div>
          </div>
          <div className="grid min-w-[280px] gap-2 sm:grid-cols-3 lg:w-[480px]">
            <MiniStat label="Exams" value={loading ? "..." : totals?.exams ?? 0} />
            <MiniStat label="Questions" value={loading ? "..." : totals?.questionBank ?? totals?.questions ?? 0} />
            <MiniStat label="Upcoming" value={loading ? "..." : upcomingExams} />
          </div>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Exam Actions" eyebrow="Start here">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {primaryExamActions.map((action) => <ActionCard key={action.title} action={action} />)}
          </div>
        </Panel>
        <Panel title="Nidus AI Exam Flow" eyebrow="Recommended path">
          <div className="grid gap-3">
            {launchFlow.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)] text-xs font-black text-[var(--navy)]">{index + 1}</span>
                <p className="text-sm font-black text-[var(--navy)]">{step}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
                <p className="text-sm font-bold leading-6 text-emerald-950">Students see exams only after a test is published to their batch.</p>
              </div>
            </div>
          </div>
        </Panel>
      </section>
    </AcademicShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--gold-soft)] px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p><p className="text-xl font-black text-[var(--navy)]">{value}</p></div>;
}

function Panel({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return <section className="min-h-0 rounded-3xl border border-[var(--border)] bg-white/86 p-4 shadow-sm"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{eyebrow}</p><h2 className="mt-1 text-lg font-black">{title}</h2><div className="mt-3 max-h-[58vh] overflow-y-auto pr-1">{children}</div></section>;
}

function ActionCard({ action }: { action: { title: string; detail: string; href: string; icon: LucideIcon; tone: Tone; primary?: boolean } }) {
  const Icon = action.icon;
  const palette = tonePalette(action.tone);
  return <Link href={action.href} className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${action.primary ? palette.card : "border-[var(--border)] bg-white"}`}><div className="flex items-start gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${palette.icon}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-sm font-black text-[var(--navy)]">{action.title}</span><span className="mt-1 block text-xs leading-5 text-[var(--muted-blue)]">{action.detail}</span></span></div></Link>;
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