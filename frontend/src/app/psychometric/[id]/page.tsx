"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { NidusAiOrbit } from "@/components/nidus-ai/nidus-ai-orbit";
import { nidusOptionalGuidance, nidusPlatformGuidance } from "@/components/psychometric/nidus-ai-assessment-engine";
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
      <main className="space-y-6">
        <NidusAiOrbit message={nidusPlatformGuidance(test)} mood="guide" />
        <section className="rounded-lg border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{test.type}</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">{test.title}</h1>
          <p className="mt-3 text-sm leading-7 text-muted">{test.description}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {["AI-led questions", "Natural answers", "Guided report"].map((item) => (
              <div key={item} className="rounded border border-white/10 bg-white/[0.035] p-3 text-sm font-semibold text-white">{item}</div>
            ))}
          </div>
          <p className="mt-6 rounded border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-muted">{test.instructions}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => startMutation.mutate(test.id)} disabled={startMutation.isPending}>{startMutation.isPending ? "NIDUS AI is starting..." : "Start With NIDUS AI"}</Button>
            <Button href="/psychometric" variant="secondary">Choose Another Assessment</Button>
          </div>
          <div className="mt-4 rounded border border-gold/20 bg-gold/10 p-4 text-sm leading-7 text-gold-soft">
            {nidusOptionalGuidance(0)}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Button href="/psychometric" variant="secondary">Skip For Now</Button>
            <Button href="/join" variant="secondary">Ask NIDUS AI Which Test</Button>
            <Button href="/digital-profile" variant="secondary">View Digital Profile</Button>
          </div>
        </section>
      </main>
      <TimerBox minutes={test.duration} />
    </div>
  );
}
