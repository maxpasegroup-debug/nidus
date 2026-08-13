"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  BrainCircuit,
  ClipboardCheck,
  FileCheck2,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { approveAdmission, getAdmissions, getApprovals, getFollowups, getLeads, reviewScholarship } from "@/services/crm";
import type { Admission, ApprovalRequest, Lead } from "@/types/crm";

type AdmissionView = "home" | "leads" | "applications" | "approvals" | "fees" | "activation";
type SelectedRecord = { type: "lead"; item: Lead; context?: AdmissionView } | { type: "approval"; item: ApprovalRequest } | { type: "admission"; item: Admission };
type Tone = "blue" | "green" | "gold" | "amber" | "rose";

const viewLabels: Record<AdmissionView, string> = {
  home: "Admissions Home",
  leads: "Leads",
  applications: "Applications",
  approvals: "Approvals",
  fees: "Fee Handover",
  activation: "Activation",
};

function normalizeView(value: string | null): AdmissionView {
  if (value === "leads" || value === "applications" || value === "approvals" || value === "fees" || value === "activation") return value;
  return "home";
}

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

function documentStatus(lead: Lead) {
  if (hasNote(lead, "DOCUMENTS: VERIFIED")) return { label: "Verified", tone: "ok" as const };
  if (hasNote(lead, "document") || hasNote(lead, "application")) return { label: "Check needed", tone: "warn" as const };
  return { label: "Not reviewed", tone: "warn" as const };
}

function feeStatus(lead: Lead) {
  if (hasNote(lead, "Fees: PAID") || hasNote(lead, "Fees: APPROVED")) return { label: "Paid", tone: "ok" as const, nextAction: "Ready for admission activation." };
  if (hasNote(lead, "Fees: PENDING")) return { label: "Pending", tone: "warn" as const, nextAction: "Confirm payment or schedule fee follow-up." };
  return { label: "Follow-up", tone: "warn" as const, nextAction: "Collect fee status from admissions team." };
}

function applicationStage(lead: Lead) {
  if (hasNote(lead, "Ready For Admission")) return "Ready for admission";
  if (lead.status === "COUNSELLING") return "Application review";
  if (hasNote(lead, "application")) return "Application submitted";
  return "Lead follow-up";
}

function friendlyNote(lead: Lead) {
  const fee = feeStatus(lead);
  const docs = documentStatus(lead);
  const source = lead.source ? `Source: ${lead.source}.` : "";
  return `${applicationStage(lead)}. Documents: ${docs.label}. Fee: ${fee.label}. ${source}`.trim();
}

