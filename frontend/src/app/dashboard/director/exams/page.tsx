"use client";

import Link from "next/link";
import {
  BarChart3,
  ClipboardCheck,
  FileQuestion,
  GraduationCap,
  ListChecks,
  PlayCircle,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const examControls = [
  {
    title: "Question Bank",
    text: "Create, review and organize questions by defence exam, subject, topic and difficulty.",
    href: "/question-bank",
    icon: FileQuestion,
    status: "Ready",
  },
  {
    title: "Create Exam",
    text: "Build weekly tests, mock tests, scholarship exams and defence practice exams.",
    href: "/exams",
    icon: ClipboardCheck,
    status: "Ready",
  },
  {
    title: "Published Exams",
    text: "View exams already published or scheduled for batches.",
    href: "/published",
    icon: PlayCircle,
    status: "Ready",
  },
  {
    title: "Results",
    text: "Review student scores, pass/fail status and submitted exam reports.",
    href: "/results",
    icon: Trophy,
    status: "Ready",
  },
  {
    title: "Analytics",
    text: "Check batch, topic, question and difficulty-level performance.",
    href: "/analytics",
    icon: BarChart3,
    status: "Review",
  },
  {
    title: "Student Exam Access",
    text: "Students see only exams assigned to their approved batch from the student dashboard.",
    href: "/dashboard/student#exams",
    icon: GraduationCap,
    status: "Ready",
  },
] as const;

const launchFlow = [
  "Add or import questions in Question Bank",
  "Create an exam and choose exam settings",
  "Publish the exam to selected batch",
  "Student opens dashboard and starts exam",
  "System generates result after submission",
  "Director and Academic Head review results and analytics",
];

export default function DirectorExamControlPage() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Examination Center</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Exam command for Academy batches</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            Create question banks, publish exams to batches, allow students to attempt tests and review results from one clean
            Director control room.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg" href="/examination-center">
              Open Examination Center
            </Link>
            <Link className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black" href="/question-bank">
              Open Question Bank
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {examControls.map((control) => (
            <ExamCard key={control.title} control={control} />
          ))}
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Launch Flow</p>
          <h2 className="mt-2 text-2xl font-black">How exams should run</h2>
          <div className="mt-5 grid gap-3">
            {launchFlow.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold-gradient)] text-sm font-black text-[var(--navy)]">
                  {index + 1}
                </div>
                <p className="font-bold">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[var(--gold)]" />
            <div>
              <h2 className="text-2xl font-black">Production note</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">
                Students see exams only after a teacher or academic manager publishes a live CBT test to their batch.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function ExamCard({ control }: { control: { title: string; text: string; href: string; icon: LucideIcon; status: string } }) {
  const Icon = control.icon;
  const statusClass =
    control.status === "Ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-sky-200 bg-sky-50 text-sky-800";

  return (
    <Link
      className="group rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
      href={control.href}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
          <Icon className="h-6 w-6 text-[var(--navy)]" />
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${statusClass}`}>
          {control.status}
        </span>
      </div>
      <h2 className="mt-5 text-2xl font-black">{control.title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">{control.text}</p>
      <span className="mt-5 inline-flex font-black text-[var(--navy)]">Open +</span>
    </Link>
  );
}
