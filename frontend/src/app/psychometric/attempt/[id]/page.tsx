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
      <div className="absolute inset-0 rounded-full bg-[#d7a642]/30 blur-3xl" />
      <div className="absolute inset-3 rounded-full bg-[#3f4a32]/25 blur-2xl" />
      <motion.div
        animate={{ scale: [1, 1.05, 1], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative grid h-20 w-20 place-items-center rounded-full border border-[#f7d37c]/35 bg-[linear-gradient(135deg,#071d36_0%,#3f4a32_52%,#d7a642_100%)] shadow-[0_0_70px_rgba(215,166,66,0.42)] sm:h-24 sm:w-24"
      >
        <BrainCircuit className="h-8 w-8 text-[#fff7de]" />
      </motion.div>
    </div>
  );
}

function cleanQuestionText(value: string) {
  return value.replace(/^.+?\s+scenario\s+\d+\s+-\s+.+?:\s*/i, "").trim();
}

const focusStopWords = new Set([
  "when",
  "what",
  "which",
  "where",
  "how",
  "does",
  "your",
  "you",
  "usually",
  "naturally",
  "first",
  "before",
  "after",
  "with",
  "into",
  "from",
  "that",
  "this",
  "there",
  "their",
  "becomes",
  "important",
  "situation"
]);

function focusPhrase(questionText: string) {
  const cleaned = cleanQuestionText(questionText).toLowerCase();
  if (cleaned.includes("information") && cleaned.includes("incomplete")) return "incomplete facts";
  if (cleaned.includes("confused")) return "group confusion";
  if (cleaned.includes("ownership")) return "ownership";
  if (cleaned.includes("quieter")) return "quiet member";
  if (cleaned.includes("teammate") && cleaned.includes("weak")) return "weak teammate";
  if (cleaned.includes("disagree")) return "disagreement";
  if (cleaned.includes("suggestion")) return "ignored suggestion";
  if (cleaned.includes("phone") || cleaned.includes("distract")) return "distractions";
  if (cleaned.includes("routine")) return "routine break";
  if (cleaned.includes("deadline")) return "missed deadline";
  if (cleaned.includes("team") && cleaned.includes("confidence")) return "team confidence";
  if (cleaned.includes("group")) return "group pressure";
  if (cleaned.includes("goal")) return "goal clarity";
  if (cleaned.includes("future")) return "future plan";
  if (cleaned.includes("pressure")) return "pressure";
  if (cleaned.includes("fitness") || cleaned.includes("training") || cleaned.includes("stamina")) return "training";
  if (cleaned.includes("speak") || cleaned.includes("voice") || cleaned.includes("communicate")) return "speaking";

  const words = cleaned
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !focusStopWords.has(word));
  return words.slice(0, 2).join(" ") || "this moment";
}

function generatedChoiceLabel(question: PsychometricQuestion, index: number) {
  const focus = focusPhrase(question.questionText);
  const options = [
    `Act on ${focus}`,
    `Plan for ${focus}`,
    `Ask help on ${focus}`,
    `Avoid ${focus}`
  ];
  return options[index] ?? `Option ${String.fromCharCode(65 + index)}`;
}

function isRepeatedSeedOption(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("i act early") ||
    normalized.includes("i stay steady") ||
    normalized.includes("i need support") ||
    normalized.includes("i usually delay") ||
    normalized.includes("scenario") && normalized.includes("this is my")
  );
}

function shortAnswerLabel(question: PsychometricQuestion, value: string, index: number) {
  if (isRepeatedSeedOption(value)) return generatedChoiceLabel(question, index);

  const afterColon = value.includes(":") ? value.split(":").pop() ?? value : value;
  const cleaned = afterColon
    .replace(/Scenario\s+\d+.*$/i, "")
    .replace(/this is my.*$/i, "")
    .replace(/this fits me.*$/i, "")
    .replace(/^I\s+/i, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 5).join(" ");
  return words || `Option ${String.fromCharCode(65 + index)}`;
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

  const currentChoices = nidusAnswerChoices(currentQuestion).map((option, index) => ({
    value: option,
    label: shortAnswerLabel(currentQuestion, option, index)
  }));
  const displayQuestion = cleanQuestionText(currentQuestion.questionText);
  const selectedAnswer = answers[currentQuestion.id] ?? "";
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <main className="min-h-[calc(100vh-5rem)] overflow-hidden rounded-lg border border-[#d7a642]/20 bg-[#071d36] text-white shadow-[0_30px_90px_rgba(7,29,54,0.35)]">
      <div className="relative min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(215,166,66,0.20),transparent_22rem),radial-gradient(circle_at_18%_90%,rgba(63,74,50,0.36),transparent_26rem),linear-gradient(180deg,#071d36_0%,#061525_50%,#082622_100%)]" />
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(247,211,124,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(247,211,124,0.14)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto max-w-5xl">
          <header className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm font-semibold text-white/85">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{questionProgress}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/15">
              <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,#f8d77c,#d7a642,#3f4a32)]" animate={{ width: `${questionProgress}%` }} transition={{ duration: 0.35 }} />
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
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.35em] text-[#f7d37c]">NIDUS AI</p>
                  <p className="mt-3 text-sm leading-6 text-white/70">{nidusQuestionPrompt(currentQuestion, attempt.test)}</p>
                  {currentQuestion.imageUrl ? <Image src={currentQuestion.imageUrl} alt="" width={900} height={420} unoptimized className="mx-auto mt-5 max-h-64 w-auto rounded-lg object-cover" /> : null}
                  <h1 className="mx-auto mt-7 max-w-2xl text-balance text-3xl font-bold leading-tight text-white sm:text-4xl">
                    {displayQuestion}
                  </h1>
                  <p className="mt-4 text-base font-medium text-white/70">Choose what feels most true for you right now.</p>
                </div>

                {Array.isArray(currentQuestion.options) ? (
                  <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                    {currentChoices.map((option, optionIndex) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: optionIndex * 0.04 }}
                        onClick={() => update(currentQuestion.id, option.value)}
                        className={`group flex min-h-16 items-center rounded-2xl border px-5 py-4 text-left text-base font-semibold leading-6 transition hover:-translate-y-0.5 ${selectedAnswer === option.value ? "border-[#f7d37c] bg-[#fff7de] text-[#071d36] shadow-[0_0_36px_rgba(215,166,66,0.26)]" : "border-[#f7d37c]/18 bg-white/[0.075] text-white hover:border-[#f7d37c]/65 hover:bg-white/[0.12]"}`}
                      >
                        <span className={`mr-3 inline-grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${selectedAnswer === option.value ? "bg-[#071d36] text-[#f7d37c]" : "bg-white/10 text-white/75 group-hover:bg-[#d7a642]/20"}`}>{String.fromCharCode(65 + optionIndex)}</span>
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={selectedAnswer}
                    className="mx-auto mt-8 block min-h-36 w-full max-w-3xl rounded-2xl border border-[#f7d37c]/20 bg-white/[0.085] p-5 text-base text-white outline-none placeholder:text-white/45 focus:border-[#f7d37c]"
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
