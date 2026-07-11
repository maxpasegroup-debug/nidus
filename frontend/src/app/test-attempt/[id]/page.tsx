"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { OMRPalette } from "@/components/tests/omr-palette";
import { QuestionCard } from "@/components/tests/question-card";
import { ReviewModal } from "@/components/tests/review-modal";
import { TimerCard } from "@/components/tests/timer-card";
import { useSubmitTest } from "@/hooks/use-tests";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { autosaveAttempt, getReviewPlan, logIntegrityEvent, resumeAttempt } from "@/services/tests";
import type { Question, TestAttempt } from "@/types/test";

type ActiveAttempt = TestAttempt & { test: TestAttempt["test"] & { questions: Question[] } };

function clampIndex(index: number, total: number) {
  return Math.max(0, Math.min(Math.max(0, total - 1), index));
}

export default function TestAttemptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const attemptId = params?.id ?? "";
  const { showToast } = useToast();
  const submitMutation = useSubmitTest();
  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [review, setReview] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confidence, setConfidence] = useState<Record<string, string>>({});
  const [skippedMode, setSkippedMode] = useState(false);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const startedAtRef = useRef<number | null>(null);

  const questions = useMemo(() => attempt?.test?.questions ?? [], [attempt]);
  const activeQuestion = questions[current];
  const answeredIndexes = useMemo(
    () => new Set(questions.map((question, index) => (answers[question.id] ? index : -1)).filter((index) => index >= 0)),
    [answers, questions]
  );
  const skippedIndexes = useMemo(
    () =>
      new Set(
        questions
          .map((question, index) => {
            const serverState = attempt?.answerStates?.find((state) => state.questionId === question.id);
            const isSkipped = serverState?.status === "SKIPPED" || (!answers[question.id] && visited.has(index) && !review.has(index));
            return isSkipped ? index : -1;
          })
          .filter((index) => index >= 0)
      ),
    [answers, attempt?.answerStates, questions, review, visited]
  );
  const remaining = Math.max(0, questions.length - answeredIndexes.size);
  const progress = questions.length ? Math.round((answeredIndexes.size / questions.length) * 100) : 0;

  function goToQuestion(index: number) {
    const bounded = clampIndex(index, questions.length);
    setVisited((currentSet) => new Set(currentSet).add(bounded));
    setCurrent(bounded);
  }

  useEffect(() => {
    if (!attemptId) return;
    setLoading(true);
    resumeAttempt(attemptId)
      .then((serverAttempt) => {
        const active = serverAttempt as ActiveAttempt;
        setAttempt(active);
        startedAtRef.current = active.timing ? Date.now() - active.timing.elapsedSeconds * 1000 : Date.now();

        const stateAnswers = (active.answerStates ?? []).reduce<Record<string, string>>((acc, state) => {
          if (state.questionId && state.selectedAnswer) acc[state.questionId] = state.selectedAnswer;
          return acc;
        }, {});
        setAnswers(stateAnswers);

        const indexByQuestion = new Map((active.test?.questions ?? []).map((question, index) => [question.id, index]));
        const marked = new Set<number>();
        const seen = new Set<number>([0]);
        const restoredConfidence: Record<string, string> = {};
        for (const state of active.answerStates ?? []) {
          const index = indexByQuestion.get(state.questionId);
          if (typeof index !== "number") continue;
          if (state.markedForReview) marked.add(index);
          if (state.status && state.status !== "UNANSWERED") seen.add(index);
          if (state.confidence) restoredConfidence[state.questionId] = state.confidence;
        }
        setReview(marked);
        setVisited(seen);
        setConfidence(restoredConfidence);

        const restoredIndex = active.currentQuestionId ? indexByQuestion.get(active.currentQuestionId) : undefined;
        const sectionIndex = typeof active.sectionState?.currentIndex === "number" ? active.sectionState.currentIndex : undefined;
        setCurrent(clampIndex(typeof restoredIndex === "number" ? restoredIndex : typeof sectionIndex === "number" ? sectionIndex : 0, active.test?.questions?.length ?? 0));

        if (typeof window !== "undefined") localStorage.setItem("nidus_active_attempt", JSON.stringify(active));
      })
      .catch((error) => {
        const message = getApiErrorMessage(error);
        if (message.toLowerCase().includes("attempt not found")) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("nidus_active_attempt");
            localStorage.removeItem(`nidus_attempt_${attemptId}`);
          }
          showToast("This exam attempt is no longer available. Open the exam again from your dashboard.", "error");
          router.replace("/dashboard/student/exams");
          return;
        }
        showToast(message || "Attempt could not be loaded", "error");
      })
      .finally(() => setLoading(false));
  }, [attemptId, router, showToast]);

  useEffect(() => {
    if (!attemptId || !activeQuestion || !questions.length || submitMutation.isPending) return;
    const handle = window.setTimeout(() => {
      void autosaveAttempt({
        attemptId,
        currentQuestionId: activeQuestion.id,
        sectionState: { currentIndex: current, skippedMode },
        answers: questions.map((question, index) => ({
          questionId: question.id,
          selectedAnswer: answers[question.id],
          status: answers[question.id] ? "ANSWERED" : review.has(index) ? "REVIEW" : visited.has(index) ? "SKIPPED" : "UNANSWERED",
          confidence: confidence[question.id],
          markedForReview: review.has(index)
        }))
      }).then((serverAttempt) => {
        if (serverAttempt.submittedAt || serverAttempt.status === "SUBMITTED") {
          router.push(`/results/${attemptId}`);
          return;
        }
        setAttempt(serverAttempt as ActiveAttempt);
        if (typeof window !== "undefined") localStorage.setItem("nidus_active_attempt", JSON.stringify(serverAttempt));
      }).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(handle);
  }, [activeQuestion, answers, attemptId, confidence, current, questions, review, router, skippedMode, submitMutation.isPending, visited]);

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
    if (submitMutation.isPending) return;
    submitMutation.mutate({
      attemptId,
      answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })),
      timeTaken: Math.max(0, Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000))
    });
  }, [answers, attemptId, submitMutation]);

  if (loading) {
    return <EmptyState title="Loading exam" description="Restoring your answers and timer from the server." />;
  }

  if (!attempt || !activeQuestion) {
    return <EmptyState title="Attempt not loaded" description="Start a test from the test details page." />;
  }

  function selectAnswer(answer: string) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [activeQuestion.id]: answer }));
    setVisited((currentSet) => new Set(currentSet).add(current));
  }

  function clearResponse() {
    setAnswers((currentAnswers) => {
      const next = { ...currentAnswers };
      delete next[activeQuestion.id];
      return next;
    });
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
    setVisited((currentSet) => new Set(currentSet).add(current));
    goToQuestion(current + 1);
  }

  async function reviewSkipped() {
    const plan = await getReviewPlan(attemptId).catch(() => null);
    const nextId = plan?.aiReviewOrder[0] ?? questions.find((question) => !answers[question.id])?.id;
    const nextIndex = questions.findIndex((question) => question.id === nextId);
    if (nextIndex >= 0) {
      setSkippedMode(true);
      goToQuestion(nextIndex);
    }
  }

  return (
    <motion.div className="min-h-screen bg-[#f7f3ea] p-3 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <main className="space-y-5">
          <div className="flex flex-col justify-between gap-3 rounded-lg border border-[#d9c79d] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">CBT Exam Mode</p>
              <h1 className="mt-1 text-xl font-semibold text-[#071d36]">{attempt.test.title}</h1>
            </div>
            <Button type="button" variant="secondary" onClick={() => document.documentElement.requestFullscreen?.()}>
              Fullscreen
            </Button>
          </div>
          <QuestionCard question={activeQuestion} selectedAnswer={answers[activeQuestion.id]} onSelect={selectAnswer} />
          <div className="grid gap-3 rounded-lg border border-[#d9c79d] bg-white p-3 shadow-sm sm:grid-cols-4 lg:grid-cols-8">
            <Button type="button" variant="secondary" onClick={() => goToQuestion(current - 1)}>Previous</Button>
            <Button type="button" onClick={() => goToQuestion(current + 1)}>Next</Button>
            <Button type="button" variant="secondary" onClick={toggleReview}>Mark Review</Button>
            <Button type="button" variant="secondary" onClick={clearResponse}>Clear</Button>
            <Button type="button" variant="secondary" onClick={skipQuestion}>Skip</Button>
            <Button type="button" variant="secondary" onClick={reviewSkipped}>Skipped</Button>
            <Button type="button" variant="secondary" onClick={() => setConfidence((value) => ({ ...value, [activeQuestion.id]: value[activeQuestion.id] === "LOW" ? "HIGH" : "LOW" }))}>Confidence</Button>
            <Button type="button" onClick={() => setIsModalOpen(true)}>Submit</Button>
          </div>
        </main>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <TimerCard minutes={attempt.test.duration} remainingSeconds={attempt.timing?.remainingSeconds} onExpire={submit} />
          <div className="rounded-lg border border-[#d9c79d] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">Exam Summary</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-[#071d36]">
              <span className="rounded border px-3 py-2">Total {questions.length}</span>
              <span className="rounded border px-3 py-2">Answered {answeredIndexes.size}</span>
              <span className="rounded border px-3 py-2">Skipped {skippedIndexes.size}</span>
              <span className="rounded border px-3 py-2">Review {review.size}</span>
              <span className="rounded border px-3 py-2">Remaining {remaining}</span>
              <span className="rounded border px-3 py-2">Progress {progress}%</span>
            </div>
          </div>
          <OMRPalette
            total={questions.length}
            activeIndex={current}
            answered={answeredIndexes}
            marked={review}
            skipped={skippedIndexes}
            visited={visited}
            onSelect={goToQuestion}
          />
        </aside>
        <ReviewModal
          isOpen={isModalOpen}
          answered={Object.keys(answers).length}
          total={questions.length}
          marked={review.size}
          onClose={() => setIsModalOpen(false)}
          onSubmit={submit}
        />
      </div>
    </motion.div>
  );
}
