"use client";

import { NidusMathText, NidusQuestionContent } from "@/components/exam/nidus-math-renderer";
import type { Question } from "@/types/test";

const options = ["A", "B", "C", "D"] as const;

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
      <h2 className="mt-5 text-xl font-semibold leading-8 text-[#071d36]">
        <NidusQuestionContent content={question.contentJson} fallbackText={question.questionText} imageUrl={question.questionImage} />
      </h2>
      {visualNotes.length ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
          <p className="font-black">Read the question exactly as shown by your teacher.</p>
          <p className="mt-1">{visualNotes.join(" / ")}</p>
        </div>
      ) : null}
      <div className="mt-6 grid gap-3">
        {options.map((option) => {
          const text = question[`option${option}` as keyof Question] as string;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded border px-4 py-3 text-left transition ${
                selectedAnswer === option
                  ? "border-[#b9913f] bg-[#fff7de] text-[#071d36]"
                  : "border-[#071d36]/10 bg-[#fffdf8] text-[#071d36] hover:border-[#b9913f]/50"
              }`}
            >
              <span className="font-semibold">{option}.</span> <NidusMathText text={text} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
