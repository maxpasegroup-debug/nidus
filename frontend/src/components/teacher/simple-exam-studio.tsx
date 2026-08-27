"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, FileText, Loader2, Plus, Upload } from "lucide-react";
import { useAcademyBatches } from "@/hooks/use-academy";
import { apiClient, getApiErrorMessage } from "@/services/api";

const NIDUS_TIME_ZONE = "Asia/Kolkata";
const NIDUS_UTC_OFFSET = "+05:30";
type Stage = "home" | "essentials" | "upload" | "review" | "release";
type UploadRecord = { id: string; importJobId?: string | null; originalName?: string };
type Question = { id?: string; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; explanation: string; marks: number; negativeMarks: number; difficultyLevel: string; topic: string; reviewStatus: string; sourcePageNumber?: number };
type ReviewIssue = { id: string; type: string; severity: "HIGH" | "MEDIUM" | "LOW"; state: "OPEN" | "RESOLVED" | "APPROVED_AS_IS"; approvable: boolean; reason?: string };
type ReviewSummary = { actualQuestionCount: number; actualMarksTotal: number; unresolvedHighIssueCount: number; reviewStatus: "READY" | "REVIEW_REQUIRED"; blockingReasons: string[]; test: { id: string; title: string; subject?: string; topic?: string; duration: number; totalMarks: number; lifecycle: string; examStartsAt?: string; examEndsAt?: string; expectedQuestionCount?: number; authoritativeQuestionCount?: number; expectedTotalMarks?: number; batch?: { id: string; name: string } }; questionIssues: Array<{ questionId: string; issues: ReviewIssue[] }> };

const emptyQuestion = (): Question => ({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "", explanation: "", marks: 1, negativeMarks: 0, difficultyLevel: "MEDIUM", topic: "", reviewStatus: "NEEDS_REVIEW" });
const fieldClass = "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#0b5d8f] focus:outline-none focus:ring-2 focus:ring-[#0b5d8f]/20";

