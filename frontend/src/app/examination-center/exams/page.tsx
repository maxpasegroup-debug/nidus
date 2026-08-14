"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle2, FileQuestion, Library, PenLine, Send, Sparkles, Upload, UsersRound } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { getAcademyBatches } from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";
import { createExamFromBank, getExaminationAnalytics, publishExam, type ExamFromBankPayload } from "@/services/examination";
import type { Test } from "@/types/test";

const examTypes = ["NDA", "CDS", "AFCAT", "AGNIVEER", "AISSEE", "RIMC", "Internal Test", "Weekly Test"];
const fieldClasses = "h-11 rounded-xl border border-[#d8cdb8] bg-white px-3 text-sm font-bold text-[#071d36] outline-none transition placeholder:text-[#94a3b8] focus:border-[#b9913f] focus:ring-2 focus:ring-[#f4dfaa]";
const sourceRoutes = {
  UPLOAD_PAPER: "/dashboard/director/teaching/exams",
  MANUAL: "/tests"
} as const;

const initialForm = {
  title: "NDA Foundation Test 01",
  examType: "NDA",
  subject: "General Studies",
  topic: "Medieval India",
  duration: 60,
  totalQuestions: 25,
  totalMarks: 100,
  description: "Short assessment for the selected batches.",
  publishNow: false,
  batchIds: [] as string[]
};

type ExamCreateIssue = {
  title: string;
  message: string;
};

type QuestionSource = "UPLOAD_PAPER" | "QUESTION_BANK" | "MANUAL";

export default function ExaminationExamsPage() {
  return <SimpleDirectorExamBuilder />;
}

