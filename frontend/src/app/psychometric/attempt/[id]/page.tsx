"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { TimerBox } from "@/components/psychometric/timer-box";
import { useSubmitPsychometric } from "@/hooks/use-psychometric";
import type { PsychometricAttempt, PsychometricQuestion } from "@/types/psychometric";

export default function PsychometricAttemptPage() {
  const params = useParams<{ id: string }>();
  const attemptId = params?.id ?? "";
  const submitMutation = useSubmitPsychometric();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const attempt = useMemo<(PsychometricAttempt & { test: PsychometricAttempt["test"] & { questions: PsychometricQuestion[] } }) | null>(() => {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem("nidus_psychometric_attempt") ?? "null");
  }, []);

  if (!attempt) return <EmptyState title="Assessment not loaded" description="Start an assessment from the psychometric page." />;

  function update(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function submit() {
    submitMutation.mutate({
      attemptId,
      answers: Object.entries(answers).map(([questionId, answerText]) => ({ questionId, answerText }))
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <main className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{attempt.test.type}</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{attempt.test.title}</h1>
        </div>
        {attempt.test.questions?.map((question) => (
          <div key={question.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
            {question.imageUrl ? <img src={question.imageUrl} alt="" className="mb-4 max-h-72 rounded object-cover" /> : null}
            <p className="font-semibold text-white">{question.order}. {question.questionText}</p>
            {Array.isArray(question.options) ? (
              <select className="mt-4 h-12 w-full rounded border border-white/10 bg-navy-deep px-4 text-white" onChange={(event) => update(question.id, event.target.value)}>
                <option value="">Select response</option>
                {question.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : (
              <textarea className="mt-4 min-h-36 w-full rounded border border-white/10 bg-navy-deep/75 p-4 text-sm text-white outline-none focus:border-gold" onChange={(event) => update(question.id, event.target.value)} placeholder="Write your response..." />
            )}
          </div>
        ))}
        <Button onClick={submit} disabled={submitMutation.isPending}>{submitMutation.isPending ? "Submitting..." : "Submit Assessment"}</Button>
      </main>
      <TimerBox minutes={attempt.test.duration} />
    </div>
  );
}
