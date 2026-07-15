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
import { AcademicHero, AcademicShell, Panel } from "../academic/_components";

const examControls = [
  {
    title: "Question Bank",
    text: "Create, review and organize questions by defence exam, subject, topic and difficulty.",
    href: "/examination-center/question-bank",
    icon: FileQuestion,
    status: "Ready",
  },
  {
    title: "Create Exam",
    text: "Build weekly tests, mock tests, scholarship exams and defence practice exams.",
    href: "/examination-center/exams",
    icon: ClipboardCheck,
    status: "Ready",
  },
  {
    title: "Published Exams",
    text: "View exams already published or scheduled for batches.",
    href: "/examination-center/published",
    icon: PlayCircle,
    status: "Ready",
  },
  {
    title: "Results",
    text: "Review student scores, pass/fail status and submitted exam reports.",
    href: "/examination-center/results",
    icon: Trophy,
    status: "Ready",
  },
  {
    title: "Analytics",
    text: "Check batch, topic, question and difficulty-level performance.",
    href: "/examination-center/analytics",
    icon: BarChart3,
    status: "Review",
  },
  {
    title: "Student Exam Access",
    text: "Students see only exams assigned to their approved batch from the student dashboard.",
    href: "/dashboard/student/exams",
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
    <AcademicShell>
      <AcademicHero
        eyebrow="Examination Center"
        title="Exam Control"
        description="Create question banks, publish exams to batches, allow students to attempt tests and review results from one clean Director control room."
        action={
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--navy)] shadow-lg" href="/examination-center">
              Exam Center
            </Link>
            <Link className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black" href="/examination-center/question-bank">
              Question Bank
            </Link>
          </div>
        }
      />

        <section className="grid min-h-0 flex-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {examControls.map((control) => (
            <ExamCard key={control.title} control={control} />
          ))}
        </section>

        <Panel title="How exams should run" eyebrow="Launch Flow">
          <div className="grid max-h-[32vh] gap-3 overflow-y-auto pr-1">
            {launchFlow.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold-gradient)] text-sm font-black text-[var(--navy)]">
                  {index + 1}
                </div>
                <p className="font-bold">{step}</p>
              </div>
            ))}
          </div>
        </Panel>

        <section className="shrink-0 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 shadow-sm">
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
    </AcademicShell>
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
      className="group rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md"
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
      <h2 className="mt-4 text-xl font-black">{control.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{control.text}</p>
      <span className="mt-4 inline-flex font-black text-[var(--navy)]">Open +</span>
    </Link>
  );
}
