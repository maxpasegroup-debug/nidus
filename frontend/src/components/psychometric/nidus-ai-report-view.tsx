"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, MessageCircle, Sparkles, Target, UserRoundCheck } from "lucide-react";
import type { NidusGeneratedReport } from "@/components/psychometric/nidus-ai-assessment-engine";

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

export function NidusAiReportView({ report }: { report: NidusGeneratedReport }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Score", String(report.score), ClipboardCheck],
          ["Level", report.level, UserRoundCheck],
          ["Next Test", report.recommendedNextTest, Target],
          ["Guru Quest", report.recommendedGuruQuest, Sparkles]
        ].map(([label, value, Icon]) => {
          const MetricIcon = Icon as typeof ClipboardCheck;
          return (
            <div key={String(label)} className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
              <MetricIcon className="h-5 w-5 text-gold" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{String(label)}</p>
              <p className="mt-2 text-lg font-semibold leading-6 text-white">{String(value)}</p>
            </div>
          );
        })}
      </section>

      <ReportCard title="What This Means">
        <p className="mt-3 text-sm leading-7 text-muted">{report.simpleMeaning}</p>
        <div className="mt-4 rounded border border-gold/20 bg-gold/10 p-4 text-sm leading-7 text-gold-soft">
          {report.behaviourPattern}
        </div>
      </ReportCard>

      <section className="grid gap-4 lg:grid-cols-2">
        <ReportCard title="Strength Pattern">
          <div className="mt-4 space-y-3">
            {report.strengths.map((item) => (
              <div key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-muted">{item}</div>
            ))}
          </div>
        </ReportCard>
        <ReportCard title="Needs Improvement">
          <div className="mt-4 space-y-3">
            {report.improvementAreas.map((item) => (
              <div key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-muted">{item}</div>
            ))}
          </div>
        </ReportCard>
      </section>

      <ReportCard title="Officer Readiness Signal">
        <p className="mt-3 text-sm leading-7 text-muted">{report.officerReadinessSignal}</p>
      </ReportCard>

      {report.dimensionScores?.length ? (
        <ReportCard title="Dimension Scores">
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {report.dimensionScores.map((dimension) => (
              <div key={dimension.dimension} className="rounded border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{dimension.label}</p>
                  <p className="text-sm font-semibold text-gold-soft">{dimension.score}/100</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${dimension.score}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">{dimension.answered}/{dimension.total} responses</p>
              </div>
            ))}
          </div>
        </ReportCard>
      ) : null}

      <ReportCard title="Answer Interpretation">
        <div className="mt-4 space-y-3">
          {report.answerSignals.length ? report.answerSignals.map((signal, index) => (
            <div key={`${signal.question}-${index}`} className="rounded border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{signal.dimensionLabel ?? signal.dimension}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white">{signal.question}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{signal.answer}</p>
              <p className="mt-3 text-sm leading-6 text-gold-soft">{signal.interpretation}</p>
            </div>
          )) : (
            <p className="text-sm leading-7 text-muted">No answer-level signals were captured. Complete at least one response for deeper interpretation.</p>
          )}
        </div>
      </ReportCard>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <ReportCard title="Parent / Counsellor Summary">
          <p className="mt-3 text-sm leading-7 text-muted">{report.parentSummary}</p>
          {report.counsellorSummary ? <p className="mt-4 rounded border border-gold/20 bg-gold/10 p-4 text-sm leading-7 text-gold-soft">{report.counsellorSummary}</p> : null}
        </ReportCard>
        <ReportCard title="Next Best Action">
          <div className="mt-4 space-y-3">
            <Link href="/guru" className="flex items-center justify-between rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold-soft">
              Start {report.recommendedGuruQuest} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/psychometric" className="flex items-center justify-between rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white">
              Take {report.recommendedNextTest} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/join" className="flex items-center justify-between rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white">
              Book counselling <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">{report.counsellingAction}</p>
        </ReportCard>
      </section>

      {report.sevenDayActionPlan?.length ? (
        <ReportCard title="7-Day Action Plan">
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {report.sevenDayActionPlan.map((item) => (
              <div key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-muted">{item}</div>
            ))}
          </div>
        </ReportCard>
      ) : null}
    </div>
  );
}
