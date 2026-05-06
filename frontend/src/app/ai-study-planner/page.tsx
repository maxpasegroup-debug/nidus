"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIInsightCard } from "@/components/ai-planner/ai-insight-card";
import { StudyScheduleTimeline } from "@/components/ai-planner/study-schedule-timeline";
import { SectionHeader } from "@/components/dashboard";
import { useStudyPlan } from "@/hooks/use-ai-planner";

const topicOptions = ["Mathematics", "English", "Current Affairs", "Reasoning", "SSB Psychology", "Fitness"];

export default function AIStudyPlannerPage() {
  const { data: plan, isLoading, generate } = useStudyPlan();
  const [targetExam, setTargetExam] = useState("NDA");
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(4);
  const [targetDate, setTargetDate] = useState("");
  const [strengths, setStrengths] = useState<string[]>(["Reasoning"]);
  const [weaknesses, setWeaknesses] = useState<string[]>(["Mathematics"]);

  function toggle(list: string[], setter: (value: string[]) => void, topic: string) {
    setter(list.includes(topic) ? list.filter((item) => item !== topic) : [...list, topic]);
  }

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.055] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">AI Study Planner</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Smart preparation command system</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">Generate a focused plan from your target exam, time budget, strengths and weak areas.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
          <div className="grid gap-4">
            <label>
              <span className="text-sm text-ink">Target exam</span>
              <select value={targetExam} onChange={(event) => setTargetExam(event.target.value)} className="mt-2 h-12 w-full rounded border border-white/10 bg-navy-deep px-4 text-white">
                {["NDA", "CDS", "AFCAT", "SSB"].map((exam) => <option key={exam}>{exam}</option>)}
              </select>
            </label>
            <Input label="Study hours per day" type="number" value={studyHoursPerDay} onChange={(event) => setStudyHoursPerDay(Number(event.target.value))} />
            <Input label="Exam target date" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold text-white">Strengths</p>
            <div className="mt-3 flex flex-wrap gap-2">{topicOptions.map((topic) => <button key={topic} type="button" onClick={() => toggle(strengths, setStrengths, topic)} className={`rounded border px-3 py-2 text-sm ${strengths.includes(topic) ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-muted"}`}>{topic}</button>)}</div>
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold text-white">Weaknesses</p>
            <div className="mt-3 flex flex-wrap gap-2">{topicOptions.map((topic) => <button key={topic} type="button" onClick={() => toggle(weaknesses, setWeaknesses, topic)} className={`rounded border px-3 py-2 text-sm ${weaknesses.includes(topic) ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-muted"}`}>{topic}</button>)}</div>
          </div>
          <Button className="mt-6 w-full" disabled={generate.isPending || !targetDate} onClick={() => generate.mutate({ targetExam, studyHoursPerDay, targetDate, strengths, weaknesses })}>{generate.isPending ? "Generating..." : "Generate Plan"}</Button>
        </div>
        <div className="space-y-4">
          <AIInsightCard title="AI Predicting Officer Potential" body="Future-ready planner signals combine academic consistency, SSB psychology readiness, revision discipline and performance trend data." />
          <AIInsightCard title="Smart Weakness Detection" body="Weak topics are converted into revision missions with priority labels and follow-up practice blocks." />
          {isLoading ? <div className="h-64 animate-pulse rounded-lg bg-white/[0.06]" /> : <StudyScheduleTimeline plan={plan} />}
        </div>
      </section>
    </motion.div>
  );
}
