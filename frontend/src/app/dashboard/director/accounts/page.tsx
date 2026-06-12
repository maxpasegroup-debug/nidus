"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import {
  BadgeIndianRupee,
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  ReceiptText,
  Settings,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const accountSections = [
  { id: "fees", title: "Fee Management", text: "Course fees, student payments and pending dues.", icon: BadgeIndianRupee, status: "Manual Ready" },
  { id: "invoices", title: "Invoices & Receipts", text: "Generate and track payment receipts.", icon: ReceiptText, status: "Setup" },
  { id: "expenses", title: "Expenses", text: "Office, salary, rent, marketing and operational expenses.", icon: CreditCard, status: "Manual Ready" },
  { id: "subscriptions", title: "Subscriptions", text: "TOPRANK, assessments and premium module subscriptions.", icon: WalletCards, status: "Setup" },
  { id: "reports", title: "Reports", text: "Academic, admissions, marketing, finance and staff reports.", icon: BarChart3, status: "Review" },
  { id: "settings", title: "Settings", text: "Company details, contact number, branch and system controls.", icon: Settings, status: "Ready" },
  { id: "audit", title: "Audit Logs", text: "Track important actions by staff and management.", icon: FileText, status: "Setup" },
];

export default function DirectorAccountsPage() {
  const [notice, setNotice] = useState("");
  const [feeForm, setFeeForm] = useState({
    student: "",
    batch: "",
    amount: "",
    status: "Pending",
    note: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "Office",
    amount: "",
    note: "",
  });

  const submitFee = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("Fee record prepared. Connect this form to the finance table/Razorpay reconciliation when accounts backend is finalized.");
  };

  const submitExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("Expense record prepared. Connect this form to the accounts ledger when finance backend is finalized.");
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Admin & Accounts</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Finance and operations control</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            A clean Director-owned accounts room for fee status, invoices, expenses, subscriptions, settings and audit readiness.
            No fake revenue or demo finance numbers are displayed.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {accountSections.map((section) => {
            const Icon = section.icon;
            return (
              <a
                key={section.id}
                className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
                href={`#${section.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                    <Icon className="h-6 w-6 text-[var(--navy)]" />
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]">
                    {section.status}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-black">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{section.text}</p>
              </a>
            );
          })}
        </section>

        {notice && (
          <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold text-[var(--navy)]">
            {notice}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel id="fees" title="Fee Management" eyebrow="Manual launch control">
            <form onSubmit={submitFee} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Student name / email" value={feeForm.student} onChange={(value) => setFeeForm((item) => ({ ...item, student: value }))} required />
                <Field label="Batch / program" value={feeForm.batch} onChange={(value) => setFeeForm((item) => ({ ...item, batch: value }))} />
                <Field label="Amount" value={feeForm.amount} onChange={(value) => setFeeForm((item) => ({ ...item, amount: value }))} required />
                <label className="grid gap-2 text-sm font-bold">
                  Status
                  <select
                    className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                    value={feeForm.status}
                    onChange={(event) => setFeeForm((item) => ({ ...item, status: event.target.value }))}
                  >
                    <option>Pending</option>
                    <option>Partially Paid</option>
                    <option>Paid</option>
                    <option>Refund Requested</option>
                  </select>
                </label>
              </div>
              <Field label="Note" value={feeForm.note} onChange={(value) => setFeeForm((item) => ({ ...item, note: value }))} />
              <button className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
                Prepare Fee Record
              </button>
            </form>
          </Panel>

          <Panel id="expenses" title="Expenses" eyebrow="Manual launch control">
            <form onSubmit={submitExpense} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Expense title" value={expenseForm.title} onChange={(value) => setExpenseForm((item) => ({ ...item, title: value }))} required />
                <label className="grid gap-2 text-sm font-bold">
                  Category
                  <select
                    className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                    value={expenseForm.category}
                    onChange={(event) => setExpenseForm((item) => ({ ...item, category: event.target.value }))}
                  >
                    <option>Office</option>
                    <option>Salary</option>
                    <option>Rent</option>
                    <option>Marketing</option>
                    <option>Operations</option>
                    <option>Training</option>
                  </select>
                </label>
                <Field label="Amount" value={expenseForm.amount} onChange={(value) => setExpenseForm((item) => ({ ...item, amount: value }))} required />
                <Field label="Note" value={expenseForm.note} onChange={(value) => setExpenseForm((item) => ({ ...item, note: value }))} />
              </div>
              <button className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
                Prepare Expense Record
              </button>
            </form>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel id="invoices" title="Invoices & Receipts" eyebrow="Receipt setup">
            <Empty text="Invoice/receipt generation will connect to actual payment records. No fake receipts are shown." icon={ReceiptText} />
          </Panel>
          <Panel id="subscriptions" title="Subscriptions" eyebrow="Razorpay and premium access">
            <Empty text="TOPRANK, assessments and premium subscriptions should be reconciled with Razorpay before launch." icon={WalletCards} />
          </Panel>
          <Panel id="reports" title="Reports" eyebrow="Management review">
            <Empty text="Reports will combine real admissions, academics, marketing, fees and staff data. No demo charts are shown." icon={BarChart3} />
          </Panel>
          <Panel id="settings" title="Settings" eyebrow="Company configuration">
            <Empty text="Company contact, branch, receipt format, payment settings and account permissions can be managed here." icon={Building2} />
          </Panel>
        </section>

        <Panel id="audit" title="Audit Logs" eyebrow="Action history">
          <Empty text="Audit log integration should record employee creation, password reset, admission approval, batch creation and finance actions." icon={ShieldCheck} />
        </Panel>
      </section>
    </main>
  );
}

function Panel({ id, title, eyebrow, children }: { id: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function Empty({ text, icon: Icon }: { text: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm leading-7 text-[var(--muted-blue)]">
      <Icon className="mb-3 h-5 w-5 text-[var(--gold)]" />
      {text}
    </div>
  );
}
