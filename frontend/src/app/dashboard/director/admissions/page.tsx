"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  PhoneCall,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { approveAdmission, getAdmissions, getApprovals, getFollowups, getLeads, reviewScholarship } from "@/services/crm";
import type { Admission, ApprovalRequest, Lead } from "@/types/crm";

type AdmissionView = "applications" | "approvals" | "fees" | "activated";
type SelectedRecord = { type: "lead"; item: Lead } | { type: "approval"; item: ApprovalRequest } | { type: "admission"; item: Admission };

const queueLabels: Record<AdmissionView, string> = {
  applications: "Applications",
  approvals: "Approvals",
  fees: "Fee Follow-up",
  activated: "Activated"
};

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
  const [selected, setSelected] = useState<SelectedRecord | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const leadsQuery = useQuery({ queryKey: ["director", "admission-review", "leads"], queryFn: () => getLeads() });
  const admissionsQuery = useQuery({ queryKey: ["director", "admission-review", "admissions"], queryFn: getAdmissions });
  const approvalsQuery = useQuery({ queryKey: ["director", "admission-review", "approvals"], queryFn: getApprovals });
  const followupsQuery = useQuery({ queryKey: ["director", "admission-review", "followups"], queryFn: getFollowups });

  const reviewApprovalMutation = useMutation({
    mutationFn: async ({ approved, approval }: { approved: boolean; approval: ApprovalRequest }) => {
      if (approval.type === "ADMISSION_APPROVAL" && approval.admission?.id) {
        return approveAdmission({ id: approval.admission.id, approved });
      }
      if (approval.targetType === "ScholarshipDiscount" && approval.targetId) {
        return reviewScholarship({ id: approval.targetId, approved });
      }
      throw new Error("This approval needs to be opened from its original admission record.");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["director", "admission-review"] }),
        queryClient.invalidateQueries({ queryKey: ["crm", "admissions"] }),
        queryClient.invalidateQueries({ queryKey: ["crm", "approvals"] })
      ]);
      showToast("Admission decision saved", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });

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
  const revenueForecast = applications.reduce((sum, lead) => sum + moneyFromLead(lead), 0);
  const loading = leadsQuery.isLoading || admissionsQuery.isLoading || approvalsQuery.isLoading || followupsQuery.isLoading;
  const attentionCount = applications.length + pendingApprovals.length + feesPending.length + todayFollowups.length;

  const tabs = useMemo<Array<{ key: AdmissionView; label: string; count: number; detail: string; icon: LucideIcon }>>(() => [
    { key: "applications", label: "Applications", count: applications.length, detail: `${pendingDocuments.length} document check`, icon: UserPlus },
    { key: "approvals", label: "Approvals", count: pendingApprovals.length, detail: "Director decisions", icon: ShieldCheck },
    { key: "fees", label: "Fee Follow-up", count: feesPending.length, detail: `Rs ${revenueForecast.toLocaleString("en-IN")} forecast`, icon: BadgeIndianRupee },
    { key: "activated", label: "Activated", count: admissions.length, detail: `${todayAdmissions.length} today`, icon: UserCheck }
  ], [admissions.length, applications.length, feesPending.length, pendingApprovals.length, pendingDocuments.length, revenueForecast, todayAdmissions.length]);

  const queue = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const items = view === "applications" ? applications : view === "fees" ? feesPending : view === "activated" ? admissions : pendingApprovals;
    if (!query) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
  }, [admissions, applications, feesPending, pendingApprovals, searchText, view]);

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto grid max-w-[1500px] gap-4">
        <header className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director Admissions</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight md:text-4xl">Admissions Command</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Review applicants, approvals and fee follow-ups from one clean admission desk.</p>
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm lg:w-[380px]">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted-blue)]" />
              <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search name, mobile, course or status" className="min-w-0 flex-1 bg-transparent outline-none" />
            </div>
          </div>
        </header>

        <section className="grid gap-3 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--navy)] shadow-sm"><CheckCircle2 className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-black">Nidus AI Admission Status</p>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">
                {loading ? "Checking admissions..." : attentionCount ? `${attentionCount} admission item(s) need attention. Start with the highlighted queue.` : "Admissions are clear. No urgent approval or fee follow-up is visible."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:flex">
            <Signal label="Applications" value={applications.length} />
            <Signal label="Approvals" value={pendingApprovals.length} tone={pendingApprovals.length ? "warn" : "ok"} />
            <Signal label="Follow-ups" value={todayFollowups.length} tone={todayFollowups.length ? "warn" : "ok"} />
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          {tabs.map((tab) => <QueueTab key={tab.key} active={view === tab.key} count={loading ? "..." : tab.count} detail={tab.detail} icon={tab.icon} label={tab.label} onClick={() => setView(tab.key)} />)}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Admission Queue</p>
              <h2 className="mt-1 text-xl font-black">{queueLabels[view]}</h2>
            </div>
            <p className="text-sm font-black text-[var(--muted-blue)]">{loading ? "Loading..." : `${queue.length} shown`}</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {queue.map((item) => view === "approvals" ? (
              <ApprovalCard key={(item as ApprovalRequest).id} approval={item as ApprovalRequest} pending={reviewApprovalMutation.isPending} onOpen={() => setSelected({ type: "approval", item: item as ApprovalRequest })} onReview={(approved) => reviewApprovalMutation.mutate({ approved, approval: item as ApprovalRequest })} />
            ) : view === "activated" ? (
              <AdmissionCard key={(item as Admission).id} admission={item as Admission} onOpen={() => setSelected({ type: "admission", item: item as Admission })} />
            ) : (
              <LeadCard key={(item as Lead).id} lead={item as Lead} onOpen={() => setSelected({ type: "lead", item: item as Lead })} />
            ))}
          </div>
          {!queue.length ? <Empty text={loading ? "Loading admission records..." : "No records found in this queue."} /> : null}
        </section>
      </section>
      {selected ? <DetailDrawer selected={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function Signal({ label, tone = "ok", value }: { label: string; tone?: "ok" | "warn"; value: number }) {
  return <div className="rounded-xl bg-white px-3 py-2 shadow-sm"><p className={`text-lg font-black ${tone === "warn" ? "text-amber-700" : "text-[var(--navy)]"}`}>{value}</p><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p></div>;
}

function QueueTab({ active, count, detail, icon: Icon, label, onClick }: { active: boolean; count: string | number; detail: string; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:border-[var(--gold-border)] ${active ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white/95 hover:bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--muted-blue)]">{label}</p><p className="mt-2 text-3xl font-black">{count}</p><p className="mt-1 text-xs font-semibold text-[var(--muted-blue)]">{detail}</p></div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"><Icon className="h-4 w-4" /></span>
      </div>
    </button>
  );
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const feePaid = hasNote(lead, "Fees: PAID") || hasNote(lead, "Fees: APPROVED");
  const docsVerified = hasNote(lead, "DOCUMENTS: VERIFIED");
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:shadow-md">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-black">{lead.fullName}</h3><p className="mt-1 truncate text-sm text-[var(--muted-blue)]">{lead.targetExam}</p></div><span className="rounded-full bg-[var(--gold-soft)] px-3 py-1 text-[10px] font-black">{lead.status}</span></div>
      <div className="mt-4 grid gap-2 text-xs font-black"><InfoLine icon={PhoneCall} label="Mobile" value={lead.mobile} /><InfoLine icon={FileCheck2} label="Documents" value={docsVerified ? "Verified" : "Check needed"} tone={docsVerified ? "ok" : "warn"} /><InfoLine icon={BadgeIndianRupee} label="Fee" value={feePaid ? "Paid" : "Follow-up"} tone={feePaid ? "ok" : "warn"} /></div>
      <button type="button" onClick={onOpen} className="mt-4 min-h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">View applicant</button>
    </article>
  );
}

function ApprovalCard({ approval, onOpen, onReview, pending }: { approval: ApprovalRequest; onOpen: () => void; onReview: (approved: boolean) => void; pending: boolean }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:shadow-md">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-black">{approval.type.replaceAll("_", " ")}</h3><p className="mt-1 line-clamp-2 text-sm text-[var(--muted-blue)]">{approval.reason || approval.remarks || approval.targetType}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-800">{approval.status}</span></div>
      <div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={() => onReview(true)} disabled={pending} className="min-h-10 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-800 disabled:opacity-60">Approve</button><button type="button" onClick={() => onReview(false)} disabled={pending} className="min-h-10 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-black text-rose-800 disabled:opacity-60">Reject</button><button type="button" onClick={onOpen} className="min-h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black">View</button></div>
    </article>
  );
}

