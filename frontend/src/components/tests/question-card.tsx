"use client";

import { RichStudentQuestionRenderer } from "@/components/tests/rich-student-renderer";
import type { Question } from "@/types/test";

export function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  questionNumber,
  totalQuestions,
  visualNotes = []
}: {
  question: Question;
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  questionNumber?: number;
  totalQuestions?: number;
  visualNotes?: string[];
}) {
  return (
    <div className="rounded-lg border border-[#d9c79d] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded border border-[#b9913f]/35 bg-[#fff7de] px-3 py-1 font-semibold text-[#8a6426]">{question.topic}</span>
          <span className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-1 font-semibold text-[#64748b]">{question.difficultyLevel}</span>
          <span className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-1 font-semibold text-[#64748b]">+{question.marks} / -{question.negativeMarks}</span>
        </div>
        {questionNumber && totalQuestions ? (
          <span className="rounded-full border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-1 text-xs font-black text-[#071d36]">
            Question {questionNumber} of {totalQuestions}
          </span>
        ) : null}
      </div>
      <div className="mt-5">
        <RichStudentQuestionRenderer
          question={question}
          selectedAnswer={selectedAnswer}
          onSelect={onSelect}
          fallbackVisualNotes={visualNotes}
        />
      </div>
    </div>
  );
}
