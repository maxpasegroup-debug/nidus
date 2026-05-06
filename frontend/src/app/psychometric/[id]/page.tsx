"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { TimerBox } from "@/components/psychometric/timer-box";
import { usePsychometricAttempt, useStartPsychometric } from "@/hooks/use-psychometric";
import { getApiErrorMessage } from "@/services/api";

export default function PsychometricDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: test, isLoading, error } = usePsychometricAttempt(id);
  const startMutation = useStartPsychometric();

  if (isLoading) return <div className="h-80 animate-pulse rounded-lg bg-white/[0.06]" />;
  if (error || !test) return <EmptyState title="Unable to load assessment" description={getApiErrorMessage(error)} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="rounded-lg border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{test.type}</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">{test.title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{test.description}</p>
        <p className="mt-6 rounded border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-muted">{test.instructions}</p>
        <Button className="mt-6" onClick={() => startMutation.mutate(test.id)} disabled={startMutation.isPending}>Start Assessment</Button>
      </section>
      <TimerBox minutes={test.duration} />
    </div>
  );
}
