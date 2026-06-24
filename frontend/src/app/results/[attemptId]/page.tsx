"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Target, Trophy, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/courses/empty-state";
import { AnalysisCard } from "@/components/tests/analysis-card";
import { ResultChart } from "@/components/tests/result-chart";
import { SectionHeader } from "@/components/dashboard";
import { useResults } from "@/hooks/use-tests";
import { getApiErrorMessage } from "@/services/api";
import type { Question } from "@/types/test";

export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId ?? "";
  const { data, isLoading, error } = useResults(attemptId);

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg border border-[#d9c79d] bg-white" />;
  if (error || !data) return <EmptyState title="Unable to load result" description={getApiErrorMessage(error)} />;

  const questionCount = data.attempt.test._count?.questions ?? data.attempt.test.questions?.length ?? data.attempt.answers.length;
  const skipped = Math.max(0, questionCount - data.attempt.answers.length);
  const allQuestions = data.attempt.test.questions?.length ? data.attempt.test.questions : data.attempt.answers.map((answer) => answer.question);
  const answersByQuestion = new Map(data.attempt.answers.map((answer) => [answer.questionId, answer]));

  return (
    <motion.div className="space-y-8 bg-[#f7f3ea] p-4 text-[#071d36]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeader eyebrow="Result Command Report" title={data.attempt.test.title} action="Performance analysis" />
      <section className="grid gap-4 md:grid-cols-4">
        <AnalysisCard title="Total Score" value={`${data.attempt.score}/${data.attempt.test.totalMarks}`} note="Final score after negative marking" />
        <AnalysisCard title="Accuracy" value={`${data.analytics.accuracy}%`} note={`${data.attempt.totalCorrect} correct, ${data.attempt.totalWrong} wrong`} />
        <AnalysisCard title="Batch Rank" value={`#${data.analytics.batchRank}`} note={`Among ${data.analytics.rankedStudents} submitted students`} />
        <AnalysisCard title="Avg Time" value={`${data.analytics.timeAnalysis.averagePerQuestion}s`} note="Average time per attempted question" />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={<CheckCircle2 className="h-5 w-5" />} label="Correct" value={String(data.attempt.totalCorrect)} />
        <Metric icon={<XCircle className="h-5 w-5" />} label="Wrong" value={String(data.attempt.totalWrong)} />
        <Metric icon={<Target className="h-5 w-5" />} label="Skipped" value={String(skipped)} />
        <Metric icon={<Clock3 className="h-5 w-5" />} label="Time Taken" value={`${Math.round(data.attempt.timeTaken / 60)} min`} />
      </section>

      <ResultChart data={data.analytics.topicAnalysis} />

      <section className="rounded-lg border border-[#d9c79d] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-[#071d36]">Faculty released performance report</p>
            <p className="mt-2 text-sm leading-7 text-[#64748b]">{data.analytics.aiInsights}</p>
          </div>
          <span className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            <Trophy className="h-4 w-4" />
            Official Result
          </span>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader eyebrow="Review" title="Question paper, answer key and explanations" />
        {allQuestions.map((question, index) => {
          const answer = answersByQuestion.get(question.id);
          const isCorrect = Boolean(answer?.isCorrect);
          return (
          <div key={question.id} className="rounded-lg border border-[#d9c79d] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="max-w-4xl font-medium text-[#071d36]">Q{index + 1}. {question.questionText}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${answer ? isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                {answer ? isCorrect ? "Correct" : "Wrong" : "Skipped"}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {(["A", "B", "C", "D"] as const).map((option) => (
                <p key={option} className={`rounded-lg border px-3 py-2 ${question.correctAnswer === option ? "border-emerald-300 bg-emerald-50 font-black text-emerald-800" : answer?.selectedAnswer === option ? "border-red-300 bg-red-50 text-red-800" : "border-[#eadfca] bg-[#fbf8f1]"}`}>
                  {option}. {getOptionText(question, option)}
                </p>
              ))}
            </div>
            <p className={`mt-3 text-sm ${isCorrect ? "text-emerald-700" : answer ? "text-red-700" : "text-slate-600"}`}>
              Selected {answer?.selectedAnswer || "Skipped"} - Correct {question.correctAnswer}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{question.explanation}</p>
          </div>
        )})}
      </section>
    </motion.div>
  );
}

function getOptionText(question: Question, option: "A" | "B" | "C" | "D") {
  if (option === "A") return question.optionA;
  if (option === "B") return question.optionB;
  if (option === "C") return question.optionC;
  return question.optionD;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d9c79d] bg-white p-4 shadow-sm">
      <div className="text-[#b9913f]">{icon}</div>
      <p className="mt-3 text-sm font-semibold text-[#64748b]">{label}</p>
      <p className="mt-1 text-3xl font-black text-[#071d36]">{value}</p>
    </div>
  );
}
