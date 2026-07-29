"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Target, Trophy, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/courses/empty-state";
import { AnalysisCard } from "@/components/tests/analysis-card";
import { ResultChart } from "@/components/tests/result-chart";
import { SectionHeader } from "@/components/dashboard";
import { NidusMathText } from "@/components/exam/nidus-math-renderer";
import { useResults } from "@/hooks/use-tests";
import { getApiErrorMessage } from "@/services/api";
import type { Question } from "@/types/test";

export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId ?? "";
  const { data, isLoading, error } = useResults(attemptId);

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg border border-[#d9c79d] bg-white" />;
  if (error || !data) return <EmptyState title="Unable to load result" description={getApiErrorMessage(error)} />;

  if (data.resultsReleased === false || data.resultStatus === "PENDING_RELEASE") {
    const submittedAt = data.attempt.submittedAt
      ? new Date(data.attempt.submittedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
      : "Submitted";
    const questionCount = data.analytics.questionCount ?? data.attempt.test._count?.questions ?? data.attempt.test.questions?.length ?? 0;

    return (
      <motion.div className="space-y-6 bg-[#f7f3ea] p-4 text-[#071d36]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader eyebrow="Result Review" title={data.attempt.test.title} action="Pending faculty release" />
        <section className="rounded-lg border border-[#d9c79d] bg-white p-6 shadow-sm">
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Result under review
          </span>
          <h2 className="mt-5 text-2xl font-black">Your exam has been submitted.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#64748b]">
            The official score, rank, answer key, solved paper and explanations will appear here after faculty releases the result.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric icon={<CheckCircle2 className="h-5 w-5" />} label="Submission" value={submittedAt} />
            <Metric icon={<Target className="h-5 w-5" />} label="Questions" value={questionCount ? String(questionCount) : "Locked"} />
            <Metric icon={<Clock3 className="h-5 w-5" />} label="Time Taken" value={`${Math.round((data.attempt.timeTaken ?? 0) / 60)} min`} />
          </div>
        </section>
      </motion.div>
    );
  }

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
            <p className="font-semibold text-[#071d36]">Performance feedback</p>
            <p className="mt-2 text-sm leading-7 text-[#64748b]">{data.analytics.feedbackSummary || data.analytics.aiInsights}</p>
          </div>
          <span className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            <Trophy className="h-4 w-4" />
            Official Result
          </span>
        </div>
        {data.analytics.improvementAreas?.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {data.analytics.improvementAreas.slice(0, 6).map((area) => (
              <div key={area.topic} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{area.accuracy}% accuracy</p>
                <h3 className="mt-2 font-black text-[#071d36]">{area.topic}</h3>
                <p className="mt-2 text-sm leading-6 text-amber-900">{area.message}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <SectionHeader eyebrow="Review" title="Question paper, answer key and explanations" />
        {allQuestions.map((question, index) => {
          const answer = answersByQuestion.get(question.id);
          const isCorrect = Boolean(answer?.isCorrect);
          const visualNotes = Array.isArray(question.visualReviewNotes) ? question.visualReviewNotes.filter(Boolean) : [];
          return (
          <div key={question.id} className="rounded-lg border border-[#d9c79d] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="max-w-4xl font-medium text-[#071d36]">
                Q{index + 1}. <NidusMathText text={question.questionText} />
              </p>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${answer ? isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                {answer ? isCorrect ? "Correct" : "Wrong" : "Skipped"}
              </span>
            </div>
            {question.questionImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={question.questionImage} alt="" className="mt-4 max-h-80 w-auto rounded-lg border border-[#eadfca] object-contain" />
            ) : null}
            {visualNotes.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {visualNotes.map((note) => (
                  <span key={note} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">{note}</span>
                ))}
              </div>
            ) : null}
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {(["A", "B", "C", "D"] as const).map((option) => (
                <p key={option} className={`rounded-lg border px-3 py-2 ${question.correctAnswer === option ? "border-emerald-300 bg-emerald-50 font-black text-emerald-800" : answer?.selectedAnswer === option ? "border-red-300 bg-red-50 text-red-800" : "border-[#eadfca] bg-[#fbf8f1]"}`}>
                  {option}. <NidusMathText text={getOptionText(question, option)} />
                </p>
              ))}
            </div>
            <p className={`mt-3 text-sm ${isCorrect ? "text-emerald-700" : answer ? "text-red-700" : "text-slate-600"}`}>
              Selected {answer?.selectedAnswer || "Skipped"} - Correct {question.correctAnswer}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#64748b]"><NidusMathText text={question.explanation} /></p>
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
