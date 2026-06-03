"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Compass, MessageCircle, Sparkles, Target, TrendingUp, UserRoundCheck } from "lucide-react";
import type { NidusGeneratedReport } from "@/components/psychometric/nidus-ai-assessment-engine";

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1020]/92 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function ScoreRing({ score, level }: { score: number; level: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(198,77,255,0.22),transparent_18rem),#0b1020] p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.30)]">
      <div className="mx-auto grid h-44 w-44 place-items-center rounded-full" style={{ background: `conic-gradient(#f4c95d ${score * 3.6}deg, rgba(255,255,255,0.10) 0deg)` }}>
        <div className="grid h-36 w-36 place-items-center rounded-full bg-[#070a16]">
          <div>
            <p className="text-5xl font-bold text-white">{score}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#f4c95d]">Score</p>
          </div>
        </div>
      </div>
      <p className="mt-5 text-lg font-semibold text-white">{level}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">NIDUS AI overall readiness interpretation</p>
    </div>
  );
}

function VisualDimensionGraph({ dimensions }: { dimensions: NonNullable<NidusGeneratedReport["dimensionScores"]> }) {
  const topDimensions = [...dimensions].sort((a, b) => b.score - a.score).slice(0, 8);

  return (
    <ReportCard title="Visual Dimension Graph">
      <div className="mt-5 space-y-4">
        {topDimensions.map((dimension) => (
          <div key={dimension.dimension}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-white">{dimension.label}</span>
              <span className="font-semibold text-[#f4c95d]">{dimension.score}/100</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#7bdcff,#c64dff,#f4c95d)]"
                style={{ width: `${Math.max(5, Math.min(100, dimension.score))}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-white/50">{dimension.answered}/{dimension.total} signals captured</p>
          </div>
        ))}
      </div>
    </ReportCard>
  );
}

function CareerGuidancePanel({ report }: { report: NidusGeneratedReport }) {
  const guidance: Array<[string, string, typeof Target]> = [
    ["Best next assessment", report.recommendedNextTest, Target],
    ["Growth quest", report.recommendedGuruQuest, Sparkles],
    ["Counselling focus", report.counsellingAction, Compass]
  ];

  return (
    <ReportCard title="Career Focused Guidance">
      <div className="mt-4 grid gap-3">
        {guidance.map(([label, value, Icon]) => {
          const GuidanceIcon = Icon as typeof Target;
          return (
            <div key={String(label)} className="rounded border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-[#f4c95d]/15 text-[#f4c95d]">
                  <GuidanceIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{String(label)}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white">{String(value)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ReportCard>
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
            <div key={String(label)} className="rounded-lg border border-white/10 bg-[#0b1020]/92 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
              <MetricIcon className="h-5 w-5 text-gold" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{String(label)}</p>
              <p className="mt-2 text-lg font-semibold leading-6 text-white">{String(value)}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <ScoreRing score={report.score} level={report.level} />
        {report.dimensionScores?.length ? <VisualDimensionGraph dimensions={report.dimensionScores} /> : (
          <ReportCard title="Visual Interpretation">
            <div className="mt-5 rounded border border-white/10 bg-white/[0.045] p-4 text-sm leading-7 text-white/70">
              Dimension graph will appear after enough answer signals are captured.
            </div>
          </ReportCard>
        )}
      </section>

      <ReportCard title="What This Means">
        {report.executiveSummary ? <p className="mt-3 text-sm leading-7 text-white">{report.executiveSummary}</p> : null}
        <p className="mt-3 text-sm leading-7 text-muted">{report.simpleMeaning}</p>
        <div className="mt-4 rounded border border-gold/20 bg-gold/10 p-4 text-sm leading-7 text-gold-soft">
          {report.behaviourPattern}
        </div>
      </ReportCard>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
        <ReportCard title="Interpretation Map">
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["Readiness", report.officerReadinessSignal],
              ["Behaviour", report.behaviourPattern],
              ["Confidence", report.reportConfidence ?? "Complete more responses to improve confidence."]
            ].map(([title, body], index) => (
              <div key={title} className="rounded border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#f4c95d]" />
                  <p className="text-sm font-semibold text-white">{title}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">{body}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#f4c95d]" style={{ width: `${Math.max(28, report.score - index * 12)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ReportCard>
        <CareerGuidancePanel report={report} />
      </section>

      {(report.percentileContext || report.reportConfidence) ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {report.percentileContext ? (
            <ReportCard title="Benchmark Context">
              <p className="mt-3 text-sm leading-7 text-muted">{report.percentileContext}</p>
            </ReportCard>
          ) : null}
          {report.reportConfidence ? (
            <ReportCard title="Report Confidence">
              <p className="mt-3 text-sm leading-7 text-muted">{report.reportConfidence}</p>
            </ReportCard>
          ) : null}
        </section>
      ) : null}

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

      {report.integritySignals?.length ? (
        <ReportCard title="Response Integrity">
          <div className="mt-4 space-y-3">
            {report.integritySignals.map((item) => (
              <div key={item} className="rounded border border-gold/20 bg-gold/10 px-4 py-3 text-sm leading-6 text-gold-soft">{item}</div>
            ))}
          </div>
        </ReportCard>
      ) : null}

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

      {report.dimensionInsights?.length ? (
        <ReportCard title="Dimension Insights">
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {report.dimensionInsights.map((dimension) => (
              <div key={dimension.dimension} className="rounded border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{dimension.label}</p>
                  <p className="text-sm font-semibold text-gold-soft">{dimension.score}/100</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{dimension.interpretation}</p>
                <p className="mt-3 rounded border border-gold/20 bg-gold/10 px-3 py-2 text-sm leading-6 text-gold-soft">{dimension.action}</p>
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
          {report.parentGuidance?.length ? (
            <div className="mt-4 space-y-2">
              {report.parentGuidance.map((item) => (
                <p key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-muted">{item}</p>
              ))}
            </div>
          ) : null}
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

      {(report.thirtyDayPlan?.length || report.ninetyDayPlan?.length) ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {report.thirtyDayPlan?.length ? (
            <ReportCard title="30-Day Training Plan">
              <div className="mt-4 space-y-3">
                {report.thirtyDayPlan.map((item) => (
                  <div key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-muted">{item}</div>
                ))}
              </div>
            </ReportCard>
          ) : null}
          {report.ninetyDayPlan?.length ? (
            <ReportCard title="90-Day Roadmap">
              <div className="mt-4 space-y-3">
                {report.ninetyDayPlan.map((item) => (
                  <div key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-muted">{item}</div>
                ))}
              </div>
            </ReportCard>
          ) : null}
        </section>
      ) : null}

      {(report.riskReview?.length || report.mentorReviewChecklist?.length || report.mentorNotes?.length) ? (
        <section className="grid gap-4 lg:grid-cols-3">
          {report.riskReview?.length ? (
            <ReportCard title="Risk Review">
              <div className="mt-4 space-y-3">
                {report.riskReview.map((item) => (
                  <div key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-muted">{item}</div>
                ))}
              </div>
            </ReportCard>
          ) : null}
          {report.mentorReviewChecklist?.length ? (
            <ReportCard title="Mentor Checklist">
              <div className="mt-4 space-y-3">
                {report.mentorReviewChecklist.map((item) => (
                  <div key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-muted">{item}</div>
                ))}
              </div>
            </ReportCard>
          ) : null}
          {report.mentorNotes?.length ? (
            <ReportCard title="Mentor Notes">
              <div className="mt-4 space-y-3">
                {report.mentorNotes.map((item) => (
                  <div key={item} className="rounded border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-muted">{item}</div>
                ))}
              </div>
            </ReportCard>
          ) : null}
        </section>
      ) : null}

      {report.disclaimer ? (
        <ReportCard title="Educational Disclaimer">
          <p className="mt-3 text-sm leading-7 text-muted">{report.disclaimer}</p>
        </ReportCard>
      ) : null}
    </div>
  );
}
