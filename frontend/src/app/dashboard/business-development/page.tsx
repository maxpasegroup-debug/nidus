"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, BarChart3, CalendarClock, CheckCircle2, Phone, PhoneCall, Plus, Send, UserPlus, Users } from "lucide-react";
import { AiOperatingLayer } from "@/components/ai/ai-operating-layer";
import { RoleDashboardGuard } from "@/components/dashboard";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { ExecutiveIntelligenceSystem } from "@/components/reporting/executive-intelligence-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFollowups, useLeads } from "@/hooks/use-crm";
import type { GuestApplicantResult, Lead, LeadStatus } from "@/types/crm";

type BdeTab = "CALLING" | "NEW" | "FOLLOWUPS" | "COUNSELLING" | "LEADS" | "REPORTS";

const tabs: Array<{ key: BdeTab; label: string }> = [
  { key: "CALLING", label: "Calling Desk" },
  { key: "NEW", label: "New Enquiry" },
  { key: "FOLLOWUPS", label: "Follow-ups" },
  { key: "COUNSELLING", label: "Ready for AO" },
  { key: "LEADS", label: "All Leads" },
  { key: "REPORTS", label: "Reports" },
];

const leadStatuses: Array<{ label: string; value: LeadStatus | "" }> = [
  { label: "All", value: "" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Counselling", value: "COUNSELLING" },
  { label: "Converted", value: "ENROLLED" },
  { label: "Lost", value: "LOST" },
];

const callStatuses = ["Not reachable", "Connected", "Interested", "Call later", "Counselling needed", "Ready for admission", "Not interested"];
const tabAliases: Record<string, BdeTab> = {
  PIPELINE: "REPORTS",
  TEAM: "REPORTS",
  SOCIAL: "REPORTS",
  TODAY: "CALLING",
  READY: "COUNSELLING",
};

const validTabs = new Set<BdeTab>(["CALLING", "NEW", "FOLLOWUPS", "COUNSELLING", "LEADS", "REPORTS"]);

function value(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "").trim();
}

function appendNote(existing: string | undefined, title: string, lines: string[]) {
  const body = lines.filter(Boolean).join("\n");
  const entry = `[${new Date().toISOString()}] ${title}${body ? `\n${body}` : ""}`;
  return existing ? `${existing}\n\n${entry}` : entry;
}

function parentName(lead: Lead) {
  const match = lead.notes?.match(/^Parent:\s*(.+)$/im);
  return match?.[1] ?? "Not added";
}

function isReadyForAdmission(lead: Lead) {
  return /Ready For Admission|AO_QUEUE:\s*YES/i.test(lead.notes ?? "");
}

function mapCallStatus(status: string): LeadStatus {
  if (status === "Not interested") return "LOST";
  if (status === "Ready for admission" || status === "Counselling needed" || status === "Interested") return "COUNSELLING";
  if (status === "Connected" || status === "Call later" || status === "Not reachable") return "CONTACTED";
  return "NEW";
}

