"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText, Users } from "lucide-react";
import { AnnouncementCard, ProgressCard, SectionHeader, StatCard } from "@/components/dashboard";
import { PageHero } from "@/components/layout/page-hero";
import type { AssessmentReport } from "@/components/assessments/assessment-catalog";

export function AssessmentReportView({ report }: { report: AssessmentReport }) {
  const Icon = report.assessment.icon;

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Assessment Report"
        title={report.assessment.reportName}
        description={report.assessment.subtitle}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/psychometric" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">
              Back to Assessments <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/crm/counselling" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
              Book Counselling <Users className="h-4 w-4" />
            </Link>
          </div>
        }
        stats={[
          { value: `${report.score}/100`, label: "assessment score" },
          { value: report.level, label: "current level" },
          { value: report.archetype, label: "archetype" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Score" value={`${report.score}/100`} note={report.level} />
        <StatCard label="Archetype" value={report.archetype} note="Shareable profile identity" />
        <StatCard label="Access" value={report.assessment.access} note="Assessment tier" />
        <StatCard label="Guru Link" value={report.assessment.relatedGuruQuest} note="Recommended quest pathway" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <div className="premium-surface rounded-lg p-5">
            <div className="grid h-14 w-14 place-items-center rounded border border-gold/30 bg-gold/10 text-gold">
              <Icon className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-ink">{report.assessment.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{report.assessment.subtitle}</p>
          </div>
          <ProgressCard title="Assessment Score" value={report.score} label={report.level} />
        </div>

        <div className="premium-surface rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Generated Interpretation</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Report summary</h2>
            </div>
            <FileText className="h-6 w-6 text-gold" />
          </div>
          <div className="mt-5 grid gap-3">
            {[
              `Score: ${report.score}/100 (${report.level}).`,
              `Archetype: ${report.archetype}.`,
              `Report type: ${report.assessment.reportName}.`,
              `Recommended action: ${report.recommendedAction}`,
              report.counsellingPrompt
            ].map((item) => (
              <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <SectionHeader eyebrow="Strengths" title="Strong signals" />
          <div className="mt-4 grid gap-3">
            {report.strengths.map((strength) => (
              <div key={strength} className="flex gap-3 rounded border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
                {strength}
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionHeader eyebrow="Improvements" title="Focus areas" />
          <div className="mt-4 grid gap-3">
            {report.improvementAreas.map((area) => (
              <div key={area} className="rounded border border-gold/20 bg-gold/10 p-4 text-sm leading-6 text-muted">{area}</div>
            ))}
          </div>
        </div>
      </section>

      <SectionHeader eyebrow="Report Actions" title="What to do next" />
      <section className="grid gap-4 md:grid-cols-3">
        <AnnouncementCard title="Parent Summary" description={report.parentSummary} tag="Parent" />
        <AnnouncementCard title="Recommended Action" description={report.recommendedAction} tag="Action" />
        <AnnouncementCard title="Counselling CTA" description={report.counsellingPrompt} tag="Counselling" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/digital-profile" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">Open Digital Profile <ArrowRight className="h-4 w-4" /></Link>
        <Link href="/progress-reports" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">Open Hybrid Report <ArrowRight className="h-4 w-4" /></Link>
        <Link href="/guru" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:bg-gold/15">Start Guru Quest <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </motion.div>
  );
}
