"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";
import { ArrowLeft, Check, FileText, Loader2, Plus, Upload, X } from "lucide-react";
import { useAcademyBatches } from "@/hooks/use-academy";
import { useTests } from "@/hooks/use-tests";
import { apiClient, getApiErrorMessage } from "@/services/api";
import type { AcademyBatch } from "@/services/academy";
import type { Test } from "@/types/test";

type Stage = "home" | "details" | "preview" | "published";
type UploadKind = "QUESTION_PAPER" | "ANSWER_KEY";
type PaperQuestion = { questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; explanation: string; marks: number; negativeMarks: number; difficultyLevel: string; topic: string; reviewStatus: string };
type UploadRecord = { id: string; importJobId?: string | null; originalName?: string };

const emptyQuestion = (): PaperQuestion => ({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "", explanation: "", marks: 1, negativeMarks: 0, difficultyLevel: "MEDIUM", topic: "", reviewStatus: "NEEDS_REVIEW" });
const countStudents = (batch?: AcademyBatch) => batch?._count?.students ?? batch?.students?.length ?? 0;
const statusLabel = (test: Test) => test.status === "PUBLISHED" && test.isLive ? "LIVE" : test.status === "CLOSED" ? "COMPLETED" : test.status === "PUBLISHED" ? "UPCOMING" : "DRAFT";