function isToday(date: Date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isOverdue(date: Date) {
  const now = new Date();
  return date < now && !isToday(date);
}

function nextFollowupLabel(date?: string) {
  if (!date) return "No follow-up set";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "No follow-up set";
  if (isToday(parsed)) return `Today ${parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (isOverdue(parsed)) return "Overdue";
  return parsed.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function LeadCard({ lead, nextFollowUp, onOpen }: { lead: Lead; nextFollowUp?: string; onOpen: (lead: Lead) => void }) {
  const ready = isReadyForAdmission(lead);
  return (
    <article className="rounded-2xl border border-[#071d36]/15 bg-white p-4 shadow-[0_10px_24px_rgba(7,29,54,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-black text-[#071d36]">{lead.fullName}</h3>
          <p className="mt-1 text-sm font-semibold text-[#52627a]">{lead.targetExam}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${ready ? "bg-emerald-50 text-emerald-800" : "bg-[#fff8df] text-[#79551f]"}`}>
          {ready ? "AO READY" : lead.status}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[#071d36] sm:grid-cols-2">
        <span className="rounded-xl bg-[#f7f9fc] px-3 py-2 font-bold">{lead.mobile}</span>
        <span className="rounded-xl bg-[#f7f9fc] px-3 py-2 font-bold">{nextFollowupLabel(nextFollowUp)}</span>
      </div>
      <p className="mt-3 text-xs text-[#52627a]">Parent: {parentName(lead)} / Source: {lead.source}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`tel:${lead.mobile}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#071d36]/15 bg-white px-4 text-sm font-black text-[#071d36] hover:border-[#b9913f]">
          <Phone className="mr-2 h-4 w-4" /> Call
        </a>
        <button type="button" onClick={() => onOpen(lead)} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#071d36] px-4 text-sm font-black text-white">
          Update
        </button>
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#071d36]/25 bg-white p-6 text-sm font-semibold text-[#52627a]">{text}</div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#071d36]/15 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3f4a32]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#071d36]">{value}</p>
    </div>
  );
}

export default function BusinessDevelopmentDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRequestedTab = searchParams?.get("tab")?.toUpperCase() ?? "";
  const requestedTab = (tabAliases[rawRequestedTab] ?? rawRequestedTab) as BdeTab | "";
  const [activeTab, setActiveTab] = useState<BdeTab>(
    requestedTab && validTabs.has(requestedTab) ? requestedTab : "CALLING",
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | undefined>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [guestResult, setGuestResult] = useState<GuestApplicantResult | null>(null);

  const leads = useLeads({ status, search: search || undefined });
  const followups = useFollowups();
  const leadData = useMemo(() => leads.data ?? [], [leads.data]);
  const followupData = useMemo(() => followups.data ?? [], [followups.data]);

  useEffect(() => {
    if (requestedTab && validTabs.has(requestedTab)) setActiveTab(requestedTab);
  }, [requestedTab]);

  const latestFollowupByLead = useMemo(() => {
    const map = new Map<string, string>();
    followupData.forEach((item) => {
      const previous = map.get(item.leadId);
      if (!previous || new Date(item.followUpDate).getTime() > new Date(previous).getTime()) map.set(item.leadId, item.followUpDate);
    });
    return map;
  }, [followupData]);

  const todayFollowups = followupData.filter((item) => isToday(new Date(item.followUpDate)) && item.status !== "COMPLETED");
  const overdueFollowups = followupData.filter((item) => isOverdue(new Date(item.followUpDate)) && item.status !== "COMPLETED");
  const readyLeads = leadData.filter(isReadyForAdmission);
  const newLeads = leadData.filter((lead) => lead.status === "NEW" && !isReadyForAdmission(lead));
  const todayQueue = useMemo(() => {
    const ids = new Set([...todayFollowups, ...overdueFollowups].map((item) => item.leadId));
    return leadData.filter((lead) => lead.status === "NEW" || ids.has(lead.id)).filter((lead) => lead.status !== "LOST" && lead.status !== "ENROLLED");
  }, [leadData, overdueFollowups, todayFollowups]);

  const reports = {
    callsToday: todayQueue.length,
    overdue: overdueFollowups.length,
    newLeads: newLeads.length,
    readyForAo: readyLeads.length,
    converted: leadData.filter((lead) => lead.status === "ENROLLED").length,
    contacted: leadData.filter((lead) => lead.status === "CONTACTED").length,
    counselling: leadData.filter((lead) => lead.status === "COUNSELLING").length,
    lost: leadData.filter((lead) => lead.status === "LOST").length,
  };

  const visibleLeads = activeTab === "CALLING"
    ? todayQueue
    : activeTab === "NEW"
      ? newLeads
    : activeTab === "COUNSELLING"
      ? readyLeads
      : activeTab === "FOLLOWUPS"
        ? leadData.filter((lead) => latestFollowupByLead.has(lead.id) && !isReadyForAdmission(lead))
        : leadData;

  function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setGuestResult(null);
    leads.createGuest.mutate(
      {
        fullName: value(form, "fullName"),
        mobile: value(form, "mobile"),
        email: value(form, "email") || undefined,
        targetExam: value(form, "targetExam"),
        source: value(form, "source"),
        parentName: value(form, "parentName") || undefined,
        notes: value(form, "notes") || undefined,
      },
      { onSuccess: (result) => { setGuestResult(result); form.reset(); } }
    );
  }

  function saveCallUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLead) return;
    const form = event.currentTarget;
    const callStatus = value(form, "callStatus");
    const nextFollowUpDate = value(form, "followUpDate");
    const note = appendNote(selectedLead.notes, "BDE call update", [
      `Call Status: ${callStatus}`,
      nextFollowUpDate ? `Next Follow-up: ${nextFollowUpDate}` : "",
      value(form, "notes") ? `Notes: ${value(form, "notes")}` : "",
    ]);

    if (nextFollowUpDate) {
      followups.create.mutate({
        leadId: selectedLead.id,
        followUpDate: nextFollowUpDate,
        remarks: [callStatus, value(form, "notes")].filter(Boolean).join(" | "),
        status: callStatus,
      });
    }

    leads.update.mutate(
      { id: selectedLead.id, status: mapCallStatus(callStatus), notes: note },
      { onSuccess: () => setSelectedLead(null) },
    );
  }

  function handoverToAo(lead: Lead) {
    const note = appendNote(lead.notes, "Ready For Admission", [
      "APPLICATION_STATUS: READY_FOR_ADMISSION",
      "AO_QUEUE: YES",
      `BDE Name: ${user?.name ?? lead.assignee?.name ?? "Business Development Executive"}`,
      `Program: ${lead.targetExam}`,
      "Handover To Administrative Officer: YES",
    ]);
    leads.update.mutate(
      { id: lead.id, status: "COUNSELLING", notes: note },
      { onSuccess: () => setSelectedLead(null) },
    );
  }

  function archiveLead(lead: Lead) {
    if (!window.confirm(`Archive ${lead.fullName}? This will move the lead to Lost.`)) return;
    leads.remove.mutate(lead.id, { onSuccess: () => setSelectedLead(null) });
  }

  function openTab(tab: BdeTab) {
    setActiveTab(tab);
    router.replace(`/dashboard/business-development?tab=${tab}`, { scroll: false });
  }

  return (
    <RoleDashboardGuard role={["DIRECTOR", "BUSINESS_DEVELOPMENT_EXECUTIVE", "TELECALLER", "MARKETING_COORDINATOR"]}>
      <WorkspaceDashboard
        roleTitle="Business Development Workspace"
        greeting="Today's Leads"
        subtitle="Call leads, add enquiries, schedule follow-ups and send confirmed cases to the admission office."
        focus={[
          { label: "Call Now", title: reports.callsToday, detail: "New leads and due follow-ups to call today.", href: "/dashboard/business-development?tab=CALLING", icon: PhoneCall, tone: reports.callsToday ? "warning" : "success" },
          { label: "Overdue", title: reports.overdue, detail: "Follow-ups that need recovery before they go cold.", href: "/dashboard/business-development?tab=FOLLOWUPS", icon: CalendarClock, tone: reports.overdue ? "warning" : "success" },
          { label: "Send to AO", title: reports.readyForAo, detail: "Interested leads ready for admission office handover.", href: "/dashboard/business-development?tab=COUNSELLING", icon: Send, tone: reports.readyForAo ? "info" : "success" },
        ]}
        actions={[
          { label: "Calling Desk", href: "/dashboard/business-development?tab=CALLING", icon: PhoneCall },
          { label: "New Enquiry", href: "/dashboard/business-development?tab=NEW", icon: UserPlus },
          { label: "All Leads", href: "/dashboard/business-development?tab=LEADS", icon: Users },
          { label: "Follow-ups", href: "/dashboard/business-development?tab=FOLLOWUPS", icon: CalendarClock },
          { label: "Ready for AO", href: "/dashboard/business-development?tab=COUNSELLING", icon: Send },
          { label: "Reports", href: "/dashboard/business-development?tab=REPORTS", icon: BarChart3 },
        ]}
        metrics={[
          { label: "Calls Today", value: reports.callsToday },
          { label: "Overdue", value: reports.overdue, tone: reports.overdue ? "warning" : "success" },
          { label: "New Leads", value: reports.newLeads },
          { label: "Ready For AO", value: reports.readyForAo },
        ]}
        activity={todayQueue.slice(0, 5).map((lead) => ({ title: lead.fullName, detail: `${lead.mobile} / ${lead.targetExam}`, href: "/dashboard/business-development?tab=CALLING", meta: latestFollowupByLead.get(lead.id) ? nextFollowupLabel(latestFollowupByLead.get(lead.id)) : lead.status }))}
        upcoming={readyLeads.slice(0, 5).map((lead) => ({ title: lead.fullName, detail: `${lead.targetExam} is ready for AO handover.`, href: "/dashboard/business-development?tab=COUNSELLING", meta: "AO" }))}
      >

        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#071d36]/15 bg-white p-2" aria-label="Business development work views">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => openTab(tab.key)} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-black ${activeTab === tab.key ? "bg-[#071d36] text-white" : "text-[#071d36] hover:bg-[#f7f9fc]"}`}>
              {tab.label}
            </button>
          ))}
        </nav>

        <section className="grid min-h-0 gap-4 xl:grid-cols-[0.78fr_1.42fr]">
          <aside className="min-h-0 overflow-y-auto rounded-2xl border border-[#071d36]/15 bg-white p-5">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-[#b9913f]" />
              <h2 className="text-2xl font-black text-[#071d36]">New enquiry</h2>
            </div>
            <p className="mt-2 text-sm text-[#52627a]">Create login and lead in one minute.</p>
            {guestResult ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-black">{guestResult.reusedExistingUser ? "Existing account reused" : "Guest account ready"}</p>
                <p className="mt-1">Login: <strong>{guestResult.loginIdentity}</strong></p>
                {guestResult.mustChangePassword ? <p>PIN: <strong>1234</strong></p> : <p>Use existing PIN. Do not share default PIN.</p>}
              </div>
            ) : null}
            <form onSubmit={createLead} className="mt-5 grid gap-3">
              <Input name="fullName" label="Student Name" required />
              <Input name="parentName" label="Parent Name" />
              <Input name="mobile" label="Mobile" required />
              <Input name="email" label="Email (optional)" type="email" />
              <Input name="targetExam" label="Interested Course" required />
              <Input name="source" label="Source" required placeholder="WhatsApp, website, referral" />
              <Input name="notes" label="Short note" />
              <Button disabled={leads.createGuest.isPending}>
                <Plus className="mr-2 h-4 w-4" /> {leads.createGuest.isPending ? "Creating..." : "Create Lead"}
              </Button>
            </form>
          </aside>

          <section className="min-h-0 overflow-y-auto rounded-2xl border border-[#071d36]/15 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#3f4a32]">{tabs.find((tab) => tab.key === activeTab)?.label}</p>
                <h2 className="mt-1 text-3xl font-black text-[#071d36]">
                  {activeTab === "CALLING" ? "Who should I call now?" : activeTab === "NEW" ? "Fresh enquiries" : activeTab === "COUNSELLING" ? "Send these to AO" : activeTab === "FOLLOWUPS" ? "Follow-up tracker" : activeTab === "REPORTS" ? "Simple performance" : "Lead records"}
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
                <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone, course" />
                <label className="block">
                  <span className="text-sm font-medium text-ink">Status</span>
                  <select className="mt-2 h-12 w-full rounded border border-[#071d36]/15 bg-white px-3 text-sm font-semibold text-[#071d36]" value={status ?? ""} onChange={(event) => setStatus(event.target.value ? event.target.value as LeadStatus : undefined)}>
                    {leadStatuses.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {activeTab === "REPORTS" ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Metric label="Total Leads" value={leadData.length} />
                <Metric label="Active Follow-ups" value={followupData.filter((item) => item.status !== "COMPLETED").length} />
                <Metric label="AO Handovers" value={readyLeads.length} />
                <Metric label="New Leads" value={reports.newLeads} />
                <Metric label="Contacted" value={reports.contacted} />
                <Metric label="Counselling" value={reports.counselling} />
                <Metric label="Lost" value={reports.lost} />
                <Metric label="Converted" value={reports.converted} />
                <Metric label="Today's Work" value={reports.callsToday + reports.overdue} />
              </div>
            ) : (
              <div className="mt-5 grid max-h-[52vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                {visibleLeads.map((lead) => <LeadCard key={lead.id} lead={lead} nextFollowUp={latestFollowupByLead.get(lead.id)} onOpen={setSelectedLead} />)}
                {!visibleLeads.length ? <EmptyState text="No leads in this lane. Nice and quiet." /> : null}
              </div>
            )}
          </section>
        </section>

        <AiOperatingLayer
          role="BUSINESS_DEVELOPMENT"
          items={[
            {
              title: reports.overdue ? `${reports.overdue} overdue follow-up(s)` : "No overdue follow-ups",
              detail: "Lead priority is calculated from the existing follow-up queue.",
              href: "/dashboard/business-development?tab=CALLING",
              icon: CalendarClock,
              tone: reports.overdue ? "warning" : "success",
            },
            {
              title: `${reports.readyForAo} AO-ready lead(s)`,
              detail: "These leads have admission handover signals and should not stay in sales.",
              href: "/dashboard/business-development?tab=COUNSELLING",
              icon: Send,
              tone: reports.readyForAo ? "info" : "default",
            },
            {
              title: `${reports.converted} converted`,
              detail: "Conversion insight remains inside the growth workspace, not a separate AI dashboard.",
              href: "/dashboard/business-development?tab=REPORTS",
              icon: BarChart3,
              tone: "success",
            },
          ]}
        />

        <ExecutiveIntelligenceSystem
          role="BUSINESS_DEVELOPMENT"
          title="Growth Intelligence"
          description="Lead funnel, conversions, pending admissions, counselling outcomes, campaign performance and follow-up recovery are connected to the existing CRM workspace."
          metrics={[
            { label: "Lead Funnel", value: leadData.length, note: `${reports.newLeads} new lead(s)`, tone: "info" },
            { label: "Conversions", value: reports.converted, note: `${reports.counselling} counselling`, tone: reports.converted ? "success" : "info" },
            { label: "Follow-ups", value: reports.callsToday, note: `${reports.overdue} overdue`, tone: reports.overdue ? "warning" : "success" },
            { label: "AO Ready", value: reports.readyForAo, note: "Ready for admission handover", tone: reports.readyForAo ? "warning" : "success" },
          ]}
          insights={[
            { title: "What happened?", detail: `${leadData.length} lead(s), ${followupData.length} follow-up(s) and ${reports.readyForAo} AO-ready handover(s) are visible.`, tone: "info" },
            { title: "What needs attention?", detail: reports.overdue ? `${reports.overdue} overdue follow-up(s) need recovery today.` : "No overdue recovery queue is visible.", href: "/dashboard/business-development?tab=CALLING", tone: reports.overdue ? "warning" : "success" },
            { title: "What should I do next?", detail: "Work through calling, counselling and reports from the existing CRM tabs above.", href: "/dashboard/business-development?tab=REPORTS", tone: "info" },
          ]}
        />

        {selectedLead ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#071d36]/15 bg-[#fffdf8] shadow-2xl">
              <div className="border-b border-[#071d36]/10 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#3f4a32]">Call update</p>
                    <h2 className="mt-1 text-3xl font-black text-[#071d36]">{selectedLead.fullName}</h2>
                    <p className="mt-1 text-sm text-[#52627a]">{selectedLead.mobile} / {selectedLead.targetExam}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedLead(null)} className="rounded-xl border border-[#071d36]/15 bg-white px-4 py-2 text-sm font-black text-[#071d36]">Close</button>
                </div>
              </div>
              <form onSubmit={saveCallUpdate} className="grid gap-4 p-5">
                <label className="block">
                  <span className="text-sm font-medium text-ink">Call status</span>
                  <select name="callStatus" className="mt-2 h-12 w-full rounded-xl border border-[#071d36]/15 bg-white px-4 text-sm font-black text-[#071d36]" defaultValue="Connected">
                    {callStatuses.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <Input name="followUpDate" label="Next Follow-up Date" type="datetime-local" />
                <label className="block">
                  <span className="text-sm font-medium text-ink">Call notes</span>
                  <textarea name="notes" rows={4} className="mt-2 w-full rounded-xl border border-[#071d36]/15 bg-white p-4 text-sm text-[#071d36] outline-none focus:border-[#b9913f]" placeholder="What did the student or parent say?" />
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button disabled={followups.create.isPending || leads.update.isPending}>
                    <PhoneCall className="mr-2 h-4 w-4" /> Save Update
                  </Button>
                  <Button type="button" onClick={() => handoverToAo(selectedLead)} disabled={leads.update.isPending} variant="secondary">
                    <Send className="mr-2 h-4 w-4" /> Send to AO
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => archiveLead(selectedLead)} disabled={leads.remove.isPending}>
                    <Archive className="mr-2 h-4 w-4" /> Archive
                  </Button>
                </div>
                {isReadyForAdmission(selectedLead) ? (
                  <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" /> Already visible to AO
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        ) : null}
      </WorkspaceDashboard>
    </RoleDashboardGuard>
  );
}
