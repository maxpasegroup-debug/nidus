"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpenCheck, FileQuestion, RefreshCw, Search } from "lucide-react";
import { apiGet, getApiErrorMessage } from "@/services/api";

type QuestionBankRole = "TEACHER" | "ACADEMIC_HEAD";

type BankBatch = {
  id: string;
  name?: string | null;
  batchName?: string | null;
  assignedSubjects?: string[];
  subject?: string | null;
};

type BankExam = {
  id: string;
  title?: string | null;
  examName?: string | null;
  name?: string | null;
  batchId?: string | null;
  batchName?: string | null;
  subject?: string | null;
  topic?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
  questionCount?: number | null;
  questions?: unknown[];
  marks?: number | null;
  totalMarks?: number | null;
  durationMinutes?: number | null;
  createdAt?: string | null;
};

function recordsFrom<T>(value: unknown, key: string): T[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record[key])) return record[key] as T[];
  if (record.data && typeof record.data === "object" && Array.isArray((record.data as Record<string, unknown>)[key])) {
    return (record.data as Record<string, unknown>)[key] as T[];
  }
  return [];
}

function batchName(batch?: BankBatch | null) {
  return batch?.name || batch?.batchName || "Assigned batch";
}

function examTitle(exam: BankExam) {
  return exam.title || exam.examName || exam.name || "Question set";
}

function questionCount(exam: BankExam) {
  return exam.questionCount ?? exam.questions?.length ?? 0;
}

function statusTone(status?: string | null) {
  const value = String(status || "DRAFT").toUpperCase();
  if (["PUBLISHED", "APPROVED", "LIVE"].includes(value)) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["REJECTED", "CANCELLED", "ARCHIVED"].includes(value)) return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function TeacherQuestionBankPage({ role, backHref }: { role: QuestionBankRole; backHref: string }) {
  const base = role === "ACADEMIC_HEAD" ? "/dashboard/academic-head" : "/dashboard/teacher";
  const [batches, setBatches] = useState<BankBatch[]>([]);
  const [exams, setExams] = useState<BankExam[]>([]);
  const [batchId, setBatchId] = useState("ALL");
  const [subject, setSubject] = useState("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plan, examResponse] = await Promise.all([
        apiGet<unknown>("/academy/my-teaching-plan"),
        apiGet<unknown>("/academy/exams"),
      ]);
      const nextBatches = recordsFrom<BankBatch>(plan, "batches");
      setBatches(nextBatches);
      setExams(recordsFrom<BankExam>(examResponse, "exams"));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const subjects = useMemo(() => {
    const items = new Set<string>();
    batches.forEach((batch) => {
      batch.assignedSubjects?.forEach((item) => item && items.add(item));
      if (batch.subject) items.add(batch.subject);
    });
    exams.forEach((exam) => exam.subject && items.add(exam.subject));
    return Array.from(items).sort((a, b) => a.localeCompare(b));
  }, [batches, exams]);

  const visibleExams = useMemo(() => {
    const term = query.trim().toLowerCase();
    return exams.filter((exam) => {
      const matchesBatch = batchId === "ALL" || exam.batchId === batchId || exam.batchName === batchName(batches.find((batch) => batch.id === batchId));
      const matchesSubject = subject === "ALL" || String(exam.subject || "").toLowerCase() === subject.toLowerCase();
      const haystack = [examTitle(exam), exam.subject, exam.topic, exam.batchName].join(" ").toLowerCase();
      return matchesBatch && matchesSubject && (!term || haystack.includes(term));
    });
  }, [batchId, batches, exams, query, subject]);

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4">
      <header className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-black text-[var(--muted-blue)] hover:text-[var(--ink)]">
          <ArrowLeft size={16} /> My Workspace
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><FileQuestion size={22} /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Question Bank</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Reuse exam questions faster.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Find previous question sets by batch, subject or topic. Open the exam module when you need to create, edit or publish a paper.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black disabled:opacity-50">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <Link href={`${base}/exams`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white">
              <BookOpenCheck size={16} /> Open Exams
            </Link>
          </div>
        </div>
      </header>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p> : null}

      <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-blue)]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topic, exam or subject..." className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--page-bg)] pl-11 pr-4 text-sm font-bold outline-none" />
          </label>
          <select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
            <option value="ALL">All batches</option>
            {batches.map((batch) => <option key={batch.id} value={batch.id}>{batchName(batch)}</option>)}
          </select>
          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
            <option value="ALL">All subjects</option>
            {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Reusable Papers</p>
            <h2 className="mt-2 text-2xl font-black">Question sets</h2>
          </div>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{visibleExams.length} set(s)</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleExams.map((exam) => (
            <article key={exam.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{exam.subject || "Subject"}</p>
                  <h3 className="mt-2 text-xl font-black">{examTitle(exam)}</h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${statusTone(exam.reviewStatus || exam.status)}`}>{exam.reviewStatus || exam.status || "DRAFT"}</span>
              </div>
              <p className="mt-3 text-sm text-[var(--muted-blue)]">{exam.batchName || "Batch"} / {exam.topic || "Topic pending"}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
                <span className="rounded-xl bg-white px-3 py-2">{questionCount(exam)} Qs</span>
                <span className="rounded-xl bg-white px-3 py-2">{exam.totalMarks ?? exam.marks ?? 0} marks</span>
                <span className="rounded-xl bg-white px-3 py-2">{exam.durationMinutes ?? 0} min</span>
              </div>
              <Link href={`${base}/exams`} className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-slate-950 bg-white px-4 text-sm font-black text-slate-950">Manage in Exams</Link>
            </article>
          ))}
          {!visibleExams.length ? (
            <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
              <FileQuestion className="mx-auto h-10 w-10 text-[var(--muted-blue)]" />
              <h3 className="mt-4 text-xl font-black">{loading ? "Loading question sets..." : "No question set found"}</h3>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">Create an exam first. Published and draft papers become reusable question sets here.</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
