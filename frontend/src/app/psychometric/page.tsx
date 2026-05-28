"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Crown, ShieldCheck } from "lucide-react";
import { assessmentCatalog } from "@/components/assessments/assessment-catalog";

const freeTests = assessmentCatalog.filter((assessment) => assessment.access !== "PREMIUM");
const premiumTests = assessmentCatalog.filter((assessment) => assessment.access === "PREMIUM");

function cleanTitle(title: string) {
  return title.replace("(TM)", "").replace("™", "").trim();
}

function AssessmentCard({ assessment, premium = false }: { assessment: (typeof assessmentCatalog)[number]; premium?: boolean }) {
  const Icon = assessment.icon;
  const next = `/psychometric/${assessment.id}`;
  return (
    <article className="flex min-h-60 flex-col rounded-lg border border-[#b9913f]/45 bg-white p-5 text-[#071d36] shadow-[0_16px_44px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f] hover:shadow-[0_22px_56px_rgba(185,145,63,0.16)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded border border-[#b9913f]/35 bg-[#fff7de] text-[#8a6426]">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-[#b9913f]/35 bg-[#fff7de] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#071d36]">
          {premium ? "Rs 499" : "Free"}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-semibold leading-tight text-[#071d36]">{cleanTitle(assessment.title)}</h3>
      <p className="mt-3 text-sm leading-6 text-[#40516a]">{assessment.subtitle}</p>
      <Link href={`/register?intent=assessment&next=${encodeURIComponent(next)}`} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-4 py-3 text-sm font-semibold text-[#071d36] shadow-[0_12px_28px_rgba(185,145,63,0.18)] transition hover:brightness-105">
        Start <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export default function PsychometricPage() {
  return (
    <div className="bg-[#fffdf8] pt-20 text-[#071d36]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.16),transparent_28rem),radial-gradient(circle_at_82%_14%,rgba(63,74,50,0.12),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto max-w-7xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#b9913f]/40 bg-white text-[#8a6426] shadow-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">NIDUS Assessments</p>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">
            Check Your Eligibility for a Defence Career
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#40516a]">
            Simple tests to understand officer readiness, confidence, discipline, focus, and the right defence path.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="#free-tests" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-5 py-3 text-sm font-semibold text-[#071d36] shadow-[0_14px_34px_rgba(185,145,63,0.22)] transition hover:brightness-105">
              Start Free Test <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/register?intent=assessment" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#071d36]/14 bg-white px-5 py-3 text-sm font-semibold text-[#071d36] shadow-sm transition hover:-translate-y-0.5">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      <section id="free-tests" className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-6 w-6 text-[#8a6426]" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Free Tests</p>
              </div>
              <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Start here first</h2>
            </div>
            <p className="text-sm font-semibold text-[#40516a]">{freeTests.length} free assessments</p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {freeTests.map((assessment) => <AssessmentCard key={assessment.id} assessment={assessment} />)}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-[#8a6426]" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Premium Tests</p>
              </div>
              <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Detailed reports for serious aspirants</h2>
            </div>
            <p className="text-sm font-semibold text-[#40516a]">Rs 499 per premium assessment</p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {premiumTests.map((assessment) => <AssessmentCard key={assessment.id} assessment={assessment} premium />)}
          </div>
        </div>
      </section>
    </div>
  );
}
