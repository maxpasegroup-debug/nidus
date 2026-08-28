"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, BookOpen, CalendarDays, Check, Clock3, FileText, Info, Loader2, Medal, Plus, Users, Upload } from "lucide-react";
import { useAcademyBatches } from "@/hooks/use-academy";
import { apiClient, getApiErrorMessage } from "@/services/api";
import { ESSENTIAL_FIELD_ORDER, validateExamEssentials, type EssentialErrors, type EssentialField, type EssentialValues } from "@/lib/exam-essentials-validation";

const NIDUS_TIME_ZONE = "Asia/Kolkata";
const NIDUS_UTC_OFFSET = "+05:30";
type Stage = "home" | "essentials" | "upload" | "review" | "release";
type UploadRecord = { id: string; importJobId?: string | null; originalName?: string; fileType?: string; fileSize?: number };
type Question = { id?: string; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; explanation: string; marks: number; negativeMarks: number; difficultyLevel: string; topic: string; reviewStatus: string; sourcePageNumber?: number };
type ReviewIssue = { id: string; type: string; severity: "HIGH" | "MEDIUM" | "LOW"; state: "OPEN" | "RESOLVED" | "APPROVED_AS_IS"; approvable: boolean; reason?: string };
type ReviewSummary = { actualQuestionCount: number; actualMarksTotal: number; unresolvedHighIssueCount: number; unresolvedAnswerCount: number; answeredQuestionCount: number; missingExplanationCount: number; reviewStatus: "READY" | "REVIEW_REQUIRED"; blockingReasons: string[]; test: { id: string; title: string; subject?: string; topic?: string; duration: number; totalMarks: number; lifecycle: string; publishAt?: string; examStartsAt?: string; examEndsAt?: string; expectedQuestionCount?: number; authoritativeQuestionCount?: number; expectedTotalMarks?: number; batch?: { id: string; name: string } }; questionIssues: Array<{ questionId: string; issues: ReviewIssue[] }> };

