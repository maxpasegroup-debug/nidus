"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { AnnouncementCard, QuickActionCard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useCreateTest, useTests } from "@/hooks/use-tests";
import { getApiErrorMessage } from "@/services/api";
import type { TestPayload } from "@/services/tests";

const monthlyPlan = [
  { title: "Week 1", description: "Subject practice test with topic-level correction.", tag: "Practice" },
  { title: "Week 2", description: "Aptitude test covering reasoning, verbal, and numerical skills.", tag: "Aptitude" },
  { title: "Week 3", description: "Timed mock exam with rank and accuracy tracking.", tag: "Mock" },
  { title: "Week 4", description: "Growth report review with teacher remarks and AI action plan.", tag: "Report" }
];

export default function TestsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [examType, setExamType] = useState("");
  const [topic, setTopic] = useState("");
  const { data: tests = [], isLoading, error } = useTests({ search, examType, topic });
  const createTest = useCreateTest();
  const [aiPrompt, setAiPrompt] = useState("");
  const [draftQuestions, setDraftQuestions] = useState<NonNullable<TestPayload["questions"]>>([]);
  const examTypes = useMemo(() => Array.from(new Set(tests.map((test) => test.examType))), [tests]);
  const canCreateTests = user?.role === "ADMIN" || user?.role === "TEACHER";
  const liveTests = tests.filter((test) => test.isLive).length;
  const mockTests = tests.filter((test) => test.isMockTest).length;

  function handleCreateTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    createTest.mutate(
      {
        title: String(data.get("title") ?? ""),
        description: String(data.get("description") ?? ""),
        examType: String(data.get("examType") ?? ""),
        category: String(data.get("category") ?? ""),
        duration: Number(data.get("duration") ?? 60),
        totalMarks: Number(data.get("totalMarks") ?? 100),
        isMockTest: data.get("isMockTest") === "on",
        isLive: data.get("isLive") === "on"
      },
      {
        onSuccess: () => form.reset()
      }
    );
  }

  function generateDraftFromPrompt() {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    const lines = prompt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const topic = lines[0]?.replace(/^(create|make|generate)\s+/i, "").slice(0, 70) || "Teacher generated topic";
    const requestedCount = Math.min(30, Math.max(5, Number(prompt.match(/(\d+)\s*(mcq|question|questions)/i)?.[1] ?? 10)));
    const sourceLines = lines.length > 1 ? lines : [topic];
    const nextQuestions = Array.from({ length: requestedCount }).map((_, index) => {
      const source = sourceLines[index % sourceLines.length];
      return {
        questionText: `Q${index + 1}. ${source}?`,
        optionA: "Option A",
        optionB: "Option B",
        optionC: "Option C",
        optionD: "Option D",
        correctAnswer: "A",
        explanation: "Teacher should review and edit this explanation before publishing.",
        marks: 1,
        negativeMarks: 0,
        difficultyLevel: /hard|advanced/i.test(prompt) ? "HARD" : /easy|basic/i.test(prompt) ? "EASY" : "MEDIUM",
        topic
      };
    });
    setDraftQuestions(nextQuestions);
  }

  function handlePublishAiDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const publishAt = String(data.get("publishAt") ?? "");
    createTest.mutate(
      {
        title: String(data.get("title") ?? "NIDUS generated test"),
        description: `${String(data.get("description") ?? "Generated from teacher prompt.")}${publishAt ? ` Scheduled for ${publishAt}.` : ""}`,
        examType: String(data.get("examType") ?? "NIDUS"),
        category: "Teacher Generated",
        duration: Number(data.get("duration") ?? 45),
        totalMarks: draftQuestions.reduce((sum, question) => sum + question.marks, 0),
        isMockTest: true,
        isLive: Boolean(publishAt),
        questions: draftQuestions
      },
      {
        onSuccess: () => {
          form.reset();
          setAiPrompt("");
          setDraftQuestions([]);
        }
      }
    );
  }

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-gold/20 bg-white/[0.06] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Tests / Monthly Growth System</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Plan monthly exams and measure growth</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Run subject tests, aptitude tests, mock exams, leaderboards, weak-topic analysis, and monthly progress actions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Tests" value={String(tests.length)} note="Practice, mock and live tests" />
        <StatCard label="Mock Tests" value={String(mockTests)} note="Timed exam practice" />
        <StatCard label="Live Tests" value={String(liveTests)} note="Scheduled academy tests" />
        <StatCard label="Exam Tracks" value={String(examTypes.length)} note="Distinct exam categories" />
      </section>

      <SectionHeader eyebrow="Monthly Plan" title="Professional testing rhythm" />
      <section className="grid gap-4 md:grid-cols-4">
        {monthlyPlan.map((item) => (
          <AnnouncementCard key={item.title} title={item.title} description={item.description} tag={item.tag} />
        ))}
      </section>

      {canCreateTests ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-gold/20 bg-gold/10 p-5">
            <SectionHeader eyebrow="Teacher Exam Studio" title="Type or paste, then NIDUS arranges the test" action="Teacher/Admin" />
            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              className="min-h-44 w-full rounded border border-white/12 bg-navy-deep/80 p-4 text-sm leading-6 text-white outline-none placeholder:text-muted focus:border-gold"
              placeholder="Example: Create a 50 mark NDA Maths test on Trigonometry. Include 20 MCQs, medium difficulty, answer key and explanation. Or paste questions from ChatGPT here."
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={generateDraftFromPrompt} variant="secondary">Generate draft</Button>
              <Button type="button" onClick={() => setDraftQuestions([])} variant="secondary">Clear draft</Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">NIDUS arranges the teacher prompt into test questions. Teacher must review the draft before publishing.</p>
          </div>
          <form onSubmit={handlePublishAiDraft} className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
            <SectionHeader eyebrow="Publish Settings" title="Review, set time, publish" action={`${draftQuestions.length} questions`} />
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="title" label="Test title" placeholder="Trigonometry Monthly Test" required />
              <Input name="examType" label="Exam type" placeholder="NDA" required />
              <Input name="duration" label="Timer minutes" type="number" min="1" defaultValue={45} required />
              <Input name="publishAt" label="Publish date and time" type="datetime-local" />
              <Input name="description" label="Teacher note" placeholder="Generated from NIDUS prompt and reviewed by teacher." className="md:col-span-2" />
            </div>
            <Button type="submit" className="mt-5 w-full" disabled={draftQuestions.length === 0 || createTest.isPending}>{createTest.isPending ? "Publishing..." : "Publish generated test"}</Button>
          </form>
          {draftQuestions.length ? (
            <div className="lg:col-span-2 rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <SectionHeader eyebrow="Draft Preview" title="Questions NIDUS arranged" action="Review before publishing" />
              <div className="grid max-h-80 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                {draftQuestions.slice(0, 12).map((question, index) => (
                  <div key={`${question.questionText}-${index}`} className="rounded border border-white/10 bg-navy-deep/55 p-4">
                    <p className="text-sm font-semibold text-ink">{question.questionText}</p>
                    <p className="mt-2 text-xs text-muted">A. {question.optionA} | B. {question.optionB} | C. {question.optionC} | D. {question.optionD}</p>
                    <p className="mt-2 text-xs text-gold-soft">Answer: {question.correctAnswer} | {question.difficultyLevel}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {canCreateTests ? (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleCreateTest} className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
            <SectionHeader eyebrow="Exam Planner" title="Create blank test shell" action="Teacher/Admin" />
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="title" label="Test title" placeholder="May NDA Mathematics Test" required />
              <Input name="examType" label="Exam type" placeholder="NDA" required />
              <Input name="category" label="Category" placeholder="Monthly Test" required />
              <Input name="duration" label="Duration minutes" type="number" min="1" defaultValue={60} required />
              <Input name="totalMarks" label="Total marks" type="number" min="1" defaultValue={100} required />
              <Input name="description" label="Description" placeholder="Monthly test for subject growth tracking." required />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 text-sm text-muted"><input name="isMockTest" type="checkbox" className="h-4 w-4" defaultChecked /> Mock test</label>
              <label className="flex items-center gap-3 text-sm text-muted"><input name="isLive" type="checkbox" className="h-4 w-4" /> Live/scheduled test</label>
            </div>
            <Button type="submit" className="mt-5 w-full" disabled={createTest.isPending}>{createTest.isPending ? "Creating..." : "Create test"}</Button>
          </form>
          <div className="grid gap-4">
            <AnnouncementCard title="Leaderboard logic" description="Rank students by monthly score, batch rank, subject rank, and growth rank." tag="Rank" />
            <AnnouncementCard title="Growth score" description="Combine score, accuracy, speed, consistency, and improvement from previous month." tag="Growth" />
            <QuickActionCard title="Open progress reports" description="Review how test results become parent-friendly reports." href="/progress-reports" />
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-4 lg:grid-cols-[1fr_220px_220px]">
        <Input label="Search tests" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search NDA Mathematics..." />
        <label className="block">
          <span className="text-sm font-medium text-ink">Exam</span>
          <select value={examType} onChange={(event) => setExamType(event.target.value)} className="mt-2 h-12 w-full rounded border border-white/12 bg-navy-deep px-4 text-sm text-white">
            <option value="">All exams</option>
            {examTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <Input label="Topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Algebra, Polity..." />
      </div>

      <SectionHeader eyebrow="Available Tests" title="Mock and live tests" />
      {isLoading ? <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-lg border border-white/10 bg-white/[0.06]" />)}</div> : null}
      {error ? <EmptyState title="Unable to load tests" description={getApiErrorMessage(error)} /> : null}
      {!isLoading && !error ? (
        tests.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tests.map((test) => (
              <Link key={test.id} href={`/tests/${test.id}`} className="group rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-gold/35">
                <div className="flex items-center justify-between">
                  <span className="rounded border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{test.examType}</span>
                  <span className="text-xs text-muted">{test.isLive ? "Live" : test.isMockTest ? "Mock" : "Practice"}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-white">{test.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{test.description}</p>
                <div className="mt-5 flex justify-between text-sm text-muted">
                  <span>{test.duration} min</span>
                  <span>{test.totalMarks} marks</span>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <EmptyState title="No tests found" description="Try a different search or filter." />
        )
      ) : null}
    </motion.div>
  );
}
