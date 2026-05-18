"use client";

import { motion } from "framer-motion";
import { AnnouncementCard, ProgressCard, QuickActionCard, SectionHeader, StatCard } from "@/components/dashboard";
import { PageHero } from "@/components/layout/page-hero";

const reportSections = [
  { title: "Academic Score", description: "Subject marks, accuracy, rank, weak topics, and improvement from last month.", tag: "Marks" },
  { title: "Aptitude Growth", description: "Reasoning, verbal ability, numerical ability, awareness, and decision making.", tag: "Aptitude" },
  { title: "Attendance & Discipline", description: "Class attendance, PT attendance, discipline remarks, and punctuality signals.", tag: "Conduct" },
  { title: "OLQ / Psychometric", description: "Leadership, confidence, initiative, social adaptability, responsibility, and stability.", tag: "OLQ" },
  { title: "Teacher Remarks", description: "Simple teacher comments, classroom behaviour, effort level, and next learning target.", tag: "Teacher" },
  { title: "NIDUS AI Plan", description: "AI-generated strengths, risks, next-month targets, and daily improvement actions.", tag: "AI" }
];

const monthlyTimeline = [
  "Week 1: subject practice and lesson completion review.",
  "Week 2: aptitude test and weak-topic coaching.",
  "Week 3: full mock exam with leaderboard update.",
  "Week 4: progress report, parent view, and action plan."
];

export default function ProgressReportsPage() {
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Growth & Progress Reports"
        title="Monthly hybrid progress report"
        description="A clear report system for academic marks, aptitude, attendance, discipline, psychometric growth, teacher remarks, and NIDUS AI action plans."
        stats={[
          { value: "6", label: "report sections" },
          { value: "30d", label: "monthly cycle" },
          { value: "360", label: "growth view" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Academic Growth" value="82%" note="Marks, accuracy and subject progress" />
        <StatCard label="Aptitude Growth" value="76%" note="Reasoning and decision-making score" />
        <StatCard label="Attendance" value="91%" note="Class and PT participation" />
        <StatCard label="Officer Readiness" value="78%" note="OLQ, discipline and confidence signals" />
      </section>

      <SectionHeader eyebrow="Report Format" title="What the academy can show every month" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportSections.map((section) => (
          <AnnouncementCard key={section.title} title={section.title} description={section.description} tag={section.tag} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="premium-surface rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Monthly Cycle</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">How reports are prepared</h2>
          <div className="mt-5 grid gap-3">
            {monthlyTimeline.map((item) => (
              <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressCard title="Subject score" value={82} label="Monthly academic readiness" />
          <ProgressCard title="Speed and accuracy" value={74} label="Timed test efficiency" />
          <ProgressCard title="Consistency" value={88} label="Practice and attendance stability" />
          <ProgressCard title="Improvement" value={69} label="Growth from previous month" />
        </div>
      </section>

      <SectionHeader eyebrow="Actions" title="Where progress data comes from" />
      <section className="grid gap-4 md:grid-cols-3">
        <QuickActionCard title="Monthly tests" description="Create and run tests that feed academic and aptitude scores." href="/tests" />
        <QuickActionCard title="Psychometric tests" description="Use OLQ and psychometric attempts for officer-readiness growth." href="/psychometric" />
        <QuickActionCard title="Performance analytics" description="Open AI analytics for weak topics and recommendations." href="/performance-analytics" />
      </section>
    </motion.div>
  );
}
