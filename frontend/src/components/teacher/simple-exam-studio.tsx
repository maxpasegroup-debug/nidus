"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronRight, FileText, Loader2, Plus, Save, Upload, X } from "lucide-react";
import { useAcademyBatches } from "@/hooks/use-academy";
import { useTests } from "@/hooks/use-tests";
import { apiClient, getApiErrorMessage } from "@/services/api";
import { createTest, type TestPayload } from "@/services/tests";
import { publishExam } from "@/services/examination";
import type { AcademyBatch } from "@/services/academy";
import type { Question, Test } from "@/types/test";

type Stage = "home" | "setup" | "review" | "publish" | "published";
type ExamQuestion = Omit<Question, "id" | "testId" | "publishedVersion"> & { id?: string };

function blankQuestion(): ExamQuestion {
  return { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", explanation: "", marks: 1, negativeMarks: 0, difficultyLevel: "MEDIUM", topic: "", reviewStatus: "DRAFT" };
}

function parsePastedQuestions(value: string) {
  return value.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean).map(function (line) {
    var parts = line.split("|").map(function (part) { return part.trim(); });
    if (parts.length < 6) return null;
    return Object.assign(blankQuestion(), { questionText: parts[0], optionA: parts[1], optionB: parts[2], optionC: parts[3], optionD: parts[4], correctAnswer: parts[5].toUpperCase(), topic: "General" });
  }).filter(function (question): question is ExamQuestion { return Boolean(question); });
}

function studentCount(batch?: AcademyBatch) {
  return batch ? (batch._count?.students ?? batch.students?.length ?? 0) : 0;
}

function statusLabel(test: Test) {
  if (test.status === "PUBLISHED" && test.isLive) return "LIVE";
  if (test.status === "CLOSED") return "COMPLETED";
  if (test.status === "PUBLISHED") return "UPCOMING";
  return "DRAFT";
}

function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  var label = props.label;
  var inputProps = Object.assign({}, props);
  delete (inputProps as { label?: string }).label;
  return <label className="grid gap-1.5"><span className="text-xs font-semibold text-slate-600">{label}</span><input {...inputProps} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#0b5d8f] focus:ring-2 focus:ring-[#0b5d8f]/15" /></label>;
}

function Section(props: { number: string; title: string; children: ReactNode }) {
  return <section className="border-b border-slate-200 py-5 last:border-b-0"><div className="mb-4 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#0b3558] text-xs font-bold text-white">{props.number}</span><h2 className="text-base font-bold text-slate-900">{props.title}</h2></div>{props.children}</section>;
}

function ExamCard({ test }: { test: Test }) {
  var label = statusLabel(test);
  return <article className="border-b border-slate-200 py-4 last:border-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{test.title}</h3><p className="mt-1 text-sm text-slate-500">{test.subject || test.examType} · {test.batchId ? "Assigned batch" : "No batch selected"}</p></div><span className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + (label === "LIVE" ? "bg-emerald-100 text-emerald-800" : label === "DRAFT" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700")}>{label}</span></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><span>{test.questions?.length ?? test._count?.questions ?? 0} questions</span><span>{test.totalMarks} marks</span><span>{test.duration} minutes</span>{test.publishAt ? <span>{new Date(test.publishAt).toLocaleString()}</span> : null}</div><div className="mt-3 flex gap-3"><Link href={"/tests/" + test.id} className="text-sm font-semibold text-[#0b5d8f] hover:underline">Open</Link>{label !== "DRAFT" ? <Link href="/examination-center/results" className="text-sm font-semibold text-[#0b5d8f] hover:underline">Results</Link> : null}</div></article>;
}

