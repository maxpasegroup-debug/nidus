"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, Brain, CheckCircle2, ClipboardCheck, Compass, MessageCircle, ShieldCheck, Sparkles, Target, TrendingUp, UserRoundCheck } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { NidusGeneratedReport } from "@/components/psychometric/nidus-ai-assessment-engine";

function scoreBand(score: number) {
  if (score >= 90) return { label: "Elite Zone", color: "#b9913f", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" };
  if (score >= 75) return { label: "Green Zone", color: "#059669", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" };
  if (score >= 60) return { label: "Yellow Zone", color: "#ca8a04", bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-300" };
  if (score >= 45) return { label: "Orange Zone", color: "#ea580c", bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-300" };
  return { label: "Red Zone", color: "#dc2626", bg: "bg-red-50", text: "text-red-800", border: "border-red-300" };
}

function PremiumPanel({ eyebrow, title, children, action }: { eyebrow?: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#d8d2c3] bg-white p-5 shadow-[0_20px_60px_rgba(7,29,54,0.08)] md:p-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9a6f22]">{eyebrow}</p> : null}
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#071d36] md:text-3xl">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ScoreRing({ score, level }: { score: number; level: string }) {
  const band = scoreBand(score);
  return (
    <div className="rounded-3xl border border-[#071d36]/10 bg-[#071d36] p-6 text-center text-white shadow-[0_24px_70px_rgba(7,29,54,0.22)]">
      <div className="mx-auto grid h-48 w-48 place-items-center rounded-full" style={{ background: `conic-gradient(${band.color} ${score * 3.6}deg, rgba(255,255,255,0.12) 0deg)` }}>
        <div className="grid h-36 w-36 place-items-center rounded-full bg-[#fffdf8] text-[#071d36]">
          <div>
            <p className="text-5xl font-black">{score}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-[#9a6f22]">Readiness</p>
          </div>
        </div>
      </div>
      <p className="mt-5 text-2xl font-black">{level}</p>
      <p className={`mx-auto mt-3 inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${band.bg} ${band.text} ${band.border}`}>{band.label}</p>
    </div>
  );
}

function ReportHero({ report }: { report: NidusGeneratedReport }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#071d36]/10 bg-[#071d36] text-white shadow-[0_30px_90px_rgba(7,29,54,0.25)]">
      <div className="grid gap-8 p-6 md:p-9 lg:grid-cols-[1fr_280px] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.42em] text-[#e7c873]">NIDUS Defence Assessment Report</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">Expert readiness interpretation</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/76">{report.executiveSummary ?? report.simpleMeaning}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black">{report.level}</span>
            <span className="rounded-full border border-[#e7c873]/35 bg-[#e7c873]/15 px-4 py-2 text-sm font-black text-[#e7c873]">{report.reportConfidence ?? "Report confidence improves with more attempts"}</span>
          </div>
        </div>
        <ScoreRing score={report.score} level={report.level} />
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof ClipboardCheck }) {
  return (
    <div className="rounded-2xl border border-[#d8d2c3] bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[#9a6f22]" />
      <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-[#64748b]">{label}</p>
      <p className="mt-2 text-xl font-black leading-7 text-[#071d36]">{value}</p>
    </div>
  );
}

function ReadinessRadar({ report }: { report: NidusGeneratedReport }) {
  const data = (report.dimensionScores ?? []).slice(0, 8).map((dimension) => ({
    trait: dimension.label.replace(" and ", " & "),
    value: dimension.score,
  }));

  if (!data.length) {
    return <div className="rounded-2xl border border-dashed border-[#d8d2c3] bg-[#fffdf8] p-6 text-sm text-[#64748b]">Radar chart will appear after enough dimension signals are captured.</div>;
  }

  return (
    <div className="h-[420px] rounded-2xl border border-[#d8d2c3] bg-[#fffdf8] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#d8d2c3" />
          <PolarAngleAxis dataKey="trait" tick={{ fill: "#071d36", fontSize: 11, fontWeight: 700 }} />
          <Radar dataKey="value" stroke="#b9913f" fill="#b9913f" fillOpacity={0.28} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function InsightList({ items, tone = "neutral" }: { items?: string[]; tone?: "neutral" | "good" | "risk" | "gold" }) {
  const classes = {
    neutral: "border-[#d8d2c3] bg-[#fffdf8] text-[#334155]",
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    risk: "border-orange-200 bg-orange-50 text-orange-950",
    gold: "border-amber-200 bg-amber-50 text-amber-950",
  }[tone];
  return (
    <div className="grid gap-3">
      {(items?.length ? items : ["No signal available yet."]).map((item) => (
        <div key={item} className={`rounded-2xl border px-4 py-3 text-sm font-semibold leading-6 ${classes}`}>
          {item}
        </div>
      ))}
    </div>
  );
}

function DimensionCard({ dimension }: { dimension: NonNullable<NidusGeneratedReport["dimensionInsights"]>[number] }) {
  const band = scoreBand(dimension.score);
  return (
    <article className="rounded-2xl border border-[#d8d2c3] bg-[#fffdf8] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-[#071d36]">{dimension.label}</h3>
          <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${band.bg} ${band.text} ${band.border}`}>{band.label}</p>
        </div>
        <p className="text-2xl font-black text-[#071d36]">{dimension.score}</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full" style={{ width: `${dimension.score}%`, background: band.color }} />
      </div>
      <p className="mt-4 text-sm leading-7 text-[#334155]">{dimension.interpretation}</p>
      <p className="mt-4 rounded-xl border border-[#b9913f]/25 bg-[#fff7de] p-3 text-sm font-bold leading-6 text-[#6f4d16]">{dimension.action}</p>
    </article>
  );
}

export function NidusAiReportView({ report }: { report: NidusGeneratedReport }) {
  return (
    <div className="space-y-7 text-[#071d36]">
      <ReportHero report={report} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Overall Score" value={`${report.score}/100`} icon={ClipboardCheck} />
        <MetricCard label="Readiness Level" value={report.level} icon={UserRoundCheck} />
        <MetricCard label="Next Assessment" value={report.recommendedNextTest} icon={Target} />
        <MetricCard label="Guru Quest" value={report.recommendedGuruQuest} icon={Sparkles} />
      </section>

      <PremiumPanel eyebrow="Consulting Summary" title="What this report says about you">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[#d8d2c3] bg-[#fffdf8] p-5">
            <p className="text-base leading-8 text-[#26364d]">{report.simpleMeaning}</p>
            <div className="mt-5 rounded-2xl border border-[#b9913f]/25 bg-[#fff7de] p-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9a6f22]">Behaviour Pattern</p>
              <p className="mt-2 text-sm font-semibold leading-7 text-[#6f4d16]">{report.behaviourPattern}</p>
            </div>
          </div>
          <div className="grid gap-3">
            <InsightList items={report.strengths.slice(0, 3)} tone="good" />
            <InsightList items={report.improvementAreas.slice(0, 3)} tone="risk" />
          </div>
        </div>
      </PremiumPanel>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <PremiumPanel eyebrow="Visual Projection" title="Readiness radar">
          <ReadinessRadar report={report} />
        </PremiumPanel>
        <PremiumPanel eyebrow="Interpretation Map" title="Core dimensions">
          <div className="space-y-4">
            {(report.dimensionScores ?? []).slice(0, 8).map((dimension) => {
              const band = scoreBand(dimension.score);
              return (
                <div key={dimension.dimension}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-black">{dimension.label}</span>
                    <span className="font-black" style={{ color: band.color }}>{dimension.score}/100</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#edf0f4]">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(4, dimension.score)}%`, background: band.color }} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-[#64748b]">{dimension.answered}/{dimension.total} signals captured</p>
                </div>
              );
            })}
          </div>
        </PremiumPanel>
      </section>

      {report.dimensionInsights?.length ? (
        <PremiumPanel eyebrow="Trait Diagnosis" title="Detailed expert interpretation">
          <div className="grid gap-4 md:grid-cols-2">
            {report.dimensionInsights.map((dimension) => <DimensionCard key={dimension.dimension} dimension={dimension} />)}
          </div>
        </PremiumPanel>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <PremiumPanel eyebrow="Strengths" title="What to build on">
          <InsightList items={report.strengths} tone="good" />
        </PremiumPanel>
        <PremiumPanel eyebrow="Development" title="What needs training">
          <InsightList items={report.improvementAreas} tone="risk" />
        </PremiumPanel>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <PremiumPanel eyebrow="Defence Interpretation" title="Officer readiness signal">
          <p className="text-base leading-8 text-[#334155]">{report.officerReadinessSignal}</p>
          {report.integritySignals?.length ? (
            <div className="mt-5">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#9a6f22]">Response Integrity</p>
              <InsightList items={report.integritySignals} tone="gold" />
            </div>
          ) : null}
        </PremiumPanel>
        <PremiumPanel eyebrow="Risk and Support" title="Intervention signals" action={<AlertTriangle className="h-7 w-7 text-orange-500" />}>
          <InsightList items={report.riskReview} tone="risk" />
        </PremiumPanel>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <PremiumPanel eyebrow="Parent View" title="Simple family summary">
          <p className="text-base leading-8 text-[#334155]">{report.parentSummary}</p>
          <div className="mt-5">
            <InsightList items={report.parentGuidance} tone="neutral" />
          </div>
        </PremiumPanel>
        <PremiumPanel eyebrow="Mentor View" title="Academic counselling note">
          <p className="text-base leading-8 text-[#334155]">{report.counsellorSummary}</p>
          <div className="mt-5">
            <InsightList items={report.mentorReviewChecklist} tone="gold" />
          </div>
        </PremiumPanel>
      </section>

      <PremiumPanel eyebrow="Action Plan" title="What to do next">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <p className="mb-3 text-sm font-black">Next 7 days</p>
            <InsightList items={report.sevenDayActionPlan} tone="good" />
          </div>
          <div>
            <p className="mb-3 text-sm font-black">Next 30 days</p>
            <InsightList items={report.thirtyDayPlan} tone="gold" />
          </div>
          <div>
            <p className="mb-3 text-sm font-black">Next 90 days</p>
            <InsightList items={report.ninetyDayPlan} tone="neutral" />
          </div>
        </div>
      </PremiumPanel>

      <PremiumPanel eyebrow="Next Best Actions" title="Continue your journey">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/guru" className="rounded-2xl border border-[#d8d2c3] bg-[#fffdf8] p-5 transition hover:-translate-y-1 hover:bg-white">
            <Sparkles className="h-6 w-6 text-[#9a6f22]" />
            <h3 className="mt-4 text-lg font-black">Start {report.recommendedGuruQuest}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Convert this report into daily personal transformation.</p>
          </Link>
          <Link href="/psychometric" className="rounded-2xl border border-[#d8d2c3] bg-[#fffdf8] p-5 transition hover:-translate-y-1 hover:bg-white">
            <Target className="h-6 w-6 text-[#9a6f22]" />
            <h3 className="mt-4 text-lg font-black">Take {report.recommendedNextTest}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Complete the next assessment for deeper accuracy.</p>
          </Link>
          <Link href="/join" className="rounded-2xl border border-[#d8d2c3] bg-[#fffdf8] p-5 transition hover:-translate-y-1 hover:bg-white">
            <MessageCircle className="h-6 w-6 text-[#9a6f22]" />
            <h3 className="mt-4 text-lg font-black">Book counselling</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{report.counsellingAction}</p>
          </Link>
        </div>
      </PremiumPanel>

      {report.answerSignals.length ? (
        <PremiumPanel eyebrow="Evidence" title="Answer-level interpretation">
          <div className="grid gap-4 lg:grid-cols-2">
            {report.answerSignals.slice(0, 10).map((signal, index) => (
              <div key={`${signal.question}-${index}`} className="rounded-2xl border border-[#d8d2c3] bg-[#fffdf8] p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9a6f22]">{signal.dimensionLabel ?? signal.dimension}</p>
                <p className="mt-2 text-sm font-black leading-6 text-[#071d36]">{signal.question}</p>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{signal.answer}</p>
                <p className="mt-3 rounded-xl border border-[#b9913f]/25 bg-[#fff7de] p-3 text-sm font-semibold leading-6 text-[#6f4d16]">{signal.interpretation}</p>
              </div>
            ))}
          </div>
        </PremiumPanel>
      ) : null}

      {report.disclaimer ? (
        <div className="rounded-2xl border border-[#d8d2c3] bg-white p-4 text-sm leading-7 text-[#64748b]">
          <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-600" />
          {report.disclaimer}
        </div>
      ) : null}
    </div>
  );
}
