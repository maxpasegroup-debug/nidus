"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, ClipboardCheck, FileText, GraduationCap, Plus, RotateCcw, Save, Send, Trash2, Upload, UserRound } from "lucide-react";
import { getApiErrorMessage } from "@/services/api";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { approveNdpReview, getNdpReview, getNdpReviews, getNdpStudents, publishNdpReview, returnNdpReview, saveNdpReview, submitNdpReview, type NdpManualEntry, type NdpReview, type NdpStudentBatch } from "@/services/academy";
import { TeacherModuleHeader } from "@/components/teacher/teacher-dashboard-primitives";

const reviewTypes = ["MONTHLY", "TERM", "WEEKLY"] as const;
const ratings = ["", "Excellent", "Very Good", "Good", "Needs Improvement", "At Risk"];
const fieldClass = "min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold normal-case tracking-normal text-[var(--ink)] outline-none focus:border-slate-950 disabled:bg-slate-50 disabled:text-slate-400";
const termFieldClass = "min-h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold normal-case tracking-normal text-[var(--ink)] outline-none focus:border-slate-950 disabled:bg-slate-50 disabled:text-slate-400";

const categoryLabels: Record<string, string> = {
  ACADEMIC_PERFORMANCE: "Academic Performance",
  SKILL_DEVELOPMENT: "Skill Development Assessment",
  TEST_PERFORMANCE: "Test Performance Summary",
  DEFENCE_DEVELOPMENT: "Defence Aspirant Development",
  TEACHER_OBSERVATION: "Teacher's Observations",
  NEXT_TERM_ACTION_PLAN: "Next-Term Action Plan",
  FINAL_REVIEW: "Final Review",
};

const categoryHelp: Record<string, string> = {
  ACADEMIC_PERFORMANCE: "Enter subject-wise term marks and the final performance score.",
  SKILL_DEVELOPMENT: "Rate learning skills that affect classroom performance.",
  TEST_PERFORMANCE: "Record class tests, mock tests and weekly assessment performance.",
  DEFENCE_DEVELOPMENT: "Capture discipline, confidence, fitness and officer-readiness signals.",
  TEACHER_OBSERVATION: "Keep remarks short and useful for review.",
  NEXT_TERM_ACTION_PLAN: "Write strengths, attention areas and next-term goals.",
  FINAL_REVIEW: "Close the review with the overall progress summary.",
};

const quickPeriods = ["Term 1", "Term 2", "Term 3"];
const customCategories = [
  { value: "ACADEMIC_PERFORMANCE", label: "Subject Performance" },
  { value: "TEST_PERFORMANCE", label: "Exam/Test Performance" },
  { value: "SKILL_DEVELOPMENT", label: "Skill Development" },
  { value: "DEFENCE_DEVELOPMENT", label: "Defence Development" },
  { value: "TEACHER_OBSERVATION", label: "Teacher Observation" },
  { value: "NEXT_TERM_ACTION_PLAN", label: "Action Plan" },
];

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function entryKey(entry: Pick<NdpManualEntry, "category" | "item" | "subject">) {
  return `${entry.category}::${entry.subject ?? ""}::${entry.item}`;
}

function groupedEntries(entries: NdpManualEntry[]) {
  return entries.reduce<Record<string, NdpManualEntry[]>>((groups, entry) => {
    const group = groups[entry.category] ?? [];
    group.push(entry);
    groups[entry.category] = group;
    return groups;
  }, {});
}

