"use client";

import { motion } from "framer-motion";
import { AssessmentMissionCard } from "@/components/assessments/assessment-mission-card";
import { buildAssessmentProgress } from "@/components/assessments/assessment-catalog";
import { EmptyState } from "@/components/courses/empty-state";
import { PsychometricCard } from "@/components/psychometric/psychometric-card";
import { AnnouncementCard, QuickActionCard, SectionHeader, StatCard } from "@/components/dashboard";
import { usePsychometricTests, useStartPsychometric } from "@/hooks/use-psychometric";
import { getApiErrorMessage } from "@/services/api";

const monthlyTrackers = [
  { title: "IQ / Aptitude", description: "Reasoning, speed, accuracy, verbal, numerical, and decision-making growth.", tag: "IQ" },
  { title: "EQ / Behaviour", description: "Emotional stability, cooperation, confidence, responsibility, and attitude.", tag: "EQ" },
  { title: "OLQ Readiness", description: "Officer-like qualities such as leadership, initiative, courage, and influence.", tag: "OLQ" },
  { title: "Monthly Growth", description: "Scores roll into the progress report for parents, teachers, and management.", tag: "Report" }
];

export default function PsychometricPage() {
  const { data: tests = [], isLoading, error } = usePsychometricTests();
  const startMutation = useStartPsychometric();
  const assessmentEcosystem = buildAssessmentProgress(0);
  const freeAssessments = assessmentEcosystem.filter((assessment) => assessment.access === "FREE").length;
  const premiumAssessments = assessmentEcosystem.filter((assessment) => assessment.access === "PREMIUM").length;

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.055] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Assessments</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Defence readiness and growth assessments</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">Public guests and students can take guided assessments. Results support officer-readiness tracking, monthly progress reports, NIDUS Guru recommendations, and counselling action plans.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Assessment Ecosystem" value="15" note="Full defence profile assessment map" />
        <StatCard label="Free Lead Tests" value={String(freeAssessments)} note="Officer, discipline, leadership, career and Guru hooks" />
        <StatCard label="Premium Reports" value={String(premiumAssessments)} note="Advanced SSB psychology and AI report path" />
        <StatCard label="Access" value="Guest + Student" note="Preview and enrolled attempts" />
      </section>

      <SectionHeader eyebrow="Monthly Tracking" title="What these tests measure" />
      <section className="grid gap-4 md:grid-cols-4">
        {monthlyTrackers.map((item) => <AnnouncementCard key={item.title} title={item.title} description={item.description} tag={item.tag} />)}
      </section>

      <SectionHeader eyebrow="Ecosystem" title="Complete the 15-part defence profile" action="Frontend-ready report states" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assessmentEcosystem.map((assessment) => (
          <AssessmentMissionCard key={assessment.id} assessment={assessment} />
        ))}
      </section>

      <SectionHeader eyebrow="Live Backend Tests" title="Available configured assessments" />
      {isLoading ? <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-lg bg-white/[0.06]" />)}</div> : null}
      {error ? <EmptyState title="Unable to load assessments" description={getApiErrorMessage(error)} /> : null}
      {!isLoading && !error ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => <PsychometricCard key={test.id} test={test} onStart={() => startMutation.mutate(test.id)} />)}
        </section>
      ) : null}

      <SectionHeader eyebrow="Next Steps" title="How management should use this" />
      <section className="grid gap-4 md:grid-cols-3">
        <QuickActionCard title="Add to progress report" description="Use monthly aptitude and psychometric results in growth reports." href="/progress-reports" />
        <QuickActionCard title="Teacher follow-up" description="Teachers can use low-score areas to support students." href="/dashboard/teacher" />
        <QuickActionCard title="Guest conversion" description="Guests can try tests and then register for full academy access." href="/register" />
      </section>
    </motion.div>
  );
}
