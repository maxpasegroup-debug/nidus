"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeIndianRupee, BarChart3, BrainCircuit, CalendarDays, FileText, PhoneCall, Printer, ReceiptText, Search, UserRound, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { generateInvoice, getFees, getInvoices, getPaymentAnalytics } from "@/services/payments";
import type { FeeInstallment, Invoice } from "@/types/payments";

type AccountsTab = "overview" | "collect" | "dues" | "receipts" | "reports";
type StudentOption = { id: string; name: string; email?: string; mobile?: string };
type ReportKind = "daily" | "dues" | "batch" | "admission" | "monthly";

const tabs: Array<{ id: AccountsTab; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: BadgeIndianRupee },
  { id: "collect", label: "Collect Fee", icon: WalletCards },
  { id: "dues", label: "Pending Dues", icon: CalendarDays },
  { id: "receipts", label: "Receipts", icon: ReceiptText },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const reports: Array<{ id: ReportKind; label: string; detail: string }> = [
  { id: "daily", label: "Daily Collection", detail: "Receipts generated today." },
  { id: "dues", label: "Pending Dues", detail: "All unpaid fee records." },
  { id: "batch", label: "Batch-wise Collection", detail: "Collection list grouped by visible student records." },
  { id: "admission", label: "Admission Revenue", detail: "Admission-linked invoices when available." },
  { id: "monthly", label: "Monthly Summary", detail: "Current month receipts and pending dues." },
];

function tabFromMode(value?: string | null): AccountsTab {
  if (value === "invoices") return "receipts";
  if (value === "reports") return "reports";
  if (tabs.some((tab) => tab.id === value)) return value as AccountsTab;
  return "overview";
}

