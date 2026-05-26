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
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded border border-gold/25 bg-gold/10 px-3 py-1 text-gold">{question.topic}</span>
        <span className="rounded border border-white/10 bg-white/[0.05] px-3 py-1 text-muted">{question.difficultyLevel}</span>
        <span className="rounded border border-white/10 bg-white/[0.05] px-3 py-1 text-muted">+{question.marks} / -{question.negativeMarks}</span>
      </div>
      <h2 className="mt-5 text-xl font-semibold leading-8 text-white">{question.questionText}</h2>
      {question.questionImage ? <Image src={question.questionImage} alt="" width={900} height={360} unoptimized className="mt-4 max-h-64 w-auto rounded border border-white/10 object-contain" /> : null}
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
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-white/10 bg-white/[0.035] text-white hover:border-gold/30"
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
