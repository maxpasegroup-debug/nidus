"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { NidusAiOrbit } from "@/components/nidus-ai/nidus-ai-orbit";
import { nidusAnswerChoices, nidusOptionalGuidance, nidusProfileAccuracy, nidusQuestionPrompt } from "@/components/psychometric/nidus-ai-assessment-engine";
import { TimerBox } from "@/components/psychometric/timer-box";
import { usePsychometricActiveAttempt, useSubmitPsychometric } from "@/hooks/use-psychometric";
import { getApiErrorMessage } from "@/services/api";
import type { PsychometricAttempt, PsychometricQuestion } from "@/types/psychometric";

function readCachedAttempt(attemptId: string) {
  if (typeof window === "undefined") return null;
  try {
    const attempt = JSON.parse(localStorage.getItem("nidus_psychometric_attempt") ?? "null") as (PsychometricAttempt & { test: PsychometricAttempt["test"] & { questions: PsychometricQuestion[] } }) | null;
    return attempt?.id === attemptId ? attempt : null;
  } catch {
    return null;
  }
}

export default function PsychometricAttemptPage() {
  const params = useParams<{ id: string }>();
  const attemptId = params?.id ?? "";
  const submitMutation = useSubmitPsychometric();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const cachedAttempt = useMemo(() => readCachedAttempt(attemptId), [attemptId]);
  const { data: fetchedAttempt, isLoading, error } = usePsychometricActiveAttempt(attemptId, !cachedAttempt);
  const attempt = cachedAttempt ?? fetchedAttempt ?? null;

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-[#071d36]/10" />;
  if (error) return <EmptyState title="Assessment not loaded" description={getApiErrorMessage(error)} />;
  if (!attempt) return <EmptyState title="Assessment not loaded" description="Start an assessment from the psychometric page." />;

  const questions = attempt.test.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((question) => Boolean(answers[question.id])).length;
  const progress = nidusProfileAccuracy(answeredCount, questions.length);

  function update(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function submit() {
    submitMutation.mutate({
      attemptId,
      answers: Object.entries(answers).map(([questionId, answerText]) => ({ questionId, answerText }))
    });
  }

  function goNext() {
    setCurrentIndex((index) => Math.min(index + 1, Math.max(questions.length - 1, 0)));
  }

  function goBack() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  if (!currentQuestion) return <EmptyState title="No questions available" description="NIDUS AI could not find questions for this assessment." />;

  const currentChoices = nidusAnswerChoices(currentQuestion);
  const selectedAnswer = answers[currentQuestion.id] ?? "";
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <main className="space-y-4">
        <div className="rounded-lg border border-[#071d36]/10 bg-white/90 p-5 shadow-[0_24px_70px_rgba(7,29,54,0.10)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">{attempt.test.type}</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#071d36]">{attempt.test.title}</h1>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#071d36]/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#f8d77c] via-[#d7a642] to-[#a8741f] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">{answeredCount}/{questions.length} responses captured</p>
          <div className="mt-4 rounded border border-[#c89b3c]/25 bg-[#fff7de] p-3 text-sm leading-6 text-[#8a6426]">
            {nidusOptionalGuidance(progress)}
          </div>
        </div>
        <NidusAiOrbit message={nidusQuestionPrompt(currentQuestion, attempt.test)} mood={selectedAnswer ? "thinking" : "asking"} />
        <div className="rounded-lg border border-[#071d36]/10 bg-white/90 p-5 shadow-[0_24px_70px_rgba(7,29,54,0.10)]">
          {currentQuestion.imageUrl ? <Image src={currentQuestion.imageUrl} alt="" width={900} height={420} unoptimized className="mb-4 max-h-72 w-auto rounded object-cover" /> : null}
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">Question {currentIndex + 1} of {questions.length}</p>
          <h2 className="mt-3 text-2xl font-semibold leading-8 text-[#071d36]">{currentQuestion.questionText}</h2>
          {Array.isArray(currentQuestion.options) ? (
            <div className="mt-5 grid gap-3">
              {currentChoices.map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update(currentQuestion.id, option)}
                  className={`rounded-lg border p-4 text-left text-sm font-semibold leading-6 transition hover:-translate-y-0.5 ${selectedAnswer === option ? "border-[#c89b3c] bg-[#fff7de] text-[#071d36]" : "border-[#071d36]/10 bg-white text-[#071d36] hover:border-[#c89b3c]/60"}`}
                >
                  <span className="mr-3 text-[#8a6426]">{String.fromCharCode(65 + optionIndex)}</span>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={selectedAnswer}
              className="mt-5 min-h-36 w-full rounded border border-[#071d36]/10 bg-white p-4 text-sm text-[#071d36] outline-none placeholder:text-[#64748b] focus:border-[#c89b3c]"
              onChange={(event) => update(currentQuestion.id, event.target.value)}
              placeholder="Answer naturally. NIDUS AI is reading the behaviour pattern, not judging the wording."
            />
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={goBack} variant="secondary" disabled={currentIndex === 0}>Previous</Button>
            <Button href="/psychometric" variant="secondary">Continue Later</Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {!isLastQuestion ? <Button onClick={goNext}>Skip / Next Question</Button> : null}
            {isLastQuestion ? <Button onClick={submit} disabled={submitMutation.isPending || answeredCount === 0}>{submitMutation.isPending ? "NIDUS AI is interpreting..." : "Generate NIDUS AI Report"}</Button> : null}
          </div>
        </div>
        <div className="rounded-lg border border-[#071d36]/10 bg-white/90 p-4 text-sm leading-7 text-[#40516a]">
          Tests are optional. Skipped answers do not block your journey, but completed answers improve NIDUS AI interpretation and digital profile accuracy.
        </div>
      </main>
      <TimerBox minutes={attempt.test.duration} />
    </div>
  );
}