function studentLabel(student?: StudentOption | null, fallback?: string) {
  if (!student) return fallback || "Student";
  return [student.name, student.mobile, student.email].filter(Boolean).join(" / ") || fallback || student.id;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function money(value?: number | null) {
  return `Rs ${Number(value ?? 0).toLocaleString()}`;
}

export default function DirectorAccountsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const requestedMode = searchParams?.get("mode") || searchParams?.get("tab");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<AccountsTab>(tabFromMode(requestedMode));
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [collectForm, setCollectForm] = useState({ amount: "", paymentMode: "Cash", status: "GENERATED" });
  const [receiptSearch, setReceiptSearch] = useState("");
  const [activeReport, setActiveReport] = useState<ReportKind>("daily");

  const analyticsQuery = useQuery({ queryKey: ["finance", "analytics", "director-accounts"], queryFn: getPaymentAnalytics });
  const feesQuery = useQuery({ queryKey: ["finance", "fees", "director-accounts"], queryFn: getFees });
  const invoicesQuery = useQuery({ queryKey: ["finance", "invoices", "director-accounts"], queryFn: getInvoices });

  const analytics = analyticsQuery.data;
  const fees = useMemo(() => feesQuery.data ?? [], [feesQuery.data]);
  const invoices = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data]);
  const pendingFees = fees.filter((fee) => fee.paidStatus !== "PAID");
  const overdueFees = pendingFees.filter((fee) => new Date(fee.dueDate) < new Date());
  const openReceipts = invoices.filter((invoice) => invoice.status !== "PAID");
  const monthlyRevenue = analytics?.monthlyRevenue ?? 0;
  const pendingDues = analytics?.pendingDues ?? pendingFees.reduce((sum, fee) => sum + Number(fee.dueAmount ?? fee.amount ?? 0), 0);

  const students = useMemo(() => {
    const map = new Map<string, StudentOption>();
    for (const fee of fees) {
      if (!fee.studentId) continue;
      map.set(fee.studentId, { id: fee.studentId, name: fee.student?.name || fee.studentId, email: fee.student?.email, mobile: fee.student?.mobile });
    }
    for (const invoice of invoices) {
      if (!invoice.studentId) continue;
      map.set(invoice.studentId, { id: invoice.studentId, name: invoice.student?.name || invoice.studentId, email: invoice.student?.email, mobile: invoice.student?.mobile });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [fees, invoices]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students.slice(0, 8);
    return students.filter((student) => [student.name, student.mobile, student.email, student.id].filter(Boolean).join(" ").toLowerCase().includes(query)).slice(0, 12);
  }, [studentSearch, students]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const selectedStudentFees = pendingFees.filter((fee) => fee.studentId === selectedStudentId);
  const suggestedAmount = selectedStudentFees.reduce((sum, fee) => sum + Number(fee.dueAmount ?? fee.amount ?? 0), 0);

  const invoiceMutation = useMutation({
    mutationFn: () => generateInvoice({ studentId: selectedStudentId, amount: Number(collectForm.amount || suggestedAmount), status: collectForm.status }),
    onSuccess: () => {
      setNotice("Receipt generated.");
      setCollectForm({ amount: "", paymentMode: "Cash", status: "GENERATED" });
      setStudentSearch("");
      setSelectedStudentId("");
      void queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not generate receipt."),
  });

  const submitCollection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStudentId) {
      setNotice("Select a student before generating receipt.");
      return;
    }
    invoiceMutation.mutate();
  };

  const filteredReceipts = invoices.filter((invoice) => {
    const query = receiptSearch.trim().toLowerCase();
    if (!query) return true;
    return [
      invoice.invoiceNumber,
      invoice.studentId,
      invoice.student?.name,
      invoice.student?.mobile,
      invoice.status,
    ].filter(Boolean).join(" ").toLowerCase().includes(query);
  });

  const reportRows = reportData(activeReport, fees, invoices);

  function printReport(kind: ReportKind) {
    setActiveReport(kind);
    window.setTimeout(() => window.print(), 50);
  }

  const aiInsight = pendingDues
    ? overdueFees.length
      ? `${overdueFees.length} overdue student(s) need first attention.`
      : `${pendingFees.length} pending due record(s) are open.`
    : openReceipts.length
      ? `${openReceipts.length} receipt(s) are open for confirmation.`
      : "Accounts look clear for today.";

  return (
    <main className="h-[calc(100vh-96px)] overflow-hidden bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-5">
      <section className="mx-auto flex h-full max-w-[1500px] flex-col gap-3">
        <header className="shrink-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[1fr_680px] xl:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director Accounts</p>
              <h1 className="mt-1 text-2xl font-black md:text-3xl">Accounts Control</h1>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">Collections, dues, receipts, reports and AI support in one simple desk.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              <AccountMetric label="Today" value={money(analytics?.dailyRevenue ?? 0)} />
              <AccountMetric label="Pending" value={money(pendingDues)} tone={pendingDues ? "warning" : "success"} />
              <AccountMetric label="Overdue" value={overdueFees.length} tone={overdueFees.length ? "warning" : "success"} />
              <AccountMetric label="Receipts" value={invoices.length} />
            </div>
          </div>
        </header>

        <section className="grid shrink-0 gap-2 md:grid-cols-5">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition hover:border-[var(--gold-border)] ${tab === item.id ? "border-[var(--gold-border)] bg-[var(--gold-soft)] text-[var(--navy)] shadow-sm" : "border-[var(--border)] bg-white text-[var(--muted-blue)]"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </section>

        {notice ? <div className="shrink-0 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-2 text-sm font-bold text-[var(--navy)]">{notice}</div> : null}

        <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[1fr_340px]">
          <section className="min-h-0 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm md:p-4">
            {tab === "overview" ? (
              <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <Panel id="overview-actions" title="Quick Actions" eyebrow="Start here">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <QuickAction icon={WalletCards} title="Collect Fee" detail="Search student and save receipt." onClick={() => setTab("collect")} />
                    <QuickAction icon={CalendarDays} title="Pending Dues" detail={`${pendingFees.length} open due record(s).`} onClick={() => setTab("dues")} />
                    <QuickAction icon={ReceiptText} title="Receipts" detail={`${invoices.length} receipt record(s).`} onClick={() => setTab("receipts")} />
                    <QuickAction icon={BarChart3} title="Reports" detail="Daily and monthly summaries." onClick={() => setTab("reports")} />
                  </div>
                </Panel>
                <Panel id="overview-pressure" title="Fee Attention" eyebrow="AI priority">
                  <div className="grid max-h-full gap-2 overflow-y-auto pr-1">
                    {pendingFees.slice(0, 7).map((fee) => <FinanceRow key={fee.id} title={fee.title} meta={`${studentLabel(fee.student, fee.studentId)} / due ${new Date(fee.dueDate).toLocaleDateString()}`} amount={fee.dueAmount ?? fee.amount} status={fee.paidStatus} />)}
                    {!pendingFees.length ? <Empty text="No pending dues are visible." icon={BadgeIndianRupee} /> : null}
                  </div>
                </Panel>
              </div>
            ) : null}

            {tab === "collect" ? (
              <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <Panel id="collect-fee" title="Collect Fee" eyebrow="Student search">
                  <label className="grid gap-2 text-sm font-black">
                    Search student
                    <div className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
                      <Search className="h-4 w-4 text-[var(--gold)]" />
                      <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} className="min-h-9 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="Name, mobile, email or ID" />
                    </div>
                  </label>
                  <div className="mt-3 grid max-h-[calc(100vh-430px)] gap-2 overflow-y-auto pr-1">
                    {filteredStudents.map((student) => (
                      <button key={student.id} type="button" onClick={() => { setSelectedStudentId(student.id); setStudentSearch(studentLabel(student)); }} className={`rounded-xl border p-3 text-left text-sm transition hover:border-[var(--gold-border)] ${selectedStudentId === student.id ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`}>
                        <span className="font-black">{student.name}</span>
                        <span className="mt-1 block truncate text-xs text-[var(--muted-blue)]">{[student.mobile, student.email, student.id].filter(Boolean).join(" / ")}</span>
                      </button>
                    ))}
                    {!filteredStudents.length ? <Empty text="No matching finance student record found." icon={UserRound} /> : null}
                  </div>
                </Panel>

                <Panel id="receipt-form" title="Receipt Details" eyebrow="Generate">
                  <form onSubmit={submitCollection} className="grid gap-3">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">Selected student</p>
                      <p className="mt-1 font-black">{selectedStudent ? studentLabel(selectedStudent) : "Select a student first"}</p>
                      {selectedStudentFees.length ? <p className="mt-1 text-sm text-[var(--muted-blue)]">Suggested amount {money(suggestedAmount)}</p> : null}
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label="Amount" value={collectForm.amount || (suggestedAmount ? String(suggestedAmount) : "")} onChange={(value) => setCollectForm((item) => ({ ...item, amount: value }))} required />
                      <SelectField label="Mode" value={collectForm.paymentMode} options={["Cash", "UPI", "Bank", "Cheque"]} onChange={(value) => setCollectForm((item) => ({ ...item, paymentMode: value }))} />
                      <SelectField label="Status" value={collectForm.status} options={["GENERATED", "PAID"]} onChange={(value) => setCollectForm((item) => ({ ...item, status: value }))} />
                    </div>
                    <button className="min-h-11 rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)] shadow-sm disabled:opacity-60" disabled={invoiceMutation.isPending}>
                      {invoiceMutation.isPending ? "Saving..." : "Save Receipt"}
                    </button>
                  </form>
                </Panel>
              </div>
            ) : null}

            {tab === "dues" ? (
              <Panel id="pending-dues" title="Pending Dues" eyebrow="Collection list">
                <div className="grid max-h-[calc(100vh-360px)] gap-2 overflow-y-auto pr-1">
                  {pendingFees.map((fee) => <DueRow key={fee.id} fee={fee} onCollect={() => { setSelectedStudentId(fee.studentId); setStudentSearch(studentLabel(fee.student, fee.studentId)); setCollectForm((item) => ({ ...item, amount: String(fee.dueAmount ?? fee.amount) })); setTab("collect"); }} />)}
                  {!pendingFees.length ? <Empty text="No pending fees recorded." icon={BadgeIndianRupee} /> : null}
                </div>
              </Panel>
            ) : null}

            {tab === "receipts" ? (
              <Panel id="receipts" title="Receipts" eyebrow="Search and print">
                <div className="mb-3 flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
                  <Search className="h-4 w-4 text-[var(--gold)]" />
                  <input value={receiptSearch} onChange={(event) => setReceiptSearch(event.target.value)} className="min-h-9 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="Search receipt, student, mobile or status" />
                </div>
                <div className="grid max-h-[calc(100vh-420px)] gap-2 overflow-y-auto pr-1">
                  {filteredReceipts.map((invoice) => <ReceiptRow key={invoice.id} invoice={invoice} />)}
                  {!filteredReceipts.length ? <Empty text="No receipts match this search." icon={ReceiptText} /> : null}
                </div>
              </Panel>
            ) : null}

            {tab === "reports" ? (
              <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[0.75fr_1.25fr]">
                <Panel id="finance-reports" title="Reports" eyebrow="Simple reports">
                  <div className="grid gap-2">
                    {reports.map((report) => (
                      <button key={report.id} type="button" onClick={() => printReport(report.id)} className={`rounded-xl border p-3 text-left text-sm transition hover:border-[var(--gold-border)] ${activeReport === report.id ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`}>
                        <FileText className="mb-2 h-4 w-4 text-[var(--gold)]" />
                        <span className="block font-black">{report.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--muted-blue)]">{report.detail}</span>
                      </button>
                    ))}
                  </div>
                </Panel>
                <Panel id="finance-report-data" title={reports.find((report) => report.id === activeReport)?.label ?? "Report Data"} eyebrow="Current data">
                  <div className="mb-3 grid gap-2 md:grid-cols-4">
                    <AccountMetric label="Rows" value={reportRows.length} />
                    <AccountMetric label="Amount" value={money(reportRows.reduce((sum, row) => sum + row.amount, 0))} />
                    <AccountMetric label="Date" value={todayKey()} />
                    <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 text-sm font-black">
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                  </div>
                  <div className="grid max-h-[calc(100vh-460px)] gap-2 overflow-y-auto pr-1">
                    {reportRows.map((row) => <FinanceRow key={row.id} title={row.title} meta={row.meta} amount={row.amount} status={row.status} />)}
                    {!reportRows.length ? <Empty text="No records available for this report." icon={FileText} /> : null}
                  </div>
                </Panel>
              </div>
            ) : null}
          </section>

          <aside className="hidden min-h-0 xl:block">
            <Panel id="ai-support" title="AI Support" eyebrow="Director help">
              <div className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3">
                <BrainCircuit className="h-5 w-5 text-[var(--gold)]" />
                <p className="mt-3 text-sm font-black">{aiInsight}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted-blue)]">Use this panel for simple finance direction. Technical analytics stay outside the director accounts screen.</p>
              </div>
              <div className="mt-3 grid gap-2">
                <AiHint label="Next action" value={overdueFees.length ? "Open Pending Dues and contact overdue students." : pendingFees.length ? "Collect nearest due payments first." : "No urgent fee action."} />
                <AiHint label="Receipts" value={openReceipts.length ? "Check open receipts before closing the day." : "Receipt queue is calm."} />
                <AiHint label="Report" value="Use Reports for print-ready daily or monthly summaries." />
              </div>
            </Panel>
          </aside>
        </section>
      </section>
    </main>
  );
}