function friendlyApprovalType(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function approvalTitle(approval: ApprovalRequest) {
  const student = approval.admission?.student?.name;
  if (student) return student;
  if (approval.requester?.name) return approval.requester.name;
  return friendlyApprovalType(approval.type);
}

function approvalSubtitle(approval: ApprovalRequest) {
  if (approval.admission?.course?.title) return approval.admission.course.title;
  if (approval.targetType === "ScholarshipDiscount") return "Scholarship / discount request";
  return friendlyApprovalType(approval.type);
}

function approvalReason(approval: ApprovalRequest) {
  return approval.reason || approval.remarks || "Director decision needed before this admission can continue.";
}

function requestedDate(value?: string) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function leadNextAction(lead: Lead, mode: "leads" | "applications") {
  const docs = documentStatus(lead);
  const fee = feeStatus(lead);
  if (mode === "applications" && docs.tone === "warn") return "Check documents";
  if (mode === "applications" && fee.tone === "warn") return "Send to fee follow-up";
  if (hasNote(lead, "Ready For Admission")) return "Prepare admission";
  if (lead.status === "NEW") return "Call applicant";
  if (lead.status === "CONTACTED") return "Schedule counselling";
  return "Continue follow-up";
}

export default function DirectorAdmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = normalizeView(searchParams?.get("tab") ?? null);
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
      if (approval.type === "ADMISSION_APPROVAL" && approval.admission?.id) return approveAdmission({ id: approval.admission.id, approved });
      if (approval.targetType === "ScholarshipDiscount" && approval.targetId) return reviewScholarship({ id: approval.targetId, approved });
      throw new Error("This approval needs to be opened from its original admission record.");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["director", "admission-review"] }),
        queryClient.invalidateQueries({ queryKey: ["crm", "admissions"] }),
        queryClient.invalidateQueries({ queryKey: ["crm", "approvals"] }),
      ]);
      showToast("Admission decision saved", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error"),
  });

  const leads = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data]);
  const admissions = useMemo(() => admissionsQuery.data ?? [], [admissionsQuery.data]);
  const approvals = useMemo(() => approvalsQuery.data ?? [], [approvalsQuery.data]);
  const followups = useMemo(() => followupsQuery.data ?? [], [followupsQuery.data]);
  const activeLeads = useMemo(() => leads.filter((lead) => lead.status !== "ENROLLED" && lead.status !== "LOST"), [leads]);
  const applications = useMemo(() => activeLeads.filter((lead) => hasNote(lead, "application") || hasNote(lead, "Ready For Admission") || lead.status === "COUNSELLING"), [activeLeads]);
  const pendingDocuments = useMemo(() => applications.filter((lead) => documentStatus(lead).tone === "warn"), [applications]);
  const feesPending = useMemo(() => activeLeads.filter((lead) => feeStatus(lead).tone === "warn"), [activeLeads]);
  const pendingApprovals = useMemo(() => approvals.filter((approval) => approval.status === "PENDING"), [approvals]);
  const todayFollowups = useMemo(() => followups.filter((item) => isToday(item.followUpDate) && item.status !== "COMPLETED"), [followups]);
  const todayAdmissions = useMemo(() => admissions.filter((admission) => isToday(admission.admissionDate)), [admissions]);
  const revenueForecast = applications.reduce((sum, lead) => sum + moneyFromLead(lead), 0);
  const feeForecast = feesPending.reduce((sum, lead) => sum + moneyFromLead(lead), 0);
  const loading = leadsQuery.isLoading || admissionsQuery.isLoading || approvalsQuery.isLoading || followupsQuery.isLoading;
  const attentionCount = pendingApprovals.length + feesPending.length + pendingDocuments.length;

  const modules = useMemo<Array<{ key: AdmissionView; label: string; count: number; detail: string; icon: LucideIcon; tone: Tone }>>(() => [
    { key: "applications", label: "Applications", count: applications.length, detail: `${pendingDocuments.length} document check(s)`, icon: FileCheck2, tone: pendingDocuments.length ? "amber" : "green" },
    { key: "fees", label: "Fee Handover", count: feesPending.length, detail: feeForecast ? `Rs ${feeForecast.toLocaleString("en-IN")}` : "Payment follow-up", icon: BadgeIndianRupee, tone: feesPending.length ? "amber" : "green" },
    { key: "approvals", label: "Approvals", count: pendingApprovals.length, detail: "Director decisions", icon: ShieldCheck, tone: pendingApprovals.length ? "amber" : "green" },
    { key: "activation", label: "Activation", count: admissions.length, detail: `${todayAdmissions.length} today`, icon: UserCheck, tone: "green" },
  ], [admissions.length, applications.length, feeForecast, feesPending.length, pendingApprovals.length, pendingDocuments.length, todayAdmissions.length]);

  const queue = useMemo(() => {
    const items = view === "leads" || view === "home"
      ? activeLeads
      : view === "applications"
        ? applications
        : view === "approvals"
          ? pendingApprovals
          : view === "fees"
            ? feesPending
            : admissions;
    const query = searchText.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
  }, [activeLeads, admissions, applications, feesPending, pendingApprovals, searchText, view]);

  function openView(nextView: AdmissionView) {
    setSearchText("");
    router.replace(nextView === "home" ? "/dashboard/director/admissions" : `/dashboard/director/admissions?tab=${nextView}`);
  }

  const aiMessage = loading
    ? "Nidus AI is checking the admissions desk."
    : attentionCount
      ? `Nidus AI found ${attentionCount} admission item(s) needing attention.`
      : "Nidus AI sees a calm admissions desk. No urgent director action is visible.";

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto grid max-w-[1500px] gap-4">
        <header className="rounded-3xl border border-[var(--border)] bg-white/92 p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Nidus AI Admissions</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">Admissions Workspace</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Applications, fee handover, approvals and activation in one simple AI-guided desk.</p>
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted-blue)]" />
              <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search name, mobile, course or status" className="min-w-0 flex-1 bg-transparent outline-none" />
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#08223f] text-white"><BrainCircuit className="h-6 w-6" /></span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">Nidus AI Status</p>
                <p className="mt-1 text-base font-black leading-7">{aiMessage}</p>
                <p className="text-sm text-[var(--muted-blue)]">Start with the highlighted queue. Raw CRM notes are hidden from this Director view.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[340px]">
              <MiniStat label="Leads" value={loading ? "..." : activeLeads.length} />
              <MiniStat label="Fees" value={loading ? "..." : feesPending.length} tone={feesPending.length ? "warn" : "ok"} />
              <MiniStat label="Follow-ups" value={loading ? "..." : todayFollowups.length} tone={todayFollowups.length ? "warn" : "ok"} />
            </div>
          </div>
        </section>

        {view === "home" ? (
          <section className="grid gap-4">
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {modules.map((module) => <HomeActionCard key={module.key} module={module} loading={loading} onClick={() => openView(module.key)} />)}
            </section>
            <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <Panel title="Today&apos;s Admission Work" eyebrow="AI priority list">
                <div className="grid gap-3">
                  <ActionLink href="/dashboard/director/admissions?tab=applications" icon={FileCheck2} label="Review applications" detail={`${pendingDocuments.length} applicant(s) need document clarity.`} value={pendingDocuments.length} tone={pendingDocuments.length ? "amber" : "green"} />
                  <ActionLink href="/dashboard/director/admissions?tab=fees" icon={BadgeIndianRupee} label="Fee handover" detail={`${feesPending.length} case(s) need fee confirmation.`} value={feesPending.length} tone={feesPending.length ? "amber" : "green"} />
                  <ActionLink href="/dashboard/director/admissions?tab=approvals" icon={ShieldCheck} label="Pending approvals" detail={`${pendingApprovals.length} director decision(s) pending.`} value={pendingApprovals.length} tone={pendingApprovals.length ? "amber" : "green"} />
                </div>
              </Panel>
              <Panel title="Admissions Flow" eyebrow="Simple pipeline">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FlowButton label="Leads" detail={`${activeLeads.length} active lead(s)`} icon={UserPlus} onClick={() => openView("leads")} />
                  {modules.map((module) => <FlowButton key={module.key} label={module.label} detail={module.detail} icon={module.icon} onClick={() => openView(module.key)} />)}
                </div>
              </Panel>
            </section>
          </section>
        ) : (
          <section className="rounded-3xl border border-[var(--border)] bg-white/92 p-4 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{viewLabels[view]}</p>
                <h2 className="mt-1 text-xl font-black">{view === "fees" ? "Fee Handover" : view === "activation" ? "Activation Desk" : `${viewLabels[view]} Queue`}</h2>
                {view === "fees" ? <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">Confirm payment status, follow up pending cases and keep applicants moving toward activation.</p> : null}
                {view === "applications" ? <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">Review documents, fee readiness and admission stage without raw CRM notes.</p> : null}
                {view === "leads" ? <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">See active enquiries and the next human action for each applicant.</p> : null}
                {view === "approvals" ? <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">Approve or reject only the decisions that need Director attention.</p> : null}
              </div>
              <p className="text-sm font-black text-[var(--muted-blue)]">{loading ? "Loading..." : `${queue.length} shown`}</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {queue.map((item) => view === "approvals" ? (
                <ApprovalCard key={(item as ApprovalRequest).id} approval={item as ApprovalRequest} pending={reviewApprovalMutation.isPending} onOpen={() => setSelected({ type: "approval", item: item as ApprovalRequest })} onReview={(approved) => reviewApprovalMutation.mutate({ approved, approval: item as ApprovalRequest })} />
              ) : view === "activation" ? (
                <AdmissionCard key={(item as Admission).id} admission={item as Admission} onOpen={() => setSelected({ type: "admission", item: item as Admission })} />
              ) : view === "fees" ? (
                <FeeLeadCard key={(item as Lead).id} lead={item as Lead} onOpen={() => setSelected({ type: "lead", item: item as Lead, context: "fees" })} />
              ) : (
                <LeadCard key={(item as Lead).id} lead={item as Lead} mode={view === "applications" ? "applications" : "leads"} onOpen={() => setSelected({ type: "lead", item: item as Lead, context: view })} />
              ))}
            </div>
            {!queue.length ? <Empty text={loading ? "Loading admission records..." : "No records found in this submodule."} /> : null}
          </section>
        )}
      </section>
      {selected ? <DetailDrawer selected={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function MiniStat({ label, tone = "ok", value }: { label: string; tone?: "ok" | "warn"; value: string | number }) {
  return <div className="rounded-2xl bg-white/82 px-3 py-2 text-center shadow-sm"><p className={`text-lg font-black ${tone === "warn" ? "text-amber-700" : "text-[var(--navy)]"}`}>{value}</p><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p></div>;
}

function HomeActionCard({ loading, module, onClick }: { loading: boolean; module: { label: string; count: number; detail: string; icon: LucideIcon; tone: Tone }; onClick: () => void }) {
  const Icon = module.icon;
  const palette = tonePalette(module.tone);
  return <button type="button" onClick={onClick} className={`rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${palette.card}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{module.label}</p><p className="mt-2 text-4xl font-black">{loading ? "..." : module.count}</p><p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">{module.detail}</p></div><span className={`grid h-11 w-11 place-items-center rounded-xl ${palette.icon}`}><Icon className="h-5 w-5" /></span></div><span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--navy)] px-4 text-sm font-black text-white">Open</span></button>;
}

function Panel({ children, eyebrow, title }: { children: React.ReactNode; eyebrow: string; title: string }) {
  return <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-4 shadow-sm"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{eyebrow}</p><h2 className="mt-1 text-xl font-black">{title}</h2><div className="mt-4">{children}</div></section>;
}

function ActionLink({ detail, href, icon: Icon, label, tone, value }: { detail: string; href: string; icon: LucideIcon; label: string; tone: Tone; value: number }) {
  const palette = tonePalette(tone);
  return <a href={href} className={`block rounded-2xl border p-4 transition hover:shadow-md ${palette.card}`}><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${palette.icon}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-sm font-black">{label}</span><span className="mt-0.5 block truncate text-sm text-[var(--muted-blue)]">{detail}</span></span></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black shadow-sm">{value}</span></div></a>;
}

function FlowButton({ detail, icon: Icon, label, onClick }: { detail: string; icon: LucideIcon; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-2xl border border-[var(--border)] bg-white p-4 text-left transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)]"><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-black">{label}</span><span className="mt-1 block text-xs font-bold text-[var(--muted-blue)]">{detail}</span></span></div></button>;
}

function LeadCard({ lead, mode, onOpen }: { lead: Lead; mode: "leads" | "applications"; onOpen: () => void }) {
  const fee = feeStatus(lead);
  const docs = documentStatus(lead);
  const action = leadNextAction(lead, mode);
  return <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-black">{lead.fullName}</h3><p className="mt-1 truncate text-sm text-[var(--muted-blue)]">{lead.targetExam}</p></div><span className="rounded-full bg-[var(--gold-soft)] px-3 py-1 text-[10px] font-black">{applicationStage(lead)}</span></div><div className="mt-4 grid gap-2 text-xs font-black"><InfoLine icon={PhoneCall} label="Mobile" value={lead.mobile} /><InfoLine icon={UserPlus} label="Source" value={lead.source || "Not set"} /><InfoLine icon={FileCheck2} label="Documents" value={docs.label} tone={docs.tone} /><InfoLine icon={BadgeIndianRupee} label="Fee" value={fee.label} tone={fee.tone} /><InfoLine icon={ClipboardCheck} label="Next" value={action} tone={action.includes("Check") || action.includes("fee") ? "warn" : "ok"} /></div><div className="mt-4 grid grid-cols-2 gap-2"><a href={`tel:${lead.mobile}`} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">Call</a><button type="button" onClick={onOpen} className="min-h-10 rounded-xl bg-[var(--navy)] px-3 text-sm font-black text-white">{mode === "applications" ? "Review" : "View"}</button></div></article>;
}
function FeeLeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const fee = feeStatus(lead);
  const expected = moneyFromLead(lead);
  return <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-black">{lead.fullName}</h3><p className="mt-1 truncate text-sm text-[var(--muted-blue)]">{lead.targetExam}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-black ${fee.tone === "warn" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{fee.label}</span></div><div className="mt-4 grid gap-2 text-xs font-black"><InfoLine icon={PhoneCall} label="Mobile" value={lead.mobile} /><InfoLine icon={BadgeIndianRupee} label="Expected fee" value={expected ? `Rs ${expected.toLocaleString("en-IN")}` : "Not entered"} tone={expected ? "ok" : "warn"} /><InfoLine icon={ClipboardCheck} label="Action" value={fee.nextAction} tone={fee.tone} /></div><button type="button" onClick={onOpen} className="mt-4 min-h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">Open fee details</button></article>;
}

function ApprovalCard({ approval, onOpen, onReview, pending }: { approval: ApprovalRequest; onOpen: () => void; onReview: (approved: boolean) => void; pending: boolean }) {
  const amount = approval.amount ? `Rs ${approval.amount.toLocaleString("en-IN")}` : approval.admission?.totalFee ? `Rs ${approval.admission.totalFee.toLocaleString("en-IN")}` : "Not applicable";
  return <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-black">{approvalTitle(approval)}</h3><p className="mt-1 truncate text-sm font-bold text-[var(--muted-blue)]">{approvalSubtitle(approval)}</p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-amber-800 shadow-sm">Decision</span></div><div className="mt-4 grid gap-2 text-xs font-black"><InfoLine icon={ShieldCheck} label="Reason" value={approvalReason(approval)} tone="warn" /><InfoLine icon={BadgeIndianRupee} label="Amount" value={amount} /><InfoLine icon={ClipboardCheck} label="Requested" value={requestedDate(approval.requestedAt)} /></div><div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={() => onReview(true)} disabled={pending} className="min-h-10 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-800 disabled:opacity-60">Approve</button><button type="button" onClick={() => onReview(false)} disabled={pending} className="min-h-10 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-black text-rose-800 disabled:opacity-60">Reject</button><button type="button" onClick={onOpen} className="min-h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black">Details</button></div></article>;
}
function AdmissionCard({ admission, onOpen }: { admission: Admission; onOpen: () => void }) {
  return <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-black">{admission.student?.name ?? "Student"}</h3><p className="mt-1 truncate text-sm text-[var(--muted-blue)]">{admission.course?.title ?? admission.batch}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">{admission.status ?? "ADMITTED"}</span></div><div className="mt-4 grid gap-2 text-xs font-black"><InfoLine icon={BadgeIndianRupee} label="Payment" value={admission.paymentStatus} /><InfoLine icon={ClipboardCheck} label="Batch" value={admission.batch || "Not set"} /></div><button type="button" onClick={onOpen} className="mt-4 min-h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">Open activation</button></article>;
}

function InfoLine({ icon: Icon, label, tone = "ok", value }: { icon: LucideIcon; label: string; tone?: "ok" | "warn"; value: string }) {
  return <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--page-bg)] px-3 py-2"><span className="flex min-w-0 items-center gap-2 text-[var(--muted-blue)]"><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{label}</span></span><span className={`truncate text-right ${tone === "warn" ? "text-amber-700" : "text-[var(--navy)]"}`}>{value}</span></div>;
}

function DetailDrawer({ onClose, selected }: { onClose: () => void; selected: SelectedRecord }) {
  const title = selected.type === "lead" ? selected.item.fullName : selected.type === "approval" ? friendlyApprovalType(selected.item.type) : selected.item.student?.name ?? "Admission";
  const rows = selected.type === "lead"
    ? leadRows(selected.item, selected.context)
    : selected.type === "approval"
      ? [["Applicant", approvalTitle(selected.item)], ["Request", approvalSubtitle(selected.item)], ["Reason", approvalReason(selected.item)], ["Amount", selected.item.amount ? `Rs ${selected.item.amount.toLocaleString("en-IN")}` : selected.item.admission?.totalFee ? `Rs ${selected.item.admission.totalFee.toLocaleString("en-IN")}` : "Not applicable"], ["Requested", requestedDate(selected.item.requestedAt)], ["Status", selected.item.status]]
      : [["Student", selected.item.student?.name ?? "Student"], ["Course", selected.item.course?.title ?? "Not set"], ["Batch", selected.item.batch || "Not set"], ["Payment", selected.item.paymentStatus], ["Admission date", new Date(selected.item.admissionDate).toLocaleDateString()]];
  return <div className="fixed inset-0 z-50 bg-slate-950/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><aside className="ml-auto flex h-full w-full max-w-md flex-col rounded-2xl border border-[var(--border)] bg-white p-4 text-[var(--navy)] shadow-2xl"><div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3"><div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{selected.type === "lead" && selected.context === "fees" ? "Fee Details" : "Admission Details"}</p><h2 className="mt-1 text-xl font-black">{title}</h2></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white"><X className="h-4 w-4" /></button></div><div className="mt-4 grid gap-2 overflow-auto pr-1">{rows.map(([label, value]) => <div key={label} className="rounded-xl bg-[var(--page-bg)] px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">{label}</p><p className="mt-1 break-words text-sm font-black">{value}</p></div>)}</div></aside></div>;
}

function leadRows(lead: Lead, context?: AdmissionView): string[][] {
  const fee = feeStatus(lead);
  const docs = documentStatus(lead);
  if (context === "fees") {
    const expected = moneyFromLead(lead);
    return [["Student", lead.fullName], ["Mobile", lead.mobile], ["Program", lead.targetExam], ["Fee status", fee.label], ["Expected fee", expected ? `Rs ${expected.toLocaleString("en-IN")}` : "Not entered"], ["Next action", fee.nextAction], ["Note", friendlyNote(lead)]];
  }
  return [["Student", lead.fullName], ["Mobile", lead.mobile], ["Program", lead.targetExam], ["Stage", applicationStage(lead)], ["Documents", docs.label], ["Fee", fee.label], ["Next action", friendlyNote(lead)]];
}

function Empty({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm text-[var(--muted-blue)]">{text}</div>;
}

function tonePalette(tone: Tone) {
  const styles: Record<Tone, { card: string; icon: string }> = {
    blue: { card: "border-[#d8e8fb] bg-white", icon: "bg-[#e4f0ff] text-[#123c6d]" },
    green: { card: "border-[var(--border)] bg-white", icon: "bg-emerald-100 text-emerald-800" },
    gold: { card: "border-[var(--border)] bg-white", icon: "bg-[var(--gold-soft)] text-[var(--navy)]" },
    amber: { card: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-800" },
    rose: { card: "border-rose-200 bg-rose-50", icon: "bg-rose-100 text-rose-800" },
  };
  return styles[tone];
}

