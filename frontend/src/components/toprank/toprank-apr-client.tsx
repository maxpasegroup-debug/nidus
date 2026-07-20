"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { getTopRankAssessmentStatus } from "@/services/toprank-assessment-service";
import type { TopRankAssessmentStatus } from "@/types/toprank";
import { AssessmentSummary, CategoryScoreCard, ReadinessGauge, StrengthCard, WeaknessCard } from "./toprank-components";

function label(value: string) {
  return value.replace(/Score$/, "").replace(/([A-Z])/g, " $1").trim();
}

export function TopRankAPRClient() {
  const [status, setStatus] = useState<TopRankAssessmentStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTopRankAssessmentStatus().then(setStatus).catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  if (error) return <p className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-bold text-red-100">{error}</p>;
  if (!status?.apr) {
    return (
      <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-8 text-center">
        <h1 className="text-3xl font-black text-white">APR Not Ready</h1>
        <p className="mt-3 text-sm leading-6 text-[#b9c2b4]">Complete the diagnostic assessment to generate your Agnipath Preparation Record.</p>
        <Link href="/toprank/assessment" className="mt-6 inline-flex rounded-full bg-[#d6a447] px-6 py-3 text-sm font-black text-[#06120e]">Start Assessment</Link>
      </div>
    );
  }

  const apr = status.apr;
  const categories = [
    ["Academic Readiness", apr.academicScore],
    ["Physical Readiness", apr.physicalScore],
    ["Learning Readiness", apr.learningScore],
    ["Discipline Readiness", apr.disciplineScore],
    ["Career Clarity", apr.careerScore]
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ReadinessGauge score={apr.overallScore} />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#f6d17a]">TopRank APR</p>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">Agnipath Preparation Record</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#b9c2b4]">Your RC4 baseline shows who you are today, where you are strong, and where preparation must begin.</p>
          <div className="mt-6"><AssessmentSummary completedAt={apr.assessment?.completedAt ?? apr.createdAt} /></div>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map(([title, score]) => <CategoryScoreCard key={title} title={title} score={score} />)}
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <section>
          <h2 className="text-xl font-black text-white">Strengths</h2>
          <div className="mt-4 grid gap-3">{apr.strengths.length ? apr.strengths.map((item) => <StrengthCard key={item} title={label(item)} />) : <StrengthCard title="Baseline captured" />}</div>
        </section>
        <section>
          <h2 className="text-xl font-black text-white">Weaknesses</h2>
          <div className="mt-4 grid gap-3">{apr.weaknesses.length ? apr.weaknesses.map((item) => <WeaknessCard key={item} title={label(item)} />) : <StrengthCard title="No critical weakness" />}</div>
        </section>
        <section>
          <h2 className="text-xl font-black text-white">Improvement Areas</h2>
          <div className="mt-4 grid gap-3">{apr.improvementAreas.map((item) => <WeaknessCard key={item} title={label(item)} />)}</div>
        </section>
      </div>
    </div>
  );
}