function reportData(kind: ReportKind, fees: FeeInstallment[], invoices: Invoice[]) {
  const today = todayKey();
  if (kind === "daily") {
    return invoices
      .filter((invoice) => invoice.generatedAt?.slice(0, 10) === today)
      .map((invoice) => ({ id: invoice.id, title: invoice.invoiceNumber, meta: studentLabel(invoice.student, invoice.studentId), amount: invoice.dueAmount ?? invoice.amount, status: invoice.status }));
  }
  if (kind === "dues") {
    return fees
      .filter((fee) => fee.paidStatus !== "PAID")
      .map((fee) => ({ id: fee.id, title: fee.title, meta: `${studentLabel(fee.student, fee.studentId)} / due ${new Date(fee.dueDate).toLocaleDateString()}`, amount: fee.dueAmount ?? fee.amount, status: fee.paidStatus }));
  }
  if (kind === "admission") {
    return invoices
      .filter((invoice) => Boolean(invoice.admissionId))
      .map((invoice) => ({ id: invoice.id, title: invoice.invoiceNumber, meta: studentLabel(invoice.student, invoice.studentId), amount: invoice.dueAmount ?? invoice.amount, status: invoice.status }));
  }
  if (kind === "monthly") {
    const month = today.slice(0, 7);
    return invoices
      .filter((invoice) => invoice.generatedAt?.slice(0, 7) === month)
      .map((invoice) => ({ id: invoice.id, title: invoice.invoiceNumber, meta: studentLabel(invoice.student, invoice.studentId), amount: invoice.dueAmount ?? invoice.amount, status: invoice.status }));
  }
  return invoices.map((invoice) => ({ id: invoice.id, title: invoice.invoiceNumber, meta: studentLabel(invoice.student, invoice.studentId), amount: invoice.dueAmount ?? invoice.amount, status: invoice.status }));
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

function AccountMetric({ label, value, tone }: { label: string; value: string | number; tone?: "warning" | "success" }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 shadow-sm ${tone === "warning" ? "border-amber-200 bg-amber-50" : tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-[var(--border)] bg-white"}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--gold)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--navy)]">{value}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, title, detail, onClick }: { icon: LucideIcon; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-[var(--border)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-3 font-black">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">{detail}</p>
    </button>
  );
}

function AiHint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--gold)]">{label}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-[var(--muted-blue)]">{value}</p>
    </div>
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
          {money(amount)} / {status}
        </span>
      </div>
    </div>
  );
}

