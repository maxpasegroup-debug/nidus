"use client";

import { motion } from "framer-motion";
import { EmptyState } from "@/components/courses/empty-state";
import { PsychometricCard } from "@/components/psychometric/psychometric-card";
import { SectionHeader } from "@/components/dashboard";
import { usePsychometricTests, useStartPsychometric } from "@/hooks/use-psychometric";
import { getApiErrorMessage } from "@/services/api";

export default function PsychometricPage() {
  const { data: tests = [], isLoading, error } = usePsychometricTests();
  const startMutation = useStartPsychometric();

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.055] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">SSB Psychology Lab</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Psychometric and OLQ assessments</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">Calm, focused assessments for TAT, WAT, SRT, Self Description and officer-like qualities.</p>
      </section>
      <SectionHeader eyebrow="Assessments" title="Choose an assessment category" />
      {isLoading ? <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-lg bg-white/[0.06]" />)}</div> : null}
      {error ? <EmptyState title="Unable to load assessments" description={getApiErrorMessage(error)} /> : null}
      {!isLoading && !error ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => <PsychometricCard key={test.id} test={test} onStart={() => startMutation.mutate(test.id)} />)}
        </section>
      ) : null}
    </motion.div>
  );
}