export function SimpleExamStudio() {
  var query = useTests();
  var batchQuery = useAcademyBatches({ status: "ACTIVE" }, true);
  var tests = useMemo(function () { return query.data || []; }, [query.data]);
  var batches = useMemo(function () { return batchQuery.data || []; }, [batchQuery.data]);
  var [stage, setStage] = useState<Stage>("home");
  var [title, setTitle] = useState("");
  var [examType, setExamType] = useState("School Exam");
  var [subject, setSubject] = useState("");
  var [duration, setDuration] = useState(40);
  var [batchId, setBatchId] = useState("");
  var [schedule, setSchedule] = useState("");
  var [questions, setQuestions] = useState<ExamQuestion[]>([]);
  var [paste, setPaste] = useState("");
  var [paperName, setPaperName] = useState("");
  var [paperStatus, setPaperStatus] = useState("");
  var [createdTest, setCreatedTest] = useState<Test | null>(null);
  var [busy, setBusy] = useState(false);
  var [message, setMessage] = useState("");
  var [errorMessage, setErrorMessage] = useState("");
  var selectedBatch = useMemo(function () { return batches.find(function (batch) { return batch.id === batchId; }); }, [batches, batchId]);
  var readyQuestions = questions.filter(function (question) { return question.questionText.trim() && [question.optionA, question.optionB, question.optionC, question.optionD].every(Boolean) && /^[A-D]$/.test(question.correctAnswer) && question.explanation.trim(); });
  var needsAttention = questions.length - readyQuestions.length;
  var grouped = useMemo(function () { return { today: tests.filter(function (test) { return test.status === "PUBLISHED" && test.isLive; }), upcoming: tests.filter(function (test) { return test.status === "PUBLISHED" && !test.isLive; }), completed: tests.filter(function (test) { return test.status === "CLOSED"; }), drafts: tests.filter(function (test) { return !test.isLive && test.status !== "PUBLISHED" && test.status !== "CLOSED"; }) }; }, [tests]);

  function reset() {
    setStage("home"); setTitle(""); setSubject(""); setDuration(40); setBatchId(""); setSchedule(""); setQuestions([]); setPaste(""); setPaperName(""); setPaperStatus(""); setCreatedTest(null); setMessage(""); setErrorMessage("");
  }
  function addQuestions(next: ExamQuestion[]) { setQuestions(function (current) { return current.concat(next); }); setPaste(""); }
  function updateQuestion(index: number, field: keyof ExamQuestion, value: string | number) { setQuestions(function (current) { return current.map(function (question, questionIndex) { return questionIndex === index ? Object.assign({}, question, { [field]: value }) : question; }); }); }
  function buildPayload(): TestPayload {
    return { title: title.trim(), description: "Teacher-created " + subject.trim() + " exam.", examType: examType.trim() || "School Exam", category: "Teacher Exam", subject: subject.trim(), batchId, duration, totalMarks: questions.reduce(function (sum, question) { return sum + Number(question.marks || 0); }, 0), isMockTest: false, isLive: false, questions: questions.map(function (question) { return { questionText: question.questionText, optionA: question.optionA, optionB: question.optionB, optionC: question.optionC, optionD: question.optionD, correctAnswer: question.correctAnswer, explanation: question.explanation.trim(), marks: Number(question.marks || 1), negativeMarks: Number(question.negativeMarks || 0), difficultyLevel: question.difficultyLevel || "MEDIUM", topic: question.topic || subject.trim(), reviewStatus: "DRAFT" }; }) };
  }
  async function uploadPaper(event: ChangeEvent<HTMLInputElement>) {
    var file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setErrorMessage(""); setPaperName(file.name); setPaperStatus("Uploading your paper...");
    try { var form = new FormData(); form.append("file", file); form.append("sourceKind", "QUESTION_PAPER"); form.append("batchId", batchId); form.append("subject", subject); await apiClient.post("/academy/exams/uploads", form, { headers: { "Content-Type": "multipart/form-data" } }); setPaperStatus("Paper uploaded. Questions need a quick teacher review before publishing."); }
    catch (error) { setErrorMessage(getApiErrorMessage(error)); setPaperStatus(""); } finally { setBusy(false); }
  }
  function continueToReview() {
    var pasted = parsePastedQuestions(paste); var nextQuestions = pasted.length ? questions.concat(pasted) : questions;
    setErrorMessage("");
    if (!title.trim() || !subject.trim() || !batchId) return setErrorMessage("Add an exam name, subject and class before continuing.");
    if (!nextQuestions.length) return setErrorMessage("Add questions by pasting them or creating them manually.");
    setQuestions(nextQuestions); setPaste(""); setStage("review");
  }
  async function saveDraft() {
    setBusy(true); setErrorMessage("");
    try { var test = await createTest(buildPayload()); setCreatedTest(test); setMessage("Draft saved."); setStage("review"); } catch (error) { setErrorMessage(getApiErrorMessage(error)); } finally { setBusy(false); }
  }
  async function publish() {
    setBusy(true); setErrorMessage("");
    try { var test = createdTest || await createTest(buildPayload()); setCreatedTest(test); await publishExam(test.id, schedule || undefined); setMessage("Exam published. " + studentCount(selectedBatch) + " students can now access it."); setStage("published"); } catch (error) { setErrorMessage(getApiErrorMessage(error)); } finally { setBusy(false); }
  }

  if (stage === "home") {
    var groups: Array<[string, Test[]]> = [["Today", grouped.today], ["Upcoming", grouped.upcoming], ["Completed", grouped.completed], ["Drafts", grouped.drafts]];
    return <main className="mx-auto max-w-5xl px-4 py-8 md:px-8"><header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5"><div><p className="text-sm font-semibold text-[#0b5d8f]">Exams</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Create, manage and review your exams.</h1></div><button type="button" onClick={function () { setStage("setup"); }} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0b3558] px-4 text-sm font-bold text-white hover:bg-[#092a46]"><Plus size={17} /> Create exam</button></header>{query.error ? <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{getApiErrorMessage(query.error)}</p> : null}{query.isLoading ? <p className="py-10 text-sm text-slate-500">Loading exams...</p> : <div className="mt-6 grid gap-8 lg:grid-cols-2">{groups.map(function (group) { return <section key={group[0]}><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">{group[0]}</h2><span className="text-xs text-slate-400">{group[1].length}</span></div><div className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm">{group[1].length ? group[1].map(function (test) { return <ExamCard key={test.id} test={test} />; }) : <p className="py-6 text-sm text-slate-500">No exams here yet.</p>}</div></section>; })}</div>}</main>;
  }
  if (stage === "published") return <main className="mx-auto max-w-2xl px-4 py-12 md:px-8"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white"><Check /></span><h1 className="mt-4 text-2xl font-bold text-emerald-950">Exam published</h1><p className="mt-2 text-sm text-emerald-900">{message}</p><div className="mt-6 flex justify-center gap-3"><Link href={createdTest ? "/tests/" + createdTest.id : "/tests"} className="rounded-lg bg-[#0b3558] px-4 py-2.5 text-sm font-bold text-white">View exam</Link><button type="button" onClick={reset} className="rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-900">Done</button></div></div></main>;

  return <main className="mx-auto max-w-5xl px-4 py-8 md:px-8"><header className="flex items-center gap-3 border-b border-slate-200 pb-5"><button type="button" onClick={function () { setStage("home"); }} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Back to exams"><ArrowLeft size={17} /></button><div><p className="text-sm font-semibold text-[#0b5d8f]">Exams</p><h1 className="text-2xl font-bold text-slate-950">{stage === "setup" ? "Create exam" : stage === "review" ? "Review questions" : "Exam ready"}</h1><p className="mt-1 text-sm text-slate-500">{stage === "setup" ? "Set up your exam in a few simple steps." : "Check only what needs your attention."}</p></div></header><div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500"><span className={stage === "setup" ? "text-[#0b5d8f]" : ""}>1 Exam</span><ChevronRight size={14} /><span className={stage === "review" ? "text-[#0b5d8f]" : ""}>2 Paper</span><ChevronRight size={14} /><span>3 Students</span><ChevronRight size={14} /><span>4 Publish</span></div>{errorMessage ? <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><X size={17} />{errorMessage}</div> : null}
    {stage === "setup" ? <div className="mt-4 rounded-xl border border-slate-200 bg-white px-5 shadow-sm"><Section number="1" title="Exam"><div className="grid gap-4 md:grid-cols-3"><Field label="Exam name" value={title} onChange={function (event) { setTitle(event.target.value); }} placeholder="Mathematics Unit Test 1" /><Field label="Subject" value={subject} onChange={function (event) { setSubject(event.target.value); }} placeholder="Mathematics" /><label className="grid gap-1.5"><span className="text-xs font-semibold text-slate-600">Exam type</span><select value={examType} onChange={function (event) { setExamType(event.target.value); }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>School Exam</option><option>Unit Test</option><option>Practice Test</option><option>Competitive Exam</option><option>Mock Exam</option></select></label></div></Section><Section number="2" title="Question paper"><div className="grid gap-3 md:grid-cols-3"><label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center hover:border-[#0b5d8f]"><Upload size={20} className="text-[#0b5d8f]" /><span className="text-sm font-bold text-slate-800">Upload paper</span><span className="text-xs text-slate-500">PDF, Word, image or text</span><input type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={uploadPaper} /></label><button type="button" onClick={function () { document.getElementById("paste-questions")?.focus(); }} className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-center hover:border-[#0b5d8f]"><FileText size={20} className="text-[#0b5d8f]" /><span className="text-sm font-bold text-slate-800">Paste questions</span><span className="text-xs text-slate-500">One question per line</span></button><button type="button" onClick={function () { addQuestions([blankQuestion()]); }} className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-center hover:border-[#0b5d8f]"><Plus size={20} className="text-[#0b5d8f]" /><span className="text-sm font-bold text-slate-800">Create manually</span><span className="text-xs text-slate-500">Add a question yourself</span></button></div>{paperName ? <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><Check size={16} /> {paperName} · {paperStatus || "Paper uploaded"}</p> : null}<label className="mt-4 grid gap-1.5"><span className="text-xs font-semibold text-slate-600">Paste questions</span><textarea id="paste-questions" value={paste} onChange={function (event) { setPaste(event.target.value); }} placeholder="Question text | Option A | Option B | Option C | Option D | A" className="min-h-20 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#0b5d8f]" /><span className="text-xs text-slate-500">Format: question | A | B | C | D | correct answer</span></label></Section><Section number="3" title="Exam settings"><div className="grid gap-4 md:grid-cols-2"><Field label="Duration (minutes)" type="number" min={1} value={duration} onChange={function (event) { setDuration(Number(event.target.value)); }} /><p className="flex items-end pb-2 text-sm text-slate-600">Questions are counted after you add the paper.</p></div></Section><Section number="4" title="Students"><label className="grid max-w-xl gap-1.5"><span className="text-xs font-semibold text-slate-600">Who should take this exam?</span><select value={batchId} onChange={function (event) { setBatchId(event.target.value); }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">Choose a class or batch</option>{batches.map(function (batch) { return <option key={batch.id} value={batch.id}>{batch.name} · {studentCount(batch)} students</option>; })}</select></label></Section><div className="flex flex-wrap items-center justify-between gap-3 py-5"><button type="button" onClick={saveDraft} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"><Save size={16} /> Save draft</button><button type="button" onClick={continueToReview} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#0b3558] px-5 py-2.5 text-sm font-bold text-white">Continue <ChevronRight size={16} /></button></div></div> : null}
    {stage === "review" ? <div className="mt-5"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><div><h2 className="font-bold text-slate-900">{questions.length} questions</h2><p className="mt-1 text-sm text-slate-500">{readyQuestions.length} ready · {needsAttention} need attention</p></div><button type="button" onClick={function () { setQuestions(function (current) { return current.concat([blankQuestion()]); }); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"><Plus size={16} /> Add question</button></div><div className="mt-4 grid gap-3">{questions.map(function (question, index) { var ready = readyQuestions.includes(question); return <article key={question.id || index} className={"rounded-xl border bg-white p-4 " + (ready ? "border-slate-200" : "border-amber-300 bg-amber-50/40")}><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-slate-900">Question {index + 1}</p><span className="text-xs font-semibold text-slate-500">{ready ? "Ready" : "Needs attention"}</span></div><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="grid gap-1 md:col-span-2"><span className="text-xs font-semibold text-slate-500">Question text</span><textarea value={question.questionText} onChange={function (event) { updateQuestion(index, "questionText", event.target.value); }} className="min-h-16 rounded-lg border border-slate-300 p-2 text-sm" /></label>{(["optionA", "optionB", "optionC", "optionD"] as const).map(function (field) { return <Field key={field} label={field.replace("option", "Option ")} value={question[field]} onChange={function (event) { updateQuestion(index, field, event.target.value); }} />; })}<label className="grid gap-1.5"><span className="text-xs font-semibold text-slate-600">Correct answer</span><select value={question.correctAnswer} onChange={function (event) { updateQuestion(index, "correctAnswer", event.target.value); }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">{["A", "B", "C", "D"].map(function (answer) { return <option key={answer}>{answer}</option>; })}</select></label><Field label="Marks" type="number" min={0.01} step={0.25} value={question.marks} onChange={function (event) { updateQuestion(index, "marks", Number(event.target.value)); }} /></div></article>; })}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><button type="button" onClick={function () { setStage("setup"); }} className="text-sm font-bold text-slate-600">Back to setup</button><div className="flex gap-2"><button type="button" onClick={saveDraft} disabled={busy || !questions.length} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"><Save size={16} /> Save draft</button><button type="button" onClick={function () { setStage("publish"); }} disabled={busy || needsAttention > 0} className="inline-flex items-center gap-2 rounded-lg bg-[#0b3558] px-5 py-2.5 text-sm font-bold text-white">Continue <ChevronRight size={16} /></button></div></div></div> : null}
    {stage === "publish" ? <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]"><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold text-slate-900">Exam ready</h2><p className="mt-1 text-sm text-slate-500">Review this summary before students receive access.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-semibold text-slate-500">Exam</p><p className="font-bold text-slate-900">{title}</p></div><div><p className="text-xs font-semibold text-slate-500">Class</p><p className="font-bold text-slate-900">{selectedBatch?.name}</p></div><div><p className="text-xs font-semibold text-slate-500">Questions</p><p className="font-bold text-slate-900">{questions.length}</p></div><div><p className="text-xs font-semibold text-slate-500">Total marks</p><p className="font-bold text-slate-900">{questions.reduce(function (sum, question) { return sum + Number(question.marks || 0); }, 0)}</p></div><div><p className="text-xs font-semibold text-slate-500">Duration</p><p className="font-bold text-slate-900">{duration} minutes</p></div></div><div className="mt-6 grid gap-2 text-sm">{["Paper", "Questions", "Students"].map(function (item) { return <p key={item} className="flex items-center gap-2 text-emerald-700"><Check size={16} /> {item} ready</p>; })}</div></section><aside className="rounded-xl border border-slate-200 bg-white p-5"><label className="grid gap-1.5"><span className="text-xs font-semibold text-slate-600">Schedule</span><select value={schedule ? "later" : "now"} onChange={function (event) { setSchedule(event.target.value === "later" ? new Date(Date.now() + 3600000).toISOString() : ""); }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="now">Start now</option><option value="later">Schedule for later</option></select></label>{schedule ? <Field label="Date and time" type="datetime-local" value={schedule.slice(0, 16)} onChange={function (event) { setSchedule(new Date(event.target.value).toISOString()); }} /> : null}<button type="button" onClick={publish} disabled={busy} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0b3558] px-4 text-sm font-bold text-white disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={17} /> : <Check size={17} />} Publish exam</button><button type="button" onClick={function () { setStage("review"); }} className="mt-2 w-full py-2 text-sm font-bold text-slate-600">Back to questions</button></aside></div> : null}</main>;
}
