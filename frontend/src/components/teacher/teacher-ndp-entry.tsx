"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ClipboardCheck, FileText, GraduationCap, Save, Send, UserRound } from "lucide-react";
import { getApiErrorMessage } from "@/services/api";
import { getNdpReview, getNdpStudents, saveNdpReview, submitNdpReview, type NdpManualEntry, type NdpReview, type NdpStudentBatch } from "@/services/academy";
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

export function TeacherNdpEntry() {
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
  const locked = review?.status === "SUBMITTED" || review?.status === "APPROVED" || review?.status === "PUBLISHED";

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
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
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

      {review ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ScoreCard label="Overall" value={review.scores?.overallReadiness} />
            <ScoreCard label="Academic" value={review.scores?.academicReadiness} />
            <ScoreCard label="Tests" value={review.scores?.testPerformance} />
            <ScoreCard label="Skills" value={review.scores?.skillDevelopment} />
            <ScoreCard label="Defence" value={review.scores?.defenceDevelopment} />
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
                      <div>
                        <p className="text-sm font-black text-[var(--ink)]">{entry.item}</p>
                        {entry.subject ? <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">{entry.subject}</p> : null}
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
