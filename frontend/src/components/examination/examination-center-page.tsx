"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, ClipboardCheck, FileSpreadsheet, Layers3, ListChecks, Upload, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/courses/empty-state";
import { SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { useTests } from "@/hooks/use-tests";
import { getApiErrorMessage } from "@/services/api";
import type { Test } from "@/types/test";

type ExaminationView = "dashboard" | "question-bank" | "exams" | "published" | "results" | "analytics";

const examTracks = ["NDA", "CDS", "AFCAT", "Agniveer", "SSC", "Weekly Tests", "Scholarship Exams"];
const topics = ["History", "Polity", "Geography", "Science", "Current Affairs", "Medieval India"];
const centerLinks = [
  { title: "Dashboard", href: "/examination-center" },
  { title: "Question Bank", href: "/examination-center/question-bank" },
  { title: "Exams", href: "/examination-center/exams" },
  { title: "Published Exams", href: "/examination-center/published" },
  { title: "Results", href: "/examination-center/results" },
  { title: "Analytics", href: "/examination-center/analytics" }
];

function countQuestions(tests: Test[]) {
  return tests.reduce((sum, test) => sum + (test._count?.questions ?? test.questions?.length ?? 0), 0);
}

function uniqueCount(values: Array<string | null | undefined>) {
  return new Set(values.filter(Boolean)).size;
}

function accuracyShell(index: number) {
  return [82, 71, 65, 58, 48, 76][index % 6];
}

export function ExaminationCenterPage({ view }: { view: ExaminationView }) {
  const { data: tests = [], isLoading, error } = useTests();
  const published = tests.filter((test) => test.isLive || test.status === "PUBLISHED");
  const drafts = tests.filter((test) => !test.isLive || ["DRAFT", "DRAFT_REVIEW", "REVIEW"].includes(test.status ?? ""));
  const attempts = tests.reduce((sum, test) => sum + (test._count?.attempts ?? 0), 0);

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_60%,#eef4f7_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6426]">Examination Center</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Defence CBT Examination Management</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#40516a]">
          Manage question bank, create exams, publish to batches, monitor results, and identify weak topics for NDA, CDS, AFCAT, Agniveer, SSC, weekly and scholarship exams.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/examination-center/exams">Create New Exam</Button>
          <Button href="/examination-center/question-bank" variant="secondary">Open Question Bank</Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {centerLinks.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-lg border border-[#071d36]/10 bg-white p-4 text-sm font-semibold text-[#071d36] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9913f]/45">
            {link.title}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Exams" value={String(tests.length)} note="Draft, mock and live exams" />
        <StatCard label="Published" value={String(published.length)} note="Visible/ready exams" />
        <StatCard label="Question Items" value={String(countQuestions(tests))} note="Current test-linked bank" />
        <StatCard label="Attempts" value={String(attempts)} note="Students appeared" />
      </section>

      {isLoading ? <div className="h-44 animate-pulse rounded-lg border border-[#071d36]/10 bg-white" /> : null}
      {error ? <EmptyState title="Unable to load Examination Center" description={getApiErrorMessage(error)} /> : null}
      {!isLoading && !error ? <ViewContent view={view} tests={tests} published={published} drafts={drafts} attempts={attempts} /> : null}
    </motion.div>
  );
}

function ViewContent({ view, tests, published, drafts, attempts }: { view: ExaminationView; tests: Test[]; published: Test[]; drafts: Test[]; attempts: number }) {
  if (view === "question-bank") return <QuestionBankView tests={tests} />;
  if (view === "exams") return <ExamsView tests={tests} drafts={drafts} />;
  if (view === "published") return <PublishedView tests={published} />;
  if (view === "results") return <ResultsView tests={tests} attempts={attempts} />;
  if (view === "analytics") return <AnalyticsView tests={tests} />;
  return <DashboardView tests={tests} published={published} drafts={drafts} />;
}

function DashboardView({ tests, published, drafts }: { tests: Test[]; published: Test[]; drafts: Test[] }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
        <SectionHeader eyebrow="Exam Tracks" title="Defence exam control room" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {examTracks.map((track) => (
            <Link key={track} href={`/examination-center/exams?track=${encodeURIComponent(track)}`} className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4 transition hover:-translate-y-0.5 hover:border-[#b9913f]/45">
              <p className="text-lg font-semibold text-[#071d36]">{track}</p>
              <p className="mt-1 text-xs text-[#64748b]">{tests.filter((test) => test.examType.toLowerCase().includes(track.toLowerCase())).length} exams</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
        <SectionHeader eyebrow="Workflow" title="Nidus exam workflow" />
        <div className="mt-5 grid gap-3">
          {["Basic information", "Select question bank", "Choose questions", "Preview exam", "Publish to batch"].map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#071d36] text-xs font-bold text-[#e7c873]">{index + 1}</span>
              <span className="text-sm font-semibold text-[#071d36]">{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatCard label="Drafts" value={String(drafts.length)} note="Need review" />
          <StatCard label="Live" value={String(published.length)} note="Ready/published" />
        </div>
      </div>
    </section>
  );
}

function QuestionBankView({ tests }: { tests: Test[] }) {
  const questionBank = tests.flatMap((test) => (test.questions ?? []).map((question) => ({ ...question, examType: test.examType, title: test.title })));
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard icon={<FileSpreadsheet className="h-6 w-6" />} title="Bulk Import" text="Excel/CSV template support will import question, options, answer, explanation, topic and difficulty." />
        <InfoCard icon={<Layers3 className="h-6 w-6" />} title="Topic Tree" text="Defence -> NDA -> History -> Medieval India, Polity, Geography, Science and Current Affairs." />
        <InfoCard icon={<Upload className="h-6 w-6" />} title="Nidus Upload Flow" text="Upload, validate, preview errors, then approve into Active question bank." />
      </div>
      <QuestionTable questions={questionBank.slice(0, 30)} />
    </section>
  );
}

function ExamsView({ tests, drafts }: { tests: Test[]; drafts: Test[] }) {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-[#071d36]/10 bg-white p-5">
        <SectionHeader eyebrow="Create Exam" title="NDA FOUNDATION TEST 01 pilot configuration" />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {["NDA", "Medieval India", "60 Minutes", "100 Questions", "Passing 50%", "Randomization Enabled", "No Negative Marking", "Draft"].map((item) => (
            <div key={item} className="rounded border border-[#071d36]/10 bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#071d36]">{item}</div>
          ))}
        </div>
        <Button href="/examination-center/exams" className="mt-5">Create Exam</Button>
      </div>
      <TestGrid tests={drafts.length ? drafts : tests} emptyTitle="No exam drafts yet" />
    </section>
  );
}

function PublishedView({ tests }: { tests: Test[] }) {
  return <TestGrid tests={tests} emptyTitle="No published exams yet" />;
}

function ResultsView({ tests, attempts }: { tests: Test[]; attempts: number }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <div className="rounded-lg border border-[#071d36]/10 bg-white p-5">
        <SectionHeader eyebrow="Results" title="Instant result engine" />
        <div className="mt-5 grid gap-3">
          {["Correct / Wrong / Skipped", "Percentage and Pass/Fail", "Rank and time taken", "Question explanations"].map((item) => (
            <div key={item} className="rounded border border-[#071d36]/10 bg-[#fffdf8] p-4 text-sm font-semibold text-[#071d36]">{item}</div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Students Appeared" value={String(attempts)} note="From current tests" />
        <StatCard label="Result Reports" value={String(attempts)} note="Instant reports generated" />
        <StatCard label="Exam Count" value={String(tests.length)} note="Available for result review" />
      </div>
    </section>
  );
}

function AnalyticsView({ tests }: { tests: Test[] }) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-[#071d36]/10 bg-white p-5">
        <SectionHeader eyebrow="Topic Analysis" title="Weak topic visibility" />
        <div className="mt-5 grid gap-3">
          {topics.map((topic, index) => (
            <div key={topic} className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#071d36]">{topic}</p>
                <p className="text-sm font-bold text-[#8a6426]">{accuracyShell(index)}%</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[#f7f3ea]">
                <div className="h-2 rounded-full bg-[#b9913f]" style={{ width: `${accuracyShell(index)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-[#071d36]/10 bg-white p-5">
        <SectionHeader eyebrow="Exam Analytics" title="Management view" />
        <div className="mt-5 grid gap-3">
          <StatCard label="Exam Categories" value={String(uniqueCount(tests.map((test) => test.examType)))} note="NDA, CDS, AFCAT and more" />
          <StatCard label="Topics" value={String(uniqueCount(tests.map((test) => test.topic)))} note="Tracked for weak-area analysis" />
          <StatCard label="Faculty Analytics" value="Ready" note="Will connect with teacher-created tests" />
        </div>
      </div>
    </section>
  );
}

function TestGrid({ tests, emptyTitle }: { tests: Test[]; emptyTitle: string }) {
  if (!tests.length) return <EmptyState title={emptyTitle} description="Use Create Exam to create the first exam." />;
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tests.map((test) => (
        <Link key={test.id} href={`/tests/${test.id}`} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6426]">{test.examType}</p>
          <h2 className="mt-3 text-xl font-semibold text-[#071d36]">{test.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#64748b]">{test.description}</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-xs font-semibold text-[#40516a]">
            <span className="rounded bg-[#fffdf8] px-2 py-2">{test.duration} min</span>
            <span className="rounded bg-[#fffdf8] px-2 py-2">{test._count?.questions ?? 0} Q</span>
            <span className="rounded bg-[#fffdf8] px-2 py-2">{test.isLive ? "Live" : test.status ?? "Draft"}</span>
          </div>
        </Link>
      ))}
    </section>
  );
}

function QuestionTable({ questions }: { questions: Array<{ id: string; questionText: string; topic: string; difficultyLevel: string; examType: string; title: string }> }) {
  if (!questions.length) return <EmptyState title="No test-linked questions loaded yet" description="Question Bank import will fill this central list in the next phase." />;
  return (
    <section className="rounded-lg border border-[#071d36]/10 bg-white p-5">
      <SectionHeader eyebrow="Question Bank" title="Current test-linked questions" action={`${questions.length} shown`} />
      <div className="mt-5 grid gap-3">
        {questions.map((question) => (
          <div key={question.id} className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
            <p className="text-sm font-semibold text-[#071d36]">{question.questionText}</p>
            <p className="mt-2 text-xs text-[#64748b]">{question.examType} - {question.topic} - {question.difficultyLevel}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
      <div className="grid h-11 w-11 place-items-center rounded bg-[#fff7de] text-[#8a6426]">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-[#071d36]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#64748b]">{text}</p>
    </div>
  );
}