function SimpleDirectorExamBuilder() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: batches = [] } = useQuery({ queryKey: ["academy", "batches", "active"], queryFn: () => getAcademyBatches({ status: "ACTIVE" }) });
  const { data: analytics } = useQuery({ queryKey: ["examination", "analytics"], queryFn: getExaminationAnalytics });
  const [form, setForm] = useState(initialForm);
  const [createIssue, setCreateIssue] = useState<ExamCreateIssue | null>(null);
  const [questionSource, setQuestionSource] = useState<QuestionSource>("QUESTION_BANK");
  const [createdExam, setCreatedExam] = useState<Test | null>(null);

  const selectedBatches = batches.filter((batch) => form.batchIds.includes(batch.id));
  const readyQuestions = analytics?.totals.questionBank ?? analytics?.totals.questions ?? 0;
  const isBankSource = questionSource === "QUESTION_BANK";

  const createMutation = useMutation({
    mutationFn: (payload: ExamFromBankPayload) => createExamFromBank(payload),
    onMutate: () => setCreateIssue(null),
    onSuccess: async (exam) => {
      setCreatedExam(exam);
      showToast("Exam created successfully", "success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tests"] }),
        queryClient.invalidateQueries({ queryKey: ["examination"] })
      ]);
    },
    onError: (error) => {
      const issue = friendlyExamCreateIssue(error);
      setCreateIssue(issue);
      showToast(issue.title, "error");
    }
  });

  const publishMutation = useMutation({
    mutationFn: (examId: string) => publishExam(examId),
    onSuccess: async (exam) => {
      setCreatedExam(exam);
      showToast("Exam published successfully", "success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tests"] }),
        queryClient.invalidateQueries({ queryKey: ["examination"] })
      ]);
    },
    onError: (error) => {
      showToast(getApiErrorMessage(error) || "Nidus could not publish this exam yet.", "error");
    }
  });

  function toggleBatch(batchId: string) {
    setForm((current) => ({
      ...current,
      batchIds: current.batchIds.includes(batchId) ? current.batchIds.filter((id) => id !== batchId) : [...current.batchIds, batchId]
    }));
  }

  function submitExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isBankSource) return;
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      examType: form.examType,
      category: form.examType,
      subject: form.subject.trim(),
      topic: form.topic.trim(),
      duration: Number(form.duration),
      totalQuestions: Number(form.totalQuestions),
      marks: Number(form.totalMarks),
      batchIds: form.batchIds,
      publishNow: form.publishNow,
      randomization: true,
      questionSelection: "RANDOM",
      passingPercentage: 50
    });
  }

  return (
    <main className="mx-auto grid max-w-[1480px] gap-4 text-[#071d36]">
      <div className="flex flex-col gap-3 rounded-3xl border border-[#d8cdb8] bg-white/90 p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <Link href="/dashboard/director/exams" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#5f7089] hover:text-[#071d36]">
            <ArrowLeft className="h-4 w-4" /> Exam Control
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff7df] text-[#071d36] shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#b9913f]">Nidus AI Exams</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Create Exam</h1>
              <p className="mt-1 text-sm font-medium text-[#526783]">Choose a question source, select batches and finish in one place.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 xl:min-w-[360px]">
          <MiniStat label="Questions" value={readyQuestions} />
          <MiniStat label="Exams" value={analytics?.totals.exams ?? 0} />
          <MiniStat label="Batches" value={batches.length} />
        </div>
      </div>

      <form onSubmit={submitExam} className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-[#d8cdb8] bg-white/92 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e9d09d] bg-[#fff7df] p-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#b9913f]">Step 1</p>
              <h2 className="mt-1 text-lg font-black">Exam details</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button href="/examination-center/question-bank" variant="secondary" size="sm">
                <Library className="h-4 w-4" /> Question Bank
              </Button>
              <Button href="/dashboard/director/exams" variant="secondary" size="sm">Cancel</Button>
            </div>
          </div>

          {createIssue ? <ExamCreateIssueCard issue={createIssue} /> : null}

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Exam name" className="md:col-span-2 xl:col-span-2">
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className={fieldClasses} />
            </Field>
            <Field label="Exam type">
              <select value={form.examType} onChange={(event) => setForm({ ...form, examType: event.target.value })} className={fieldClasses}>
                {examTypes.map((exam) => <option key={exam}>{exam}</option>)}
              </select>
            </Field>
            <Field label="Subject">
              <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className={fieldClasses} />
            </Field>
            <Field label="Topic" className="md:col-span-2">
              <input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} className={fieldClasses} />
            </Field>
            <Field label="Duration">
              <input type="number" min={1} value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} className={fieldClasses} />
            </Field>
            <Field label="Marks">
              <input type="number" min={1} value={form.totalMarks} onChange={(event) => setForm({ ...form, totalMarks: Number(event.target.value) })} className={fieldClasses} />
            </Field>
            <Field label="Questions">
              <input type="number" min={1} value={form.totalQuestions} onChange={(event) => setForm({ ...form, totalQuestions: Number(event.target.value) })} className={fieldClasses} />
            </Field>
            <Field label="Short note" className="md:col-span-2 xl:col-span-3">
              <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={fieldClasses} />
            </Field>
          </div>

          <div className="mt-4 rounded-2xl border border-[#e0d6c5] bg-[#fffdf8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#b9913f]">Step 2</p>
                <h2 className="mt-1 text-lg font-black">Add questions</h2>
              </div>
              <p className="text-xs font-bold text-[#64748b]">Use the path that fits today exam.</p>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <QuestionSourceCard active={questionSource === "UPLOAD_PAPER"} icon={<Upload className="h-4 w-4" />} title="Upload paper" detail="AI import and review" onClick={() => setQuestionSource("UPLOAD_PAPER")} />
              <QuestionSourceCard active={questionSource === "QUESTION_BANK"} icon={<Library className="h-4 w-4" />} title="Question bank" detail={`${readyQuestions} ready questions`} onClick={() => setQuestionSource("QUESTION_BANK")} />
              <QuestionSourceCard active={questionSource === "MANUAL"} icon={<PenLine className="h-4 w-4" />} title="Create manually" detail="Open CBT builder" onClick={() => setQuestionSource("MANUAL")} />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#e0d6c5] bg-[#fffdf8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#b9913f]">Step 3</p>
                <h2 className="mt-1 text-lg font-black">Select batches</h2>
              </div>
              <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d8cdb8] bg-white px-4 text-sm font-black text-[#071d36]">
                <input type="checkbox" checked={form.publishNow} onChange={(event) => setForm({ ...form, publishNow: event.target.checked })} disabled={!isBankSource} />
                Publish now
              </label>
            </div>
            <div className="mt-3 grid max-h-[260px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 2xl:grid-cols-3">
              {batches.map((batch) => (
                <button key={batch.id} type="button" onClick={() => toggleBatch(batch.id)} className={`rounded-2xl border px-3 py-2.5 text-left transition ${form.batchIds.includes(batch.id) ? "border-[#b9913f] bg-[#fff4cf]" : "border-[#e0d6c5] bg-white hover:border-[#c6ad78]"}`}>
                  <span className="flex items-center gap-3">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${form.batchIds.includes(batch.id) ? "border-[#b9913f] bg-[#071d36] text-white" : "border-[#cbd5e1] text-transparent"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[#071d36]">{batch.name}</span>
                      <span className="block truncate text-xs font-bold text-[#64748b]">{batch.course?.title ?? batch.programSlug}</span>
                    </span>
                  </span>
                </button>
              ))}
              {!batches.length ? <p className="text-sm font-bold text-[#64748b]">No active batches found.</p> : null}
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-4">
          {createdExam ? (
            <ExamCreatedPanel
              exam={createdExam}
              selectedBatchCount={selectedBatches.length}
              publishNow={form.publishNow}
              isPublishing={publishMutation.isPending}
              onPublish={() => publishMutation.mutate(createdExam.id)}
              onCreateAnother={() => {
                setCreatedExam(null);
                setCreateIssue(null);
                setQuestionSource("QUESTION_BANK");
                setForm(initialForm);
              }}
            />
          ) : (
            <section className="rounded-3xl border border-[#d8cdb8] bg-white/92 p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#b9913f]">Step 4</p>
              <h2 className="mt-1 text-xl font-black">Finish</h2>
              <div className="mt-4 grid gap-2">
                <SummaryRow label="Source" value={sourceLabel(questionSource)} />
                <SummaryRow label="Questions" value={isBankSource ? `${form.totalQuestions} from active bank` : "Continue to source"} />
                <SummaryRow label="Duration" value={`${form.duration} min`} />
                <SummaryRow label="Marks" value={String(form.totalMarks)} />
                <SummaryRow label="Batches" value={selectedBatches.length ? `${selectedBatches.length} selected` : "Draft only"} />
                <SummaryRow label="Publish" value={form.publishNow && isBankSource ? "Immediately" : "Later"} />
              </div>
              {questionSource === "UPLOAD_PAPER" ? (
                <Button href={sourceRoutes.UPLOAD_PAPER} className="mt-4 w-full">
                  <Upload className="h-4 w-4" /> Continue to Upload
                </Button>
              ) : questionSource === "MANUAL" ? (
                <Button href={sourceRoutes.MANUAL} className="mt-4 w-full">
                  <PenLine className="h-4 w-4" /> Open Manual Builder
                </Button>
              ) : (
                <Button type="submit" disabled={createMutation.isPending || !form.title.trim()} className="mt-4 w-full">
                  <FileQuestion className="h-4 w-4" /> {createMutation.isPending ? "Creating..." : "Create Exam"}
                </Button>
              )}
              <p className="mt-3 text-xs font-bold leading-5 text-[#64748b]">If matching questions are not ready, Nidus will show clear next steps instead of a technical error.</p>
            </section>
          )}

          <section className="rounded-3xl border border-[#d8cdb8] bg-[#fffdf8] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eef6ff] text-[#071d36]">
                <UsersRound className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-black">Simple director flow</p>
                <p className="mt-1 text-sm font-bold leading-6 text-[#64748b]">Upload a paper, use ready questions or open the manual builder. Nidus keeps each path clear.</p>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </main>
  );
}

function sourceLabel(source: QuestionSource) {
  if (source === "UPLOAD_PAPER") return "Upload paper";
  if (source === "MANUAL") return "Manual builder";
  return "Question bank";
}

function friendlyExamCreateIssue(error: unknown): ExamCreateIssue {
  const rawMessage = getApiErrorMessage(error);
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("question bank") || normalized.includes("matched this exam selection") || normalized.includes("no active")) {
    return {
      title: "Nidus could not find ready questions for this exam.",
      message: "Open the question bank and add or activate questions for this subject, or return to Exam Control and choose another exam source. Your exam details are still on this page."
    };
  }

  if (normalized.includes("batch")) {
    return {
      title: "Please check the selected batch.",
      message: "Nidus could not complete the exam setup for the selected batch. Choose an active batch or create the exam as a draft first."
    };
  }

  return {
    title: "Nidus could not create the exam yet.",
    message: rawMessage || "Please review the exam details and try again."
  };
}

