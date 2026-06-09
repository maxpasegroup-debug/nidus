"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  FileSpreadsheet,
  Layers3,
  ListChecks,
  PlayCircle,
  ShieldCheck,
  Trophy
} from "lucide-react";
import { EmptyState, QuickActionCard, SectionHeader, StatCard } from "@/components/dashboard";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { useTests } from "@/hooks/use-tests";
import { getApiErrorMessage } from "@/services/api";
import { getAcademyBatches, type AcademyBatch } from "@/services/academy";
import {
  closeExam,
  createExamFromBank,
  createQuestionBankItem,
  deleteExam,
  deleteQuestionBankItem,
  getExaminationAnalytics,
  getExaminationResults,
  getQuestionBank,
  importQuestionBankCsv,
  publishExam,
  updateQuestionBankItem,
  type ExaminationAnalytics,
  type ExaminationResultAttempt,
  type QuestionBankItem,
  type QuestionBankPayload
} from "@/services/examination";
import type { Test } from "@/types/test";

type ExaminationView = "dashboard" | "question-bank" | "exams" | "published" | "results" | "analytics";

type ExaminationCenterShellProps = {
  view: ExaminationView;
};

const examTracks = ["NDA", "CDS", "AFCAT", "AGNIVEER", "SSC", "Weekly Tests", "Internal Mock Tests", "Scholarship Exams"];

const questionCategories = [
  { title: "NDA", topics: ["History / Medieval India", "Polity", "Geography", "Science", "Current Affairs"] },
  { title: "CDS", topics: ["English", "General Knowledge", "Elementary Mathematics", "Current Affairs"] },
  { title: "AFCAT", topics: ["Reasoning", "Military Aptitude", "Numerical Ability", "English"] },
  { title: "AGNIVEER", topics: ["Army", "Navy", "Air Force", "Physical Readiness"] },
  { title: "SSB", topics: ["OIR", "PPDT", "Psychology", "GTO", "Interview"] },
  { title: "Coast Guard", topics: ["Aptitude", "Reasoning", "English", "General Science"] }
];

const questionFields = [
  "Question ID",
  "Question Text",
  "Question Type",
  "Options A-D",
  "Correct Answer",
  "Explanation",
  "Topic",
  "Sub Topic",
  "Difficulty",
  "Marks",
  "Negative Marks",
  "Status",
  "Created By",
  "Created Date"
];

const creationSteps = [
  "Basic information",
  "Select question bank",
  "Choose questions",
  "Preview exam",
  "Publish to batch"
];

const auditCards = [
  {
    title: "CBT core ready",
    description: "Existing Test, Question, Attempt and CBT answer state models already support timed exam delivery."
  },
  {
    title: "Question bank foundation",
    description: "Current questions carry options, answer key, explanation, topic, difficulty, marks and negative marks."
  },
  {
    title: "Batch publishing base",
    description: "Tests already connect to batches. Multi-batch publishing and scheduling can be expanded in the next phase."
  },
  {
    title: "Instant result base",
    description: "Submission, scoring, review and topic analytics already exist and can be refined for defence exam reporting."
  }
];

function normalizeTrack(value?: string | null) {
  if (!value) return "Unmapped";
  return value.replace(/_/g, " ").toUpperCase();
}

function countQuestions(tests: Test[]) {
  return tests.reduce((total, test) => total + (test._count?.questions ?? test.questions?.length ?? 0), 0);
}

function countAttempts(tests: Test[]) {
  return tests.reduce((total, test) => total + (test._count?.attempts ?? 0), 0);
}

function groupByTrack(tests: Test[]) {
  return tests.reduce<Record<string, number>>((acc, test) => {
    const track = normalizeTrack(test.examType || test.category);
    acc[track] = (acc[track] ?? 0) + 1;
    return acc;
  }, {});
}

function getDraftTests(tests: Test[]) {
  return tests.filter((test) => test.status === "DRAFT" || test.status === "DRAFT_REVIEW" || !test.isLive);
}

function getPublishedTests(tests: Test[]) {
  return tests.filter((test) => test.isLive || test.status === "PUBLISHED");
}

function LoadingPanel() {
  return (
    <div className="rounded border border-[#d9c79d] bg-white/75 p-8 text-[#071d36] shadow-sm">
      Loading examination data...
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
      {message}
    </div>
  );
}

