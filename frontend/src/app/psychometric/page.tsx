"use client";

import { motion } from "framer-motion";
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

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.055] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Aptitude / Psychometric Tests</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Monthly IQ, EQ and OLQ growth tracking</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">Public guests and students can take guided online tests. Results support monthly progress reports, officer-readiness tracking, and teacher action plans.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Available Tests" value={String(tests.length)} note="Public list for guests and students" />
        <StatCard label="Monthly Cycle" value="30d" note="Recommended academy rhythm" />
        <StatCard label="Report Areas" value="IQ/EQ/OLQ" note="Progress report growth signals" />
        <StatCard label="Access" value="Guest + Student" note="Preview and enrolled attempts" />
      </section>

      <SectionHeader eyebrow="Monthly Tracking" title="What these tests measure" />
      <section className="grid gap-4 md:grid-cols-4">
        {monthlyTrackers.map((item) => <AnnouncementCard key={item.title} title={item.title} description={item.description} tag={item.tag} />)}
      </section>

      <SectionHeader eyebrow="Assessments" title="Choose an assessment category" />
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
