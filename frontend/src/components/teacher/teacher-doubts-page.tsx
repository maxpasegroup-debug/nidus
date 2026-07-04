"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, HelpCircle, RefreshCw, Send } from "lucide-react";
import { apiClient, apiGet, getApiErrorMessage } from "@/services/api";

type DoubtRole = "TEACHER" | "ACADEMIC_HEAD";

type DoubtBatch = {
  id: string;
  name?: string | null;
  batchName?: string | null;
  subject?: string | null;
  assignedSubjects?: string[];
};

type DoubtHistory = {
  id: string;
  subject?: string | null;
  question?: string | null;
  aiResponse?: string | null;
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

function batchName(batch?: DoubtBatch | null) {
  return batch?.name || batch?.batchName || "Assigned batch";
}

function subjectsFor(batch?: DoubtBatch | null) {
  const subjects = new Set<string>();
  batch?.assignedSubjects?.forEach((subject) => subject && subjects.add(subject));
  if (batch?.subject) subjects.add(batch.subject);
  return Array.from(subjects).sort((a, b) => a.localeCompare(b));
}

function formatDate(value?: string | null) {
  if (!value) return "Now";
  return new Date(value).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function TeacherDoubtsPage({ role, backHref }: { role: DoubtRole; backHref: string }) {
  const [batches, setBatches] = useState<DoubtBatch[]>([]);
  const [history, setHistory] = useState<DoubtHistory[]>([]);
  const [batchId, setBatchId] = useState("");
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plan, doubts] = await Promise.all([
        apiGet<unknown>("/academy/my-teaching-plan"),
        apiGet<unknown>("/ai/doubts/history"),
      ]);
      const nextBatches = recordsFrom<DoubtBatch>(plan, "batches");
      setBatches(nextBatches);
      setHistory(recordsFrom<DoubtHistory>(doubts, "doubts"));
      setBatchId((current) => current || nextBatches[0]?.id || "");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedBatch = useMemo(() => batches.find((batch) => batch.id === batchId) ?? batches[0] ?? null, [batchId, batches]);
  const subjects = useMemo(() => subjectsFor(selectedBatch), [selectedBatch]);

  useEffect(() => {
    setSubject((current) => current && subjects.includes(current) ? current : subjects[0] || "");
  }, [subjects]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject || !question.trim()) return;
    setSaving(true);
    setError(null);
    setAnswer(null);
    try {
      const response = await apiClient.post<{ doubt: DoubtHistory }>("/ai/doubt", {
        subject,
        question: `[${batchName(selectedBatch)}] ${question.trim()}`,
      });
      setAnswer(response.data.doubt?.aiResponse || "NIDUS Guru saved the doubt. Open history to review the response.");
      setQuestion("");
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4">
      <header className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-black text-[var(--muted-blue)] hover:text-[var(--ink)]">
          <ArrowLeft size={16} /> My Workspace
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><HelpCircle size={22} /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Doubts & Questions</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Clear doubts before they grow.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Select batch and subject, ask NIDUS Guru for a teaching explanation, and keep recent doubt history ready for class follow-up.</p>
            </div>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p> : null}
      {answer ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{answer}</p> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <form onSubmit={submit} className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--page-bg)]"><Bot size={20} /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">{role === "ACADEMIC_HEAD" ? "Teacher + HOD" : "Teacher"} Assistant</p>
              <h2 className="text-2xl font-black">Ask a teaching doubt</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">Batch
              <select value={selectedBatch?.id || ""} onChange={(event) => setBatchId(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                {batches.map((batch) => <option key={batch.id} value={batch.id}>{batchName(batch)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black">Subject
              <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                {subjects.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black sm:col-span-2">Question
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} required rows={8} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal" placeholder="Example: Explain this algebra shortcut in a simple way for NDA students." />
            </label>
          </div>
          <button type="submit" disabled={saving || !subject || !question.trim()} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-50">
            <Send size={17} /> {saving ? "Asking..." : "Ask NIDUS Guru"}
          </button>
        </form>

        <aside className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">History</p>
          <h2 className="mt-2 text-2xl font-black">Recent doubts</h2>
          <div className="mt-5 grid gap-3">
            {history.slice(0, 8).map((item) => (
              <article key={item.id} className="rounded-2xl border border-[var(--border)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black">{item.subject || "Subject"}</h3>
                  <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-[10px] font-black">{formatDate(item.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm font-bold">{item.question || "Question"}</p>
                {item.aiResponse ? <p className="mt-3 rounded-xl bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--muted-blue)]">{item.aiResponse}</p> : null}
              </article>
            ))}
            {!history.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center">
                <HelpCircle className="mx-auto h-8 w-8 text-[var(--muted-blue)]" />
                <h3 className="mt-3 text-lg font-black">{loading ? "Loading..." : "No doubts yet"}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">Ask your first doubt from the form.</p>
              </div>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
