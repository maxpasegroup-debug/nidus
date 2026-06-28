"use client";

import Link from "next/link";
import { ArrowLeft, CalendarCheck, CreditCard, Upload } from "lucide-react";

type SupportTool = "LEAVE" | "EXPENSE";

const toolCopy = {
  LEAVE: {
    eyebrow: "Leave Requests",
    title: "Apply and track leave",
    text: "A simple staff leave desk for teachers and academic heads. Submit the request, attach proof if needed, and track approval status.",
    icon: CalendarCheck,
    fields: ["From date", "To date", "Reason", "Attachment"],
    actions: ["Save Draft", "Submit Request"],
    status: ["Pending", "Approved", "Rejected"],
  },
  EXPENSE: {
    eyebrow: "Expense Claims",
    title: "Submit bills for reimbursement",
    text: "A clean claim desk for travel, printing, study material, refreshments and approved academy expenses.",
    icon: CreditCard,
    fields: ["Expense title", "Category", "Amount", "Bill upload"],
    actions: ["Save Draft", "Submit Claim"],
    status: ["Pending", "Approved", "Paid"],
  },
} satisfies Record<SupportTool, {
  eyebrow: string;
  title: string;
  text: string;
  icon: typeof CalendarCheck;
  fields: string[];
  actions: string[];
  status: string[];
}>;

export function TeacherSupportToolPage({ tool, backHref }: { tool: SupportTool; backHref: string }) {
  const copy = toolCopy[tool];
  const Icon = copy.icon;
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4">
      <Link href={backHref} className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black">
        <ArrowLeft size={16} /> My Workspace
      </Link>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
              <Icon size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">{copy.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-black">{copy.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">{copy.text}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <form className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">New Request</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {copy.fields.slice(0, 3).map((field) => (
              <label key={field} className="grid gap-2 text-sm font-black">
                {field}
                <input className="min-h-12 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 font-bold outline-none focus:border-slate-950" placeholder={field} />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-black sm:col-span-2">
              {copy.fields[3]}
              <span className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm font-black">
                <Upload size={17} /> Choose file
              </span>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">{copy.actions[0]}</button>
            <button type="button" className="rounded-xl border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-black text-white">{copy.actions[1]}</button>
          </div>
        </form>

        <aside className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Status Tracker</p>
          <div className="mt-4 grid gap-3">
            {copy.status.map((status) => (
              <div key={status} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm">
                <span className="font-black">{status}</span>
                <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">0</span>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
            Phase 1 creates the dedicated workspace page. Approval and payment persistence will connect in the support-tools phase.
          </p>
        </aside>
      </section>
    </main>
  );
}