type ExamActions = {
  onPublish?: (id: string) => void;
  onClose?: (id: string) => void;
  onDelete?: (id: string) => void;
  busy?: boolean;
};

function TestList({ tests, emptyTitle, actions }: { tests: Test[]; emptyTitle: string; actions?: ExamActions }) {
  if (!tests.length) {
    return <EmptyState title={emptyTitle} description="Create or publish exams from the existing CBT engine when ready." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tests.map((test) => (
        <article key={test.id} className="rounded border border-[#d9c79d] bg-white/85 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border border-[#c79b3b]/35 bg-[#fff6d8] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#8a6426]">
              {normalizeTrack(test.examType || test.category)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f718a]">{test.status ?? "PUBLISHED"}</span>
          </div>
          <h3 className="mt-4 text-xl font-black text-[#071d36]">{test.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#506581]">{test.description}</p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <span className="rounded bg-[#f8f2e6] p-3 text-[#071d36]">{test.duration} min</span>
            <span className="rounded bg-[#f8f2e6] p-3 text-[#071d36]">{test._count?.questions ?? 0} questions</span>
            <span className="rounded bg-[#f8f2e6] p-3 text-[#071d36]">{test._count?.attempts ?? 0} attempts</span>
          </div>
          {actions ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {actions.onPublish && test.status !== "PUBLISHED" ? (
                <button disabled={actions.busy} onClick={() => actions.onPublish?.(test.id)} className="rounded border border-[#b9913f] bg-[#fff6d8] px-3 py-2 text-sm font-bold text-[#071d36]">
                  Publish
                </button>
              ) : null}
              {actions.onClose && test.status !== "CLOSED" ? (
                <button disabled={actions.busy} onClick={() => actions.onClose?.(test.id)} className="rounded border border-[#d9c79d] bg-white px-3 py-2 text-sm font-bold text-[#071d36]">
                  Close
                </button>
              ) : null}
              {actions.onDelete ? (
                <button disabled={actions.busy} onClick={() => actions.onDelete?.(test.id)} className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function DashboardView({ tests, analytics }: { tests: Test[]; analytics?: ExaminationAnalytics }) {
  const published = getPublishedTests(tests);
  const drafts = getDraftTests(tests);
  const attempts = countAttempts(tests);
  const questionBankTotal = analytics?.totals.questionBank ?? 0;

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Exams" value={String(tests.length)} note="Created CBT tests" />
        <StatCard label="Question Bank" value={String(questionBankTotal)} note="Reusable central pool" />
        <StatCard label="Published" value={String(published.length)} note="Live or assigned" />
        <StatCard label="Attempts" value={String(attempts)} note="Student submissions" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickActionCard title="Question Bank" description="Organize NDA, CDS, AFCAT, Agniveer, SSB and internal test questions." href="/examination-center/question-bank" />
        <QuickActionCard title="Create Exam" description="Use the existing CBT builder to create or review timed exams." href="/tests" />
        <QuickActionCard title="Published Exams" description="Check exams that are already visible for students and batches." href="/examination-center/published" />
      </section>

      <section className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
        <SectionHeader eyebrow="Phase 1 Audit" title="Existing engine readiness" />
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {auditCards.map((card) => (
            <div key={card.title} className="rounded border border-[#eadfca] bg-[#fffdf8] p-4">
              <CheckCircle2 className="h-5 w-5 text-[#b9913f]" />
              <h3 className="mt-3 font-black text-[#071d36]">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#506581]">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
        <SectionHeader eyebrow="Exam Tracks" title="Defence and internal examination structure" />
        <div className="mt-5 flex flex-wrap gap-3">
          {examTracks.map((track) => (
            <span key={track} className="rounded-full border border-[#c79b3b]/35 bg-[#fff6d8] px-4 py-2 text-sm font-bold text-[#071d36]">
              {track}
            </span>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-[#506581]">
          Phase 2 wires the Examination Center around the existing test engine. Deep question bank CRUD, multi-batch publishing and bulk imports should follow as backend schema phases.
        </p>
      </section>

      <section>
        <SectionHeader eyebrow="Draft Queue" title="Exams waiting for review or publishing" />
        <div className="mt-4">
          <TestList tests={drafts.slice(0, 4)} emptyTitle="No draft exams found" />
        </div>
      </section>
    </>
  );
}

function QuestionBankView({
  tests,
  questions,
  onCreate,
  onImport,
  onActivate,
  onDelete,
  busy
}: {
  tests: Test[];
  questions: QuestionBankItem[];
  onCreate: (payload: QuestionBankPayload) => void;
  onImport: (csvText: string) => void;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<QuestionBankPayload>({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: "",
    category: "Defence",
    subCategory: "NDA",
    topic: "Medieval India",
    subTopic: "",
    difficulty: "MEDIUM",
    marks: 1,
    negativeMarks: 0,
    status: "ACTIVE"
  });
  const [csvText, setCsvText] = useState("");

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate(form);
  }

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Central Bank" value={String(questions.length)} note="Reusable bank questions" />
        <StatCard label="CBT Questions" value={String(countQuestions(tests))} note="Already inside tests" />
        <StatCard label="Exam Categories" value={String(questionCategories.length)} note="Defence structure ready" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
          <SectionHeader eyebrow="Question Bank" title="Category and topic structure" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {questionCategories.map((category) => (
              <div key={category.title} className="rounded border border-[#eadfca] bg-[#fffdf8] p-4">
                <h3 className="font-black text-[#071d36]">Defence - {category.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {category.topics.map((topic) => (
                    <span key={topic} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#506581] shadow-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-[#d9c79d] bg-[#fff6d8] p-6 shadow-sm">
          <FileSpreadsheet className="h-8 w-8 text-[#b9913f]" />
          <h3 className="mt-4 text-xl font-black text-[#071d36]">Bulk question import</h3>
          <p className="mt-2 text-sm leading-6 text-[#506581]">
            Paste CSV with headers: questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, subCategory, topic, difficulty.
          </p>
          <textarea
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
            className="mt-4 min-h-40 w-full rounded border border-[#d9c79d] bg-white p-3 text-sm text-[#071d36]"
            placeholder="questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,subCategory,topic,difficulty"
          />
          <button disabled={busy || !csvText.trim()} onClick={() => onImport(csvText)} className="mt-4 rounded border border-[#b9913f] bg-[linear-gradient(135deg,#fff3bf,#e7c873,#b9913f)] px-5 py-3 text-sm font-black text-[#071d36]">
            Import CSV
          </button>
        </div>
      </section>

      <section className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
        <SectionHeader eyebrow="Add Question" title="Create a reusable question" />
        <form onSubmit={submitQuestion} className="mt-5 grid gap-4">
          <textarea value={form.questionText} onChange={(event) => setForm({ ...form, questionText: event.target.value })} required className="min-h-24 rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]" placeholder="Question text" />
          <div className="grid gap-3 md:grid-cols-4">
            {(["optionA", "optionB", "optionC", "optionD"] as const).map((key) => (
              <input key={key} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]" placeholder={key.replace("option", "Option ")} />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-6">
            <select value={form.correctAnswer} onChange={(event) => setForm({ ...form, correctAnswer: event.target.value })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]">
              {["A", "B", "C", "D"].map((answer) => <option key={answer}>{answer}</option>)}
            </select>
            <select value={form.subCategory} onChange={(event) => setForm({ ...form, subCategory: event.target.value })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]">
              {["NDA", "CDS", "AFCAT", "AGNIVEER", "SSB", "AIR FORCE", "NAVY", "ARMY", "COAST GUARD", "SSC"].map((exam) => <option key={exam}>{exam}</option>)}
            </select>
            <input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} required className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36] md:col-span-2" placeholder="Topic" />
            <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]">
              {["EASY", "MEDIUM", "HARD"].map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
            </select>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]">
              {["DRAFT", "ACTIVE"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <textarea value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} className="min-h-20 rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]" placeholder="Explanation for result report" />
          <button disabled={busy} className="w-fit rounded border border-[#b9913f] bg-[linear-gradient(135deg,#fff3bf,#e7c873,#b9913f)] px-6 py-3 text-sm font-black text-[#071d36]">
            Save Question
          </button>
        </form>
      </section>

      <section className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
        <SectionHeader eyebrow="Bank Items" title="Reusable questions" />
        <div className="mt-5 grid gap-3">
          {questions.slice(0, 20).map((question) => (
            <article key={question.id} className="rounded border border-[#eadfca] bg-[#fffdf8] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b9913f]">{question.subCategory} - {question.topic} - {question.difficulty}</span>
                <span className="rounded-full border border-[#d9c79d] px-3 py-1 text-xs font-bold text-[#071d36]">{question.status}</span>
              </div>
              <p className="mt-3 font-bold text-[#071d36]">{question.questionText}</p>
              <div className="mt-3 grid gap-2 text-sm text-[#506581] md:grid-cols-4">
                <span>A. {question.optionA}</span>
                <span>B. {question.optionB}</span>
                <span>C. {question.optionC}</span>
                <span>D. {question.optionD}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {question.status !== "ACTIVE" ? <button disabled={busy} onClick={() => onActivate(question.id)} className="rounded border border-[#b9913f] bg-[#fff6d8] px-3 py-2 text-xs font-black text-[#071d36]">Activate</button> : null}
                <button disabled={busy} onClick={() => onDelete(question.id)} className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">Delete</button>
              </div>
            </article>
          ))}
          {!questions.length ? <EmptyState title="No bank questions yet" description="Add one question or paste the CSV import template above." /> : null}
        </div>
      </section>

      <section className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
        <SectionHeader eyebrow="Required Fields" title="Question data model for Phase 3" />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {questionFields.map((field) => (
            <span key={field} className="rounded border border-[#eadfca] bg-[#fffdf8] px-4 py-3 text-sm font-bold text-[#071d36]">
              {field}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}

function ExamsView({
  tests,
  batches,
  onCreateExam,
  actions,
  busy
}: {
  tests: Test[];
  batches: AcademyBatch[];
  onCreateExam: (payload: Parameters<typeof createExamFromBank>[0]) => void;
  actions: ExamActions;
  busy: boolean;
}) {
  const [form, setForm] = useState({
    title: "NDA Foundation Test 01",
    description: "Medieval India foundation test for NDA aspirants.",
    examType: "NDA",
    category: "Defence",
    topic: "Medieval India",
    duration: 60,
    totalQuestions: 100,
    publishNow: false,
    batchIds: [] as string[]
  });

  function submitExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreateExam({ ...form, batchIds: form.batchIds, randomization: true, questionSelection: "RANDOM", passingPercentage: 50 });
  }

  function toggleBatch(batchId: string) {
    setForm((currentForm) => ({
      ...currentForm,
      batchIds: currentForm.batchIds.includes(batchId) ? currentForm.batchIds.filter((id) => id !== batchId) : [...currentForm.batchIds, batchId]
    }));
  }

  return (
    <>
      <section className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
        <SectionHeader eyebrow="Create New Exam" title="Professional exam creation workflow" />
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {creationSteps.map((step, index) => (
            <div key={step} className="rounded border border-[#eadfca] bg-[#fffdf8] p-4">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b9913f]">Step {index + 1}</span>
              <p className="mt-2 font-black text-[#071d36]">{step}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/tests">Create From CBT Builder</Button>
          <Button href="/examination-center/question-bank" variant="secondary">Review Question Bank</Button>
        </div>
      </section>
      <section className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
        <SectionHeader eyebrow="Create From Bank" title="Generate a CBT exam from active questions" />
        <form onSubmit={submitExam} className="mt-5 grid gap-4 md:grid-cols-6">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36] md:col-span-2" />
          <select value={form.examType} onChange={(event) => setForm({ ...form, examType: event.target.value })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]">
            {["NDA", "CDS", "AFCAT", "AGNIVEER", "SSC"].map((exam) => <option key={exam}>{exam}</option>)}
          </select>
          <input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]" />
          <input type="number" value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]" />
          <input type="number" value={form.totalQuestions} onChange={(event) => setForm({ ...form, totalQuestions: Number(event.target.value) })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36]" />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="rounded border border-[#d9c79d] bg-white p-3 text-[#071d36] md:col-span-4" />
          <label className="flex items-center gap-2 rounded border border-[#d9c79d] bg-white px-3 text-sm font-bold text-[#071d36]">
            <input type="checkbox" checked={form.publishNow} onChange={(event) => setForm({ ...form, publishNow: event.target.checked })} />
            Publish now
          </label>
          <button disabled={busy} className="rounded border border-[#b9913f] bg-[linear-gradient(135deg,#fff3bf,#e7c873,#b9913f)] px-5 py-3 text-sm font-black text-[#071d36]">
            Create Exam
          </button>
          <div className="md:col-span-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6426]">Publish to batches</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {batches.map((batch) => (
                <label key={batch.id} className="flex items-start gap-3 rounded border border-[#d9c79d] bg-[#fffdf8] p-3 text-sm font-bold text-[#071d36]">
                  <input type="checkbox" checked={form.batchIds.includes(batch.id)} onChange={() => toggleBatch(batch.id)} className="mt-1" />
                  <span>
                    {batch.name}
                    <span className="block text-xs font-medium text-[#64748b]">{batch.course?.title ?? batch.programSlug}</span>
                  </span>
                </label>
              ))}
              {!batches.length ? <p className="text-sm text-[#64748b]">No active batches found.</p> : null}
            </div>
          </div>
        </form>
      </section>
      <section>
        <SectionHeader eyebrow="Exam Plans" title="Draft and available exams" />
        <div className="mt-4">
          <TestList tests={tests} emptyTitle="No exams created yet" actions={actions} />
        </div>
      </section>
    </>
  );
}

function PublishedView({ tests, actions }: { tests: Test[]; actions: ExamActions }) {
  const published = getPublishedTests(tests);
  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Published Exams" value={String(published.length)} note="Visible or ready for students" />
        <StatCard label="Questions Assigned" value={String(countQuestions(published))} note="Across published exams" />
        <StatCard label="Attempts" value={String(countAttempts(published))} note="Captured submissions" />
      </section>
      <TestList tests={published} emptyTitle="No published exams found" actions={{ onClose: actions.onClose, onDelete: actions.onDelete, busy: actions.busy }} />
    </>
  );
}

function ResultsView({ tests, results }: { tests: Test[]; results: ExaminationResultAttempt[] }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Attempts" value={String(countAttempts(tests))} note="All CBT submissions" />
        <StatCard label="Result Reports" value="Instant" note="Score and review enabled" />
        <StatCard label="Rank View" value="Ready" note="Can be expanded by batch" />
        <StatCard label="AI Report" value="Next" note="Phase 7 enhancement" />
      </section>
      <section className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
        <SectionHeader eyebrow="Result Report" title="What students and Ritwik will see" />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {["Correct, wrong and skipped answers", "Percentage, pass/fail and rank", "Question analysis with explanations"].map((item) => (
            <div key={item} className="rounded border border-[#eadfca] bg-[#fffdf8] p-4 font-bold text-[#071d36]">
              {item}
            </div>
          ))}
        </div>
        <Button href="/progress-reports" className="mt-6">Open Reports</Button>
      </section>
      <section className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
        <SectionHeader eyebrow="Latest Submissions" title="Ritwik result review queue" />
        <div className="mt-5 grid gap-3">
          {results.slice(0, 12).map((attempt) => (
            <div key={attempt.id} className="grid gap-2 rounded border border-[#eadfca] bg-[#fffdf8] p-4 md:grid-cols-5">
              <span className="font-bold text-[#071d36]">{attempt.user.name}</span>
              <span className="text-[#506581] md:col-span-2">{attempt.test.title}</span>
              <span className="font-black text-[#b9913f]">{attempt.score}/{attempt.test.totalMarks}</span>
              <span className="text-[#506581]">{attempt.totalCorrect} correct</span>
            </div>
          ))}
          {!results.length ? <EmptyState title="No submitted attempts yet" description="Results will appear after students submit published exams." /> : null}
        </div>
      </section>
    </>
  );
}

function AnalyticsView({ tests, analytics }: { tests: Test[]; analytics?: ExaminationAnalytics }) {
  const byTrack = groupByTrack(tests);
  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Exam Types" value={String(Object.keys(byTrack).length)} note="Mapped tracks" />
        <StatCard label="Question Bank" value={String(analytics?.totals.questionBank ?? 0)} note="Reusable questions" />
        <StatCard label="Attempts" value={String(analytics?.totals.attempts ?? countAttempts(tests))} note="Student activity" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
          <SectionHeader eyebrow="Batch Analytics" title="Current exam distribution" />
          <div className="mt-5 space-y-3">
            {Object.entries(byTrack).map(([track, count]) => (
              <div key={track} className="flex items-center justify-between rounded border border-[#eadfca] bg-[#fffdf8] px-4 py-3">
                <span className="font-bold text-[#071d36]">{track}</span>
                <span className="text-sm font-black text-[#b9913f]">{count} exams</span>
              </div>
            ))}
            {!Object.keys(byTrack).length ? <EmptyState title="No exam analytics yet" description="Create tests to start seeing track-wise analytics." /> : null}
          </div>
        </div>

        <div className="rounded border border-[#d9c79d] bg-white/85 p-6 shadow-sm">
          <SectionHeader eyebrow="Question Analytics" title="Topic and difficulty intelligence" />
          <div className="mt-5 grid gap-3">
            {(analytics?.questionBankBreakdown ?? []).slice(0, 8).map((item) => (
              <div key={`${item.subCategory}-${item.topic}-${item.difficulty}-${item.status}`} className="rounded border border-[#eadfca] bg-[#fffdf8] px-4 py-3 font-bold text-[#071d36]">
                {item.subCategory} - {item.topic} - {item.difficulty}
                <span className="float-right text-[#b9913f]">{item._count._all}</span>
              </div>
            ))}
            {!analytics?.questionBankBreakdown?.length ? <EmptyState title="No question analytics yet" description="Add active question bank items to see topic and difficulty intelligence." /> : null}
          </div>
        </div>
      </section>
    </>
  );
}

const viewMeta: Record<ExaminationView, { eyebrow: string; title: string; description: string; icon: typeof ShieldCheck }> = {
  dashboard: {
    eyebrow: "Examination Center",
    title: "NIDUS Examination Command",
    description: "Manage defence exams, question bank, publishing, results and analytics from one simple control room.",
    icon: ShieldCheck
  },
  "question-bank": {
    eyebrow: "Central Bank",
    title: "Question Bank",
    description: "Structure NDA, CDS, AFCAT, Agniveer, SSB and internal questions with topics, difficulty, marks and explanations.",
    icon: Database
  },
  exams: {
    eyebrow: "Exam Builder",
    title: "Create and manage exams",
    description: "Use a clean workflow for exam information, question selection, preview and batch publishing.",
    icon: ListChecks
  },
  published: {
    eyebrow: "Student Access",
    title: "Published Exams",
    description: "Track exams that are visible to students or ready for batch-wise execution.",
    icon: PlayCircle
  },
  results: {
    eyebrow: "Performance",
    title: "Results and reports",
    description: "Review score, rank, attempts, explanations and report readiness.",
    icon: Trophy
  },
  analytics: {
    eyebrow: "Academic Intelligence",
    title: "Exam analytics",
    description: "Understand exam distribution now, and prepare for topic, question, difficulty and batch analytics.",
    icon: BarChart3
  }
};

export function ExaminationCenterShell({ view }: ExaminationCenterShellProps) {
  const { data: tests = [], isLoading, error } = useTests();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: questions = [], isLoading: questionsLoading } = useQuery({ queryKey: ["examination", "question-bank"], queryFn: getQuestionBank });
  const { data: results = [] } = useQuery({ queryKey: ["examination", "results"], queryFn: getExaminationResults });
  const { data: analytics } = useQuery({ queryKey: ["examination", "analytics"], queryFn: getExaminationAnalytics });
  const { data: batches = [] } = useQuery({ queryKey: ["academy", "batches", "active"], queryFn: () => getAcademyBatches({ status: "ACTIVE" }) });
  const meta = viewMeta[view];
  const Icon = meta.icon;

  async function refreshExamData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tests"] }),
      queryClient.invalidateQueries({ queryKey: ["examination"] })
    ]);
  }

  const createQuestionMutation = useMutation({
    mutationFn: createQuestionBankItem,
    onSuccess: async () => {
      showToast("Question saved to bank", "success");
      await refreshExamData();
    },
    onError: (mutationError) => showToast(getApiErrorMessage(mutationError), "error")
  });
  const importMutation = useMutation({
    mutationFn: importQuestionBankCsv,
    onSuccess: async (result) => {
      showToast(`${result.imported} questions imported`, "success");
      await refreshExamData();
    },
    onError: (mutationError) => showToast(getApiErrorMessage(mutationError), "error")
  });
  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<QuestionBankPayload> }) => updateQuestionBankItem(id, payload),
    onSuccess: async () => {
      showToast("Question updated", "success");
      await refreshExamData();
    },
    onError: (mutationError) => showToast(getApiErrorMessage(mutationError), "error")
  });
  const deleteQuestionMutation = useMutation({
    mutationFn: deleteQuestionBankItem,
    onSuccess: async () => {
      showToast("Question deleted", "success");
      await refreshExamData();
    },
    onError: (mutationError) => showToast(getApiErrorMessage(mutationError), "error")
  });
  const createExamMutation = useMutation({
    mutationFn: createExamFromBank,
    onSuccess: async () => {
      showToast("Exam created from question bank", "success");
      await refreshExamData();
    },
    onError: (mutationError) => showToast(getApiErrorMessage(mutationError), "error")
  });
  const publishMutation = useMutation({
    mutationFn: publishExam,
    onSuccess: async () => {
      showToast("Exam published", "success");
      await refreshExamData();
    },
    onError: (mutationError) => showToast(getApiErrorMessage(mutationError), "error")
  });
  const closeMutation = useMutation({
    mutationFn: closeExam,
    onSuccess: async () => {
      showToast("Exam closed", "success");
      await refreshExamData();
    },
    onError: (mutationError) => showToast(getApiErrorMessage(mutationError), "error")
  });
  const deleteExamMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: async () => {
      showToast("Exam deleted", "success");
      await refreshExamData();
    },
    onError: (mutationError) => showToast(getApiErrorMessage(mutationError), "error")
  });
  const busy =
    questionsLoading ||
    createQuestionMutation.isPending ||
    importMutation.isPending ||
    updateQuestionMutation.isPending ||
    deleteQuestionMutation.isPending ||
    createExamMutation.isPending ||
    publishMutation.isPending ||
    closeMutation.isPending ||
    deleteExamMutation.isPending;
  const examActions: ExamActions = {
    onPublish: (id) => publishMutation.mutate(id),
    onClose: (id) => closeMutation.mutate(id),
    onDelete: (id) => deleteExamMutation.mutate(id),
    busy
  };

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 py-8 text-[#071d36] md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded border border-[#d9c79d] bg-[radial-gradient(circle_at_top_right,rgba(199,155,59,0.16),transparent_32%),linear-gradient(135deg,#fffdf8,#f5efe2)] p-6 shadow-[0_22px_70px_rgba(7,29,54,0.12)] md:p-8"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c79b3b]/40 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#8a6426]">
                <Icon className="h-4 w-4" />
                {meta.eyebrow}
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-[#071d36] md:text-5xl">{meta.title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[#506581]">{meta.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button href="/tests">Open CBT Engine</Button>
              <Button href="/examination-center/question-bank" variant="secondary">Question Bank</Button>
            </div>
          </div>
        </motion.section>

        {isLoading ? <LoadingPanel /> : null}
        {error ? <ErrorPanel message={getApiErrorMessage(error)} /> : null}

        {!isLoading && !error ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
            {view === "dashboard" ? <DashboardView tests={tests} analytics={analytics} /> : null}
            {view === "question-bank" ? (
              <QuestionBankView
                tests={tests}
                questions={questions}
                onCreate={(payload) => createQuestionMutation.mutate(payload)}
                onImport={(csvText) => importMutation.mutate(csvText)}
                onActivate={(id) => updateQuestionMutation.mutate({ id, payload: { status: "ACTIVE" } })}
                onDelete={(id) => deleteQuestionMutation.mutate(id)}
                busy={busy}
              />
            ) : null}
            {view === "exams" ? <ExamsView tests={tests} batches={batches} onCreateExam={(payload) => createExamMutation.mutate(payload)} actions={examActions} busy={busy} /> : null}
            {view === "published" ? <PublishedView tests={tests} actions={examActions} /> : null}
            {view === "results" ? <ResultsView tests={tests} results={results} /> : null}
            {view === "analytics" ? <AnalyticsView tests={tests} analytics={analytics} /> : null}
          </motion.div>
        ) : null}

        <section className="rounded border border-[#d9c79d] bg-[#071d36] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2cf75]">Pilot target</p>
              <h2 className="mt-2 text-2xl font-black">NDA Foundation Test 01</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">Medieval India, 60 minutes, 100 questions, instant result and explanations.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <span className="rounded border border-white/15 bg-white/10 px-4 py-3"><Clock3 className="mb-2 h-4 w-4 text-[#f2cf75]" />60 min</span>
              <span className="rounded border border-white/15 bg-white/10 px-4 py-3"><ClipboardCheck className="mb-2 h-4 w-4 text-[#f2cf75]" />100 Q</span>
              <span className="rounded border border-white/15 bg-white/10 px-4 py-3"><Layers3 className="mb-2 h-4 w-4 text-[#f2cf75]" />Hybrid CBT</span>
              <span className="rounded border border-white/15 bg-white/10 px-4 py-3"><Trophy className="mb-2 h-4 w-4 text-[#f2cf75]" />Instant</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