function AdmissionCard({ admission, onOpen }: { admission: Admission; onOpen: () => void }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:shadow-md">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-black">{admission.student?.name ?? "Student"}</h3><p className="mt-1 truncate text-sm text-[var(--muted-blue)]">{admission.course?.title ?? admission.batch}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">{admission.status ?? "ADMITTED"}</span></div>
      <div className="mt-4 grid gap-2 text-xs font-black"><InfoLine icon={BadgeIndianRupee} label="Payment" value={admission.paymentStatus} /><InfoLine icon={ClipboardCheck} label="Batch" value={admission.batch || "Not set"} /></div>
      <button type="button" onClick={onOpen} className="mt-4 min-h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">View admission</button>
    </article>
  );
}

function InfoLine({ icon: Icon, label, tone = "ok", value }: { icon: LucideIcon; label: string; tone?: "ok" | "warn"; value: string }) {
  return <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--page-bg)] px-3 py-2"><span className="flex min-w-0 items-center gap-2 text-[var(--muted-blue)]"><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{label}</span></span><span className={`truncate ${tone === "warn" ? "text-amber-700" : "text-[var(--navy)]"}`}>{value}</span></div>;
}

function DetailDrawer({ onClose, selected }: { onClose: () => void; selected: SelectedRecord }) {
  const title = selected.type === "lead" ? selected.item.fullName : selected.type === "approval" ? selected.item.type.replaceAll("_", " ") : selected.item.student?.name ?? "Admission";
  const rows = selected.type === "lead"
    ? [["Mobile", selected.item.mobile], ["Exam", selected.item.targetExam], ["Status", selected.item.status], ["Source", selected.item.source], ["Notes", selected.item.notes || "No notes"]]
    : selected.type === "approval"
      ? [["Status", selected.item.status], ["Type", selected.item.type], ["Reason", selected.item.reason || selected.item.remarks || "No reason"], ["Amount", selected.item.amount ? `Rs ${selected.item.amount.toLocaleString("en-IN")}` : "Not set"], ["Requested", new Date(selected.item.requestedAt).toLocaleString()]]
      : [["Student", selected.item.student?.name ?? "Student"], ["Course", selected.item.course?.title ?? "Not set"], ["Batch", selected.item.batch || "Not set"], ["Payment", selected.item.paymentStatus], ["Admission date", new Date(selected.item.admissionDate).toLocaleDateString()]];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col rounded-2xl border border-[var(--border)] bg-white p-4 text-[var(--navy)] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3"><div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Admission Details</p><h2 className="mt-1 text-xl font-black">{title}</h2></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white"><X className="h-4 w-4" /></button></div>
        <div className="mt-4 grid gap-2 overflow-auto pr-1">{rows.map(([label, value]) => <div key={label} className="rounded-xl bg-[var(--page-bg)] px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">{label}</p><p className="mt-1 break-words text-sm font-black">{value}</p></div>)}</div>
      </aside>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm text-[var(--muted-blue)]">{text}</div>;
}
