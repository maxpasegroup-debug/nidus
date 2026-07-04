"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, ClipboardCheck, Crown, ShieldCheck } from "lucide-react";

import { assessmentCatalog } from "@/components/assessments/assessment-catalog";

const freeTests = assessmentCatalog.filter((assessment) => assessment.access !== "PREMIUM");
const premiumTests = assessmentCatalog.filter((assessment) => assessment.access === "PREMIUM");

function cleanTitle(title: string) {
  return title.replace("(TM)", "").replace("â„¢", "").trim();
}

export default function StudentAssessmentsPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Assessments</p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Defence readiness assessments.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">
              Complete officer readiness, OLQ, discipline, focus, leadership and career-fit assessments from your student dashboard.
            </p>
          </div>
          <Link href="/dashboard/student/progress" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-black text-white">
            <BrainCircuit className="h-5 w-5" /> Open NDP
          </Link>
        </div>
      </section>

      <AssessmentGrid title="Start here first" eyebrow="Free Tests" icon={ClipboardCheck} assessments={freeTests} />
      <AssessmentGrid title="Detailed reports" eyebrow="Premium Tests" icon={Crown} assessments={premiumTests} premium />
    </main>
  );
}

function AssessmentGrid({ title, eyebrow, icon: Icon, assessments, premium = false }: { title: string; eyebrow: string; icon: typeof ShieldCheck; assessments: typeof assessmentCatalog; premium?: boolean }) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
            <Icon className="h-5 w-5 text-[var(--gold)]" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{eyebrow}</p>
            <h2 className="mt-1 text-2xl font-black">{title}</h2>
          </div>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-sm font-black">{assessments.length} tests</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assessments.map((assessment) => {
          const AssessmentIcon = assessment.icon;
          return (
            <article key={assessment.id} className="flex min-h-56 flex-col rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                  <AssessmentIcon className="h-5 w-5 text-[var(--gold)]" />
                </div>
                <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black uppercase tracking-[0.12em]">
                  {premium ? "Premium" : "Free"}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-black leading-tight">{cleanTitle(assessment.title)}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-blue)]">{assessment.subtitle}</p>
              <Link href={`/psychometric/${assessment.id}`} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black text-[var(--ink)]">
                Start <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
