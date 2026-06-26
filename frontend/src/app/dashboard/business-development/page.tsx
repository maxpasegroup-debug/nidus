"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Archive, CalendarClock, Handshake, PhoneCall, Search, Send, UserPlus } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCounselling, useFollowups, useLeads } from "@/hooks/use-crm";
import type { GuestApplicantResult, Lead, LeadStatus } from "@/types/crm";

const leadStatuses: Array<{ label: string; value: LeadStatus | "" }> = [
  { label: "All Leads", value: "" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Counselling", value: "COUNSELLING" },
  { label: "Converted", value: "ENROLLED" },
  { label: "Lost", value: "LOST" }
];

const followUpStatuses = ["New", "Contacted", "Follow-up", "Counselling Scheduled", "Interested", "Not Interested"];

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

function mapFollowUpStatus(status: string): LeadStatus {
  if (status === "Not Interested") return "LOST";
  if (status === "Counselling Scheduled" || status === "Interested") return "COUNSELLING";
  if (status === "Contacted" || status === "Follow-up") return "CONTACTED";
  return "NEW";
}

function StatBox({ title, value, note }: { title: string; value: number; note: string }) {
  return (
    <div className="rounded-lg border border-[#071d36]/15 bg-white/90 p-4 shadow-[0_14px_34px_rgba(7,29,54,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f4a32]">{title}</p>
      <p className="mt-3 text-3xl font-black text-[#071d36]">{value}</p>
      <p className="mt-1 text-sm text-[#52627a]">{note}</p>
    </div>
  );
}

function StatusPill({ lead }: { lead: Lead }) {
  const ready = isReadyForAdmission(lead);
  const tone = ready
    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
    : lead.status === "LOST"
      ? "border-red-200 bg-red-50 text-red-700"
      : lead.status === "ENROLLED"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-[#b9913f]/35 bg-[#fff8df] text-[#79551f]";
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold` + ` ${tone}`}>{ready ? "READY FOR AO" : lead.status}</span>;
}

export default function BusinessDevelopmentDashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | undefined>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [guestResult, setGuestResult] = useState<GuestApplicantResult | null>(null);
  const leads = useLeads({ status, search: search || undefined });
  const followups = useFollowups();
  const counselling = useCounselling();
  const leadData = useMemo(() => leads.data ?? [], [leads.data]);
  const followupData = useMemo(() => followups.data ?? [], [followups.data]);
  const counsellingData = useMemo(() => counselling.data ?? [], [counselling.data]);

  const reports = useMemo(() => ({
    newLeads: leadData.filter((lead) => lead.status === "NEW").length,
    contacted: leadData.filter((lead) => lead.status === "CONTACTED").length,
    counsellingPending: leadData.filter((lead) => lead.status === "COUNSELLING" && !isReadyForAdmission(lead)).length,
    readyForAdmission: leadData.filter(isReadyForAdmission).length,
    converted: leadData.filter((lead) => lead.status === "ENROLLED").length,
    lost: leadData.filter((lead) => lead.status === "LOST").length
  }), [leadData]);

  function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const mobile = value(form, "mobile");
    const parent = value(form, "parentName");
    setGuestResult(null);
    leads.createGuest.mutate(
      {
        fullName: value(form, "fullName"),
        mobile,
        email: value(form, "email") || undefined,
        targetExam: value(form, "targetExam"),
        source: value(form, "source"),
        parentName: parent || undefined,
        notes: value(form, "notes") || undefined
      },
      {
        onSuccess: (result) => {
          setGuestResult(result);
          form.reset();
        }
      }
    );
  }

  function saveFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLead) return;
    const form = event.currentTarget;
    const followUpStatus = value(form, "status");
    const nextStatus = mapFollowUpStatus(followUpStatus);
    const note = appendNote(selectedLead.notes, "Follow-up update", [
      `Status: ${followUpStatus}`,
      value(form, "callLog") ? `Call Log: ${value(form, "callLog")}` : "",
      value(form, "whatsappNotes") ? `WhatsApp Notes: ${value(form, "whatsappNotes")}` : "",
      value(form, "meetingNotes") ? `Meeting Notes: ${value(form, "meetingNotes")}` : ""
    ]);
    followups.create.mutate({
      leadId: selectedLead.id,
      followUpDate: value(form, "followUpDate"),
      remarks: [value(form, "callLog"), value(form, "whatsappNotes"), value(form, "meetingNotes")].filter(Boolean).join(" | "),
      status: followUpStatus
    });
    leads.update.mutate({ id: selectedLead.id, status: nextStatus, notes: note });
    setSelectedLead({ ...selectedLead, status: nextStatus, notes: note });
    form.reset();
  }

  function saveCounselling(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLead) return;
    const form = event.currentTarget;
    const note = appendNote(selectedLead.notes, "Counselling recorded", [
      value(form, "recommendedProgram") ? `Recommended Program: ${value(form, "recommendedProgram")}` : "",
      value(form, "parentFeedback") ? `Parent Feedback: ${value(form, "parentFeedback")}` : "",
      value(form, "interestLevel") ? `Student Interest Level: ${value(form, "interestLevel")}` : "",
      value(form, "counsellingNotes") ? `Counselling Notes: ${value(form, "counsellingNotes")}` : ""
    ]);
    counselling.create.mutate({
      leadId: selectedLead.id,
      counsellorName: user?.name ?? "BDE",
      bookingDate: value(form, "bookingDate"),
      mode: value(form, "mode") as "ONLINE" | "OFFLINE",
      status: "COMPLETED"
    });
    leads.update.mutate({ id: selectedLead.id, status: "COUNSELLING", targetExam: value(form, "recommendedProgram") || selectedLead.targetExam, notes: note });
    setSelectedLead({ ...selectedLead, status: "COUNSELLING", targetExam: value(form, "recommendedProgram") || selectedLead.targetExam, notes: note });
    form.reset();
  }

  function handoverToAo(lead: Lead) {
    const note = appendNote(lead.notes, "Ready For Admission", [
      "APPLICATION_STATUS: READY_FOR_ADMISSION",
      "AO_QUEUE: YES",
      `BDE Name: ${user?.name ?? lead.assignee?.name ?? "Business Development Executive"}`,
      `Program: ${lead.targetExam}`,
      "Handover To Administrative Officer: YES"
    ]);
    leads.update.mutate({ id: lead.id, status: "COUNSELLING", notes: note });
    setSelectedLead({ ...lead, status: "COUNSELLING", notes: note });
  }

  return (
    <RoleDashboardGuard role={["BUSINESS_DEVELOPMENT_EXECUTIVE", "TELECALLER", "MARKETING_COORDINATOR"]}>
      <main className="space-y-7">
        <section className="rounded-lg border border-[#071d36]/15 bg-white/95 p-6 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#3f4a32]">Business Development Executive</p>
              <h1 className="mt-3 text-4xl font-black text-[#071d36]">Enquiry to admission handoff.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#52627a]">Create the guest login, record every call, complete counselling, and send ready applicants to the Administrative Officer for documents, fees, receipts and batch activation.</p>
            </div>
            <Button type="button" onClick={() => leads.refetch()} disabled={leads.isFetching} variant="secondary">
              {leads.isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </section>

        <section id="reports" className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatBox title="New Leads" value={reports.newLeads} note="Fresh enquiries" />
          <StatBox title="Contacted" value={reports.contacted} note="Call started" />
          <StatBox title="Counselling" value={reports.counsellingPending} note="In discussion" />
          <StatBox title="Ready For AO" value={reports.readyForAdmission} note="Handed over" />
          <StatBox title="Converted" value={reports.converted} note="Enrolled" />
          <StatBox title="Lost" value={reports.lost} note="Archived" />
        </section>

        <section id="leads" className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
          <div className="rounded-lg border border-[#071d36]/15 bg-white/95 p-5 shadow-[0_14px_34px_rgba(7,29,54,0.06)]">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-[#b9913f]" />
              <h2 className="text-2xl font-black text-[#071d36]">Create Guest Login</h2>
            </div>
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
              Enter mobile or email once. NIDUS reuses an existing account if found, otherwise creates a guest login with the launch temporary password.
            </p>
            {guestResult ? (
              <div className="mt-4 rounded-lg border border-[#071d36]/15 bg-[#f7f9fc] p-4 text-sm text-[#071d36]">
                <p className="text-base font-black">{guestResult.reusedExistingUser ? "Existing account reused" : "Guest account ready"}</p>
                <p className="mt-2">Ask the applicant to login using <strong>{guestResult.loginIdentity}</strong>.</p>
                {guestResult.mustChangePassword ? <p className="mt-1">Temporary password: <strong>123456789</strong>. They must change it after login.</p> : <p className="mt-1">This account already had its own password. Do not share the launch password.</p>}
                <p className="mt-1">Lead is now available for follow-up and AO handover.</p>
              </div>
            ) : null}
            <form onSubmit={createLead} className="mt-5 grid gap-3">
              <Input name="fullName" label="Student Name" required />
              <Input name="parentName" label="Parent Name" />
              <Input name="mobile" label="Mobile" required />
              <Input name="email" label="Email (optional)" type="email" />
              <Input name="targetExam" label="Program Interested" required />
              <Input name="source" label="Source" required placeholder="Website, WhatsApp, referral, walk-in" />
              <Input name="notes" label="Notes" />
              <Button disabled={leads.createGuest.isPending}>{leads.createGuest.isPending ? "Creating login..." : "Create Guest Login + Lead"}</Button>
            </form>
          </div>

          <div className="rounded-lg border border-[#071d36]/15 bg-white/95 p-5 shadow-[0_14px_34px_rgba(7,29,54,0.06)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <Input label="Search Lead" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone, email or program" />
              </div>
              <label className="block md:w-56">
                <span className="text-sm font-medium text-[#071d36]">Filter</span>
                <select className="mt-2 h-12 w-full rounded border border-[#071d36]/15 bg-white px-4 text-sm font-semibold text-[#071d36] outline-none focus:border-[#b9913f]" value={status ?? ""} onChange={(event) => setStatus(event.target.value ? event.target.value as LeadStatus : undefined)}>
                  {leadStatuses.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3">
              {leadData.length ? leadData.map((lead) => (
                <button key={lead.id} type="button" onClick={() => setSelectedLead(lead)} className="rounded-lg border border-[#071d36]/12 bg-white p-4 text-left transition hover:border-[#b9913f]/60 hover:shadow-[0_12px_30px_rgba(7,29,54,0.08)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-[#071d36]">{lead.fullName}</h3>
                      <p className="mt-1 text-sm text-[#52627a]">{lead.targetExam} | {lead.source}</p>
                    </div>
                    <StatusPill lead={lead} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-[#071d36] sm:grid-cols-3">
                    <span>{lead.mobile}</span>
                    <span>Parent: {parentName(lead)}</span>
                    <span>BDE: {lead.assignee?.name ?? "Assigned to me"}</span>
                  </div>
                </button>
              )) : (
                <div className="rounded-lg border border-dashed border-[#071d36]/25 bg-white p-6 text-sm text-[#52627a]">
                  No leads found for this filter.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="followups" className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-[#071d36]/15 bg-white/95 p-5">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-[#b9913f]" />
              <h2 className="text-2xl font-black text-[#071d36]">Upcoming Follow-ups</h2>
            </div>
            <div className="mt-4 space-y-3">
              {followupData.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded border border-[#071d36]/12 bg-white p-3 text-sm">
                  <p className="font-bold text-[#071d36]">{item.lead?.fullName ?? item.leadId}</p>
                  <p className="text-[#52627a]">{new Date(item.followUpDate).toLocaleString()} | {item.status}</p>
                  <p className="mt-1 text-[#071d36]">{item.remarks}</p>
                </div>
              ))}
              {!followupData.length ? <p className="rounded border border-dashed border-[#071d36]/25 p-4 text-sm text-[#52627a]">No follow-ups scheduled yet.</p> : null}
            </div>
          </div>
          <div className="rounded-lg border border-[#071d36]/15 bg-white/95 p-5">
            <div className="flex items-center gap-3">
              <Handshake className="h-5 w-5 text-[#b9913f]" />
              <h2 className="text-2xl font-black text-[#071d36]">Counselling Records</h2>
            </div>
            <div className="mt-4 space-y-3">
              {counsellingData.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded border border-[#071d36]/12 bg-white p-3 text-sm">
                  <p className="font-bold text-[#071d36]">{item.lead?.fullName ?? item.leadId}</p>
                  <p className="text-[#52627a]">{item.counsellorName} | {item.mode} | {new Date(item.bookingDate).toLocaleString()}</p>
                </div>
              ))}
              {!counsellingData.length ? <p className="rounded border border-dashed border-[#071d36]/25 p-4 text-sm text-[#52627a]">No counselling records yet.</p> : null}
            </div>
          </div>
        </section>

        {selectedLead ? (
          <div className="fixed inset-0 z-50 bg-black/50 p-3 backdrop-blur-sm sm:p-6">
            <div className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#071d36]/15 bg-[#fffdf8] shadow-2xl">
              <div className="border-b border-[#071d36]/10 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3f4a32]">Lead Profile</p>
                    <h2 className="mt-2 text-3xl font-black text-[#071d36]">{selectedLead.fullName}</h2>
                    <p className="mt-1 text-sm text-[#52627a]">{selectedLead.mobile} | Parent: {parentName(selectedLead)}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedLead(null)} className="rounded border border-[#071d36]/15 bg-white px-4 py-2 text-sm font-bold text-[#071d36]">Close</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <form onSubmit={saveFollowUp} className="rounded-lg border border-[#071d36]/15 bg-white p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <PhoneCall className="h-5 w-5 text-[#b9913f]" />
                      <h3 className="text-xl font-black text-[#071d36]">Follow-up</h3>
                    </div>
                    <div className="grid gap-3">
                      <Input name="followUpDate" label="Follow-up Date" type="datetime-local" required />
                      <label className="block">
                        <span className="text-sm font-medium text-[#071d36]">Follow-up Status</span>
                        <select name="status" className="mt-2 h-12 w-full rounded border border-[#071d36]/15 bg-white px-4 text-sm font-semibold text-[#071d36]" defaultValue="Follow-up">
                          {followUpStatuses.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                      <Input name="callLog" label="Call Log" />
                      <Input name="whatsappNotes" label="WhatsApp Notes" />
                      <Input name="meetingNotes" label="Meeting Notes" />
                      <Button disabled={followups.create.isPending || leads.update.isPending}>Save Follow-up</Button>
                    </div>
                  </form>

                  <form onSubmit={saveCounselling} className="rounded-lg border border-[#071d36]/15 bg-white p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Handshake className="h-5 w-5 text-[#b9913f]" />
                      <h3 className="text-xl font-black text-[#071d36]">Counselling</h3>
                    </div>
                    <div className="grid gap-3">
                      <Input name="bookingDate" label="Counselling Date" type="datetime-local" required />
                      <Input name="recommendedProgram" label="Recommended Program" defaultValue={selectedLead.targetExam} />
                      <label className="block">
                        <span className="text-sm font-medium text-[#071d36]">Mode</span>
                        <select name="mode" className="mt-2 h-12 w-full rounded border border-[#071d36]/15 bg-white px-4 text-sm font-semibold text-[#071d36]" defaultValue="OFFLINE">
                          <option>OFFLINE</option>
                          <option>ONLINE</option>
                        </select>
                      </label>
                      <Input name="parentFeedback" label="Parent Feedback" />
                      <Input name="interestLevel" label="Student Interest Level" placeholder="High, Medium, Low" />
                      <Input name="counsellingNotes" label="Counselling Notes" />
                      <Button disabled={counselling.create.isPending || leads.update.isPending}>Save Counselling</Button>
                    </div>
                  </form>
                </div>

                <div className="mt-4 rounded-lg border border-[#071d36]/15 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#071d36]">Admission Handover</h3>
                      <p className="mt-1 text-sm text-[#52627a]">Send this case to Administrative Officer after counselling is complete. AO will receive it in the application queue.</p>
                      {isReadyForAdmission(selectedLead) ? <p className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">Already handed over to AO</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => handoverToAo(selectedLead)} disabled={leads.update.isPending}>
                        <Send className="mr-2 h-4 w-4" /> Ready For Admission
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => leads.remove.mutate(selectedLead.id)} disabled={leads.remove.isPending}>
                        <Archive className="mr-2 h-4 w-4" /> Archive
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-[#071d36]/15 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Search className="h-5 w-5 text-[#b9913f]" />
                    <h3 className="text-xl font-black text-[#071d36]">Lead Notes</h3>
                  </div>
                  <pre className="whitespace-pre-wrap rounded border border-[#071d36]/10 bg-[#fffdf8] p-4 text-sm leading-6 text-[#071d36]">{selectedLead.notes || "No notes recorded yet."}</pre>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </RoleDashboardGuard>
  );
}
