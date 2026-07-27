"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Eye, ListChecks, Maximize2, RotateCcw, Send, ShieldCheck } from "lucide-react";
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

function visualNotesForQuestion(question?: Question) {
  if (!question) return [];
  const explicitNotes = Array.isArray(question.visualReviewNotes) ? question.visualReviewNotes.filter(Boolean) : [];
  if (explicitNotes.length) return explicitNotes;
  const text = [question.questionText, question.optionA, question.optionB, question.optionC, question.optionD].join(" ");
  return [
    question.questionImage ? "Diagram/image attached" : "",
    /\b(diagram|figure|fig\.|image|shown|following|above|below|circuit|ray diagram|map)\b/i.test(text) ? "Visual reference" : "",
    /\b(table|data table|tabular|column|row)\b/i.test(text) ? "Table/data reference" : "",
    /\b(graph|chart|bar graph|pie chart|line graph|plot)\b/i.test(text) ? "Graph/chart reference" : "",
    /\\frac|\^\s*\d|\b(sin|cos|tan|log|lim)\b|[a-z]\s*=\s*[^.,;]+/i.test(text) ? "Formula or symbol check" : "",
  ].filter(Boolean);
}

function autosaveLabel(state: "IDLE" | "SAVING" | "SAVED" | "OFFLINE") {
  if (state === "SAVING") return "Saving";
  if (state === "SAVED") return "Saved";
  if (state === "OFFLINE") return "Autosave retry";
  return "Autosave ready";
}

