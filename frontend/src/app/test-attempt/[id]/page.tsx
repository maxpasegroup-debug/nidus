"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { OMRPalette } from "@/components/tests/omr-palette";
import { QuestionCard } from "@/components/tests/question-card";
import { ReviewModal } from "@/components/tests/review-modal";
import { TimerCard } from "@/components/tests/timer-card";
import { useSubmitTest } from "@/hooks/use-tests";
import { useToast } from "@/components/providers/toast-provider";
import { autosaveAttempt, getReviewPlan, logIntegrityEvent, resumeAttempt } from "@/services/tests";
import type { Question, TestAttempt } from "@/types/test";

export default function TestAttemptPage() {
  const params = useParams<{ id: string }>();
  const attemptId = params?.id ?? "";
  const { showToast } = useToast();
  const submitMutation = useSubmitTest();
  const [current, setCurrent] = useState(0);
  const [review, setReview] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    return JSON.parse(localStorage.getItem(`nidus_attempt_${attemptId}`) ?? "{}");
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confidence, setConfidence] = useState<Record<string, string>>({});
  const [skippedMode, setSkippedMode] = useState(false);

  const attempt = useMemo<(TestAttempt & { test: TestAttempt["test"] & { questions: Question[] } }) | null>(() => {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem("nidus_active_attempt") ?? "null");
  }, []);

  const questions: Question[] = useMemo(() => attempt?.test?.questions ?? [], [attempt]);
  const activeQuestion = questions[current];
  const answeredIndexes = useMemo(() => new Set(questions.map((question, index) => (answers[question.id] ? index : -1)).filter((index) => index >= 0)), [answers, questions]);
  const skippedIndexes = useMemo(() => new Set(questions.map((question, index) => (!answers[question.id] && !review.has(index) ? index : -1)).filter((index) => index >= 0)), [answers, questions, review]);

  useEffect(() => {
    if (!attemptId) return;
    resumeAttempt(attemptId).then((serverAttempt) => {
      if (serverAttempt) localStorage.setItem("nidus_active_attempt", JSON.stringify(serverAttempt));
      const stateAnswers = (serverAttempt.answerStates ?? []).reduce<Record<string, string>>((acc, state) => {
        if (typeof state.questionId === "string" && typeof state.selectedAnswer === "string") acc[state.questionId] = state.selectedAnswer;
        return acc;
      }, {});
      if (Object.keys(stateAnswers).length) setAnswers((currentAnswers) => ({ ...stateAnswers, ...currentAnswers }));
    }).catch(() => undefined);
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId || !activeQuestion) return;
    const handle = window.setTimeout(() => {
      void autosaveAttempt({
        attemptId,
        currentQuestionId: activeQuestion.id,
        sectionState: { currentIndex: current, skippedMode },
        answers: questions.map((question, index) => ({
          questionId: question.id,
          selectedAnswer: answers[question.id],
          status: answers[question.id] ? "ANSWERED" : review.has(index) ? "REVIEW" : "SKIPPED",
          confidence: confidence[question.id],
          markedForReview: review.has(index)
        }))
      });
    }, 800);
    return () => window.clearTimeout(handle);
  }, [activeQuestion, answers, attemptId, confidence, current, questions, review, skippedMode]);

  useEffect(() => {
    if (!attemptId) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void logIntegrityEvent({ attemptId, eventType: "TAB_SWITCH", severity: "MEDIUM" });
    };
    const preventCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      void logIntegrityEvent({ attemptId, eventType: "COPY_BLOCKED", severity: "LOW" });
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("copy", preventCopy);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("copy", preventCopy);
    };
  }, [attemptId]);

  const submit = useCallback(() => {
    submitMutation.mutate({
      attemptId,
      answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })),
      timeTaken: attempt?.test?.duration ? attempt.test.duration * 60 : 0
    });
  }, [answers, attempt?.test?.duration, attemptId, submitMutation]);

  if (!attempt || !activeQuestion) {
    return <EmptyState title="Attempt not loaded" description="Start a test from the test details page." />;
  }

  function selectAnswer(answer: string) {
    const next = { ...answers, [activeQuestion.id]: answer };
    setAnswers(next);
    localStorage.setItem(`nidus_attempt_${attemptId}`, JSON.stringify(next));
    showToast("Answer auto-saved", "info");
  }

  function toggleReview() {
    setReview((currentSet) => {
      const next = new Set(currentSet);
      if (next.has(current)) next.delete(current);
      else next.add(current);
      return next;
    });
  }

  function skipQuestion() {
    setSkippedMode(true);
    setCurrent((value) => Math.min(questions.length - 1, value + 1));
    showToast("Question skipped. It is saved in the sidebar.", "info");
  }

  async function reviewSkipped() {
    const plan = await getReviewPlan(attemptId).catch(() => null);
    const nextId = plan?.aiReviewOrder[0] ?? questions.find((question) => !answers[question.id])?.id;
    const nextIndex = questions.findIndex((question) => question.id === nextId);
    if (nextIndex >= 0) {
      setSkippedMode(true);
      setCurrent(nextIndex);
    }
  }

  return (
    <motion.div className="grid gap-6 lg:grid-cols-[1fr_320px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <main className="space-y-5">
        <div className="flex flex-col justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Fullscreen Exam Mode</p>
            <h1 className="mt-1 text-xl font-semibold text-white">{attempt.test.title}</h1>
          </div>
          <Button type="button" variant="secondary" onClick={() => document.documentElement.requestFullscreen?.()}>
            Fullscreen
          </Button>
        </div>
        <QuestionCard question={activeQuestion} selectedAnswer={answers[activeQuestion.id]} onSelect={selectAnswer} />
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={() => setCurrent((value) => Math.max(0, value - 1))}>Previous</Button>
          <Button type="button" onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}>Next</Button>
          <Button type="button" variant="secondary" onClick={skipQuestion}>Skip</Button>
          <Button type="button" variant="secondary" onClick={toggleReview}>Mark for review</Button>
          <Button type="button" variant="secondary" onClick={() => activeQuestion && setConfidence((value) => ({ ...value, [activeQuestion.id]: value[activeQuestion.id] === "LOW" ? "HIGH" : "LOW" }))}>Confidence</Button>
          <Button type="button" variant="secondary" onClick={reviewSkipped}>Review skipped</Button>
          <Button type="button" onClick={() => setIsModalOpen(true)}>Submit Test</Button>
        </div>
      </main>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <TimerCard minutes={attempt.test.duration} onExpire={submit} />
        <OMRPalette
          total={questions.length}
          activeIndex={current}
          answered={answeredIndexes}
          marked={review}
          skipped={skippedIndexes}
          onSelect={setCurrent}
        />
      </aside>
      <ReviewModal
        isOpen={isModalOpen}
        answered={Object.keys(answers).length}
        total={questions.length}
        onClose={() => setIsModalOpen(false)}
        onSubmit={submit}
      />
    </motion.div>
  );
}
