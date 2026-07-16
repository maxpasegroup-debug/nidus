"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { archiveDirectorExpense, createDirectorExpense, getDirectorExpenses } from "@/services/academy";
import { createFeeInstallment, generateInvoice, getFees, getInvoices, getPaymentAnalytics, getSubscriptions } from "@/services/payments";

type AccountMode = "overview" | "fees" | "invoices" | "expenses" | "subscriptions" | "reports" | "settings" | "audit";

const accountSections = [
  { id: "invoices", title: "Payments & Receipts", text: "Generate receipts and review payment records.", icon: ReceiptText, status: "Ready" },
  { id: "reports", title: "Finance Reports", text: "Download collection, due and finance summaries.", icon: BarChart3, status: "Ready" },
];

export default function DirectorAccountsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const requestedMode = searchParams?.get("mode") as AccountMode | null;
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<AccountMode>(
    requestedMode && ["invoices", "reports"].includes(requestedMode) ? requestedMode : "invoices",
  );
  const [feeForm, setFeeForm] = useState({
    studentId: "",
    title: "",
    amount: "",
    dueDate: "",
    status: "PENDING",
  });
  const [invoiceForm, setInvoiceForm] = useState({ studentId: "", amount: "", status: "GENERATED" });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "Office",
    amount: "",
    note: "",
  });
  const analyticsQuery = useQuery({ queryKey: ["finance", "analytics", "director-accounts"], queryFn: getPaymentAnalytics });
  const feesQuery = useQuery({ queryKey: ["finance", "fees", "director-accounts"], queryFn: getFees });
  const invoicesQuery = useQuery({ queryKey: ["finance", "invoices", "director-accounts"], queryFn: getInvoices });
  const subscriptionsQuery = useQuery({ queryKey: ["finance", "subscriptions", "director-accounts"], queryFn: getSubscriptions });
  const expensesQuery = useQuery({ queryKey: ["academy", "director-expenses"], queryFn: getDirectorExpenses });

  const invalidateFinance = () => {
    void queryClient.invalidateQueries({ queryKey: ["finance"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "director-expenses"] });
  };

  const feeMutation = useMutation({
    mutationFn: () =>
      createFeeInstallment({
        studentId: feeForm.studentId,
        title: feeForm.title,
        amount: Number(feeForm.amount),
        dueDate: feeForm.dueDate,
        paidStatus: feeForm.status,
      }),
    onSuccess: () => {
      setNotice("Fee installment saved.");
      setFeeForm({ studentId: "", title: "", amount: "", dueDate: "", status: "PENDING" });
      invalidateFinance();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not save fee installment."),
  });
  const invoiceMutation = useMutation({
    mutationFn: () => generateInvoice({ studentId: invoiceForm.studentId, amount: Number(invoiceForm.amount), status: invoiceForm.status }),
    onSuccess: () => {
      setNotice("Invoice generated.");
      setInvoiceForm({ studentId: "", amount: "", status: "GENERATED" });
      invalidateFinance();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not generate invoice."),
  });
  const expenseMutation = useMutation({
    mutationFn: () => createDirectorExpense({ ...expenseForm, amount: Number(expenseForm.amount) }),
    onSuccess: () => {
      setNotice("Expense saved.");
      setExpenseForm({ title: "", category: "Office", amount: "", note: "" });
      invalidateFinance();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not save expense."),
  });
  const archiveExpenseMutation = useMutation({
    mutationFn: archiveDirectorExpense,
    onSuccess: () => {
      setNotice("Expense archived.");
      invalidateFinance();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not archive expense."),
  });

  const submitFee = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    feeMutation.mutate();
  };

  const submitExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    expenseMutation.mutate();
  };
  const submitInvoice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    invoiceMutation.mutate();
  };

  const analytics = analyticsQuery.data;
  const fees = feesQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? [];
  const expenses = expensesQuery.data?.expenses ?? [];
  const activeExpenses = expenses.filter((expense) => expense.status !== "ARCHIVED");
  const pendingFees = fees.filter((fee) => fee.paidStatus !== "PAID");
  const overdueFees = pendingFees.filter((fee) => new Date(fee.dueDate) < new Date());
  const generatedInvoices = invoices.filter((invoice) => invoice.status !== "PAID");
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "ACTIVE");
  const totalExpenses = expensesQuery.data?.summary.total ?? 0;
  const monthlyRevenue = analytics?.monthlyRevenue ?? 0;
  const pendingDues = analytics?.pendingDues ?? 0;
  const netPosition = monthlyRevenue - totalExpenses;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6 lg:h-[calc(100vh-var(--nav-height)-2rem)] lg:min-h-0 lg:overflow-hidden">
      <section className="mx-auto flex h-full max-w-[1500px] flex-col gap-4 overflow-y-auto pr-0 lg:pr-2">
        <div className="shrink-0 rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Admin & Accounts</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Payments & Finance Reports</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
            Keep accounts simple: record receipts, check pending dues and prepare finance reports.
          </p>
        </div>

        <section className="grid shrink-0 gap-3 md:grid-cols-2">
          {accountSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md ${mode === section.id ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white/90"}`}
                onClick={() => setMode(section.id as AccountMode)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                    <Icon className="h-6 w-6 text-[var(--navy)]" />
                  </div>
                  <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]">
                    {section.status}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-black">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{section.text}</p>
              </button>
            );
          })}
        </section>

        <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AccountMetric label="Monthly Revenue" value={`Rs ${monthlyRevenue.toLocaleString()}`} />
          <AccountMetric label="Pending Dues" value={`Rs ${pendingDues.toLocaleString()}`} />
          <AccountMetric label="Open Fees" value={pendingFees.length} />
          <AccountMetric label="Expenses" value={`Rs ${totalExpenses.toLocaleString()}`} />
        </section>

        {notice && (
          <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold text-[var(--navy)]">
            {notice}
          </div>
        )}

        {mode === "overview" ? (
        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Panel id="finance-attention" title="Finance attention" eyebrow="What to check first">
            <div className="grid gap-3">
              <DecisionRow title="Overdue fees" value={overdueFees.length} text="Collect or follow up through AO/accounts." tone={overdueFees.length ? "warn" : "ok"} />
              <DecisionRow title="Pending dues" value={`Rs ${pendingDues.toLocaleString()}`} text="Total amount still to be collected." tone={pendingDues > 0 ? "warn" : "ok"} />
              <DecisionRow title="Generated invoices" value={generatedInvoices.length} text="Receipts and invoices still open." tone={generatedInvoices.length ? "warn" : "ok"} />
              <DecisionRow title="Net position" value={`Rs ${netPosition.toLocaleString()}`} text="Monthly revenue minus recorded expenses." tone={netPosition >= 0 ? "ok" : "danger"} />
            </div>
          </Panel>

          <Panel id="finance-split" title="Money lanes" eyebrow="Director summary">
            <div className="grid gap-3">
              <AccountMetric label="Active Subscriptions" value={activeSubscriptions.length} />
              <AccountMetric label="Successful Transactions" value={analytics?.successfulTransactions ?? 0} />
              <AccountMetric label="Expense Categories" value={Object.keys(expensesQuery.data?.summary.byCategory ?? {}).length} />
            </div>
          </Panel>
        </section>
        ) : null}

        {mode === "fees" ? (
        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel id="fees" title="Fee Management" eyebrow="Manual launch control">
            <form onSubmit={submitFee} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Student ID" value={feeForm.studentId} onChange={(value) => setFeeForm((item) => ({ ...item, studentId: value }))} required />
                <Field label="Fee title" value={feeForm.title} onChange={(value) => setFeeForm((item) => ({ ...item, title: value }))} required />
                <Field label="Amount" value={feeForm.amount} onChange={(value) => setFeeForm((item) => ({ ...item, amount: value }))} required />
                <Field label="Due date" value={feeForm.dueDate} onChange={(value) => setFeeForm((item) => ({ ...item, dueDate: value }))} required type="date" />
                <label className="grid gap-2 text-sm font-bold">
                  Status
                  <select
                    className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                    value={feeForm.status}
                    onChange={(event) => setFeeForm((item) => ({ ...item, status: event.target.value }))}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PARTIAL">Partially Paid</option>
                    <option value="PAID">Paid</option>
                  </select>
                </label>
              </div>
              <button className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
                Save Fee Installment
              </button>
            </form>
            <div className="mt-5 grid gap-3">
              {pendingFees.slice(0, 5).map((fee) => (
                <FinanceRow key={fee.id} title={fee.title} meta={`${fee.student?.name ?? fee.studentId} / due ${new Date(fee.dueDate).toLocaleDateString()}`} amount={fee.dueAmount ?? fee.amount} status={fee.paidStatus} />
              ))}
              {!pendingFees.length ? <Empty text="No pending fee installments recorded." icon={BadgeIndianRupee} /> : null}
            </div>
          </Panel>
          <Panel id="fees-list" title="Pending installments" eyebrow="Collection list">
            <div className="grid max-h-[56vh] gap-3 overflow-y-auto pr-1">
              {pendingFees.map((fee) => (
                <FinanceRow key={fee.id} title={fee.title} meta={`${fee.student?.name ?? fee.studentId} / due ${new Date(fee.dueDate).toLocaleDateString()}`} amount={fee.dueAmount ?? fee.amount} status={fee.paidStatus} />
              ))}
              {!pendingFees.length ? <Empty text="No pending fee installments recorded." icon={BadgeIndianRupee} /> : null}
            </div>
          </Panel>
        </section>
        ) : null}

        {mode === "expenses" ? (
        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
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
                Save Expense
              </button>
            </form>
            <div className="mt-5 grid gap-3">
              {activeExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black">{expense.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">{expense.category} / {expense.currency} {expense.amount.toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => archiveExpenseMutation.mutate(expense.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-800"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ))}
              {!activeExpenses.length ? <Empty text="No expenses recorded yet." icon={CreditCard} /> : null}
            </div>
          </Panel>
        </section>
        ) : null}

        {mode === "invoices" ? (
        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          <Panel id="invoices" title="Invoices & Receipts" eyebrow="Receipt setup">
            <form onSubmit={submitInvoice} className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
              <Field label="Student ID" value={invoiceForm.studentId} onChange={(value) => setInvoiceForm((item) => ({ ...item, studentId: value }))} required />
              <Field label="Amount" value={invoiceForm.amount} onChange={(value) => setInvoiceForm((item) => ({ ...item, amount: value }))} required />
              <Field label="Status" value={invoiceForm.status} onChange={(value) => setInvoiceForm((item) => ({ ...item, status: value }))} />
              <button className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
                Generate
              </button>
            </form>
            <div className="mt-5 grid gap-3">
              {invoices.slice(0, 4).map((invoice) => (
                <FinanceRow key={invoice.id} title={invoice.invoiceNumber} meta={invoice.student?.name ?? invoice.studentId} amount={invoice.dueAmount ?? invoice.amount} status={invoice.status} />
              ))}
              {!invoices.length ? <Empty text="No invoices generated yet." icon={ReceiptText} /> : null}
            </div>
          </Panel>
        </section>
        ) : null}

        {mode === "subscriptions" ? (
        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          <Panel id="subscriptions" title="Subscriptions" eyebrow="Razorpay and premium access">
            <div className="grid gap-3">
              {subscriptions.slice(0, 5).map((subscription) => (
                <FinanceRow key={subscription.id} title={subscription.planName} meta={subscription.user?.name ?? subscription.userId} amount={subscription.amount} status={subscription.status} />
              ))}
              {!subscriptions.length ? <Empty text="No premium subscriptions recorded yet." icon={WalletCards} /> : null}
              <Link href="/subscriptions" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-center font-black">
                Open Subscription Console
              </Link>
            </div>
          </Panel>
        </section>
        ) : null}

        {mode === "reports" ? (
        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          <Panel id="reports" title="Reports" eyebrow="Management review">
            <div className="grid gap-3 md:grid-cols-2">
              <AccountMetric label="Transactions" value={`${analytics?.successfulTransactions ?? 0}/${analytics?.totalTransactions ?? 0}`} />
              <AccountMetric label="Payment Methods" value={Object.keys(analytics?.paymentMethodAnalytics ?? {}).length} />
            </div>
          </Panel>
          <Panel id="email-report" title="Email Report" eyebrow="Director export">
            <Empty text="Date-filtered email report sender will live here. Use this panel for accounts handoff reports." icon={FileText} />
          </Panel>
        </section>
        ) : null}

        {mode === "settings" ? (
        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          <Panel id="settings" title="Settings" eyebrow="Company configuration">
            <Empty text="Company contact, branch, receipt format, payment settings and account permissions can be managed here." icon={Building2} />
          </Panel>
        </section>
        ) : null}

        {mode === "audit" ? (
        <Panel id="audit" title="Audit Logs" eyebrow="Action history">
          <Empty text="Audit log integration should record employee creation, password reset, admission approval, batch creation and finance actions." icon={ShieldCheck} />
        </Panel>
        ) : null}
      </section>
    </main>
  );
}

function Panel({ id, title, eyebrow, children }: { id: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="min-h-0 rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AccountMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--gold)]">{label}</p>
      <p className="mt-1 text-xl font-black text-[var(--navy)]">{value}</p>
    </div>
  );
}

function ModeCard({
  active,
  icon: Icon,
  onClick,
  status,
  text,
  title,
}: {
  active: boolean;
  icon: LucideIcon;
  onClick: () => void;
  status: string;
  text: string;
  title: string;
}) {
  return (
    <button
      className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md ${active ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white/90"}`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
          <Icon className="h-6 w-6 text-[var(--navy)]" />
        </div>
        <span className="rounded-full border border-[var(--gold-border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]">{status}</span>
      </div>
      <h2 className="mt-4 text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
    </button>
  );
}

function FinanceRow({ title, meta, amount, status }: { title: string; meta: string; amount: number; status: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{meta}</p>
        </div>
        <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
          Rs {amount.toLocaleString()} / {status}
        </span>
      </div>
    </div>
  );
}

function DecisionRow({ title, value, text, tone }: { title: string; value: string | number; text: string; tone: "ok" | "warn" | "danger" }) {
  const toneClass =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warn"
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{text}</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-black ${toneClass}`}>{value}</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        type={type}
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
