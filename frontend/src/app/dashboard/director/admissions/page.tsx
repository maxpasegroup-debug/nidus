"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileArchive,
  Search,
  UserCheck,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAdmissions, getApprovals, getFollowups, getLeads } from "@/services/crm";
import type { Admission, ApprovalRequest, Lead } from "@/types/crm";

type AdmissionView = "applications" | "approvals" | "fees" | "activated";

function hasNote(lead: Lead, text: string) {
  return String(lead.notes || "").toLowerCase().includes(text.toLowerCase());
}

function isToday(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function moneyFromLead(lead: Lead) {
  const match = String(lead.notes || "").match(/total=([0-9.]+)/i);
  return Number(match?.[1] || 0);
}

export default function DirectorAdmissionsPage() {
  const [view, setView] = useState<AdmissionView>("applications");
  const [searchText, setSearchText] = useState("");
  const leadsQuery = useQuery({ queryKey: ["director", "admission-review", "leads"], queryFn: () => getLeads() });
  const admissionsQuery = useQuery({ queryKey: ["director", "admission-review", "admissions"], queryFn: getAdmissions });
  const approvalsQuery = useQuery({ queryKey: ["director", "admission-review", "approvals"], queryFn: getApprovals });
  const followupsQuery = useQuery({ queryKey: ["director", "admission-review", "followups"], queryFn: getFollowups });

  const leads = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data]);
  const admissions = useMemo(() => admissionsQuery.data ?? [], [admissionsQuery.data]);
  const approvals = useMemo(() => approvalsQuery.data ?? [], [approvalsQuery.data]);
  const followups = useMemo(() => followupsQuery.data ?? [], [followupsQuery.data]);
  const activeLeads = useMemo(() => leads.filter((lead) => lead.status !== "ENROLLED" && lead.status !== "LOST"), [leads]);
  const applications = useMemo(() => activeLeads.filter((lead) => hasNote(lead, "application") || hasNote(lead, "Ready For Admission") || lead.status === "COUNSELLING"), [activeLeads]);
  const pendingDocuments = useMemo(() => applications.filter((lead) => !hasNote(lead, "DOCUMENTS: VERIFIED")), [applications]);
  const feesPending = useMemo(() => activeLeads.filter((lead) => hasNote(lead, "Fees: PENDING") || (!hasNote(lead, "Fees: PAID") && !hasNote(lead, "Fees: APPROVED"))), [activeLeads]);
  const pendingApprovals = useMemo(() => approvals.filter((approval) => approval.status === "PENDING"), [approvals]);
  const todayFollowups = useMemo(() => followups.filter((item) => isToday(item.followUpDate) && item.status !== "COMPLETED"), [followups]);
  const todayAdmissions = useMemo(() => admissions.filter((admission) => isToday(admission.admissionDate)), [admissions]);
  const conversion = leads.length ? Math.round((admissions.length / leads.length) * 100) : 0;
  const revenueForecast = applications.reduce((sum, lead) => sum + moneyFromLead(lead), 0);
  const loading = leadsQuery.isLoading || admissionsQuery.isLoading || approvalsQuery.isLoading || followupsQuery.isLoading;

  const queue = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const items = view === "applications"
      ? applications
      : view === "fees"
        ? feesPending
        : view === "activated"
          ? admissions
          : pendingApprovals;
    if (!query) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
  }, [admissions, applications, feesPending, pendingApprovals, searchText, view]);

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto grid max-w-[1500px] gap-4">
        <header className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director Admissions</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-4xl">Admission Review</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Review applications, approvals, fee pressure and activated admissions from one simple director page.
              </p>
            </div>
            <Link href="/dashboard/admission-cell#today" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--navy)] px-4 text-sm font-black text-white">
              Open AO Desk
            </Link>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <Metric icon={UserPlus} label="Applications" value={loading ? "..." : applications.length} note={`${pendingDocuments.length} document check`} />
          <Metric icon={CheckCircle2} label="Approvals" value={loading ? "..." : pendingApprovals.length} note="waiting for review" tone={pendingApprovals.length ? "warn" : "ok"} />
          <Metric icon={BadgeIndianRupee} label="Fees Pending" value={loading ? "..." : feesPending.length} note={`Rs ${revenueForecast.toLocaleString("en-IN")} forecast`} tone={feesPending.length ? "warn" : "ok"} />
          <Metric icon={ClipboardCheck} label="Activated" value={loading ? "..." : admissions.length} note={`${todayAdmissions.length} today`} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <Panel title="Today's Admission Work" eyebrow="Start here">
            <div className="grid gap-3">
              <ActionLink title="Review new applications" detail={`${applications.length} applicant(s) in application/counselling stage.`} href="/dashboard/admission-cell#applications" value={applications.length} />
              <ActionLink title="Approve pending requests" detail={`${pendingApprovals.length} concession or admission approval request(s).`} href="/crm/admissions" value={pendingApprovals.length} />
              <ActionLink title="Follow fee pending cases" detail={`${feesPending.length} applicant(s) need fee confirmation.`} href="/dashboard/admission-cell#fees" value={feesPending.length} />
              <ActionLink title="Today's follow-ups" detail={`${todayFollowups.length} lead follow-up(s) scheduled today.`} href="/crm/followups" value={todayFollowups.length} />
            </div>
          </Panel>

          <Panel title="Choose Queue" eyebrow="Simple menu">
            <div className="grid gap-3 sm:grid-cols-2">
              <QueueButton active={view === "applications"} icon={UserPlus} label="New Applications" detail="Applicants to review" onClick={() => setView("applications")} />
              <QueueButton active={view === "approvals"} icon={CheckCircle2} label="Pending Approvals" detail="Director review items" onClick={() => setView("approvals")} />
              <QueueButton active={view === "fees"} icon={BadgeIndianRupee} label="Fee Pending" detail="Payment follow-up" onClick={() => setView("fees")} />
              <QueueButton active={view === "activated"} icon={UserCheck} label="Activated Admissions" detail="Joined students" onClick={() => setView("activated")} />
            </div>
          </Panel>
        </section>

        <Panel title={view === "applications" ? "Application Queue" : view === "approvals" ? "Approval Queue" : view === "fees" ? "Fee Pending Queue" : "Activated Admissions"} eyebrow="Review list">
          <div className="mb-4 flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm">
            <Search className="h-4 w-4 shrink-0 text-[var(--muted-blue)]" />
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search applicant, mobile, exam or status" className="min-w-0 flex-1 bg-transparent outline-none" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {queue.map((item) => view === "approvals" ? (
              <ApprovalCard key={(item as ApprovalRequest).id} approval={item as ApprovalRequest} />
            ) : view === "activated" ? (
              <AdmissionCard key={(item as Admission).id} admission={item as Admission} />
            ) : (
              <LeadCard key={(item as Lead).id} lead={item as Lead} />
            ))}
          </div>
          {!queue.length ? <Empty text="No records found in this queue." /> : null}
        </Panel>

        <Panel title="Quick Open" eyebrow="Action pages">
          <div className="grid gap-3 md:grid-cols-4">
            <QuickLink href="/dashboard/admission-cell#applications" icon={FileArchive} label="Applications" />
            <QuickLink href="/crm/admissions" icon={CheckCircle2} label="Approvals" />
            <QuickLink href="/dashboard/admission-cell#fees" icon={BadgeIndianRupee} label="Fees" />
            <QuickLink href="/dashboard/admission-cell#activation" icon={ClipboardCheck} label="Activate" />
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, note, tone = "ok", value }: { icon: LucideIcon; label: string; note: string; tone?: "ok" | "warn"; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm font-black">{label}</p>
      <p className={`mt-1 text-xs ${tone === "warn" ? "text-amber-700" : "text-[var(--muted-blue)]"}`}>{note}</p>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function QueueButton({ active, detail, icon: Icon, label, onClick }: { active: boolean; detail: string; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left shadow-sm ${active ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <span>
        <span className="block text-sm font-black">{label}</span>
        <span className={`mt-1 block text-xs ${active ? "text-white/75" : "text-[var(--muted-blue)]"}`}>{detail}</span>
      </span>
    </button>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <h3 className="text-lg font-black">{lead.fullName}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{lead.targetExam} / {lead.mobile}</p>
      <span className="mt-3 inline-flex rounded-full bg-[var(--gold-soft)] px-3 py-1 text-xs font-black">{lead.status}</span>
      <div className="mt-4 grid gap-2">
        <Link href="/dashboard/admission-cell#applications" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-xs font-black">Review</Link>
        <Link href="/dashboard/admission-cell#fees" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-xs font-black">Fee</Link>
        <Link href="/dashboard/admission-cell#activation" className="rounded-xl bg-[var(--navy)] px-3 py-2 text-center text-xs font-black text-white">Activate</Link>
      </div>
    </article>
  );
}

function ApprovalCard({ approval }: { approval: ApprovalRequest }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <h3 className="text-lg font-black">{approval.type}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{approval.reason || approval.remarks || approval.targetType}</p>
      <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{approval.status}</span>
      <Link href="/crm/admissions" className="mt-4 block rounded-xl bg-[var(--navy)] px-3 py-2 text-center text-xs font-black text-white">Open Approval</Link>
    </article>
  );
}

function AdmissionCard({ admission }: { admission: Admission }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <h3 className="text-lg font-black">{admission.student?.name ?? "Student"}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{admission.course?.title ?? admission.batch} / {admission.paymentStatus}</p>
      <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">{admission.status ?? "ADMITTED"}</span>
      <Link href="/dashboard/admission-cell#students" className="mt-4 block rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-xs font-black">Open Student</Link>
    </article>
  );
}

function ActionLink({ title, detail, href, value }: { title: string; detail: string; href: string; value: string | number }) {
  return (
    <Link href={href} className="rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--gold-border)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{detail}</p>
        </div>
        <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-sm font-black">{value}</span>
      </div>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black transition hover:border-[var(--gold-border)]">
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[var(--gold)]" />
        {label}
      </span>
      <CalendarClock className="h-4 w-4" />
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4 text-sm text-[var(--muted-blue)]">{text}</div>;
}
