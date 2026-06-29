"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarCheck, CreditCard, RefreshCw, Send, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/services/api";

type SupportTool = "LEAVE" | "EXPENSE";

type LeaveRecord = {
  id: string;
  studentName?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  reason?: string | null;
  status?: string | null;
  reviewNote?: string | null;
  createdAt?: string | null;
};

type ExpenseRecord = {
  id: string;
  title?: string | null;
  category?: string | null;
  amount?: number | null;
  currency?: string | null;
  note?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

const toolCopy = {
  LEAVE: {
    eyebrow: "Leave Requests",
    title: "Apply and track leave",
    text: "Submit staff leave in one minute and track approval status without calling the office.",
    icon: CalendarCheck,
  },
  EXPENSE: {
    eyebrow: "Expense Claims",
    title: "Submit bills for reimbursement",
    text: "Record academy-related bills, travel, printing, resources or approved classroom expenses.",
    icon: CreditCard,
  },
} satisfies Record<SupportTool, { eyebrow: string; title: string; text: string; icon: LucideIcon }>;

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function statusTone(status?: string | null) {
  const value = String(status || "PENDING").toUpperCase();
  if (["APPROVED", "ACTIVE", "PAID"].includes(value)) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["REJECTED", "ARCHIVED"].includes(value)) return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function TeacherSupportToolPage({ tool, backHref }: { tool: SupportTool; backHref: string }) {
  const copy = toolCopy[tool];
  const Icon = copy.icon;
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [leaveForm, setLeaveForm] = useState({ fromDate: "", toDate: "", reason: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", category: "Teaching Material", amount: "", note: "" });

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tool === "LEAVE") {
        const response = await apiClient.get<{ leaves: LeaveRecord[] }>("/academy/leave-requests");
        setLeaves(response.data.leaves ?? []);
      } else {
        const response = await apiClient.get<{ expenses: ExpenseRecord[] }>("/academy/expense-claims");
        setExpenses(response.data.expenses ?? []);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tool]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const counts = useMemo(() => {
    const records = tool === "LEAVE" ? leaves : expenses;
    return {
      pending: records.filter((item) => String(item.status || "PENDING").toUpperCase() === "PENDING").length,
      approved: records.filter((item) => ["APPROVED", "ACTIVE"].includes(String(item.status || "").toUpperCase())).length,
      rejected: records.filter((item) => ["REJECTED", "ARCHIVED"].includes(String(item.status || "").toUpperCase())).length,
      paid: records.filter((item) => String(item.status || "").toUpperCase() === "PAID").length,
    };
  }, [expenses, leaves, tool]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (tool === "LEAVE") {
        await apiClient.post("/academy/leave-requests", {
          ...leaveForm,
          attachmentName: attachmentName || undefined,
        });
        setLeaveForm({ fromDate: "", toDate: "", reason: "" });
        setMessage("Leave request submitted.");
      } else {
        await apiClient.post("/academy/expense-claims", {
          title: expenseForm.title,
          category: expenseForm.category,
          amount: Number(expenseForm.amount),
          note: [expenseForm.note, attachmentName ? `Attachment: ${attachmentName}` : ""].filter(Boolean).join("\n") || undefined,
        });
        setExpenseForm({ title: "", category: "Teaching Material", amount: "", note: "" });
        setMessage("Expense claim submitted.");
      }
      setAttachmentName("");
      await loadRecords();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const records = tool === "LEAVE" ? leaves : expenses;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4">
      <header className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-black text-[var(--muted-blue)] hover:text-[var(--ink)]">
          <ArrowLeft size={16} /> My Workspace
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><Icon size={22} /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">{copy.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">{copy.text}</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadRecords()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p> : null}
      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Pending", counts.pending],
          ["Approved", counts.approved],
          [tool === "EXPENSE" ? "Paid" : "Rejected", tool === "EXPENSE" ? counts.paid : counts.rejected],
          ["Total", records.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <form onSubmit={submit} className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">New Request</p>
          <h2 className="mt-2 text-2xl font-black">{tool === "LEAVE" ? "Leave details" : "Claim details"}</h2>

          {tool === "LEAVE" ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="From date" type="date" value={leaveForm.fromDate} onChange={(value) => setLeaveForm((item) => ({ ...item, fromDate: value }))} required />
              <Field label="To date" type="date" value={leaveForm.toDate} onChange={(value) => setLeaveForm((item) => ({ ...item, toDate: value }))} required />
              <label className="grid gap-2 text-sm font-black sm:col-span-2">Reason
                <textarea value={leaveForm.reason} onChange={(event) => setLeaveForm((item) => ({ ...item, reason: event.target.value }))} required rows={5} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-normal" placeholder="Reason for leave" />
              </label>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Expense title" value={expenseForm.title} onChange={(value) => setExpenseForm((item) => ({ ...item, title: value }))} required />
              <Field label="Amount" type="number" value={expenseForm.amount} onChange={(value) => setExpenseForm((item) => ({ ...item, amount: value }))} required />
              <label className="grid gap-2 text-sm font-black">Category
                <select value={expenseForm.category} onChange={(event) => setExpenseForm((item) => ({ ...item, category: event.target.value }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal">
                  {["Teaching Material", "Travel", "Printing", "Refreshments", "Online Tools", "Other"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <Field label="Note" value={expenseForm.note} onChange={(value) => setExpenseForm((item) => ({ ...item, note: value }))} />
            </div>
          )}

          <label className="mt-5 grid gap-2 text-sm font-black">
            Attachment name
            <span className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] px-4">
              <span className="inline-flex items-center gap-2 text-sm text-[var(--muted-blue)]"><Upload size={17} /> {attachmentName || "Optional bill, proof or document name"}</span>
              <input type="file" className="max-w-[220px] text-xs" onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || "")} />
            </span>
          </label>

          <button type="submit" disabled={saving} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-50">
            <Send size={17} /> {saving ? "Submitting..." : tool === "LEAVE" ? "Submit Leave Request" : "Submit Expense Claim"}
          </button>
        </form>

        <aside className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">History</p>
          <h2 className="mt-2 text-2xl font-black">Recent requests</h2>
          <div className="mt-5 grid gap-3">
            {records.slice(0, 8).map((record) => (
              tool === "LEAVE" ? <LeaveCard key={record.id} record={record as LeaveRecord} /> : <ExpenseCard key={record.id} record={record as ExpenseRecord} />
            ))}
            {!records.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center">
                <Icon className="mx-auto h-8 w-8 text-[var(--muted-blue)]" />
                <h3 className="mt-3 text-lg font-black">{loading ? "Loading..." : "No request submitted yet"}</h3>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">Your request history will appear here.</p>
              </div>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-black">{label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 font-normal" />
    </label>
  );
}

function LeaveCard({ record }: { record: LeaveRecord }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{formatDate(record.fromDate)} to {formatDate(record.toDate)}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{record.reason || "Leave request"}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${statusTone(record.status)}`}>{record.status || "PENDING"}</span>
      </div>
      {record.reviewNote ? <p className="mt-3 rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-bold">{record.reviewNote}</p> : null}
    </article>
  );
}

function ExpenseCard({ record }: { record: ExpenseRecord }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{record.title || "Expense claim"}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{record.category || "Staff Claim"} / {record.currency || "INR"} {Number(record.amount || 0).toLocaleString()}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${statusTone(record.status)}`}>{record.status || "PENDING"}</span>
      </div>
      {record.note ? <p className="mt-3 rounded-xl bg-[var(--page-bg)] px-3 py-2 text-xs font-bold whitespace-pre-wrap">{record.note}</p> : null}
    </article>
  );
}
