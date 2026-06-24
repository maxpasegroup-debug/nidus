"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeIndianRupee, CheckCircle2, ClipboardCheck, FileArchive, PhoneCall, UserCheck, UserPlus, Users } from "lucide-react";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "../academic/_components";
import { getAdmissions, getApprovals, getFollowups, getLeads } from "@/services/crm";
import type { Lead } from "@/types/crm";

export default function DirectorAdmissionsPage() {
  const leadsQuery = useQuery({ queryKey: ["director", "admissions", "leads"], queryFn: () => getLeads() });
  const admissionsQuery = useQuery({ queryKey: ["director", "admissions", "admissions"], queryFn: getAdmissions });
  const followupsQuery = useQuery({ queryKey: ["director", "admissions", "followups"], queryFn: getFollowups });
  const approvalsQuery = useQuery({ queryKey: ["director", "admissions", "approvals"], queryFn: getApprovals });

  const leads = leadsQuery.data ?? [];
  const admissions = admissionsQuery.data ?? [];
  const followups = followupsQuery.data ?? [];
  const approvals = approvalsQuery.data ?? [];

  const activeLeads = leads.filter((lead) => lead.status !== "ENROLLED" && lead.status !== "LOST");
  const readyForAdmission = activeLeads.filter((lead) => hasNote(lead, "Ready For Admission"));
  const documentsPending = activeLeads.filter((lead) => hasNote(lead, "Documents: PENDING") || !hasNote(lead, "Documents: VERIFIED"));
  const feesPending = activeLeads.filter((lead) => hasNote(lead, "Fees: PENDING") || (!hasNote(lead, "Fees: PAID") && !hasNote(lead, "Fees: APPROVED")));
  const batchPending = activeLeads.filter((lead) => hasNote(lead, "Batch Allocation: PENDING") || hasNote(lead, "Ready For Admission"));
  const pendingApprovals = approvals.filter((approval) => approval.status === "PENDING");

  const statusCounts = useMemo(() => {
    const result = new Map<string, number>();
    for (const lead of leads) result.set(lead.status, (result.get(lead.status) ?? 0) + 1);
    return result;
  }, [leads]);

  const sourceCounts = useMemo(() => {
    const result = new Map<string, number>();
    for (const lead of leads) result.set(lead.source || "Unknown", (result.get(lead.source || "Unknown") ?? 0) + 1);
    return Array.from(result.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [leads]);

  const today = new Date().toISOString().slice(0, 10);
  const todayFollowups = followups.filter((followup) => followup.followUpDate?.slice(0, 10) === today);
  const isLoading = leadsQuery.isLoading || admissionsQuery.isLoading || followupsQuery.isLoading || approvalsQuery.isLoading;
  const isError = leadsQuery.isError || admissionsQuery.isError || followupsQuery.isError || approvalsQuery.isError;

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Director Admissions"
        title="Admission command center"
        description="Monitor every applicant from lead to documents, fees, batch allocation and student activation. AO still processes the admission; Director sees the whole pipeline."
        action={
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black text-[var(--navy)]" href="/dashboard/admission-cell">
              Open AO Processing
            </Link>
            <Link className="rounded-2xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--navy)]" href="/crm/leads">
              Open CRM Leads
            </Link>
          </div>
        }
      />

      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
          Admission data could not be loaded. Please check backend/API health.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total Leads" value={isLoading ? "..." : leads.length} />
        <StatCard label="Active Leads" value={isLoading ? "..." : activeLeads.length} />
        <StatCard label="Ready For Admission" value={isLoading ? "..." : readyForAdmission.length} />
        <StatCard label="Documents Pending" value={isLoading ? "..." : documentsPending.length} />
        <StatCard label="Fees Pending" value={isLoading ? "..." : feesPending.length} />
        <StatCard label="Activated Admissions" value={isLoading ? "..." : admissions.length} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Panel eyebrow="Pipeline" title="Admission flow status">
          <div className="grid gap-3 md:grid-cols-2">
            <PipelineCard icon={UserPlus} title="New Enquiries" value={statusCounts.get("NEW") ?? 0} text="BDE must contact and qualify." href="/crm/leads" />
            <PipelineCard icon={PhoneCall} title="Contacted" value={statusCounts.get("CONTACTED") ?? 0} text="Follow-up and counselling pending." href="/crm/followups" />
            <PipelineCard icon={ClipboardCheck} title="Counselling" value={statusCounts.get("COUNSELLING") ?? 0} text="Ready cases should move to AO." href="/crm/counselling" />
            <PipelineCard icon={CheckCircle2} title="Enrolled" value={statusCounts.get("ENROLLED") ?? admissions.length} text="Activated or converted students." href="/crm/admissions" />
          </div>
        </Panel>

        <Panel eyebrow="Action Needed" title="Director attention list">
          <div className="space-y-3">
            <AttentionRow icon={FileArchive} label="Documents pending" value={documentsPending.length} href="/dashboard/admission-cell#document-verification" />
            <AttentionRow icon={BadgeIndianRupee} label="Fees pending" value={feesPending.length} href="/dashboard/admission-cell#fees-enrollment" />
            <AttentionRow icon={Users} label="Batch allocation pending" value={batchPending.length} href="/dashboard/admission-cell#batch-allocation" />
            <AttentionRow icon={UserCheck} label="Admission approvals pending" value={pendingApprovals.length} href="/crm/admissions" />
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel eyebrow="Applications" title="Current admission queue">
          <div className="space-y-3">
            {activeLeads.slice(0, 8).map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
            {!activeLeads.length ? <EmptyState text="No active admission applications are waiting right now." /> : null}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel eyebrow="Follow-Up" title="Today's counselling actions">
            <div className="space-y-3">
              {todayFollowups.slice(0, 5).map((followup) => (
                <div key={followup.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                  <p className="font-black">{followup.lead?.fullName ?? "Lead"}</p>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{followup.remarks}</p>
                </div>
              ))}
              {!todayFollowups.length ? <EmptyState text="No follow-ups are scheduled for today." /> : null}
            </div>
          </Panel>

          <Panel eyebrow="Sources" title="Where leads are coming from">
            <div className="space-y-3">
              {sourceCounts.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
                  <span className="font-black">{source}</span>
                  <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-sm font-black">{count}</span>
                </div>
              ))}
              {!sourceCounts.length ? <EmptyState text="Lead source data appears after enquiries are captured." /> : null}
            </div>
          </Panel>
        </div>
      </section>
    </AcademicShell>
  );
}

function hasNote(lead: Lead, marker: string) {
  return lead.notes?.toLowerCase().includes(marker.toLowerCase()) ?? false;
}

function PipelineCard({ icon: Icon, title, value, text, href }: { icon: typeof UserPlus; title: string; value: number; text: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 transition hover:border-[var(--gold-border)] hover:bg-white">
      <Icon className="h-6 w-6 text-[var(--navy)]" />
      <p className="mt-4 text-sm font-black text-[var(--muted-blue)]">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
    </Link>
  );
}

function AttentionRow({ icon: Icon, label, value, href }: { icon: typeof AlertTriangle; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 transition hover:border-[var(--gold-border)] hover:bg-white">
      <span className="flex items-center gap-3 font-black">
        <Icon className="h-5 w-5 text-[var(--navy)]" />
        {label}
      </span>
      <span className={value > 0 ? "rounded-full bg-red-100 px-3 py-1 text-sm font-black text-red-700" : "rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800"}>{value}</span>
    </Link>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const ready = hasNote(lead, "Ready For Admission");
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-lg font-black">{lead.fullName}</p>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{lead.mobile} / {lead.email}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--navy)]">{lead.targetExam || "Program not selected"} from {lead.source || "Unknown source"}</p>
        </div>
        <span className={ready ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800" : "rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"}>
          {ready ? "Ready for AO" : lead.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
        <StatusPill label="Documents" active={hasNote(lead, "Documents: VERIFIED")} />
        <StatusPill label="Fees" active={hasNote(lead, "Fees: PAID") || hasNote(lead, "Fees: APPROVED")} />
        <StatusPill label="Batch" active={!hasNote(lead, "Batch Allocation: PENDING") && ready} />
      </div>
    </div>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={active ? "rounded-full bg-emerald-100 px-3 py-1 text-emerald-800" : "rounded-full bg-slate-100 px-3 py-1 text-slate-700"}>
      {label}: {active ? "Ready" : "Pending"}
    </span>
  );
}