const emptyQuestion = (): Question => ({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "", explanation: "", marks: 1, negativeMarks: 0, difficultyLevel: "MEDIUM", topic: "", reviewStatus: "NEEDS_REVIEW" });
const fieldClass = "h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold text-[var(--navy)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/15";

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
  const [dirtyQuestionIndexes, setDirtyQuestionIndexes] = useState<Set<number>>(() => new Set());
  const [questionEditErrors, setQuestionEditErrors] = useState<Record<number, string>>({});
  const [review, setReview] = useState<ReviewSummary>(); const [approvalReasons, setApprovalReasons] = useState<Record<string, string>>({});
  const [releaseChoice, setReleaseChoice] = useState<"SAVE_DRAFT" | "SCHEDULE" | "PUBLISH_NOW">("SAVE_DRAFT");
  const [releaseDate, setReleaseDate] = useState(""); const [releaseTime, setReleaseTime] = useState(""); const [confirmPublish, setConfirmPublish] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [essentialErrors, setEssentialErrors] = useState<EssentialErrors>({});
  const selectedBatch = batches.find((batch) => batch.id === batchId);
  const localStart = startDate && startTime ? new Date(`${startDate}T${startTime}:00${NIDUS_UTC_OFFSET}`) : null;
  const localEnd = localStart && !Number.isNaN(localStart.getTime()) ? new Date(localStart.getTime() + duration * 60_000) : null;

  useEffect(() => {
    if (!initialTestId) return;
    let active = true;
    void apiClient.get<{ test: ReviewSummary["test"] & { description?: string; examType?: string; batchId?: string; questions?: Question[]; expectedQuestionCount?: number } }>(`/tests/${initialTestId}`).then(async ({ data }) => {
      if (!active) return; const test = data.test;
      setTitle(test.title); setExamType(test.examType || "NDA"); setSubject(test.subject || ""); setTopic(test.topic || ""); setBatchId(test.batch?.id || test.batchId || ""); setDuration(test.duration); setMarks(test.totalMarks); setQuestionCount(test.expectedQuestionCount || test.authoritativeQuestionCount || test.questions?.length || 1); setNote(test.description || ""); setQuestions(test.questions || []); setDirtyQuestionIndexes(new Set()); setQuestionEditErrors({});
      if (test.examStartsAt) { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: NIDUS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(test.examStartsAt)); const value = (name: string) => parts.find((part) => part.type === name)?.value || ""; setStartDate(`${value("year")}-${value("month")}-${value("day")}`); setStartTime(`${value("hour")}:${value("minute")}`); }
      if (initialStage === "release" && test.lifecycle === "SCHEDULED" && test.publishAt) { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: NIDUS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(test.publishAt)); const value = (name: string) => parts.find((part) => part.type === name)?.value || ""; setReleaseChoice("SCHEDULE"); setReleaseDate(`${value("year")}-${value("month")}-${value("day")}`); setReleaseTime(`${value("hour")}:${value("minute")}`); }
      if (initialStage === "review" || initialStage === "release") { const latest = await refreshReview(initialTestId); if (active && initialStage === "release" && test.lifecycle !== "SCHEDULED" && latest.reviewStatus !== "READY") setStage("review"); }
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
    if (busy) return;
    const validation = validateExamEssentials({ title, examType, subject, topic, duration, marks, questionCount, startDate, startTime, batchId }, new Set(batches.map((batch) => batch.id)));
    if (Object.keys(validation).length) {
      setEssentialErrors(validation); setError("");
      const first = ESSENTIAL_FIELD_ORDER.find((field) => validation[field]);
      if (first) requestAnimationFrame(() => { const control = document.getElementById(`exam-essential-${first}`); control?.focus(); control?.scrollIntoView({ behavior: "smooth", block: "center" }); });
      return;
    }
    if (!localStart || !localEnd) { setEssentialErrors({ startDate: "Please select a valid exam start date.", startTime: "Please select a valid exam start time." }); return; }
    setBusy(true); setError("");
    try {
      const response = await apiClient.post<{ test: { id: string } }>("/tests", {
        ...(draftId ? { testId: draftId } : {}), title: title.trim(), description: note.trim() || `Director-created ${examType} exam.`, examType, category: "Academy", subject: subject.trim(), topic: topic.trim() || subject.trim(), batchId,
        duration, totalMarks: marks, expectedQuestionCount: questionCount, authoritativeQuestionCount: questionCount, expectedTotalMarks: marks,
        isMockTest: true, isLive: false, status: "DRAFT", examStartsAt: localStart.toISOString(), questions: [],
      });
      setDraftId(response.data.test.id); sessionStorage.setItem("nidus_director_exam_draft", response.data.test.id); setStage("upload");
    } catch (cause) {
      const message = getApiErrorMessage(cause); const mapped = mapEssentialBackendError(message);
      if (Object.keys(mapped).length) { setEssentialErrors((current) => ({ ...current, ...mapped })); const first = ESSENTIAL_FIELD_ORDER.find((field) => mapped[field]); if (first) requestAnimationFrame(() => document.getElementById(`exam-essential-${first}`)?.focus()); }
      else setError(message);
    } finally { setBusy(false); }
  }

  async function uploadFile(event: ChangeEvent<HTMLInputElement>, kind: "QUESTION_PAPER" | "ANSWER_KEY") {
    const file = event.target.files?.[0]; if (!file) return;
    if (kind === "ANSWER_KEY" && !questionPaper) { setUploadError("Question paper is required."); event.target.value = ""; return; }
    const allowedMimeTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
    if (!/\.(pdf|docx?)$/i.test(file.name) || (file.type && !allowedMimeTypes.has(file.type))) { setError("Unsupported file type. Upload a PDF, DOC, or DOCX file."); event.target.value = ""; return; }
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.append("file", file); form.append("sourceKind", kind); form.append("batchId", batchId); form.append("subject", subject); if (draftId) form.append("testId", draftId);
      const response = await apiClient.post<{ upload: UploadRecord }>("/academy/exams/uploads", form, { headers: { "Content-Type": "multipart/form-data" } });
      const upload = { ...response.data.upload, originalName: file.name, fileType: file.type, fileSize: file.size }; if (kind === "QUESTION_PAPER") { setQuestionPaper(upload); setUploadError(""); } else setSolutionPaper(upload);
    } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  }

  async function reconstruct() {
    if (busy) return;
    if (!questionPaper) { setUploadError("Question paper is required."); return; }
    if (!draftId) { setError("Save Exam Essentials before uploading the paper."); return; }
    setBusy(true); setError("");
    try {
      const uploads = [questionPaper, solutionPaper].filter((upload): upload is UploadRecord => Boolean(upload));
      const response = await apiClient.post<{ reconstruction?: { draft?: { questions?: Array<Record<string, unknown>> } } }>("/academy/exams/import/reconstruct", { testId: draftId, batchId, subject, examUploadIds: uploads.map((upload) => upload.id), importJobIds: uploads.map((upload) => upload.importJobId).filter(Boolean) });
      const extracted = response.data.reconstruction?.draft?.questions || [];
      const parsed = extracted.map((item) => {
        const options = Array.isArray(item.options) ? item.options as Array<{ label?: string; text?: string }> : [];
        const option = (label: string) => options.find((entry) => entry.label?.toUpperCase() === label)?.text || "";
        return { ...emptyQuestion(), questionText: String(item.questionText || item.text || ""), optionA: option("A"), optionB: option("B"), optionC: option("C"), optionD: option("D"), correctAnswer: String(item.linkedAnswer || "").toUpperCase(), explanation: String(item.linkedSolution || ""), topic: topic || subject, reviewStatus: String(item.reviewStatus || "NEEDS_REVIEW"), sourcePageNumber: typeof item.sourcePageNumber === "number" ? item.sourcePageNumber : typeof item.sourcePage === "number" ? item.sourcePage : undefined };
      });
      if (!parsed.length) throw new Error("No questions were reconstructed.");
      const saved = await apiClient.post<{ test: { questions?: Question[] } }>("/academy/exams", { testId: draftId, title, topic: topic || subject, subject, batchId, durationMinutes: duration, manualPaperReview: true, examUploadIds: uploads.map((upload) => upload.id), draft: { manualPaperReview: true, questions: parsed } });
      setQuestions((saved.data.test.questions || []).map((question, index) => ({ ...parsed[index], ...question }))); setDirtyQuestionIndexes(new Set()); setQuestionEditErrors({}); await refreshReview(draftId); setStage("review");
    } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  }

  async function clearQuestionsForReplacement() {
    if (busy || !draftId || !questions.length) return;
    const confirmed = window.confirm("Clear the current questions and re-upload a replacement paper? Essentials will be preserved, but the existing question set will be removed.");
    if (!confirmed) return;
    setBusy(true); setError(""); setUploadError("");
    try {
      await apiClient.post(`/tests/${draftId}/questions/clear`, {});
      setQuestions([]); setReview(undefined); setEditing(null); setDirtyQuestionIndexes(new Set()); setQuestionEditErrors({}); setQuestionPaper(undefined); setSolutionPaper(undefined);
      setStage("upload");
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally { setBusy(false); }
  }

  function editQuestion(index: number, change: Partial<Question>, markDirty = true) {
    setQuestions((current) => current.map((question, itemIndex) => itemIndex === index ? { ...question, ...change } : question));
    if (markDirty) {
      setDirtyQuestionIndexes((current) => new Set(current).add(index));
      setQuestionEditErrors((current) => { if (!current[index]) return current; const next = { ...current }; delete next[index]; return next; });
    }
  }
  async function persistQuestion(index: number) {
    const question = questions[index]; if (!question.id) return;
    setBusy(true); setError("");
    try { const response = await apiClient.put<{ question: Question }>(`/tests/${draftId}/questions/${question.id}`, { ...question, reviewStatus: "REVIEWED" }); editQuestion(index, response.data.question, false); setDirtyQuestionIndexes((current) => { const next = new Set(current); next.delete(index); return next; }); setQuestionEditErrors((current) => { const next = { ...current }; delete next[index]; return next; }); setEditing(null); await refreshReview(); } catch (cause) { setQuestionEditErrors((current) => ({ ...current, [index]: getApiErrorMessage(cause) })); } finally { setBusy(false); }
  }
  function editNextUnansweredQuestion() {
    const index = questions.findIndex((question) => !/^[A-D]$/i.test(question.correctAnswer.trim()));
    if (index < 0) return;
    setEditing(index);
    window.setTimeout(() => {
      document.getElementById(`review-question-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById(`review-question-${index}-answer`)?.focus();
    }, 0);
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

  const progress = <StepProgress stage={stage} />;
  return <main className="mx-auto max-w-[1380px] px-3 py-5 text-[var(--navy)] sm:px-5 lg:px-7"><header className="grid items-end gap-6 border-b border-[var(--border)] pb-6 lg:grid-cols-[minmax(300px,.8fr)_minmax(480px,1.2fr)]"><div className="flex gap-3">{stage !== "essentials" ? <button type="button" aria-label="Back" onClick={() => { if (stage === "release") { void refreshReview(); setStage("review"); } else setStage(stage === "review" ? "upload" : "essentials"); }} className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-white"><ArrowLeft size={17}/></button> : null}<div><p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--gold)]">NIDUS AI Exams</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{stage === "essentials" ? "Create Exam" : stage === "upload" ? "Upload Paper" : stage === "review" ? "Build & Review" : "Release Exam"}</h1><p className="mt-1 text-sm font-medium text-[var(--muted-blue)]">Create and review academy examinations.</p></div></div>{progress}</header>{error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}

    {stage === "essentials" ? <EssentialsStage title={title} setTitle={setTitle} examType={examType} setExamType={setExamType} subject={subject} setSubject={setSubject} topic={topic} setTopic={setTopic} duration={duration} setDuration={setDuration} marks={marks} setMarks={setMarks} questionCount={questionCount} setQuestionCount={setQuestionCount} note={note} setNote={setNote} startDate={startDate} setStartDate={setStartDate} startTime={startTime} setStartTime={setStartTime} batchId={batchId} setBatchId={setBatchId} batches={batches} selectedBatch={selectedBatch} localStart={localStart} localEnd={localEnd} errors={essentialErrors} clearError={(field) => setEssentialErrors((current) => { const next = { ...current }; delete next[field]; return next; })} busy={busy} save={saveEssentials} cancel={() => router.push("/dashboard/director/exams")} /> : null}

    {stage === "upload" ? <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm"><div className="flex gap-2"><FileText className="text-[#0b5d8f]" /><div><h2 className="font-bold">Upload &amp; Review</h2><p className="text-sm text-slate-500">Reconstruction saves questions into the existing draft.</p></div></div>{questions.length ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><span>This draft already has {questions.length} question{questions.length === 1 ? "" : "s"}. Clear them before uploading a replacement paper.</span><button type="button" disabled={busy} onClick={clearQuestionsForReplacement} className="rounded-lg border border-amber-700 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50">Clear questions &amp; re-upload</button></div> : null}<div className="mt-5 grid gap-3 md:grid-cols-2"><UploadField label="Question paper *" required file={questionPaper} error={uploadError} onRemove={() => setQuestionPaper(undefined)} onChange={(event) => uploadFile(event, "QUESTION_PAPER")} /><UploadField label="Answer key" optional file={solutionPaper} onRemove={() => setSolutionPaper(undefined)} onChange={(event) => uploadFile(event, "ANSWER_KEY")} /></div><p className="mt-3 text-sm text-[var(--muted-blue)]">You can continue without an answer key. Questions with an unknown correct answer will be flagged for review.</p><div className="mt-5 text-right"><button type="button" disabled={busy || !questionPaper} onClick={reconstruct} className="rounded-lg bg-[#0b3558] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : null}Upload &amp; Process</button></div></section> : null}

    {stage === "review" ? <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]"><div className="grid gap-4">{questions.map((question, index) => { const issues = review?.questionIssues.find((entry) => entry.questionId === question.id)?.issues || []; return <article id={`review-question-${index}`} key={question.id || index} className="scroll-mt-6 rounded-xl border bg-white p-5 shadow-sm"><div className="flex justify-between"><div><p className="text-xs font-bold text-slate-500">QUESTION {index + 1}</p><p className="text-xs text-slate-500">{question.sourcePageNumber ? `Source page ${question.sourcePageNumber}` : "No source coordinates were provided."}</p></div><button type="button" onClick={() => setEditing(editing === index ? null : index)} className="text-sm font-bold text-[#0b5d8f]">{editing === index ? "Close" : "Edit"}</button></div>{editing === index ? <QuestionEditor question={question} index={index} error={questionEditErrors[index]} onChange={(change) => editQuestion(index, change)} onSave={() => persistQuestion(index)} busy={busy} /> : <QuestionPreview question={question} />}{issues.filter((issue) => issue.state !== "RESOLVED").map((issue) => { const key = `${question.id}:${issue.id}`; const issueLabel = issue.type === "INVALID_CORRECT_ANSWER" ? "Answer required before release" : issue.type.replaceAll("_", " "); return <div key={issue.id} className={`mt-3 rounded-lg border p-3 text-xs ${issue.severity === "HIGH" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}><div className="flex items-center gap-2 font-bold"><AlertTriangle size={15} />{issue.severity}: {issueLabel} · {issue.state.replaceAll("_", " ")}</div>{issue.state === "OPEN" && issue.approvable ? <div className="mt-2 flex flex-wrap gap-2"><input aria-label={`Reason for ${issue.type}`} value={approvalReasons[key] || ""} onChange={(event) => setApprovalReasons((current) => ({ ...current, [key]: event.target.value }))} placeholder="Reason required" className="h-9 min-w-48 rounded border bg-white px-2" /><button type="button" onClick={() => approveAsIs(question.id!, issue.id)} disabled={busy} className="rounded border border-amber-400 bg-white px-3 font-bold">Approve as-is</button></div> : issue.state === "OPEN" ? <p className="mt-1">You can save this draft now, but set the correct answer before Release.</p> : null}</div>; })}</article>; })}</div><ReviewPanel review={review} busy={busy} reconcile={reconcile} onContinue={enterRelease} onReplace={clearQuestionsForReplacement} onReviewAnswers={editNextUnansweredQuestion} onExit={() => { if (dirtyQuestionIndexes.size && !window.confirm("Leave without saving your question changes?")) return; router.push("/dashboard/director/exams"); }} /></section> : null}
    {stage === "release" && review ? <ReleaseStage review={review} choice={releaseChoice} setChoice={setReleaseChoice} releaseDate={releaseDate} setReleaseDate={setReleaseDate} releaseTime={releaseTime} setReleaseTime={setReleaseTime} busy={busy} submit={submitRelease} /> : null}
    {confirmPublish && review ? <PublishDialog review={review} busy={busy} cancel={() => setConfirmPublish(false)} confirm={() => submitRelease("PUBLISH_NOW")} /> : null}
  </main>;
}

