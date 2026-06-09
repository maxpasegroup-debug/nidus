"use client";

import Image from "next/image";
import type { Question } from "@/types/test";

const options = ["A", "B", "C", "D"] as const;

export function QuestionCard({
  question,
  selectedAnswer,
  onSelect
}: {
  question: Question;
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#d9c79d] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded border border-[#b9913f]/35 bg-[#fff7de] px-3 py-1 text-[#8a6426]">{question.topic}</span>
        <span className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-1 text-[#64748b]">{question.difficultyLevel}</span>
        <span className="rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-1 text-[#64748b]">+{question.marks} / -{question.negativeMarks}</span>
      </div>
      <h2 className="mt-5 text-xl font-semibold leading-8 text-[#071d36]">{question.questionText}</h2>
      {question.questionImage ? <Image src={question.questionImage} alt="" width={900} height={360} unoptimized className="mt-4 max-h-64 w-auto rounded border border-[#071d36]/10 object-contain" /> : null}
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
              <span className="font-semibold">{option}.</span> {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