function StatusPill({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "ok" | "warn" }) {
  return (
    <span className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-black ${tone === "ok" ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100" : "border-amber-300/50 bg-amber-300/15 text-amber-100"}`}>
      {icon}
      {label}
    </span>
  );
}

function ExamMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6426]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#071d36]">{value}</p>
    </div>
  );
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
  const [autosaveState, setAutosaveState] = useState<"IDLE" | "SAVING" | "SAVED" | "OFFLINE">("IDLE");
  const [submitStarted, setSubmitStarted] = useState(false);
  const [focusWarnings, setFocusWarnings] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const questionEnteredAtRef = useRef<number>(Date.now());
  const timeSpentRef = useRef<Record<string, number>>({});

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
  const activeVisualNotes = useMemo(() => visualNotesForQuestion(activeQuestion), [activeQuestion]);
  const lowConfidenceCount = questions.filter((question) => confidence[question.id] === "LOW").length;
  const attemptedWithReview = new Set([...answeredIndexes, ...review]);
  const cleanRemaining = Math.max(0, questions.length - attemptedWithReview.size);

  function flushActiveQuestionTime() {
    if (!activeQuestion) return;
    const elapsed = Math.max(0, Math.round((Date.now() - questionEnteredAtRef.current) / 1000));
    timeSpentRef.current[activeQuestion.id] = (timeSpentRef.current[activeQuestion.id] ?? 0) + elapsed;
    questionEnteredAtRef.current = Date.now();
  }

  function goToQuestion(index: number) {
    flushActiveQuestionTime();
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
          if (typeof state.timeSpent === "number") timeSpentRef.current[state.questionId] = state.timeSpent;
        }
        setReview(marked);
        setVisited(seen);
        setConfidence(restoredConfidence);

        const restoredIndex = active.currentQuestionId ? indexByQuestion.get(active.currentQuestionId) : undefined;
        const sectionIndex = typeof active.sectionState?.currentIndex === "number" ? active.sectionState.currentIndex : undefined;
        setCurrent(clampIndex(typeof restoredIndex === "number" ? restoredIndex : typeof sectionIndex === "number" ? sectionIndex : 0, active.test?.questions?.length ?? 0));
        questionEnteredAtRef.current = Date.now();

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
      const liveTimeSpent = {
        ...timeSpentRef.current,
        [activeQuestion.id]: (timeSpentRef.current[activeQuestion.id] ?? 0) + Math.max(0, Math.round((Date.now() - questionEnteredAtRef.current) / 1000)),
      };
      setAutosaveState("SAVING");
      void autosaveAttempt({
        attemptId,
        currentQuestionId: activeQuestion.id,
        sectionState: { currentIndex: current, skippedMode },
        answers: questions.map((question, index) => ({
          questionId: question.id,
          selectedAnswer: answers[question.id],
          status: answers[question.id] ? "ANSWERED" : review.has(index) ? "REVIEW" : visited.has(index) ? "SKIPPED" : "UNANSWERED",
          confidence: confidence[question.id],
          markedForReview: review.has(index),
          timeSpent: liveTimeSpent[question.id] ?? 0,
        }))
      }).then((serverAttempt) => {
        if (serverAttempt.submittedAt || serverAttempt.status === "SUBMITTED") {
          router.push(`/results/${attemptId}`);
          return;
        }
        setAttempt(serverAttempt as ActiveAttempt);
        setAutosaveState("SAVED");
        if (typeof window !== "undefined") localStorage.setItem("nidus_active_attempt", JSON.stringify(serverAttempt));
      }).catch(() => setAutosaveState("OFFLINE"));
    }, 700);
    return () => window.clearTimeout(handle);
  }, [activeQuestion, answers, attemptId, confidence, current, questions, review, router, skippedMode, submitMutation.isPending, visited]);

  useEffect(() => {
    if (!attemptId) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setFocusWarnings((count) => count + 1);
        void logIntegrityEvent({ attemptId, eventType: "TAB_SWITCH", severity: "MEDIUM" });
      }
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
    if (submitMutation.isPending || submitStarted) return;
    flushActiveQuestionTime();
    setSubmitStarted(true);
    submitMutation.mutate({
      attemptId,
      answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })),
      timeTaken: Math.max(0, Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000))
    }, {
      onSuccess: () => {
        if (typeof window !== "undefined") localStorage.removeItem(`nidus_attempt_${attemptId}`);
        router.push(`/results/${attemptId}`);
      },
      onError: (error) => {
        setSubmitStarted(false);
        showToast(getApiErrorMessage(error) || "Unable to submit exam", "error");
      },
    });
  }, [answers, attemptId, router, showToast, submitMutation, submitStarted]);

  if (loading) {
    return <EmptyState title="Loading exam" description="Restoring your answers and timer from the server." />;
  }

  if (!attempt || !activeQuestion) {
    return <EmptyState title="Attempt not loaded" description="Start a test from the test details page." />;
  }

  function selectAnswer(answer: string) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [activeQuestion.id]: answer }));
    setVisited((currentSet) => new Set(currentSet).add(current));
    setReview((currentSet) => {
      if (!currentSet.has(current)) return currentSet;
      const next = new Set(currentSet);
      next.delete(current);
      return next;
    });
  }

  function clearResponse() {
    setAnswers((currentAnswers) => {
      const next = { ...currentAnswers };
      delete next[activeQuestion.id];
      return next;
    });
    setVisited((currentSet) => new Set(currentSet).add(current));
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
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[1fr_340px]">
        <main className="space-y-5">
          <div className="overflow-hidden rounded-lg border border-[#d9c79d] bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-[#d9c79d]/60 bg-[#071d36] p-4 text-white sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e0bd65]">Secure CBT Exam Mode</p>
                <h1 className="mt-1 text-xl font-black">{attempt.test.title}</h1>
                <p className="mt-1 text-sm text-white/70">{attempt.test.subject || "Exam"} / {attempt.test.topic || "General"} / {attempt.test.duration} minutes</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill icon={<ShieldCheck size={14} />} label={focusWarnings ? `${focusWarnings} focus alert${focusWarnings === 1 ? "" : "s"}` : "Focus active"} tone={focusWarnings ? "warn" : "ok"} />
                <StatusPill icon={autosaveState === "OFFLINE" ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />} label={autosaveLabel(autosaveState)} tone={autosaveState === "OFFLINE" ? "warn" : "ok"} />
                <button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-black text-white">
                  <Maximize2 size={15} /> Fullscreen
                </button>
              </div>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-4">
              <ExamMetric label="Answered" value={`${answeredIndexes.size}/${questions.length}`} />
              <ExamMetric label="Remaining" value={remaining} />
              <ExamMetric label="Review" value={review.size} />
              <ExamMetric label="Confidence flags" value={lowConfidenceCount} />
            </div>
            <div className="h-2 bg-[#f7f3ea]">
              <div className="h-full bg-[#b9913f] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <QuestionCard
            question={activeQuestion}
            selectedAnswer={answers[activeQuestion.id]}
            onSelect={selectAnswer}
            questionNumber={current + 1}
            totalQuestions={questions.length}
            visualNotes={activeVisualNotes}
          />
          <div className="grid gap-3 rounded-lg border border-[#d9c79d] bg-white p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-8">
            <Button type="button" variant="secondary" onClick={() => goToQuestion(current - 1)}>Previous</Button>
            <Button type="button" onClick={() => goToQuestion(current + 1)}>Next</Button>
            <Button type="button" variant={review.has(current) ? "primary" : "secondary"} onClick={toggleReview}><Eye className="mr-2 h-4 w-4" />Review</Button>
            <Button type="button" variant="secondary" onClick={clearResponse}><RotateCcw className="mr-2 h-4 w-4" />Clear</Button>
            <Button type="button" variant="secondary" onClick={skipQuestion}>Skip</Button>
            <Button type="button" variant="secondary" onClick={reviewSkipped}><ListChecks className="mr-2 h-4 w-4" />Skipped</Button>
            <Button type="button" variant={confidence[activeQuestion.id] === "LOW" ? "primary" : "secondary"} onClick={() => setConfidence((value) => ({ ...value, [activeQuestion.id]: value[activeQuestion.id] === "LOW" ? "HIGH" : "LOW" }))}>Confidence</Button>
            <Button type="button" onClick={() => setIsModalOpen(true)} disabled={submitMutation.isPending || submitStarted}><Send className="mr-2 h-4 w-4" />Submit</Button>
          </div>
          {cleanRemaining ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              {cleanRemaining} question(s) are neither answered nor marked for review. Use the palette before final submit.
            </p>
          ) : null}
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
            <p className="mt-3 rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-2 text-xs font-semibold leading-5 text-[#64748b]">
              Result, answer key and explanations stay locked until faculty publishes the official result.
            </p>
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
          skipped={skippedIndexes.size}
          submitting={submitMutation.isPending || submitStarted}
          onClose={() => setIsModalOpen(false)}
          onSubmit={submit}
        />
      </div>
    </motion.div>
  );
}
