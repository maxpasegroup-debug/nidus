"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeIndianRupee, BarChart3, FileText, ReceiptText, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { generateInvoice, getFees, getInvoices, getPaymentAnalytics } from "@/services/payments";

type AccountMode = "invoices" | "reports";

const modes: Array<{ id: AccountMode; title: string; text: string; icon: LucideIcon }> = [
  { id: "invoices", title: "Payments & Receipts", text: "Generate receipts and review open payment records.", icon: ReceiptText },
  { id: "reports", title: "Finance Reports", text: "Print collection, due and finance summaries.", icon: BarChart3 },
];

export default function DirectorAccountsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const requestedMode = searchParams?.get("mode") as AccountMode | null;
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<AccountMode>(
    requestedMode && modes.some((item) => item.id === requestedMode) ? requestedMode : "invoices",
  );
  const [invoiceForm, setInvoiceForm] = useState({ studentId: "", amount: "", status: "GENERATED" });

  const analyticsQuery = useQuery({ queryKey: ["finance", "analytics", "director-accounts"], queryFn: getPaymentAnalytics });
  const feesQuery = useQuery({ queryKey: ["finance", "fees", "director-accounts"], queryFn: getFees });
  const invoicesQuery = useQuery({ queryKey: ["finance", "invoices", "director-accounts"], queryFn: getInvoices });

  const invoiceMutation = useMutation({
    mutationFn: () => generateInvoice({ studentId: invoiceForm.studentId, amount: Number(invoiceForm.amount), status: invoiceForm.status }),
    onSuccess: () => {
      setNotice("Receipt generated.");
      setInvoiceForm({ studentId: "", amount: "", status: "GENERATED" });
      void queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not generate receipt."),
  });

  const submitInvoice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    invoiceMutation.mutate();
  };

  const analytics = analyticsQuery.data;
  const fees = feesQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const pendingFees = fees.filter((fee) => fee.paidStatus !== "PAID");
  const overdueFees = pendingFees.filter((fee) => new Date(fee.dueDate) < new Date());
  const generatedInvoices = invoices.filter((invoice) => invoice.status !== "PAID");
  const monthlyRevenue = analytics?.monthlyRevenue ?? 0;
  const pendingDues = analytics?.pendingDues ?? 0;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-3 py-3 text-[var(--navy)] md:px-4 lg:h-[calc(100vh-var(--nav-height)-2rem)] lg:min-h-0 lg:overflow-hidden">
      <section className="mx-auto flex h-full max-w-[1500px] flex-col gap-3 overflow-y-auto pr-0 lg:pr-2">
        <header className="shrink-0 rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Admin & Accounts</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Payments & Finance Reports</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
            Record receipts, check pending dues and prepare finance reports from one simple accounts screen.
          </p>
        </header>

        <section className="grid shrink-0 gap-2 md:grid-cols-2">
          {modes.map((item) => (
            <ModeButton
              key={item.id}
              active={mode === item.id}
              icon={item.icon}
              onClick={() => setMode(item.id)}
              text={item.text}
              title={item.title}
            />
          ))}
        </section>

        <section className="grid shrink-0 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <AccountMetric label="Monthly Revenue" value={`Rs ${monthlyRevenue.toLocaleString()}`} />
          <AccountMetric label="Pending Dues" value={`Rs ${pendingDues.toLocaleString()}`} />
          <AccountMetric label="Open Fees" value={pendingFees.length} />
          <AccountMetric label="Open Receipts" value={generatedInvoices.length} />
        </section>

        {notice ? (
          <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-2 text-sm font-bold text-[var(--navy)]">
            {notice}
          </div>
        ) : null}

        {mode === "invoices" ? (
          <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel id="receipts" title="Payments & Receipts" eyebrow="Receipt setup">
              <form onSubmit={submitInvoice} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <Field label="Student ID" value={invoiceForm.studentId} onChange={(value) => setInvoiceForm((item) => ({ ...item, studentId: value }))} required />
                <Field label="Amount" value={invoiceForm.amount} onChange={(value) => setInvoiceForm((item) => ({ ...item, amount: value }))} required />
                <Field label="Status" value={invoiceForm.status} onChange={(value) => setInvoiceForm((item) => ({ ...item, status: value }))} />
                <button className="rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)] shadow-lg">
                  Generate
                </button>
              </form>
              <div className="mt-4 grid max-h-[46vh] gap-2 overflow-y-auto pr-1">
                {invoices.slice(0, 8).map((invoice) => (
                  <FinanceRow
                    key={invoice.id}
                    title={invoice.invoiceNumber}
                    meta={invoice.student?.name ?? invoice.studentId}
                    amount={invoice.dueAmount ?? invoice.amount}
                    status={invoice.status}
                  />
                ))}
                {!invoices.length ? <Empty text="No receipts generated yet." icon={ReceiptText} /> : null}
              </div>
            </Panel>

            <Panel id="pending-fees" title="Pending Fees" eyebrow="Collection list">
              <div className="grid max-h-[58vh] gap-2 overflow-y-auto pr-1">
                {pendingFees.map((fee) => (
                  <FinanceRow
                    key={fee.id}
                    title={fee.title}
                    meta={`${fee.student?.name ?? fee.studentId} / due ${new Date(fee.dueDate).toLocaleDateString()}`}
                    amount={fee.dueAmount ?? fee.amount}
                    status={fee.paidStatus}
                  />
                ))}
                {!pendingFees.length ? <Empty text="No pending fees recorded." icon={BadgeIndianRupee} /> : null}
              </div>
            </Panel>
          </section>
        ) : null}

        {mode === "reports" ? (
          <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[0.8fr_1.2fr]">
            <Panel id="finance-reports" title="Finance Reports" eyebrow="Download and print">
              <div className="grid gap-2 md:grid-cols-2">
                {["Daily Collection", "Fee Due", "Batch-wise Collection", "Admission Revenue", "Custom Report"].map((report) => (
                  <button
                    key={report}
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-2xl border border-[var(--border)] bg-white p-3 text-left text-sm font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]"
                  >
                    <FileText className="mb-2 h-4 w-4 text-[var(--gold)]" />
                    {report}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <AccountMetric label="Transactions" value={`${analytics?.successfulTransactions ?? 0}/${analytics?.totalTransactions ?? 0}`} />
                <AccountMetric label="Payment Methods" value={Object.keys(analytics?.paymentMethodAnalytics ?? {}).length} />
                <AccountMetric label="Overdue Fees" value={overdueFees.length} />
                <AccountMetric label="Pending Dues" value={`Rs ${pendingDues.toLocaleString()}`} />
              </div>
            </Panel>

            <Panel id="finance-report-data" title="Report Data" eyebrow="Current records">
              <div className="grid max-h-[58vh] gap-2 overflow-y-auto pr-1">
                {generatedInvoices.slice(0, 8).map((invoice) => (
                  <FinanceRow
                    key={invoice.id}
                    title={invoice.invoiceNumber}
                    meta={invoice.student?.name ?? invoice.studentId}
                    amount={invoice.dueAmount ?? invoice.amount}
                    status={invoice.status}
                  />
                ))}
                {pendingFees.slice(0, 8).map((fee) => (
                  <FinanceRow
                    key={fee.id}
                    title={fee.title}
                    meta={`${fee.student?.name ?? fee.studentId} / due ${new Date(fee.dueDate).toLocaleDateString()}`}
                    amount={fee.dueAmount ?? fee.amount}
                    status={fee.paidStatus}
                  />
                ))}
                {!generatedInvoices.length && !pendingFees.length ? <Empty text="No finance records available for reports." icon={WalletCards} /> : null}
              </div>
            </Panel>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function Panel({ id, title, eyebrow, children }: { id: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="min-h-0 rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-black">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function AccountMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 px-3 py-2 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--gold)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--navy)]">{value}</p>
    </div>
  );
}

function ModeButton({
  active,
  icon: Icon,
  onClick,
  text,
  title,
}: {
  active: boolean;
  icon: LucideIcon;
  onClick: () => void;
  text: string;
  title: string;
}) {
  return (
    <button
      className={`rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md ${active ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white/90"}`}
      onClick={onClick}
      type="button"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-5 w-5 text-[var(--navy)]" />
      </div>
      <h2 className="mt-3 text-base font-black">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
    </button>
  );
}

function FinanceRow({ title, meta, amount, status }: { title: string; meta: string; amount: number; status: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-xs text-[var(--muted-blue)]">{meta}</p>
        </div>
        <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">
          Rs {amount.toLocaleString()} / {status}
        </span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[var(--navy)] outline-none focus:border-[var(--gold)]"
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
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4 text-sm leading-7 text-[var(--muted-blue)]">
      <Icon className="mb-2 h-5 w-5 text-[var(--gold)]" />
      {text}
    </div>
  );
}