function FileChoice({ label, hint, file, onChange }: { label: string; hint: string; file?: UploadRecord; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="flex min-h-28 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 hover:border-[#0b5d8f]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-[#0b5d8f] shadow-sm"><Upload size={18} /></span><span className="min-w-0"><span className="block text-sm font-bold text-slate-900">{file ? "File selected" : label}</span><span className="mt-1 block truncate text-xs text-slate-500">{file?.originalName || hint}</span></span><input type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={onChange} /></label>;
}

function ExamRow({ test }: { test: Test }) {
  return <article className="border-b border-slate-200 py-4 last:border-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{test.title}</h3><p className="mt-1 text-sm text-slate-500">{test.subject || test.examType} - {test.batchId ? "Assigned class" : "No class selected"}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">{statusLabel(test)}</span></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><span>{test.questions?.length ?? test._count?.questions ?? 0} questions</span><span>{test.totalMarks} marks</span><span>{test.duration} minutes</span></div><Link href={`/tests/${test.id}`} className="mt-3 inline-block text-sm font-bold text-[#0b5d8f]">Open exam</Link></article>;
}

export function SimpleExamStudio() {
  const testsQuery = useTests();
  const batchQuery = useAcademyBatches({ status: "ACTIVE" }, true);
  const tests = useMemo(() => testsQuery.data || [], [testsQuery.data]);
  const batches = useMemo(() => batchQuery.data || [], [batchQuery.data]);
  const [stage, setStage] = useState<Stage>("home");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(40);
  const [batchId, setBatchId] = useState("");
  const [questionPaper, setQuestionPaper] = useState<UploadRecord>();
  const [solutionPaper, setSolutionPaper] = useState<UploadRecord>();
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [publishedTest, setPublishedTest] = useState<Test>();
  const selectedBatch = batches.find((batch) => batch.id === batchId);
  const ready = questions.filter((question) => question.questionText && question.correctAnswer && question.explanation).length;

  function reset() { setStage("home"); setTitle(""); setSubject(""); setDuration(40); setBatchId(""); setQuestionPaper(undefined); setSolutionPaper(undefined); setQuestions([]); setConfirmed(false); setPublishedTest(undefined); setError(""); }

  async function uploadFile(event: ChangeEvent<HTMLInputElement>, kind: UploadKind) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.docx?$/i.test(file.name)) { setError("Please upload a Word document (.doc or .docx)."); return; }
    if (!batchId || !subject.trim()) { setError("Choose the class and subject before uploading documents."); return; }
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.append("file", file); form.append("sourceKind", kind); form.append("batchId", batchId); form.append("subject", subject.trim());
      const response = await apiClient.post<{ upload: UploadRecord }>("/academy/exams/uploads", form, { headers: { "Content-Type": "multipart/form-data" } });
      const record = { ...response.data.upload, originalName: file.name };
      if (kind === "QUESTION_PAPER") setQuestionPaper(record); else setSolutionPaper(record);
    } catch (uploadError) { setError(getApiErrorMessage(uploadError)); } finally { setBusy(false); }
  }

  async function continueToPreview() {
    if (!title.trim() || !subject.trim() || !batchId) { setError("Enter the exam name, subject and class first."); return; }
    if (!questionPaper || !solutionPaper) { setError("Upload both the question paper and the solutions Word document."); return; }
    setBusy(true); setError("");
    try {
      const uploadIds = [questionPaper.id, solutionPaper.id];
      const importJobIds = [questionPaper.importJobId, solutionPaper.importJobId].filter(Boolean);
      const response = await apiClient.post<{ reconstruction?: { draft?: { questions?: Array<Record<string, unknown>> } } }>("/academy/exams/import/reconstruct", { batchId, subject, examUploadIds: uploadIds, importJobIds });
      const extracted = response.data.reconstruction?.draft?.questions || [];
      const mapped = extracted.map((item) => {
        const options = Array.isArray(item.options) ? item.options as Array<{ label?: string; text?: string }> : [];
        const option = (label: string) => options.find((entry) => String(entry.label || "").toUpperCase() === label)?.text || "";
        return { ...emptyQuestion(), questionText: String(item.questionText || item.text || ""), optionA: option("A"), optionB: option("B"), optionC: option("C"), optionD: option("D"), correctAnswer: String(item.linkedAnswer || "").toUpperCase(), explanation: String(item.linkedSolution || ""), topic: subject.trim(), reviewStatus: String(item.reviewStatus || "NEEDS_REVIEW") };
      });
      if (!mapped.length) throw new Error("The paper could not be reconstructed into questions yet. Please review it in the document review workspace.");
      setQuestions(mapped); setConfirmed(false); setStage("preview");
    } catch (previewError) { setError(getApiErrorMessage(previewError)); } finally { setBusy(false); }
  }

  async function publish() {
    if (!questions.length || ready !== questions.length) { setError("Every question must have an answer and solution before publishing."); return; }
    setBusy(true); setError("");
    try {
      const response = await apiClient.post<{ test: Test }>("/academy/exams", { title: title.trim(), topic: subject.trim(), subject: subject.trim(), batchId, durationMinutes: duration, manualPaperReview: true, examUploadIds: [questionPaper?.id, solutionPaper?.id], draft: { schema: "NIDUS_AI_RECONSTRUCTION_DRAFT_V1", manualPaperReview: true, questions: questions.map((question, index) => ({ number: index + 1, ...question })) } });
      setPublishedTest(response.data.test); setStage("published");
    } catch (publishError) { setError(getApiErrorMessage(publishError)); } finally { setBusy(false); }
  }

  if (stage === "published") return <main className="mx-auto max-w-2xl px-4 py-12 md:px-8"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white"><Check /></span><h1 className="mt-4 text-2xl font-bold text-emerald-950">Exam published</h1><p className="mt-2 text-sm text-emerald-900">{countStudents(selectedBatch)} students can now access {publishedTest?.title || "this exam"}.</p><div className="mt-6 flex justify-center gap-3"><Link href={publishedTest ? `/tests/${publishedTest.id}` : "/tests"} className="rounded-lg bg-[#0b3558] px-4 py-2.5 text-sm font-bold text-white">View exam</Link><button type="button" onClick={reset} className="rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-900">Done</button></div></div></main>;

  if (stage === "home") return <main className="mx-auto max-w-5xl px-4 py-8 md:px-8"><header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5"><div><p className="text-sm font-semibold text-[#0b5d8f]">Exams</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Create, manage and review your exams.</h1></div><button type="button" onClick={() => setStage("details")} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0b3558] px-4 text-sm font-bold text-white"><Plus size={17} /> Create exam</button></header>{testsQuery.error ? <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{getApiErrorMessage(testsQuery.error)}</p> : null}<div className="mt-6 grid gap-8 lg:grid-cols-2">{["Today", "Upcoming", "Completed", "Drafts"].map((group) => { const list = tests.filter((test) => group === "Today" ? test.status === "PUBLISHED" && test.isLive : group === "Upcoming" ? test.status === "PUBLISHED" && !test.isLive : group === "Completed" ? test.status === "CLOSED" : !test.isLive && test.status !== "PUBLISHED" && test.status !== "CLOSED"); return <section key={group}><h2 className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">{group}</h2><div className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm">{list.length ? list.map((test) => <ExamRow key={test.id} test={test} />) : <p className="py-6 text-sm text-slate-500">No exams here yet.</p>}</div></section>; })}</div></main>;

  return <main className="mx-auto max-w-5xl px-4 py-8 md:px-8"><header className="flex items-center gap-3 border-b border-slate-200 pb-5"><button type="button" onClick={() => setStage("home")} aria-label="Back to exams" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600"><ArrowLeft size={17} /></button><div><p className="text-sm font-semibold text-[#0b5d8f]">Exams</p><h1 className="text-2xl font-bold text-slate-950">{stage === "details" ? "Host an exam" : "Check the student view"}</h1><p className="mt-1 text-sm text-slate-500">{stage === "details" ? "Add the two Word files, then review the paper once before publishing." : "This is the paper students will receive."}</p></div></header>{error ? <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><X size={17} />{error}</div> : null}
    {stage === "details" ? <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-3"><label className="grid gap-1.5 md:col-span-2"><span className="text-xs font-semibold text-slate-600">Exam name</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Mathematics Unit Test 1" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="grid gap-1.5"><span className="text-xs font-semibold text-slate-600">Subject</span><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Mathematics" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="grid gap-1.5"><span className="text-xs font-semibold text-slate-600">Class / batch</span><select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option value="">Choose a class</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name} - {countStudents(batch)} students</option>)}</select></label><label className="grid gap-1.5"><span className="text-xs font-semibold text-slate-600">Duration (minutes)</span><input type="number" min={1} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="h-10 rounded-lg border border-slate-300 px-3 text-sm" /></label></div><div className="mt-6 border-t border-slate-200 pt-5"><div className="mb-3 flex items-center gap-2"><FileText size={18} className="text-[#0b5d8f]" /><h2 className="font-bold text-slate-900">Question paper and solutions</h2></div><div className="grid gap-3 md:grid-cols-2"><FileChoice label="Upload question paper" hint="Word document only (.doc or .docx)" file={questionPaper} onChange={(event) => uploadFile(event, "QUESTION_PAPER")} /><FileChoice label="Upload solutions" hint="Word document only (.doc or .docx)" file={solutionPaper} onChange={(event) => uploadFile(event, "ANSWER_KEY")} /></div><p className="mt-3 text-xs text-slate-500">The files are checked and reconstructed using the existing review pipeline. Nothing is published automatically.</p></div><div className="mt-6 flex justify-end"><button type="button" onClick={continueToPreview} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0b3558] px-5 text-sm font-bold text-white">{busy ? <Loader2 className="animate-spin" size={17} /> : null} Continue</button></div></section> : null}
    {stage === "preview" ? <section className="mt-5"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{subject}</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{questions.length} questions - {questions.reduce((sum, question) => sum + question.marks, 0)} marks - {duration} minutes</p></div><div className="text-right text-sm font-bold text-emerald-700">{ready} of {questions.length} ready</div></div><div className="mt-5 grid gap-4">{questions.map((question, index) => <article key={`${index}-${question.questionText}`} className="border-b border-slate-200 pb-4 last:border-0"><p className="font-bold text-slate-900">{index + 1}. {question.questionText || "Question needs checking"}</p><div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">{[question.optionA, question.optionB, question.optionC, question.optionD].map((option, optionIndex) => <p key={optionIndex} className="rounded-lg bg-slate-50 px-3 py-2">{String.fromCharCode(65 + optionIndex)}. {option || "Missing option"}</p>)}</div><p className="mt-2 text-xs text-slate-500">{question.marks} mark(s)</p></article>)}</div><label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4" /> I have checked the question paper as students will see it.</label></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setStage("details")} className="text-sm font-bold text-slate-600">Back to details</button><button type="button" onClick={publish} disabled={busy || ready !== questions.length || !confirmed} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0b3558] px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <Check size={17} />} Publish exam</button></div></section> : null}
  </main>;
}