function scoreTone(score?: number | null) {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 75) return "bg-emerald-50 text-emerald-700";
  if (score >= 50) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function parseScore(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function isAcademicManagerRole(user: ReturnType<typeof useAuth>["user"]) {
  const template = typeof user?.roleMetadata?.dashboardTemplate === "string" ? user.roleMetadata.dashboardTemplate.toUpperCase() : "";
  return user?.role === "ADMIN" || user?.role === "DIRECTOR" || user?.role === "ACADEMIC_HEAD" || template === "ACADEMIC_HEAD";
}

export function TeacherNdpEntry() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<NdpStudentBatch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reviewPeriod, setReviewPeriod] = useState(currentPeriod());
  const [reviewType, setReviewType] = useState<(typeof reviewTypes)[number]>("TERM");
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [review, setReview] = useState<NdpReview | null>(null);
  const [entries, setEntries] = useState<NdpManualEntry[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<NdpReview[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [transitioningId, setTransitioningId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("ACADEMIC_PERFORMANCE");

  useEffect(() => {
    getNdpStudents()
      .then((result) => {
        setBatches(result.batches);
        const firstBatch = result.batches[0];
        setBatchId(firstBatch?.id ?? "");
        setStudentId(firstBatch?.students[0]?.id ?? "");
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const selectedBatch = useMemo(() => batches.find((batch) => batch.id === batchId) ?? null, [batches, batchId]);
  const selectedStudent = useMemo(() => selectedBatch?.students.find((student) => student.id === studentId) ?? null, [selectedBatch, studentId]);
  const groups = useMemo(() => groupedEntries(entries), [entries]);
  const isManager = isAcademicManagerRole(user);
  const locked = review?.status === "PUBLISHED" || (!isManager && (review?.status === "SUBMITTED" || review?.status === "APPROVED"));
  const availableSubjects = selectedBatch?.subjects?.length ? selectedBatch.subjects : entries.map((entry) => entry.subject).filter(Boolean) as string[];

  async function refreshQueue() {
    if (!isManager) return;
    setQueueLoading(true);
    try {
      const result = await getNdpReviews();
      setReviewQueue(result.reviews);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setQueueLoading(false);
    }
  }

  useEffect(() => {
    void refreshQueue();
  }, [isManager]);

  async function loadReview() {
    if (!batchId || !studentId || !reviewPeriod.trim()) {
      setError("Select batch, student and review period.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const next = await getNdpReview({ batchId, studentId, reviewPeriod: reviewPeriod.trim(), reviewType, academicYear });
      setReview(next);
      setEntries(next.entries);
      setNotice(next.status === "DRAFT" ? "Draft loaded. You can continue editing." : `Review loaded with status ${next.status}.`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function updateEntry(target: NdpManualEntry, patch: Partial<NdpManualEntry>) {
    setEntries((current) => current.map((entry) => entryKey(entry) === entryKey(target) ? { ...entry, ...patch } : entry));
  }

  function addEntry() {
    const subject = newSubject.trim();
    const item = newItem.trim() || (newCategory === "ACADEMIC_PERFORMANCE" ? subject : customCategories.find((category) => category.value === newCategory)?.label ?? "Progress Record");
    if (!item) {
      setError("Enter a subject or progress record name.");
      return;
    }
    const entry: NdpManualEntry = {
      category: newCategory,
      item,
      subject: subject || null,
      term1: null,
      term2: null,
      term3: null,
      rating: null,
      score: null,
      remarks: null,
      status: review?.status ?? "DRAFT",
    };
    if (entries.some((current) => entryKey(current) === entryKey(entry))) {
      setError("This NDP row already exists.");
      return;
    }
    setEntries((current) => [...current, entry]);
    setNewItem("");
    setNewSubject("");
    setError("");
    setNotice("New NDP row added. Save draft to store it.");
  }

  function removeEntry(target: NdpManualEntry) {
    setEntries((current) => current.filter((entry) => entryKey(entry) !== entryKey(target)));
    setNotice("Row removed from this draft. Save to keep the updated report.");
  }

  async function persist(mode: "SAVE" | "SUBMIT") {
    if (!batchId || !studentId || !reviewPeriod.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = { batchId, studentId, reviewPeriod: reviewPeriod.trim(), reviewType, academicYear, entries };
      const next = mode === "SUBMIT" ? await submitNdpReview(payload) : await saveNdpReview(payload);
      setReview(next);
      setEntries(next.entries);
      setNotice(mode === "SUBMIT" ? "NDP submitted for Academic Head review." : "NDP draft saved.");
      if (isManager) void refreshQueue();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openQueuedReview(next: NdpReview) {
    setReview(next);
    setEntries(next.entries);
    setBatchId(next.batchId);
    setStudentId(next.studentId);
    setReviewPeriod(next.reviewPeriod);
    setReviewType((reviewTypes as readonly string[]).includes(next.reviewType) ? next.reviewType as (typeof reviewTypes)[number] : "TERM");
    setAcademicYear(next.academicYear ?? String(new Date().getFullYear()));
    setNotice(`Opened ${next.studentName ?? "student"} NDP with status ${next.status}.`);
    setError("");
  }

  async function transitionReview(action: "APPROVE" | "RETURN" | "PUBLISH", target: NdpReview = review as NdpReview) {
    if (!target?.id) return;
    setTransitioningId(target.id);
    setError("");
    setNotice("");
    try {
      const payload = { note: reviewNote.trim() || undefined };
      const next =
        action === "APPROVE"
          ? await approveNdpReview(target.id, payload)
          : action === "RETURN"
            ? await returnNdpReview(target.id, payload)
            : await publishNdpReview(target.id, payload);
      setReview(next);
      setEntries(next.entries);
      setReviewNote("");
      setNotice(action === "APPROVE" ? "NDP approved. You can publish it now." : action === "RETURN" ? "NDP returned to teacher for correction." : "NDP published to the student Digital Profile.");
      await refreshQueue();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setTransitioningId("");
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      <TeacherModuleHeader
        eyebrow="NIDUS Digital Profile"
        title="Manual progress card entry"
        description="Select a batch and student, enter term marks, performance scores and teacher remarks, then submit for Academic Head review."
      />

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{notice}</p> : null}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-5">
          <Field label="Batch">
            <select value={batchId} onChange={(event) => { setBatchId(event.target.value); const batch = batches.find((item) => item.id === event.target.value); setStudentId(batch?.students[0]?.id ?? ""); setReview(null); setEntries([]); }} className={fieldClass}>
              {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
            </select>
          </Field>
          <Field label="Student">
            <select value={studentId} onChange={(event) => { setStudentId(event.target.value); setReview(null); setEntries([]); }} className={fieldClass}>
              {(selectedBatch?.students ?? []).map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
          </Field>
          <Field label="Review Period">
            <input value={reviewPeriod} onChange={(event) => setReviewPeriod(event.target.value)} placeholder="2026-07 or Term 1" className={fieldClass} />
          </Field>
          <Field label="Review Type">
            <select value={reviewType} onChange={(event) => setReviewType(event.target.value as (typeof reviewTypes)[number])} className={fieldClass}>
              {reviewTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Academic Year">
            <input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className={fieldClass} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickPeriods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => {
                setReviewPeriod(period);
                setReviewType("TERM");
                setReview(null);
                setEntries([]);
              }}
              className={`inline-flex min-h-9 items-center justify-center rounded-full border px-3 text-xs font-black ${
                reviewPeriod === period ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white text-[var(--ink)]"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[var(--muted-blue)]">
            <UserRound className="h-4 w-4" />
            <span>{selectedStudent?.mobile || selectedStudent?.email || selectedStudent?.name || "Choose a student"}</span>
          </div>
          <button type="button" onClick={() => void loadReview()} disabled={loading || !batchId || !studentId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60">
            <FileText className="h-4 w-4" /> {loading ? "Loading..." : "Open NDP"}
          </button>
        </div>
      </section>

      {isManager ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">Academic Head Review</p>
              <h2 className="mt-2 text-2xl font-black text-[var(--ink)]">Submitted NDP queue</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">Approve, return for correction, or publish approved progress cards to the student Digital Profile.</p>
            </div>
            <button type="button" onClick={() => void refreshQueue()} disabled={queueLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-black disabled:opacity-60">
              <FileText className="h-4 w-4" /> {queueLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div className="mt-4">
            <Field label="Review Note">
              <input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Optional note for approve, return or publish" className={fieldClass} />
            </Field>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {reviewQueue.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-[var(--ink)]">{item.studentName ?? "Student"}</h3>
                      <StatusPill status={item.status} />
                    </div>
                    <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">{item.batchName ?? "Batch"} / {item.reviewPeriod} / {item.reviewType}</p>
                    <p className="mt-1 text-xs text-[var(--muted-blue)]">Teacher: {item.teacherName ?? "Not recorded"}</p>
                  </div>
                  <ScoreBadge value={item.scores?.overallReadiness} />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <button type="button" onClick={() => openQueuedReview(item)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-black">
                    <FileText className="h-4 w-4" /> Open
                  </button>
                  <button type="button" onClick={() => void transitionReview("APPROVE", item)} disabled={transitioningId === item.id || item.status !== "SUBMITTED"} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-800 disabled:opacity-50">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button type="button" onClick={() => void transitionReview("RETURN", item)} disabled={transitioningId === item.id || !["SUBMITTED", "APPROVED"].includes(item.status)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-800 disabled:opacity-50">
                    <RotateCcw className="h-4 w-4" /> Return
                  </button>
                  <button type="button" onClick={() => void transitionReview("PUBLISH", item)} disabled={transitioningId === item.id || item.status !== "APPROVED"} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-800 disabled:opacity-50">
                    <Upload className="h-4 w-4" /> Publish
                  </button>
                </div>
              </article>
            ))}
            {!reviewQueue.length ? <EmptyQueue loading={queueLoading} /> : null}
          </div>
        </section>
      ) : null}

      {review ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ScoreCard label="Overall" value={review.scores?.overallReadiness} />
            <ScoreCard label="Academic" value={review.scores?.academicReadiness} />
            <ScoreCard label="Tests" value={review.scores?.testPerformance} />
            <ScoreCard label="Skills" value={review.scores?.skillDevelopment} />
            <ScoreCard label="Defence" value={review.scores?.defenceDevelopment} />
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">Flexible Records</p>
                <h2 className="mt-2 text-2xl font-black text-[var(--ink)]">Add subject or progress row</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">{isManager ? "Academic Head and Director can add all-subject and custom progress records." : "Teachers can add rows for their assigned subject records."}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr_1fr_auto] lg:items-end">
              <Field label="Record Type">
                <select value={newCategory} onChange={(event) => setNewCategory(event.target.value)} disabled={locked} className={fieldClass}>
                  {customCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </Field>
              <Field label="Subject">
                <input value={newSubject} onChange={(event) => setNewSubject(event.target.value)} disabled={locked} list="ndp-subjects" placeholder="Eg: Mathematics" className={fieldClass} />
                <datalist id="ndp-subjects">
                  {Array.from(new Set(availableSubjects.filter(Boolean))).map((subject) => <option key={subject} value={subject} />)}
                </datalist>
              </Field>
              <Field label="Record Name">
                <input value={newItem} onChange={(event) => setNewItem(event.target.value)} disabled={locked} placeholder="Eg: Term Exam, Mock Test, Confidence, Parent Attention" className={fieldClass} />
              </Field>
              <button type="button" onClick={addEntry} disabled={locked} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">
                <Plus className="h-4 w-4" /> Add Row
              </button>
            </div>
          </section>

          <section className="space-y-4">
            {Object.entries(groups).map(([category, rows]) => (
              <section key={category} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
                <header className="flex flex-col gap-2 bg-slate-950 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.16em]">{categoryLabels[category] ?? category}</h3>
                    <p className="mt-1 text-xs font-semibold normal-case tracking-normal text-white/70">{categoryHelp[category] ?? "Enter student progress details."}</p>
                  </div>
                  {category === "ACADEMIC_PERFORMANCE" || category === "TEST_PERFORMANCE" ? (
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                      <GraduationCap className="h-3.5 w-3.5" /> Term marks enabled
                    </span>
                  ) : null}
                </header>
                <div className="divide-y divide-[var(--border)]">
                  {rows.map((entry) => (
                    <article key={entryKey(entry)} className="grid gap-3 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-[var(--ink)]">{entry.item}</p>
                          {entry.subject ? <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">{entry.subject}</p> : null}
                        </div>
                        <button type="button" onClick={() => removeEntry(entry)} disabled={locked} className="inline-flex min-h-9 w-fit items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 disabled:opacity-40">
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-[repeat(3,minmax(120px,1fr))_150px_170px_minmax(220px,1.4fr)]">
                        <Field label="1st Term Marks">
                          <input value={entry.term1 ?? ""} onChange={(event) => updateEntry(entry, { term1: event.target.value })} disabled={locked} placeholder="Eg: 42/50" className={termFieldClass} />
                        </Field>
                        <Field label="2nd Term Marks">
                          <input value={entry.term2 ?? ""} onChange={(event) => updateEntry(entry, { term2: event.target.value })} disabled={locked} placeholder="Eg: 45/50" className={termFieldClass} />
                        </Field>
                        <Field label="3rd Term Marks">
                          <input value={entry.term3 ?? ""} onChange={(event) => updateEntry(entry, { term3: event.target.value })} disabled={locked} placeholder="Eg: 48/50" className={termFieldClass} />
                        </Field>
                        <Field label="Final Score">
                          <input type="number" min={0} max={100} value={entry.score ?? ""} onChange={(event) => updateEntry(entry, { score: parseScore(event.target.value) })} disabled={locked} placeholder="0-100" className={termFieldClass} />
                        </Field>
                        <Field label="Performance">
                          <select value={entry.rating ?? ""} onChange={(event) => updateEntry(entry, { rating: event.target.value })} disabled={locked} className={termFieldClass}>
                            {ratings.map((rating) => <option key={rating} value={rating}>{rating || "Choose"}</option>)}
                          </select>
                        </Field>
                        <Field label="Teacher Remark">
                          <input value={entry.remarks ?? ""} onChange={(event) => updateEntry(entry, { remarks: event.target.value })} disabled={locked} placeholder="Short action-focused remark" className={termFieldClass} />
                        </Field>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </section>

          <footer className="sticky bottom-4 z-20 rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">Status: {review.status}</p>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{locked ? "This review is locked after submission." : "Save draft before submitting for review."}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => void persist("SAVE")} disabled={saving || locked} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-black disabled:opacity-50"><Save className="h-4 w-4" /> Save Draft</button>
                <button type="button" onClick={() => void persist("SUBMIT")} disabled={saving || locked} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 text-sm font-black text-slate-950 disabled:opacity-50"><Send className="h-4 w-4" /> Submit</button>
              </div>
            </div>
          </footer>
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center">
          <ClipboardCheck className="mx-auto h-8 w-8 text-[var(--gold-dark)]" />
          <h3 className="mt-3 text-xl font-black">Open a student NDP</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted-blue)]">The progress-card structure will load with academic performance, skills, tests, defence development, teacher observations and final review fields.</p>
        </section>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone = normalized === "PUBLISHED"
    ? "border-blue-200 bg-blue-50 text-blue-800"
    : normalized === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : normalized === "RETURNED"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : normalized === "SUBMITTED"
          ? "border-slate-300 bg-white text-slate-800"
          : "border-slate-200 bg-slate-100 text-slate-600";
  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${tone}`}>{normalized}</span>;
}

function ScoreBadge({ value }: { value?: number | null }) {
  return (
    <div className={`w-fit rounded-2xl px-4 py-2 text-right ${scoreTone(value)}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em]">Overall</p>
      <p className="text-xl font-black">{value == null ? "--" : `${value}%`}</p>
    </div>
  );
}

function EmptyQueue({ loading }: { loading: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-6 text-center xl:col-span-2">
      <ClipboardCheck className="mx-auto h-7 w-7 text-[var(--gold-dark)]" />
      <p className="mt-3 text-sm font-black text-[var(--ink)]">{loading ? "Loading NDP reviews..." : "No NDP reviews found."}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted-blue)]">Submitted reviews will appear here for Academic Head approval and publication.</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted-blue)]">
      {label}
      {children}
    </label>
  );
}

function ScoreCard({ label, value }: { label: string; value?: number | null }) {
  return (
    <article className={`rounded-2xl border border-[var(--border)] p-4 ${scoreTone(value)}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value == null ? "--" : `${value}%`}</p>
    </article>
  );
}
