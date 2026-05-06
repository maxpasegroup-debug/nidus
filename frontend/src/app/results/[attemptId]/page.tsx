"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/courses/empty-state";
import { AnalysisCard } from "@/components/tests/analysis-card";
import { ResultChart } from "@/components/tests/result-chart";
import { SectionHeader } from "@/components/dashboard";
import { useResults } from "@/hooks/use-tests";
import { getApiErrorMessage } from "@/services/api";

export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId ?? "";
  const { data, isLoading, error } = useResults(attemptId);

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/[0.06]" />;
  if (error || !data) return <EmptyState title="Unable to load result" description={getApiErrorMessage(error)} />;

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeader eyebrow="Result Command Report" title={data.attempt.test.title} action="Performance analysis" />
      <section className="grid gap-4 md:grid-cols-4">
        <AnalysisCard title="Total Score" value={`${data.attempt.score}/${data.attempt.test.totalMarks}`} note="Final score after negative marking" />
        <AnalysisCard title="Accuracy" value={`${data.analytics.accuracy}%`} note={`${data.attempt.totalCorrect} correct, ${data.attempt.totalWrong} wrong`} />
        <AnalysisCard title="Estimated Rank" value={`#${data.analytics.rankEstimation}`} note="Mock rank estimate" />
        <AnalysisCard title="Avg Time" value={`${data.analytics.timeAnalysis.averagePerQuestion}s`} note="Average time per attempted question" />
      </section>
      <ResultChart data={data.analytics.topicAnalysis} />
      <section className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <p className="font-semibold text-white">AI insights</p>
        <p className="mt-2 text-sm leading-7 text-muted">{data.analytics.aiInsights}</p>
      </section>
      <section className="space-y-3">
        <SectionHeader eyebrow="Review" title="Correct and wrong answers" />
        {data.attempt.answers.map((answer) => (
          <div key={answer.id} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
            <p className="font-medium text-white">{answer.question.questionText}</p>
            <p className={`mt-2 text-sm ${answer.isCorrect ? "text-emerald-200" : "text-red-200"}`}>
              Selected {answer.selectedAnswer} · Correct {answer.question.correctAnswer}
            </p>
            <p className="mt-2 text-sm text-muted">{answer.question.explanation}</p>
          </div>
        ))}
      </section>
    </motion.div>
  );
}
