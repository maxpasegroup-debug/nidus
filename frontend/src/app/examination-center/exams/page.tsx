"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpenCheck, CalendarClock, CheckCircle2, FileQuestion, Library, ListChecks, Sparkles, UsersRound } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { useTests } from "@/hooks/use-tests";
import { getAcademyBatches } from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";
import { createExamFromBank, getExaminationAnalytics, type ExamFromBankPayload } from "@/services/examination";
import type { Test } from "@/types/test";

const examTypes = ["NDA", "CDS", "AFCAT", "AGNIVEER", "AISSEE", "RIMC", "Internal Test", "Weekly Test"];

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

export default function ExaminationExamsPage() {
  return <SimpleDirectorExamBuilder />;
}

function SimpleDirectorExamBuilder() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: tests = [] } = useTests();
  const { data: batches = [] } = useQuery({ queryKey: ["academy", "batches", "active"], queryFn: () => getAcademyBatches({ status: "ACTIVE" }) });
  const { data: analytics } = useQuery({ queryKey: ["examination", "analytics"], queryFn: getExaminationAnalytics });
  const [form, setForm] = useState(initialForm);

  const recentTests = useMemo(() => tests.slice(0, 4), [tests]);
  const selectedBatches = batches.filter((batch) => form.batchIds.includes(batch.id));

  const createMutation = useMutation({
    mutationFn: (payload: ExamFromBankPayload) => createExamFromBank(payload),
    onSuccess: async () => {
      showToast("Exam created successfully", "success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tests"] }),
        queryClient.invalidateQueries({ queryKey: ["examination"] })
      ]);
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });

  function toggleBatch(batchId: string) {
    setForm((current) => ({
      ...current,
      batchIds: current.batchIds.includes(batchId) ? current.batchIds.filter((id) => id !== batchId) : [...current.batchIds, batchId]
    }));
  }

  function submitExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <main className="min-h-screen bg-[#f7f3ea] text-[#071d36]">
      <header className="border-b border-[#ded4c1] bg-white/72 px-6 py-4 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <Link href="/dashboard/director/exams" className="inline-flex items-center gap-2 text-sm font-bold text-[#465b78] hover:text-[#071d36]">
            <ArrowLeft className="h-4 w-4" /> Director exam control
          </Link>
          <div className="flex items-center gap-2">
            <Button href="/examination-center/question-bank" variant="secondary" size="sm">
              <Library className="h-4 w-4" /> Question Bank
            </Button>
            <Button href="/examination-center" variant="secondary" size="sm">Exam center</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1480px] gap-5 px-6 py-7 md:px-10">
        <div className="rounded-2xl border border-[#d9c79d] bg-white/86 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#b9913f]">Nidus AI Exams</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-[#071d36]">Create Exam</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-[#526783]">
                Choose exam details, select the batches and create. Nidus uses the active question bank and keeps the full CBT engine unchanged.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
              <MiniStat label="Questions" value={analytics?.totals.questionBank ?? 0} />
              <MiniStat label="Exams" value={analytics?.totals.exams ?? tests.length} />
              <MiniStat label="Batches" value={batches.length} />
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <form onSubmit={submitExam} className="rounded-2xl border border-[#d8cdb8] bg-white/90 p-5 shadow-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-[#e9d09d] bg-[#fff7df] p-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#071d36] shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b9913f]">Simple Flow</p>
                <p className="text-sm font-bold text-[#465b78]">Details, batches, create exam</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <Field label="Exam name" className="lg:col-span-2">
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="rounded-xl border border-[#d8cdb8] bg-white px-4 py-3 text-sm font-bold text-[#071d36] outline-none transition placeholder:text-[#94a3b8] focus:border-[#b9913f] focus:ring-2 focus:ring-[#f4dfaa] " />
              </Field>
              <Field label="Exam type">
                <select value={form.examType} onChange={(event) => setForm({ ...form, examType: event.target.value })} className="rounded-xl border border-[#d8cdb8] bg-white px-4 py-3 text-sm font-bold text-[#071d36] outline-none transition placeholder:text-[#94a3b8] focus:border-[#b9913f] focus:ring-2 focus:ring-[#f4dfaa] ">
                  {examTypes.map((exam) => <option key={exam}>{exam}</option>)}
                </select>
              </Field>
              <Field label="Subject">
                <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="rounded-xl border border-[#d8cdb8] bg-white px-4 py-3 text-sm font-bold text-[#071d36] outline-none transition placeholder:text-[#94a3b8] focus:border-[#b9913f] focus:ring-2 focus:ring-[#f4dfaa] " />
              </Field>
              <Field label="Topic">
                <input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} className="rounded-xl border border-[#d8cdb8] bg-white px-4 py-3 text-sm font-bold text-[#071d36] outline-none transition placeholder:text-[#94a3b8] focus:border-[#b9913f] focus:ring-2 focus:ring-[#f4dfaa] " />
              </Field>
              <Field label="Duration">
                <input type="number" min={1} value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} className="rounded-xl border border-[#d8cdb8] bg-white px-4 py-3 text-sm font-bold text-[#071d36] outline-none transition placeholder:text-[#94a3b8] focus:border-[#b9913f] focus:ring-2 focus:ring-[#f4dfaa] " />
              </Field>
              <Field label="Questions">
                <input type="number" min={1} value={form.totalQuestions} onChange={(event) => setForm({ ...form, totalQuestions: Number(event.target.value) })} className="rounded-xl border border-[#d8cdb8] bg-white px-4 py-3 text-sm font-bold text-[#071d36] outline-none transition placeholder:text-[#94a3b8] focus:border-[#b9913f] focus:ring-2 focus:ring-[#f4dfaa] " />
              </Field>
              <Field label="Total marks">
                <input type="number" min={1} value={form.totalMarks} onChange={(event) => setForm({ ...form, totalMarks: Number(event.target.value) })} className="rounded-xl border border-[#d8cdb8] bg-white px-4 py-3 text-sm font-bold text-[#071d36] outline-none transition placeholder:text-[#94a3b8] focus:border-[#b9913f] focus:ring-2 focus:ring-[#f4dfaa] " />
              </Field>
              <Field label="Short note" className="lg:col-span-2">
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="rounded-xl border border-[#d8cdb8] bg-white px-4 py-3 text-sm font-bold text-[#071d36] outline-none transition placeholder:text-[#94a3b8] focus:border-[#b9913f] focus:ring-2 focus:ring-[#f4dfaa]  resize-none" />
              </Field>
            </div>

            <div className="mt-5 rounded-2xl border border-[#e0d6c5] bg-[#fffdf8] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b9913f]">Publish To</p>
                  <h2 className="mt-1 text-xl font-black">Select batches</h2>
                </div>
                <label className="inline-flex items-center gap-2 rounded-xl border border-[#d8cdb8] bg-white px-4 py-2 text-sm font-bold text-[#071d36]">
                  <input type="checkbox" checked={form.publishNow} onChange={(event) => setForm({ ...form, publishNow: event.target.checked })} />
                  Publish immediately
                </label>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {batches.map((batch) => (
                  <button key={batch.id} type="button" onClick={() => toggleBatch(batch.id)} className={`rounded-xl border p-3 text-left transition ${form.batchIds.includes(batch.id) ? "border-[#b9913f] bg-[#fff4cf]" : "border-[#e0d6c5] bg-white hover:border-[#c6ad78]"}`}>
                    <span className="flex items-start gap-3">
                      <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border ${form.batchIds.includes(batch.id) ? "border-[#b9913f] bg-[#071d36] text-white" : "border-[#cbd5e1] text-transparent"}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-[#071d36]">{batch.name}</span>
                        <span className="block text-xs font-bold text-[#64748b]">{batch.course?.title ?? batch.programSlug}</span>
                      </span>
                    </span>
                  </button>
                ))}
                {!batches.length ? <p className="text-sm font-bold text-[#64748b]">No active batches found.</p> : null}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#d8cdb8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-bold text-[#465b78]">
                {selectedBatches.length ? `${selectedBatches.length} batch(es) selected` : "You can create a draft now and publish later."}
              </div>
              <Button type="submit" disabled={createMutation.isPending || !form.title.trim()}>
                <FileQuestion className="h-4 w-4" /> {createMutation.isPending ? "Creating..." : "Create Exam"}
              </Button>
            </div>
          </form>

          <aside className="grid gap-5 content-start">
            <div className="rounded-2xl border border-[#d8cdb8] bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b9913f]">Nidus AI Path</p>
              <div className="mt-4 grid gap-3">
                <Step icon={<BookOpenCheck className="h-4 w-4" />} title="Use active questions" />
                <Step icon={<UsersRound className="h-4 w-4" />} title="Choose batches" />
                <Step icon={<CalendarClock className="h-4 w-4" />} title="Publish now or later" />
                <Step icon={<ListChecks className="h-4 w-4" />} title="Students attempt in CBT" />
              </div>
            </div>

            <div className="rounded-2xl border border-[#d8cdb8] bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b9913f]">Recent Exams</p>
                <Link href="/examination-center/published" className="text-xs font-black text-[#071d36] underline-offset-4 hover:underline">View all</Link>
              </div>
              <div className="mt-4 grid gap-3">
                {recentTests.map((test) => <RecentExam key={test.id} test={test} />)}
                {!recentTests.length ? <p className="rounded-xl border border-dashed border-[#d8cdb8] p-4 text-sm font-bold text-[#64748b]">No exams created yet.</p> : null}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-xs font-black uppercase tracking-[0.2em] text-[#5f7089]">{label}</span>
      {children}
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e0d6c5] bg-[#fffdf8] px-4 py-3">
      <p className="text-2xl font-black text-[#071d36]">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5f7089]">{label}</p>
    </div>
  );
}

function Step({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e0d6c5] bg-[#fffdf8] p-3 text-sm font-black text-[#071d36]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef6ff] text-[#071d36]">{icon}</span>
      {title}
    </div>
  );
}

function RecentExam({ test }: { test: Test }) {
  return (
    <div className="rounded-xl border border-[#e0d6c5] bg-[#fffdf8] p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black text-[#071d36]">{test.title}</p>
        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#5f7089]">{test.status ?? "Draft"}</span>
      </div>
      <p className="mt-2 text-xs font-bold text-[#64748b]">{test.duration} min / {test._count?.questions ?? test.questions?.length ?? 0} questions</p>
    </div>
  );
}