function StepProgress({ stage }: { stage: Stage }) {
  const active = stage === "essentials" ? 0 : stage === "upload" || stage === "review" ? 1 : 2;
  return <ol aria-label="Create exam progress" className="mt-5 grid grid-cols-3 text-center text-[11px] font-black text-[var(--navy)]">{["Essentials", "Upload & Review", "Release"].map((label, index) => <li key={label} className="relative"><span className={`relative z-10 mx-auto grid h-9 w-9 place-items-center rounded-full border ${index <= active ? "border-[var(--gold)] bg-[var(--gold-gradient)]" : "border-[var(--border)] bg-white"}`}>{index + 1}</span>{index < 2 ? <span aria-hidden className="absolute left-1/2 top-[17px] h-px w-full bg-[var(--border)]" /> : null}<span className="relative z-10 mt-2 block">{label}</span></li>)}</ol>;
}

function mapEssentialBackendError(message: string): EssentialErrors {
  const normalized = message.toLowerCase(); const errors: EssentialErrors = {};
  if (normalized.includes("title")) errors.title = message;
  if (normalized.includes("exam type")) errors.examType = message;
  if (normalized.includes("subject")) errors.subject = message;
  if (normalized.includes("topic")) errors.topic = message;
  if (normalized.includes("duration")) errors.duration = message;
  if (normalized.includes("total marks") || normalized.includes("marks")) errors.marks = message;
  if (normalized.includes("question count")) errors.questionCount = message;
  if (normalized.includes("exam start")) { errors.startDate = message; errors.startTime = message; }
  if (normalized.includes("batch")) errors.batchId = message;
  return errors;
}