function QuestionSourceCard({ active, icon, title, detail, onClick }: { active: boolean; icon: ReactNode; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-3 text-left transition ${active ? "border-[#b9913f] bg-[#fff4cf] shadow-sm" : "border-[#e0d6c5] bg-white hover:border-[#c6ad78]"}`}>
      <span className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${active ? "bg-[#071d36] text-white" : "bg-[#f5f0e6] text-[#071d36]"}`}>{icon}</span>
        <span className="min-w-0">
          <span className="block text-sm font-black text-[#071d36]">{title}</span>
          <span className="mt-1 block text-xs font-bold leading-5 text-[#64748b]">{detail}</span>
        </span>
      </span>
    </button>
  );
}

function ExamCreatedPanel({ exam, selectedBatchCount, publishNow, isPublishing, onPublish, onCreateAnother }: { exam: Test; selectedBatchCount: number; publishNow: boolean; isPublishing: boolean; onPublish: () => void; onCreateAnother: () => void }) {
  const isPublished = exam.status === "PUBLISHED" || exam.isLive || publishNow;

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-950 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">Exam ready</p>
          <h2 className="mt-1 text-xl font-black text-[#071d36]">Exam created</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-emerald-900/80">{exam.title}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <SummaryRow label="Status" value={isPublished ? "Published" : "Saved as draft"} />
        <SummaryRow label="Batches" value={selectedBatchCount ? `${selectedBatchCount} selected` : "Draft only"} />
        <SummaryRow label="Questions" value={`${exam._count?.questions ?? 0} linked`} />
      </div>
      <div className="mt-4 grid gap-2">
        {!isPublished ? (
          <Button type="button" onClick={onPublish} disabled={isPublishing} className="w-full">
            <Send className="h-4 w-4" /> {isPublishing ? "Publishing..." : "Publish now"}
          </Button>
        ) : null}
        <Button href="/examination-center/published" variant="secondary" className="w-full">Open Published Exams</Button>
        <Button type="button" variant="secondary" onClick={onCreateAnother} className="w-full">Create Another Exam</Button>
      </div>
    </section>
  );
}

function ExamCreateIssueCard({ issue }: { issue: ExamCreateIssue }) {
  return (
    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-950" role="alert">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{issue.title}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-red-900/85">{issue.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button href="/examination-center/question-bank" variant="secondary" size="sm">Open Question Bank</Button>
            <Button href="/dashboard/director/exams" variant="secondary" size="sm">Back to Exam Control</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5f7089]">{label}</span>
      {children}
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e0d6c5] bg-[#fffdf8] px-3 py-2 text-center">
      <p className="text-xl font-black text-[#071d36]">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5f7089]">{label}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e0d6c5] bg-[#fffdf8] px-3 py-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[#5f7089]">{label}</span>
      <span className="text-sm font-black text-[#071d36]">{value}</span>
    </div>
  );
}
