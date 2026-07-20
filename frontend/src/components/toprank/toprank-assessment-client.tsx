"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { submitTopRankAssessment, type TopRankAssessmentPayload } from "@/services/toprank-assessment-service";
import { AssessmentStepper, ProgressHeader, QuestionCard } from "./toprank-components";

const steps = ["Academic", "Physical", "Learning", "Discipline", "Career"];
const inputClass = "min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]";

type Question = {
  key: string;
  label: string;
  type: "slider" | "number" | "radio" | "text";
  options?: string[];
};

const questions: Question[][] = [
  [
    { key: "mathematicsConfidence", label: "Mathematics confidence", type: "slider" },
    { key: "englishConfidence", label: "English confidence", type: "slider" },
    { key: "reasoningConfidence", label: "Reasoning confidence", type: "slider" },
    { key: "generalKnowledgeConfidence", label: "General Knowledge confidence", type: "slider" },
    { key: "currentAffairsConfidence", label: "Current Affairs confidence", type: "slider" },
    { key: "computerKnowledge", label: "Computer Knowledge", type: "slider" },
    { key: "previousMockScore", label: "Previous mock score percentage", type: "number" },
    { key: "previousCoaching", label: "Previous coaching", type: "radio", options: ["Yes", "No"] }
  ],
  [
    { key: "running1600mTiming", label: "1600m running timing in minutes", type: "number" },
    { key: "pushUps", label: "Push-ups count", type: "number" },
    { key: "sitUps", label: "Sit-ups count", type: "number" },
    { key: "heightCm", label: "Height in cm", type: "number" },
    { key: "weightKg", label: "Weight in kg", type: "number" },
    { key: "medicalStatus", label: "Medical status", type: "radio", options: ["Fit", "Minor", "Review", "Unfit"] },
    { key: "exerciseFrequency", label: "Exercise frequency", type: "slider" }
  ],
  [
    { key: "dailyStudyHours", label: "Daily study hours", type: "number" },
    { key: "preferredStudyTime", label: "Preferred study time", type: "radio", options: ["Morning", "Afternoon", "Night"] },
    { key: "learningStyle", label: "Learning style", type: "radio", options: ["Reading", "Watching", "Practicing", "Revision"] },
    { key: "revisionHabits", label: "Revision habits", type: "slider" },
    { key: "distractionLevel", label: "Distraction level", type: "slider" }
  ],
  [
    { key: "attendanceConsistency", label: "Attendance consistency", type: "slider" },
    { key: "goalClarity", label: "Goal clarity", type: "slider" },
    { key: "selfConfidence", label: "Self confidence", type: "slider" },
    { key: "timeManagement", label: "Time management", type: "slider" },
    { key: "motivation", label: "Motivation", type: "slider" },
    { key: "stressLevel", label: "Stress level", type: "slider" },
    { key: "commitment", label: "Commitment", type: "slider" }
  ],
  [
    { key: "preferredForce", label: "Preferred force", type: "radio", options: ["Army", "Navy", "Air Force", "General Defence"] },
    { key: "reasonForJoining", label: "Reason for joining", type: "text" },
    { key: "familySupport", label: "Family support", type: "slider" },
    { key: "targetExam", label: "Target exam", type: "radio", options: ["Agniveer", "NDA", "CDS", "AFCAT"] }
  ]
];

const defaults: TopRankAssessmentPayload = {
  mathematicsConfidence: 5,
  englishConfidence: 5,
  reasoningConfidence: 5,
  generalKnowledgeConfidence: 5,
  currentAffairsConfidence: 5,
  computerKnowledge: 5,
  previousMockScore: 50,
  running1600mTiming: 9,
  pushUps: 15,
  sitUps: 20,
  heightCm: 165,
  weightKg: 55,
  exerciseFrequency: 5,
  dailyStudyHours: 3,
  revisionHabits: 5,
  distractionLevel: 5,
  attendanceConsistency: 5,
  goalClarity: 5,
  selfConfidence: 5,
  timeManagement: 5,
  motivation: 5,
  stressLevel: 5,
  commitment: 5,
  familySupport: 5
};

export function TopRankAssessmentClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<TopRankAssessmentPayload>(defaults);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(key: string, value: string) {
    setAnswers((state) => ({ ...state, [key]: value }));
  }

  async function next() {
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await submitTopRankAssessment(answers);
      router.push("/toprank/student/apr");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <AssessmentStepper steps={steps} currentStep={step} />
      <div className="mt-6"><ProgressHeader current={step} total={steps.length} title={`${steps[step]} Assessment`} /></div>
      {error ? <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {questions[step].map((question) => (
          <QuestionCard key={question.key} title={question.label}>
            {question.type === "slider" ? (
              <div>
                <input type="range" min="1" max="10" value={String(answers[question.key] ?? 5)} onChange={(event) => update(question.key, event.target.value)} className="w-full accent-[#d6a447]" />
                <p className="mt-2 text-sm font-black text-[#f6d17a]">{String(answers[question.key] ?? 5)} / 10</p>
              </div>
            ) : null}
            {question.type === "number" ? <input type="number" value={String(answers[question.key] ?? "")} onChange={(event) => update(question.key, event.target.value)} className={inputClass} /> : null}
            {question.type === "text" ? <textarea value={String(answers[question.key] ?? "")} onChange={(event) => update(question.key, event.target.value)} className={`${inputClass} min-h-28 py-3`} /> : null}
            {question.type === "radio" ? (
              <div className="flex flex-wrap gap-2">
                {question.options?.map((option) => (
                  <button type="button" key={option} onClick={() => update(question.key, option)} className={`rounded-full border px-4 py-2 text-sm font-black ${answers[question.key] === option ? "border-[#d6a447] bg-[#d6a447] text-[#06120e]" : "border-white/12 text-white"}`}>{option}</button>
                ))}
              </div>
            ) : null}
          </QuestionCard>
        ))}
      </div>
      <div className="mt-8 flex justify-between gap-3">
        <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} className="min-h-12 rounded-full border border-white/12 px-6 text-sm font-bold text-white">Back</button>
        <button type="button" onClick={() => void next()} disabled={busy} className="min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e] disabled:opacity-60">{step === steps.length - 1 ? busy ? "Submitting" : "Submit Assessment" : "Continue"}</button>
      </div>
    </div>
  );
}