type BatchOption = { id: string; name: string };
type EssentialsProps = {
  title: string; setTitle: (value: string) => void; examType: string; setExamType: (value: string) => void; subject: string; setSubject: (value: string) => void; topic: string; setTopic: (value: string) => void;
  duration: number; setDuration: (value: number) => void; marks: number; setMarks: (value: number) => void; questionCount: number; setQuestionCount: (value: number) => void; note: string; setNote: (value: string) => void;
  startDate: string; setStartDate: (value: string) => void; startTime: string; setStartTime: (value: string) => void; batchId: string; setBatchId: (value: string) => void; batches: BatchOption[]; selectedBatch?: BatchOption;
  localStart: Date | null; localEnd: Date | null; errors: EssentialErrors; clearError: (field: EssentialField) => void; busy: boolean; save: () => void; cancel: () => void;
};

function EssentialsStage(props: EssentialsProps) {
  const time = (date: Date | null) => date?.toLocaleTimeString("en-IN", { timeZone: NIDUS_TIME_ZONE, hour: "numeric", minute: "2-digit" }) || "—";
  const date = props.localStart?.toLocaleDateString("en-IN", { timeZone: NIDUS_TIME_ZONE, day: "numeric", month: "short", year: "numeric" }) || "Not set";
  const values: EssentialValues = { title: props.title, examType: props.examType, subject: props.subject, topic: props.topic, duration: props.duration, marks: props.marks, questionCount: props.questionCount, startDate: props.startDate, startTime: props.startTime, batchId: props.batchId };
  function update<K extends EssentialField>(field: K, value: EssentialValues[K], setter: (next: EssentialValues[K]) => void) { setter(value); if (!validateExamEssentials({ ...values, [field]: value } as EssentialValues, new Set(props.batches.map((batch) => batch.id)))[field]) props.clearError(field); }
  return <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"><div className="p-5 sm:p-6"><h2 className="text-xl font-black">Exam Essentials</h2><div className="mt-6 grid gap-x-5 gap-y-5 md:grid-cols-2">
      <TextField field="title" label="Exam name *" value={props.title} error={props.errors.title} setValue={(value) => update("title", value, props.setTitle)}/><SelectField field="examType" label="Exam type *" value={props.examType} error={props.errors.examType} setValue={(value) => update("examType", value, props.setExamType)} options={["NDA", "CDS", "AFCAT", "AGNIVEER", "SSC"]}/>
      <TextField field="subject" label="Subject *" value={props.subject} error={props.errors.subject} setValue={(value) => update("subject", value, props.setSubject)}/><TextField field="topic" label="Topic *" value={props.topic} error={props.errors.topic} setValue={(value) => update("topic", value, props.setTopic)}/>
      <NumberField field="duration" label="Duration *" value={props.duration} error={props.errors.duration} setValue={(value) => update("duration", value, props.setDuration)} suffix="minutes"/><NumberField field="marks" label="Marks *" value={props.marks} error={props.errors.marks} setValue={(value) => update("marks", value, props.setMarks)}/>
      <NumberField field="questionCount" label="Questions *" value={props.questionCount} error={props.errors.questionCount} setValue={(value) => update("questionCount", value, props.setQuestionCount)}/><label className="grid gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">Short note<textarea value={props.note} onChange={(event) => props.setNote(event.target.value)} rows={2} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm font-semibold normal-case tracking-normal text-[var(--navy)] outline-none focus:border-[var(--gold)]"/></label>
      <label className="grid gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">Exam start date *<input id="exam-essential-startDate" aria-invalid={Boolean(props.errors.startDate)} aria-describedby={props.errors.startDate ? "exam-essential-startDate-error" : undefined} type="date" value={props.startDate} onChange={(event) => update("startDate", event.target.value, props.setStartDate)} className={`${fieldClass} ${props.errors.startDate ? "border-red-400" : ""}`}/><FieldError field="startDate" error={props.errors.startDate}/></label><label className="grid gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">Exam start time *<input id="exam-essential-startTime" aria-invalid={Boolean(props.errors.startTime)} aria-describedby={props.errors.startTime ? "exam-essential-startTime-error" : undefined} type="time" value={props.startTime} onChange={(event) => update("startTime", event.target.value, props.setStartTime)} className={`${fieldClass} ${props.errors.startTime ? "border-red-400" : ""}`}/><FieldError field="startTime" error={props.errors.startTime}/></label>
      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-semibold text-[#173f75] md:col-span-2"><Info size={16} className="shrink-0"/>{props.localEnd ? `Exam ends automatically at ${time(props.localEnd)} based on the ${props.duration}-minute duration.` : "Set the examination date, start time, and duration to calculate the end time."}</div>
      <label className="grid gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)] md:col-span-2">Batch *<select id="exam-essential-batchId" aria-invalid={Boolean(props.errors.batchId)} aria-describedby={props.errors.batchId ? "exam-essential-batchId-error" : undefined} value={props.batchId} onChange={(event) => update("batchId", event.target.value, props.setBatchId)} className={`${fieldClass} ${props.errors.batchId ? "border-red-400" : ""}`}><option value="">Choose a batch</option>{props.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select><FieldError field="batchId" error={props.errors.batchId}/></label>
    </div></div><footer className="flex items-center justify-between border-t border-[var(--border)] bg-[#fffdf8] p-4 sm:px-6"><button type="button" onClick={props.cancel} className="h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">Cancel</button><button type="button" disabled={props.busy} onClick={props.save} className="h-11 rounded-xl border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-6 text-sm font-black text-[var(--navy)] shadow-[0_14px_34px_rgba(185,145,63,0.24)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:opacity-60">{props.busy ? "Saving…" : "Save & Continue  →"}</button></footer></section>
    <aside className="rounded-2xl border border-[var(--gold-border)] bg-[#fffefb] p-5 shadow-sm"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">Exam Summary</p><div className="mt-5 grid gap-4"><SummaryLine icon={FileText} label="Exam" value={props.title || "Not set"}/><SummaryLine icon={Medal} label="Type" value={props.examType}/><SummaryLine icon={BookOpen} label="Subject" value={props.subject || "Not set"}/><SummaryLine icon={BookOpen} label="Topic" value={props.topic || "Not set"}/><SummaryLine icon={Medal} label="Questions" value={String(props.questionCount)}/><SummaryLine icon={Medal} label="Marks" value={String(props.marks)}/><SummaryLine icon={Clock3} label="Duration" value={`${props.duration} minutes`}/><SummaryLine icon={Users} label="Batch" value={props.selectedBatch?.name || "Not set"}/><SummaryLine icon={CalendarDays} label="Examination" value={`${date}\n${time(props.localStart)} – ${time(props.localEnd)}`}/><div><p className="text-xs font-semibold text-[var(--muted-blue)]">Status</p><span className="mt-1 inline-flex rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-2.5 py-1 text-[10px] font-black tracking-wider text-amber-800">DRAFT</span></div></div><div className="mt-6 flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold leading-5 text-[#173f75]"><Info size={16} className="mt-0.5 shrink-0"/><p>Saved as draft first. Students cannot access this exam until it is released and the examination window becomes active.</p></div></aside>
  </div>;
}

function SummaryLine({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) { return <div className="flex gap-3"><Icon size={16} className="mt-0.5 shrink-0 text-[#173f75]"/><div><p className="text-xs font-semibold text-[var(--muted-blue)]">{label}</p><p className="mt-0.5 whitespace-pre-line text-sm font-black">{value}</p></div></div>; }
function FieldError({ field, error }: { field: EssentialField; error?: string }) { return error ? <span id={`exam-essential-${field}-error`} role="alert" className="text-xs font-semibold normal-case tracking-normal text-red-700">{error}</span> : null; }
function SelectField({ field, label, value, error, setValue, options }: { field: EssentialField; label: string; value: string; error?: string; setValue: (value: string) => void; options: string[] }) { return <label className="grid gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">{label}<select id={`exam-essential-${field}`} aria-invalid={Boolean(error)} aria-describedby={error ? `exam-essential-${field}-error` : undefined} value={value} onChange={(event) => setValue(event.target.value)} className={`${fieldClass} ${error ? "border-red-400" : ""}`}>{options.map((option) => <option key={option}>{option}</option>)}</select><FieldError field={field} error={error}/></label>; }
function TextField({ field, label, value, error, setValue }: { field: EssentialField; label: string; value: string; error?: string; setValue: (value: string) => void }) { return <label className="grid gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">{label}<input id={`exam-essential-${field}`} aria-invalid={Boolean(error)} aria-describedby={error ? `exam-essential-${field}-error` : undefined} value={value} onChange={(event) => setValue(event.target.value)} className={`${fieldClass} ${error ? "border-red-400" : ""}`} /><FieldError field={field} error={error}/></label>; }
function NumberField({ field, label, value, error, setValue, suffix }: { field: EssentialField; label: string; value: number; error?: string; setValue: (value: number) => void; suffix?: string }) { return <label className="grid gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">{label}<span className={`flex overflow-hidden rounded-xl border bg-white focus-within:border-[var(--gold)] ${error ? "border-red-400" : "border-[var(--border)]"}`}><input id={`exam-essential-${field}`} aria-invalid={Boolean(error)} aria-describedby={error ? `exam-essential-${field}-error` : undefined} type="number" min={1} step={field === "questionCount" ? 1 : "any"} value={value} onChange={(event) => setValue(event.target.valueAsNumber)} className="h-12 min-w-0 flex-1 px-3 text-sm font-semibold normal-case tracking-normal outline-none"/>{suffix ? <span className="grid place-items-center border-l border-[var(--border)] px-4 text-xs font-semibold normal-case tracking-normal text-[var(--muted-blue)]">{suffix}</span> : null}</span><FieldError field={field} error={error}/></label>; }
function UploadField({ label, file, required, optional, error, onChange, onRemove }: { label: string; file?: UploadRecord; required?: boolean; optional?: boolean; error?: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; onRemove: () => void }) { const type = file?.originalName?.split(".").pop()?.toUpperCase(); const size = file?.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(1)} MB` : ""; return <div><p className="text-sm font-black text-[var(--navy)]">{label}</p><p className="mb-2 text-xs text-[var(--muted-blue)]">{required ? "Required" : optional ? "Optional" : ""}</p><label className="flex min-h-28 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-white p-4 transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"><Upload className="text-[var(--gold)]"/><span className="min-w-0"><b>{file ? file.originalName : `Choose ${label.replace(/ \*$/, "")}`}</b><small className="block text-[var(--muted-blue)]">{file ? [type, size].filter(Boolean).join(" • ") : "Supported: PDF, DOC, DOCX"}</small></span><input className="sr-only" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onChange} /></label>{file ? <button type="button" onClick={onRemove} className="mt-2 text-xs font-bold text-[var(--muted-blue)] underline">Remove / replace</button> : null}{error ? <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}</div>; }
function QuestionPreview({ question }: { question: Question }) { return <div><p className="mt-3 font-semibold">{question.questionText || "Question text missing"}</p><div className="mt-2 grid gap-2 text-sm md:grid-cols-2">{[question.optionA, question.optionB, question.optionC, question.optionD].map((option, index) => <p key={index} className="rounded bg-slate-50 p-2">{String.fromCharCode(65 + index)}. {option || "Missing"}</p>)}</div><p className="mt-2 text-xs">Answer: {question.correctAnswer || "To be completed"} · {question.marks} marks</p>{!question.explanation.trim() ? <p className="mt-1 text-xs text-slate-500">Explanation optional.</p> : null}</div>; }
function QuestionEditor({ question, index, error, onChange, onSave, busy }: { question: Question; index: number; error?: string; onChange: (change: Partial<Question>) => void; onSave: () => void; busy: boolean }) { const prefix = `review-question-${index}`; return <div className="mt-4 grid gap-3"><label htmlFor={`${prefix}-text`} className="grid gap-1 text-xs font-bold text-[var(--navy)]">Question text *<textarea id={`${prefix}-text`} aria-describedby={error ? `${prefix}-error` : undefined} value={question.questionText} onChange={(event) => onChange({ questionText: event.target.value })} className="min-h-20 rounded-xl border border-[var(--border)] p-3 text-sm font-medium outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/15" /></label><fieldset className="grid gap-2"><legend className="mb-1 text-xs font-bold text-[var(--navy)]">Answer options *</legend>{(["A", "B", "C", "D"] as const).map((letter) => <label key={letter} htmlFor={`${prefix}-option-${letter}`} className="grid gap-1 text-xs font-semibold text-[var(--muted-blue)]">Option {letter}<input id={`${prefix}-option-${letter}`} value={question[`option${letter}`]} onChange={(event) => onChange({ [`option${letter}`]: event.target.value })} className={fieldClass} /></label>)}</fieldset><label htmlFor={`${prefix}-answer`} className="grid gap-1 text-xs font-bold text-[var(--navy)]">Correct answer <span className="font-medium text-[var(--muted-blue)]">Can be completed later; required before Release.</span><select id={`${prefix}-answer`} aria-describedby={`${prefix}-answer-help${error ? ` ${prefix}-error` : ""}`} value={question.correctAnswer} onChange={(event) => onChange({ correctAnswer: event.target.value })} className={fieldClass}><option value="">Not set — complete later</option>{["A", "B", "C", "D"].map((letter) => <option key={letter} value={letter}>{letter}</option>)}</select><span id={`${prefix}-answer-help`} className="font-medium text-amber-800">Leaving this unset keeps the exam in Review required.</span></label><label htmlFor={`${prefix}-explanation`} className="grid gap-1 text-xs font-bold text-[var(--navy)]">Explanation <span className="font-medium text-[var(--muted-blue)]">Optional</span><textarea id={`${prefix}-explanation`} value={question.explanation} onChange={(event) => onChange({ explanation: event.target.value })} placeholder="Add an explanation now or later" className="min-h-20 rounded-xl border border-[var(--border)] p-3 text-sm font-medium outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/15" /></label><label htmlFor={`${prefix}-marks`} className="grid gap-1 text-xs font-bold text-[var(--navy)]">Marks *<input id={`${prefix}-marks`} type="number" min="0.01" step="0.01" value={question.marks} onChange={(event) => onChange({ marks: Number(event.target.value) })} className={fieldClass} /></label>{error ? <p id={`${prefix}-error`} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p> : null}<button type="button" disabled={busy} onClick={onSave} className="rounded bg-[#0b3558] p-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save draft changes"}</button></div>; }
function ReviewPanel({ review, busy, reconcile, onContinue, onReplace, onReviewAnswers, onExit }: { review?: ReviewSummary; busy: boolean; reconcile: (kind: "count" | "marks") => void; onContinue: () => void; onReplace: () => void; onReviewAnswers: () => void; onExit: () => void }) { if (!review) return <aside className="rounded-xl border bg-white p-5">Loading review…</aside>; const countMismatch = review.test.authoritativeQuestionCount !== review.actualQuestionCount; const marksMismatch = Math.abs(review.test.totalMarks - review.actualMarksTotal) > 0.0001; return <aside className="h-fit rounded-xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-[#0b5d8f]">Review summary</p><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-slate-500">Questions</dt><dd className="font-bold">{review.actualQuestionCount}</dd></div><div><dt className="text-slate-500">Answers completed</dt><dd className="font-bold">{review.answeredQuestionCount} of {review.actualQuestionCount}</dd></div>{review.unresolvedAnswerCount ? <div><dt className="text-slate-500">Answers to complete later</dt><dd className="font-bold text-amber-800">{review.unresolvedAnswerCount}</dd></div> : null}<div><dt className="text-slate-500">Original expectation</dt><dd className="font-bold">{review.test.expectedQuestionCount ?? "Not recorded"}</dd></div><div><dt className="text-slate-500">Marks</dt><dd className="font-bold">{review.actualMarksTotal}</dd></div><div><dt className="text-slate-500">Issues</dt><dd className="font-bold">{review.unresolvedHighIssueCount} blocking</dd></div><div><dt className="text-slate-500">Status</dt><dd className="font-bold">{review.reviewStatus === "READY" ? "Ready for Release" : "Review required"}</dd></div></dl>{review.unresolvedAnswerCount ? <button type="button" disabled={busy} onClick={onReviewAnswers} className="mt-4 w-full rounded border border-amber-700 bg-amber-50 p-2 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50">Review next unanswered question</button> : null}{review.blockingReasons.length ? <ul className="mt-4 list-disc pl-4 text-xs text-amber-900">{review.blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p className="mt-4 flex gap-2 rounded bg-emerald-50 p-3 text-xs text-emerald-900"><Check size={15} />Backend review gate is ready. Exam remains DRAFT.</p>}{countMismatch ? <button type="button" disabled={busy} onClick={() => reconcile("count")} className="mt-3 w-full rounded border border-[#0b3558] p-2 text-xs font-bold text-[#0b3558]">Update exam to {review.actualQuestionCount} questions</button> : null}{marksMismatch ? <button type="button" disabled={busy} onClick={() => reconcile("marks")} className="mt-2 w-full rounded border border-[#0b3558] p-2 text-xs font-bold text-[#0b3558]">Update exam total to {review.actualMarksTotal}</button> : null}<button type="button" disabled={busy} onClick={onReplace} className="mt-3 w-full rounded border border-amber-700 p-2 text-xs font-bold text-amber-900 hover:bg-amber-50 disabled:opacity-50">Clear questions &amp; re-upload</button><button type="button" disabled={busy} onClick={onExit} className="mt-2 w-full rounded border border-[var(--border)] bg-white p-2 text-xs font-bold text-[var(--navy)] hover:border-[var(--gold)] disabled:opacity-50">Return to Exam Control</button><button type="button" disabled={busy || review.reviewStatus !== "READY"} onClick={onContinue} className="mt-4 w-full rounded-lg bg-[#0b3558] p-3 text-sm font-bold text-white disabled:opacity-50">Continue to Release →</button></aside>; }

function formatInstant(value?: string) { return value ? new Date(value).toLocaleString("en-IN", { timeZone: NIDUS_TIME_ZONE, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not set"; }
function ReleaseSummary({ review }: { review: ReviewSummary }) { const test = review.test; return <aside className="h-fit rounded-xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-[#0b5d8f]">Final exam summary</p><h2 className="mt-3 text-xl font-bold">{test.title}</h2><p className="text-sm text-slate-500">{test.subject || "No subject"} · {test.topic || "No topic"}</p><dl className="mt-5 grid gap-3 text-sm"><div><dt className="text-slate-500">Batch</dt><dd className="font-bold">{test.batch?.name || "Not set"}</dd></div><div><dt className="text-slate-500">Examination</dt><dd className="font-bold">{formatInstant(test.examStartsAt)} – {formatInstant(test.examEndsAt)}</dd></div><div><dt className="text-slate-500">Duration</dt><dd className="font-bold">{test.duration} minutes</dd></div><div><dt className="text-slate-500">Questions</dt><dd className="font-bold">{review.actualQuestionCount}</dd></div><div><dt className="text-slate-500">Marks</dt><dd className="font-bold">{review.actualMarksTotal}</dd></div><div><dt className="text-slate-500">Review</dt><dd className="font-bold">✓ Ready for release</dd></div></dl></aside>; }
function ReleaseStage({ review, choice, setChoice, releaseDate, setReleaseDate, releaseTime, setReleaseTime, busy, submit }: { review: ReviewSummary; choice: "SAVE_DRAFT" | "SCHEDULE" | "PUBLISH_NOW"; setChoice: (choice: "SAVE_DRAFT" | "SCHEDULE" | "PUBLISH_NOW") => void; releaseDate: string; setReleaseDate: (value: string) => void; releaseTime: string; setReleaseTime: (value: string) => void; busy: boolean; submit: () => void }) { const options = [{ value: "SAVE_DRAFT" as const, title: "Save as Draft", copy: "Keep the exam as a draft. Students cannot access it." }, { value: "SCHEDULE" as const, title: "Schedule Release", copy: "Make the exam visible automatically at a selected date and time." }, { value: "PUBLISH_NOW" as const, title: "Publish Now", copy: "Make the exam visible immediately. Students can start only when the examination window becomes active." }]; return <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]"><div className="rounded-xl border bg-white p-5 shadow-sm"><fieldset><legend className="font-bold">Choose how to release this exam</legend><div className="mt-4 grid gap-3">{options.map((option) => <label key={option.value} className="flex cursor-pointer gap-3 rounded-lg border p-4"><input type="radio" name="release-choice" value={option.value} checked={choice === option.value} onChange={() => setChoice(option.value)} className="mt-1" /><span><span className="block font-bold">{option.title}</span><span className="mt-1 block text-sm text-slate-500">{option.copy}</span></span></label>)}</div></fieldset>{choice === "SCHEDULE" ? <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2"><label className="grid gap-1 text-xs font-semibold">Release date *<input type="date" value={releaseDate} onChange={(event) => setReleaseDate(event.target.value)} className={fieldClass} /></label><label className="grid gap-1 text-xs font-semibold">Release time *<input type="time" value={releaseTime} onChange={(event) => setReleaseTime(event.target.value)} className={fieldClass} /></label><p className="text-xs text-slate-500 md:col-span-2">Release timing is separate from the examination window.</p></div> : null}<button type="button" disabled={busy} onClick={submit} className="mt-5 h-11 rounded-lg bg-[#0b3558] px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving…" : choice === "SAVE_DRAFT" ? "Save Draft" : choice === "SCHEDULE" ? "Schedule Release" : "Publish Now"}</button></div><ReleaseSummary review={review} /></section>; }
function PublishDialog({ review, busy, cancel, confirm }: { review: ReviewSummary; busy: boolean; cancel: () => void; confirm: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="publish-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"><h2 id="publish-title" className="text-xl font-bold">Publish exam now?</h2><p className="mt-2 font-bold">{review.test.title}</p><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-slate-500">Batch</dt><dd className="font-bold">{review.test.batch?.name || "Not set"}</dd></div><div><dt className="text-slate-500">Examination</dt><dd className="font-bold">{formatInstant(review.test.examStartsAt)} – {formatInstant(review.test.examEndsAt)}</dd></div><div><dt className="text-slate-500">Questions / marks</dt><dd className="font-bold">{review.actualQuestionCount} / {review.actualMarksTotal}</dd></div></dl><p className="mt-4 text-sm text-slate-600">Students will be able to see this exam immediately. They can start only when the examination window is active.</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={cancel} className="h-10 rounded-lg border px-4 text-sm font-bold">Cancel</button><button type="button" disabled={busy} onClick={confirm} className="h-10 rounded-lg bg-[#0b3558] px-4 text-sm font-bold text-white">{busy ? "Publishing…" : "Publish Exam"}</button></div></div></div>; }
