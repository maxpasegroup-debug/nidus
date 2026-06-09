"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Download, Target, XCircle } from "lucide-react";
import type { ReactNode } from "react";
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

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg border border-[#d9c79d] bg-white" />;
  if (error || !data) return <EmptyState title="Unable to load result" description={getApiErrorMessage(error)} />;

  const questionCount = data.attempt.test._count?.questions ?? data.attempt.test.questions?.length ?? data.attempt.answers.length;
  const skipped = Math.max(0, questionCount - data.attempt.answers.length);

  return (
    <motion.div className="space-y-8 bg-[#f7f3ea] p-4 text-[#071d36]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeader eyebrow="Result Command Report" title={data.attempt.test.title} action="Performance analysis" />
      <section className="grid gap-4 md:grid-cols-4">
        <AnalysisCard title="Total Score" value={`${data.attempt.score}/${data.attempt.test.totalMarks}`} note="Final score after negative marking" />
        <AnalysisCard title="Accuracy" value={`${data.analytics.accuracy}%`} note={`${data.attempt.totalCorrect} correct, ${data.attempt.totalWrong} wrong`} />
        <AnalysisCard title="Estimated Rank" value={`#${data.analytics.rankEstimation}`} note="Mock rank estimate" />
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#071d36]">AI performance guidance</p>
            <p className="mt-2 text-sm leading-7 text-[#64748b]">{data.analytics.aiInsights}</p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded border border-[#b9913f] bg-[linear-gradient(135deg,#fff3bf,#e7c873,#b9913f)] px-4 py-3 text-sm font-black text-[#071d36]">
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader eyebrow="Review" title="Correct and wrong answers" />
        {data.attempt.answers.map((answer) => (
          <div key={answer.id} className="rounded-lg border border-[#d9c79d] bg-white p-4 shadow-sm">
            <p className="font-medium text-[#071d36]">{answer.question.questionText}</p>
            <p className={`mt-2 text-sm ${answer.isCorrect ? "text-emerald-700" : "text-red-700"}`}>
              Selected {answer.selectedAnswer} - Correct {answer.question.correctAnswer}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{answer.question.explanation}</p>
          </div>
        ))}
      </section>
    </motion.div>
  );
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
