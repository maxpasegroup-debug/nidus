"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { nidusAnswerChoices, nidusOptionalGuidance, nidusProfileAccuracy, nidusQuestionPrompt } from "@/components/psychometric/nidus-ai-assessment-engine";
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

function NidusAssessmentOrb() {
  return (
    <div className="relative mx-auto grid h-24 w-24 place-items-center sm:h-28 sm:w-28">
      <div className="absolute inset-0 rounded-full bg-fuchsia-400/30 blur-3xl" />
      <div className="absolute inset-3 rounded-full bg-sky-400/20 blur-2xl" />
      <motion.div
        animate={{ scale: [1, 1.05, 1], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative grid h-20 w-20 place-items-center rounded-full bg-[linear-gradient(135deg,#d56cff_0%,#f06bd9_45%,#88d8ff_100%)] shadow-[0_0_70px_rgba(213,108,255,0.55)] sm:h-24 sm:w-24"
      >
        <BrainCircuit className="h-8 w-8 text-white" />
      </motion.div>
    </div>
  );
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
  const questionProgress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

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
    <main className="min-h-[calc(100vh-5rem)] overflow-hidden rounded-lg border border-white/10 bg-[#060814] text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
      <div className="relative min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(132,54,190,0.38),transparent_24rem),radial-gradient(circle_at_18%_88%,rgba(0,117,150,0.28),transparent_25rem),linear-gradient(180deg,#210934_0%,#08091b_52%,#031927_100%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto max-w-5xl">
          <header className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm font-semibold text-white/85">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{questionProgress}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/15">
              <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,#c64dff,#ff6fd8,#7bdcff)]" animate={{ width: `${questionProgress}%` }} transition={{ duration: 0.35 }} />
            </div>
          </header>

          <section className="grid min-h-[calc(100vh-12rem)] place-items-center py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full"
              >
                <div className="mx-auto max-w-3xl text-center">
                  <NidusAssessmentOrb />
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.35em] text-white/65">NIDUS AI</p>
                  <p className="mt-3 text-sm leading-6 text-white/70">{nidusQuestionPrompt(currentQuestion, attempt.test)}</p>
                  {currentQuestion.imageUrl ? <Image src={currentQuestion.imageUrl} alt="" width={900} height={420} unoptimized className="mx-auto mt-5 max-h-64 w-auto rounded-lg object-cover" /> : null}
                  <h1 className="mx-auto mt-7 max-w-2xl text-balance text-3xl font-bold leading-tight text-white sm:text-4xl">
                    {currentQuestion.questionText}
                  </h1>
                  <p className="mt-4 text-base font-medium text-white/70">Choose what feels most true for you right now.</p>
                </div>

                {Array.isArray(currentQuestion.options) ? (
                  <div className="mx-auto mt-8 grid max-w-3xl gap-3">
                    {currentChoices.map((option, optionIndex) => (
                      <motion.button
                        key={option}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: optionIndex * 0.04 }}
                        onClick={() => update(currentQuestion.id, option)}
                        className={`group rounded-2xl border px-5 py-4 text-left text-base font-semibold leading-7 transition hover:-translate-y-0.5 ${selectedAnswer === option ? "border-fuchsia-300 bg-white text-[#08091b] shadow-[0_0_36px_rgba(198,77,255,0.28)]" : "border-white/15 bg-white/[0.085] text-white hover:border-fuchsia-300/60 hover:bg-white/[0.13]"}`}
                      >
                        <span className={`mr-3 inline-grid h-7 w-7 place-items-center rounded-full text-xs ${selectedAnswer === option ? "bg-[#08091b] text-white" : "bg-white/10 text-white/75 group-hover:bg-fuchsia-300/20"}`}>{String.fromCharCode(65 + optionIndex)}</span>
                        {option}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={selectedAnswer}
                    className="mx-auto mt-8 block min-h-36 w-full max-w-3xl rounded-2xl border border-white/15 bg-white/[0.085] p-5 text-base text-white outline-none placeholder:text-white/45 focus:border-fuchsia-300"
                    onChange={(event) => update(currentQuestion.id, event.target.value)}
                    placeholder="Answer naturally. NIDUS AI is reading the behaviour pattern, not judging the wording."
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          <footer className="relative grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm leading-6 text-white/65">
              {nidusOptionalGuidance(progress)} {answeredCount}/{questions.length} responses captured.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={goBack} variant="secondary" disabled={currentIndex === 0}>
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>
              {!isLastQuestion ? (
                <Button onClick={goNext} disabled={!selectedAnswer}>
                  Next Question <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={submitMutation.isPending || answeredCount === 0}>
                  {submitMutation.isPending ? "NIDUS AI is interpreting..." : "Generate Report"} <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