function DueRow({ fee, onCollect }: { fee: FeeInstallment; onCollect: () => void }) {
  const overdue = new Date(fee.dueDate) < new Date();
  return (
    <div className={`rounded-2xl border p-3 ${overdue ? "border-amber-200 bg-amber-50" : "border-[var(--border)] bg-white"}`}>
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_160px_130px] md:items-center">
        <div>
          <p className="font-black">{studentLabel(fee.student, fee.studentId)}</p>
          <p className="mt-1 text-xs text-[var(--muted-blue)]">{fee.title}</p>
        </div>
        <p className="text-sm font-bold text-[var(--muted-blue)]">Due {new Date(fee.dueDate).toLocaleDateString()}</p>
        <p className="font-black">{money(fee.dueAmount ?? fee.amount)}</p>
        <button type="button" onClick={onCollect} className="rounded-xl bg-[var(--gold-gradient)] px-3 py-2 text-sm font-black text-[var(--navy)]">Collect</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {fee.student?.mobile ? <a href={`tel:${fee.student.mobile}`} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-black"><PhoneCall className="h-3 w-3" />Call</a> : null}
        {fee.student?.mobile ? <a href={`https://wa.me/${fee.student.mobile.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700">WhatsApp</a> : null}
      </div>
    </div>
  );
}

function ReceiptRow({ invoice }: { invoice: Invoice }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_150px_140px] md:items-center">
        <div>
          <p className="font-black">{invoice.invoiceNumber}</p>
          <p className="mt-1 text-xs text-[var(--muted-blue)]">{studentLabel(invoice.student, invoice.studentId)}</p>
        </div>
        <p className="text-sm font-bold text-[var(--muted-blue)]">{invoice.generatedAt ? new Date(invoice.generatedAt).toLocaleDateString() : "Date pending"}</p>
        <p className="font-black">{money(invoice.dueAmount ?? invoice.amount)}</p>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black">
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "number" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">
      {label}
      <input className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[var(--navy)] outline-none focus:border-[var(--gold)]" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">
      {label}
      <select className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[var(--navy)] outline-none focus:border-[var(--gold)]" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
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