export function SimpleExamStudio({ initialTestId = "", initialStage = "home" }: { initialTestId?: string; initialStage?: Stage }) {
  const router = useRouter();
  const { data: batches = [] } = useAcademyBatches({ status: "ACTIVE" }, true);
  const [stage, setStage] = useState<Stage>(initialStage);
  const [draftId, setDraftId] = useState(initialTestId);
  const [title, setTitle] = useState(""); const [examType, setExamType] = useState("NDA"); const [subject, setSubject] = useState(""); const [topic, setTopic] = useState("");
  const [batchId, setBatchId] = useState(""); const [duration, setDuration] = useState(60); const [marks, setMarks] = useState(100); const [questionCount, setQuestionCount] = useState(25); const [note, setNote] = useState("");
  const [startDate, setStartDate] = useState(""); const [startTime, setStartTime] = useState("");
  const [questionPaper, setQuestionPaper] = useState<UploadRecord>(); const [solutionPaper, setSolutionPaper] = useState<UploadRecord>();
  const [questions, setQuestions] = useState<Question[]>([]); const [editing, setEditing] = useState<number | null>(null);
  const [review, setReview] = useState<ReviewSummary>(); const [approvalReasons, setApprovalReasons] = useState<Record<string, string>>({});
  const [releaseChoice, setReleaseChoice] = useState<"SAVE_DRAFT" | "SCHEDULE" | "PUBLISH_NOW">("SAVE_DRAFT");
  const [releaseDate, setReleaseDate] = useState(""); const [releaseTime, setReleaseTime] = useState(""); const [confirmPublish, setConfirmPublish] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const selectedBatch = batches.find((batch) => batch.id === batchId);
  const localStart = startDate && startTime ? new Date(`${startDate}T${startTime}:00${NIDUS_UTC_OFFSET}`) : null;
  const localEnd = localStart && !Number.isNaN(localStart.getTime()) ? new Date(localStart.getTime() + duration * 60_000) : null;

  useEffect(() => {
    if (!initialTestId) return;
    let active = true;
    void apiClient.get<{ test: ReviewSummary["test"] & { description?: string; examType?: string; batchId?: string; questions?: Question[]; expectedQuestionCount?: number } }>(`/tests/${initialTestId}`).then(async ({ data }) => {
      if (!active) return; const test = data.test;
      setTitle(test.title); setExamType(test.examType || "NDA"); setSubject(test.subject || ""); setTopic(test.topic || ""); setBatchId(test.batch?.id || test.batchId || ""); setDuration(test.duration); setMarks(test.totalMarks); setQuestionCount(test.expectedQuestionCount || test.authoritativeQuestionCount || test.questions?.length || 1); setNote(test.description || ""); setQuestions(test.questions || []);
      if (test.examStartsAt) { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: NIDUS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(test.examStartsAt)); const value = (name: string) => parts.find((part) => part.type === name)?.value || ""; setStartDate(`${value("year")}-${value("month")}-${value("day")}`); setStartTime(`${value("hour")}:${value("minute")}`); }
      if (initialStage === "review" || initialStage === "release") { const latest = await refreshReview(initialTestId); if (active && initialStage === "release" && latest.reviewStatus !== "READY") setStage("review"); }
    }).catch((cause) => active && setError(getApiErrorMessage(cause)));
    return () => { active = false; };
  // The route owns the resume identity; changing form state must not re-hydrate it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTestId, initialStage]);

  async function refreshReview(id = draftId) {
    const response = await apiClient.get<{ review: ReviewSummary }>(`/tests/${id}/review-summary`);
    setReview(response.data.review);
    return response.data.review;
  }

  async function saveEssentials() {
    if (!title.trim() || !subject.trim() || !batchId || !localStart || duration <= 0 || marks <= 0 || questionCount <= 0) { setError("Complete all required Essentials fields."); return; }
    setBusy(true); setError("");
    try {
      const response = await apiClient.post<{ test: { id: string } }>("/tests", {
        ...(draftId ? { testId: draftId } : {}), title: title.trim(), description: note.trim() || `Director-created ${examType} exam.`, examType, category: "Academy", subject: subject.trim(), topic: topic.trim() || subject.trim(), batchId,
        duration, totalMarks: marks, expectedQuestionCount: questionCount, authoritativeQuestionCount: questionCount, expectedTotalMarks: marks,
        isMockTest: true, isLive: false, status: "DRAFT", examStartsAt: localStart.toISOString(), questions: [],
      });
      setDraftId(response.data.test.id); sessionStorage.setItem("nidus_director_exam_draft", response.data.test.id); setStage("upload");
    } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  }

  async function uploadFile(event: ChangeEvent<HTMLInputElement>, kind: "QUESTION_PAPER" | "ANSWER_KEY") {
    const file = event.target.files?.[0]; if (!file) return;
    if (!/\.docx?$/i.test(file.name)) { setError("Upload a Word document (.doc or .docx)."); return; }
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.append("file", file); form.append("sourceKind", kind); form.append("batchId", batchId); form.append("subject", subject);
      const response = await apiClient.post<{ upload: UploadRecord }>("/academy/exams/uploads", form, { headers: { "Content-Type": "multipart/form-data" } });
      const upload = { ...response.data.upload, originalName: file.name }; if (kind === "QUESTION_PAPER") setQuestionPaper(upload); else setSolutionPaper(upload);
    } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  }

  async function reconstruct() {
    if (!draftId || !questionPaper || !solutionPaper) return;
    setBusy(true); setError("");
    try {
      const response = await apiClient.post<{ reconstruction?: { draft?: { questions?: Array<Record<string, unknown>> } } }>("/academy/exams/import/reconstruct", { batchId, subject, examUploadIds: [questionPaper.id, solutionPaper.id], importJobIds: [questionPaper.importJobId, solutionPaper.importJobId].filter(Boolean) });
      const extracted = response.data.reconstruction?.draft?.questions || [];
      const parsed = extracted.map((item) => {
        const options = Array.isArray(item.options) ? item.options as Array<{ label?: string; text?: string }> : [];
        const option = (label: string) => options.find((entry) => entry.label?.toUpperCase() === label)?.text || "";
        return { ...emptyQuestion(), questionText: String(item.questionText || item.text || ""), optionA: option("A"), optionB: option("B"), optionC: option("C"), optionD: option("D"), correctAnswer: String(item.linkedAnswer || "").toUpperCase(), explanation: String(item.linkedSolution || ""), topic: topic || subject, reviewStatus: String(item.reviewStatus || "NEEDS_REVIEW"), sourcePageNumber: typeof item.sourcePageNumber === "number" ? item.sourcePageNumber : undefined };
      });
      if (!parsed.length) throw new Error("No questions were reconstructed.");
      const saved = await apiClient.post<{ test: { questions?: Question[] } }>("/academy/exams", { testId: draftId, title, topic: topic || subject, subject, batchId, durationMinutes: duration, manualPaperReview: true, examUploadIds: [questionPaper.id, solutionPaper.id], draft: { manualPaperReview: true, questions: parsed } });
      setQuestions((saved.data.test.questions || []).map((question, index) => ({ ...parsed[index], ...question }))); await refreshReview(draftId); setStage("review");
    } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  }

  function editQuestion(index: number, change: Partial<Question>) { setQuestions((current) => current.map((question, itemIndex) => itemIndex === index ? { ...question, ...change } : question)); }
  async function persistQuestion(index: number) {
    const question = questions[index]; if (!question.id) return;
    setBusy(true); setError("");
    try { const response = await apiClient.put<{ question: Question }>(`/tests/${draftId}/questions/${question.id}`, { ...question, reviewStatus: "REVIEWED" }); editQuestion(index, response.data.question); setEditing(null); await refreshReview(); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  }
  async function approveAsIs(questionId: string, issueId: string) {
    const key = `${questionId}:${issueId}`; const reason = approvalReasons[key]?.trim();
    if (!reason) { setError("Enter a reason before approving this issue as-is."); return; }
    setBusy(true); setError("");
    try { await apiClient.post(`/tests/${draftId}/questions/${questionId}/issues/${issueId}/approve-as-is`, { reason }); await refreshReview(); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  }
  async function reconcile(kind: "count" | "marks") {
    setBusy(true); setError("");
    try { const response = await apiClient.post<{ review: ReviewSummary }>(`/tests/${draftId}/review-reconcile`, { [kind]: true }); setReview(response.data.review); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  }
  async function enterRelease() {
    setBusy(true); setError("");
    try {
      const latest = await refreshReview();
      if (latest.reviewStatus !== "READY") { setError("This exam needs review before it can be released."); return; }
      setStage("release");
    } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  }
  async function submitRelease(action = releaseChoice) {
    if (action === "PUBLISH_NOW" && !confirmPublish) { setConfirmPublish(true); return; }
    let releaseAt: string | undefined;
    if (action === "SCHEDULE") {
      if (!releaseDate || !releaseTime) { setError("Release date and time are required."); return; }
      const instant = new Date(`${releaseDate}T${releaseTime}:00${NIDUS_UTC_OFFSET}`);
      if (Number.isNaN(instant.getTime())) { setError("Enter a valid release date and time."); return; }
      releaseAt = instant.toISOString();
    }
    setBusy(true); setError("");
    try {
      await apiClient.post(`/tests/${draftId}/release`, { action, releaseAt });
      setConfirmPublish(false);
      router.push(`/tests/${draftId}`);
    } catch (cause) {
      const message = getApiErrorMessage(cause); setError(message); setConfirmPublish(false);
      if (/needs review/i.test(message)) { await refreshReview().catch(() => undefined); setStage("review"); }
    } finally { setBusy(false); }
  }

  if (stage === "home") return <main className="mx-auto max-w-5xl px-4 py-8 md:px-8"><header className="flex items-end justify-between border-b border-slate-200 pb-5"><div><p className="text-sm font-semibold text-[#0b5d8f]">Exams</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Create, manage and review your exams.</h1></div><button type="button" onClick={() => setStage("essentials")} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0b3558] px-4 text-sm font-bold text-white"><Plus size={17} /> Create exam</button></header></main>;

  const progress = <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold"><span className={`rounded-lg p-2 text-center ${stage === "essentials" ? "bg-[#0b3558] text-white" : "border"}`}>1 Essentials</span><span className={`rounded-lg p-2 text-center ${stage === "upload" || stage === "review" ? "bg-[#0b3558] text-white" : "border"}`}>2 Upload &amp; Review</span><span className={`rounded-lg p-2 text-center ${stage === "release" ? "bg-[#0b3558] text-white" : "border"}`}>3 Release</span></div>;
  return <main className="mx-auto max-w-6xl px-4 py-8 md:px-8"><header className="flex gap-3 border-b border-slate-200 pb-5"><button type="button" aria-label="Back" onClick={() => { if (stage === "release") { void refreshReview(); setStage("review"); } else setStage(stage === "review" ? "upload" : stage === "upload" ? "essentials" : "home"); }} className="h-9 w-9 rounded-lg border"><ArrowLeft size={17} className="mx-auto" /></button><div><p className="text-sm font-semibold text-[#0b5d8f]">Create exam</p><h1 className="text-3xl font-bold">{stage === "essentials" ? "Exam essentials" : stage === "upload" ? "Upload paper" : stage === "review" ? "Build & review" : "Release exam"}</h1>{progress}</div></header>{error ? <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

    {stage === "essentials" ? <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]"><section className="grid gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-2"><TextField label="Exam name *" value={title} setValue={setTitle} /><label className="grid gap-1 text-xs font-semibold">Exam type *<select value={examType} onChange={(event) => setExamType(event.target.value)} className={fieldClass}>{["NDA", "CDS", "AFCAT", "AGNIVEER", "SSC"].map((value) => <option key={value}>{value}</option>)}</select></label><TextField label="Subject *" value={subject} setValue={setSubject} /><TextField label="Topic" value={topic} setValue={setTopic} /><NumberField label="Duration *" value={duration} setValue={setDuration} /><NumberField label="Marks *" value={marks} setValue={setMarks} /><NumberField label="Questions *" value={questionCount} setValue={setQuestionCount} /><TextField label="Short note" value={note} setValue={setNote} /><label className="grid gap-1 text-xs font-semibold">Exam start date *<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={fieldClass} /></label><label className="grid gap-1 text-xs font-semibold">Start time *<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={fieldClass} /></label><label className="grid gap-1 text-xs font-semibold md:col-span-2">Batch *<select value={batchId} onChange={(event) => setBatchId(event.target.value)} className={fieldClass}><option value="">Choose a batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label><p className="rounded-lg bg-slate-50 p-3 text-xs md:col-span-2">{localEnd ? `Exam ends automatically at ${localEnd.toLocaleString("en-IN", { timeZone: NIDUS_TIME_ZONE, hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}. The backend derives and stores this value.` : "Set start date, time and duration to calculate the end."}</p><button type="button" disabled={busy} onClick={saveEssentials} className="h-11 rounded-lg bg-[#0b3558] font-bold text-white md:col-span-2">{busy ? "Saving…" : "Save & Continue →"}</button></section><aside className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-[#0b5d8f]">Exam summary</p><p className="mt-4 font-bold">{title || "Not set"}</p><p>{examType} · {subject || "Not set"}</p><p>{duration} minutes · {marks} marks · {questionCount} expected questions</p><p>{selectedBatch?.name || "Batch not set"}</p><p className="mt-4 font-bold">DRAFT</p></aside></div> : null}

    {stage === "upload" ? <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm"><div className="flex gap-2"><FileText className="text-[#0b5d8f]" /><div><h2 className="font-bold">Question paper and solutions</h2><p className="text-sm text-slate-500">Reconstruction saves questions into the existing draft.</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-2"><UploadField label="Question paper" file={questionPaper} onChange={(event) => uploadFile(event, "QUESTION_PAPER")} /><UploadField label="Solutions" file={solutionPaper} onChange={(event) => uploadFile(event, "ANSWER_KEY")} /></div><div className="mt-5 text-right"><button type="button" disabled={busy || !questionPaper || !solutionPaper} onClick={reconstruct} className="rounded-lg bg-[#0b3558] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : null}Reconstruct &amp; review</button></div></section> : null}

    {stage === "review" ? <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]"><div className="grid gap-4">{questions.map((question, index) => { const issues = review?.questionIssues.find((entry) => entry.questionId === question.id)?.issues || []; return <article key={question.id || index} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex justify-between"><div><p className="text-xs font-bold text-slate-500">QUESTION {index + 1}</p><p className="text-xs text-slate-500">{question.sourcePageNumber ? `Source page ${question.sourcePageNumber}` : "Source coordinates unavailable"}</p></div><button type="button" onClick={() => setEditing(editing === index ? null : index)} className="text-sm font-bold text-[#0b5d8f]">{editing === index ? "Close" : "Edit"}</button></div>{editing === index ? <QuestionEditor question={question} onChange={(change) => editQuestion(index, change)} onSave={() => persistQuestion(index)} busy={busy} /> : <QuestionPreview question={question} />}{issues.filter((issue) => issue.state !== "RESOLVED").map((issue) => { const key = `${question.id}:${issue.id}`; return <div key={issue.id} className={`mt-3 rounded-lg border p-3 text-xs ${issue.severity === "HIGH" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}><div className="flex items-center gap-2 font-bold"><AlertTriangle size={15} />{issue.severity}: {issue.type.replaceAll("_", " ")} · {issue.state.replaceAll("_", " ")}</div>{issue.state === "OPEN" && issue.approvable ? <div className="mt-2 flex flex-wrap gap-2"><input aria-label={`Reason for ${issue.type}`} value={approvalReasons[key] || ""} onChange={(event) => setApprovalReasons((current) => ({ ...current, [key]: event.target.value }))} placeholder="Reason required" className="h-9 min-w-48 rounded border bg-white px-2" /><button type="button" onClick={() => approveAsIs(question.id!, issue.id)} disabled={busy} className="rounded border border-amber-400 bg-white px-3 font-bold">Approve as-is</button></div> : issue.state === "OPEN" ? <p className="mt-1">This structural issue must be resolved by editing the question.</p> : null}</div>; })}</article>; })}</div><ReviewPanel review={review} busy={busy} reconcile={reconcile} onContinue={enterRelease} /></section> : null}
    {stage === "release" && review ? <ReleaseStage review={review} choice={releaseChoice} setChoice={setReleaseChoice} releaseDate={releaseDate} setReleaseDate={setReleaseDate} releaseTime={releaseTime} setReleaseTime={setReleaseTime} busy={busy} submit={submitRelease} /> : null}
    {confirmPublish && review ? <PublishDialog review={review} busy={busy} cancel={() => setConfirmPublish(false)} confirm={() => submitRelease("PUBLISH_NOW")} /> : null}
  </main>;
}

function TextField({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) { return <label className="grid gap-1 text-xs font-semibold">{label}<input value={value} onChange={(event) => setValue(event.target.value)} className={fieldClass} /></label>; }
function NumberField({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) { return <label className="grid gap-1 text-xs font-semibold">{label}<input type="number" min={1} value={value} onChange={(event) => setValue(Number(event.target.value))} className={fieldClass} /></label>; }
function UploadField({ label, file, onChange }: { label: string; file?: UploadRecord; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) { return <label className="flex min-h-28 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4"><Upload /><span><b>{file ? "File selected" : label}</b><small className="block text-slate-500">{file?.originalName || ".doc or .docx"}</small></span><input className="sr-only" type="file" accept=".doc,.docx" onChange={onChange} /></label>; }
function QuestionPreview({ question }: { question: Question }) { return <div><p className="mt-3 font-semibold">{question.questionText || "Question text missing"}</p><div className="mt-2 grid gap-2 text-sm md:grid-cols-2">{[question.optionA, question.optionB, question.optionC, question.optionD].map((option, index) => <p key={index} className="rounded bg-slate-50 p-2">{String.fromCharCode(65 + index)}. {option || "Missing"}</p>)}</div><p className="mt-2 text-xs">Answer: {question.correctAnswer || "Missing"} · {question.marks} marks</p></div>; }
function QuestionEditor({ question, onChange, onSave, busy }: { question: Question; onChange: (change: Partial<Question>) => void; onSave: () => void; busy: boolean }) { return <div className="mt-3 grid gap-2"><textarea value={question.questionText} onChange={(event) => onChange({ questionText: event.target.value })} className="rounded border p-2" />{(["A", "B", "C", "D"] as const).map((letter) => <input key={letter} value={question[`option${letter}`]} onChange={(event) => onChange({ [`option${letter}`]: event.target.value })} placeholder={`Option ${letter}`} className={fieldClass} />)}<select value={question.correctAnswer} onChange={(event) => onChange({ correctAnswer: event.target.value })} className={fieldClass}><option value="">Correct answer</option>{["A", "B", "C", "D"].map((letter) => <option key={letter}>{letter}</option>)}</select><textarea value={question.explanation} onChange={(event) => onChange({ explanation: event.target.value })} placeholder="Explanation" className="rounded border p-2" /><input aria-label="Marks" type="number" min="0.01" step="0.01" value={question.marks} onChange={(event) => onChange({ marks: Number(event.target.value) })} className={fieldClass} /><button type="button" disabled={busy} onClick={onSave} className="rounded bg-[#0b3558] p-2 text-sm font-bold text-white">Save edit</button></div>; }
function ReviewPanel({ review, busy, reconcile, onContinue }: { review?: ReviewSummary; busy: boolean; reconcile: (kind: "count" | "marks") => void; onContinue: () => void }) { if (!review) return <aside className="rounded-xl border bg-white p-5">Loading review…</aside>; const countMismatch = review.test.authoritativeQuestionCount !== review.actualQuestionCount; const marksMismatch = Math.abs(review.test.totalMarks - review.actualMarksTotal) > 0.0001; return <aside className="h-fit rounded-xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-[#0b5d8f]">Review summary</p><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-slate-500">Questions</dt><dd className="font-bold">{review.actualQuestionCount}</dd></div><div><dt className="text-slate-500">Original expectation</dt><dd className="font-bold">{review.test.expectedQuestionCount ?? "Not recorded"}</dd></div><div><dt className="text-slate-500">Marks</dt><dd className="font-bold">{review.actualMarksTotal}</dd></div><div><dt className="text-slate-500">Issues</dt><dd className="font-bold">{review.unresolvedHighIssueCount} blocking</dd></div><div><dt className="text-slate-500">Status</dt><dd className="font-bold">{review.reviewStatus === "READY" ? "Ready for Release" : "Review required"}</dd></div></dl>{review.blockingReasons.length ? <ul className="mt-4 list-disc pl-4 text-xs text-amber-900">{review.blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p className="mt-4 flex gap-2 rounded bg-emerald-50 p-3 text-xs text-emerald-900"><Check size={15} />Backend review gate is ready. Exam remains DRAFT.</p>}{countMismatch ? <button type="button" disabled={busy} onClick={() => reconcile("count")} className="mt-3 w-full rounded border border-[#0b3558] p-2 text-xs font-bold text-[#0b3558]">Update exam to {review.actualQuestionCount} questions</button> : null}{marksMismatch ? <button type="button" disabled={busy} onClick={() => reconcile("marks")} className="mt-2 w-full rounded border border-[#0b3558] p-2 text-xs font-bold text-[#0b3558]">Update exam total to {review.actualMarksTotal}</button> : null}<button type="button" disabled={busy || review.reviewStatus !== "READY"} onClick={onContinue} className="mt-4 w-full rounded-lg bg-[#0b3558] p-3 text-sm font-bold text-white disabled:opacity-50">Continue to Release →</button></aside>; }

function formatInstant(value?: string) { return value ? new Date(value).toLocaleString("en-IN", { timeZone: NIDUS_TIME_ZONE, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not set"; }
function ReleaseSummary({ review }: { review: ReviewSummary }) { const test = review.test; return <aside className="h-fit rounded-xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-[#0b5d8f]">Final exam summary</p><h2 className="mt-3 text-xl font-bold">{test.title}</h2><p className="text-sm text-slate-500">{test.subject || "No subject"} · {test.topic || "No topic"}</p><dl className="mt-5 grid gap-3 text-sm"><div><dt className="text-slate-500">Batch</dt><dd className="font-bold">{test.batch?.name || "Not set"}</dd></div><div><dt className="text-slate-500">Examination</dt><dd className="font-bold">{formatInstant(test.examStartsAt)} – {formatInstant(test.examEndsAt)}</dd></div><div><dt className="text-slate-500">Duration</dt><dd className="font-bold">{test.duration} minutes</dd></div><div><dt className="text-slate-500">Questions</dt><dd className="font-bold">{review.actualQuestionCount}</dd></div><div><dt className="text-slate-500">Marks</dt><dd className="font-bold">{review.actualMarksTotal}</dd></div><div><dt className="text-slate-500">Review</dt><dd className="font-bold">✓ Ready for release</dd></div></dl></aside>; }
function ReleaseStage({ review, choice, setChoice, releaseDate, setReleaseDate, releaseTime, setReleaseTime, busy, submit }: { review: ReviewSummary; choice: "SAVE_DRAFT" | "SCHEDULE" | "PUBLISH_NOW"; setChoice: (choice: "SAVE_DRAFT" | "SCHEDULE" | "PUBLISH_NOW") => void; releaseDate: string; setReleaseDate: (value: string) => void; releaseTime: string; setReleaseTime: (value: string) => void; busy: boolean; submit: () => void }) { const options = [{ value: "SAVE_DRAFT" as const, title: "Save as Draft", copy: "Keep the exam as a draft. Students cannot access it." }, { value: "SCHEDULE" as const, title: "Schedule Release", copy: "Make the exam visible automatically at a selected date and time." }, { value: "PUBLISH_NOW" as const, title: "Publish Now", copy: "Make the exam visible immediately. Students can start only when the examination window becomes active." }]; return <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]"><div className="rounded-xl border bg-white p-5 shadow-sm"><fieldset><legend className="font-bold">Choose how to release this exam</legend><div className="mt-4 grid gap-3">{options.map((option) => <label key={option.value} className="flex cursor-pointer gap-3 rounded-lg border p-4"><input type="radio" name="release-choice" value={option.value} checked={choice === option.value} onChange={() => setChoice(option.value)} className="mt-1" /><span><span className="block font-bold">{option.title}</span><span className="mt-1 block text-sm text-slate-500">{option.copy}</span></span></label>)}</div></fieldset>{choice === "SCHEDULE" ? <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2"><label className="grid gap-1 text-xs font-semibold">Release date *<input type="date" value={releaseDate} onChange={(event) => setReleaseDate(event.target.value)} className={fieldClass} /></label><label className="grid gap-1 text-xs font-semibold">Release time *<input type="time" value={releaseTime} onChange={(event) => setReleaseTime(event.target.value)} className={fieldClass} /></label><p className="text-xs text-slate-500 md:col-span-2">Release timing is separate from the examination window.</p></div> : null}<button type="button" disabled={busy} onClick={submit} className="mt-5 h-11 rounded-lg bg-[#0b3558] px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving…" : choice === "SAVE_DRAFT" ? "Save Draft" : choice === "SCHEDULE" ? "Schedule Release" : "Publish Now"}</button></div><ReleaseSummary review={review} /></section>; }
function PublishDialog({ review, busy, cancel, confirm }: { review: ReviewSummary; busy: boolean; cancel: () => void; confirm: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="publish-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"><h2 id="publish-title" className="text-xl font-bold">Publish exam now?</h2><p className="mt-2 font-bold">{review.test.title}</p><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-slate-500">Batch</dt><dd className="font-bold">{review.test.batch?.name || "Not set"}</dd></div><div><dt className="text-slate-500">Examination</dt><dd className="font-bold">{formatInstant(review.test.examStartsAt)} – {formatInstant(review.test.examEndsAt)}</dd></div><div><dt className="text-slate-500">Questions / marks</dt><dd className="font-bold">{review.actualQuestionCount} / {review.actualMarksTotal}</dd></div></dl><p className="mt-4 text-sm text-slate-600">Students will be able to see this exam immediately. They can start only when the examination window is active.</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={cancel} className="h-10 rounded-lg border px-4 text-sm font-bold">Cancel</button><button type="button" disabled={busy} onClick={confirm} className="h-10 rounded-lg bg-[#0b3558] px-4 text-sm font-bold text-white">{busy ? "Publishing…" : "Publish Exam"}</button></div></div></div>; }
