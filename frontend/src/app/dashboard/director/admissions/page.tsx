"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeIndianRupee, CalendarClock, CheckCircle2, ClipboardCheck, FileArchive, GraduationCap, ShieldCheck, UserCheck, UserPlus } from "lucide-react";
import { AdmissionAutomationPanel, AdmissionDocumentsPanel, AdmissionJourneyBanner, AdmissionRoleActions } from "@/components/admission/admission-journey-workspace";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { getAdmissions, getApprovals, getFollowups, getLeads } from "@/services/crm";
import type { Admission, Lead } from "@/types/crm";

function hasNote(lead: Lead, text: string) {
  return String(lead.notes || "").toLowerCase().includes(text.toLowerCase());
}

function isToday(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function branchLabel(admission: Admission) {
  return admission.branchId || admission.instituteId || "Main Branch";
}

export default function DirectorAdmissionsPage() {
  const leadsQuery = useQuery({ queryKey: ["director", "admission-journey", "leads"], queryFn: () => getLeads() });
  const admissionsQuery = useQuery({ queryKey: ["director", "admission-journey", "admissions"], queryFn: getAdmissions });
  const approvalsQuery = useQuery({ queryKey: ["director", "admission-journey", "approvals"], queryFn: getApprovals });
  const followupsQuery = useQuery({ queryKey: ["director", "admission-journey", "followups"], queryFn: getFollowups });

  const leads = leadsQuery.data ?? [];
  const admissions = admissionsQuery.data ?? [];
  const approvals = approvalsQuery.data ?? [];
  const followups = followupsQuery.data ?? [];
  const activeLeads = leads.filter((lead) => lead.status !== "ENROLLED" && lead.status !== "LOST");
  const applications = activeLeads.filter((lead) => hasNote(lead, "application") || hasNote(lead, "Ready For Admission") || lead.status === "COUNSELLING");
  const pendingDocuments = applications.filter((lead) => !hasNote(lead, "DOCUMENTS: VERIFIED"));
  const feesPending = activeLeads.filter((lead) => hasNote(lead, "Fees: PENDING") || (!hasNote(lead, "Fees: PAID") && !hasNote(lead, "Fees: APPROVED")));
  const pendingApprovals = approvals.filter((approval) => approval.status === "PENDING");
  const todayFollowups = followups.filter((item) => isToday(item.followUpDate) && item.status !== "COMPLETED");
  const todayAdmissions = admissions.filter((admission) => isToday(admission.admissionDate));
  const conversion = leads.length ? Math.round((admissions.length / leads.length) * 100) : 0;
  const revenueForecast = applications.reduce((sum, lead) => {
    const match = String(lead.notes || "").match(/total=([0-9.]+)/i);
    return sum + Number(match?.[1] || 0);
  }, 0);
  const branchMap = new Map<string, number>();
  admissions.forEach((admission) => branchMap.set(branchLabel(admission), (branchMap.get(branchLabel(admission)) ?? 0) + 1));
  const branchRows = Array.from(branchMap.entries()).map(([branch, count]) => ({ branch, count }));
  const visibleApplications = (applications.length ? applications : activeLeads).slice(0, 8);
  const loading = leadsQuery.isLoading || admissionsQuery.isLoading || approvalsQuery.isLoading || followupsQuery.isLoading;

  return (
    <WorkspaceDashboard
      roleTitle="Director Admissions"
      greeting="Admission Overview"
      subtitle="Lead, follow-up, counselling, application, approval, fee, batch allocation and activation in one journey."
      focus={[
        { label: "Today's Admissions", title: loading ? "..." : todayAdmissions.length, detail: "Admissions completed today.", href: "/dashboard/admission-cell#students", icon: GraduationCap, tone: todayAdmissions.length ? "success" : "default" },
        { label: "Pending Approvals", title: loading ? "..." : pendingApprovals.length, detail: "Admissions or concessions waiting for review.", href: "/crm/admissions", icon: ShieldCheck, tone: pendingApprovals.length ? "warning" : "success" },
        { label: "Revenue Forecast", title: loading ? "..." : `Rs ${revenueForecast.toLocaleString("en-IN")}`, detail: "Expected value from application fee notes.", href: "/dashboard/director/accounts", icon: BadgeIndianRupee, tone: revenueForecast ? "info" : "default" },
      ]}
      actions={[
        { label: "Admission Cell", href: "/dashboard/admission-cell#today", icon: ClipboardCheck },
        { label: "Leads", href: "/crm/leads", icon: UserPlus },
        { label: "Follow-ups", href: "/crm/followups", icon: CalendarClock },
        { label: "Counselling", href: "/crm/counselling", icon: UserCheck },
        { label: "Documents", href: "/dashboard/admission-cell#documents", icon: FileArchive },
        { label: "Approvals", href: "/crm/admissions", icon: CheckCircle2 },
      ]}
      metrics={[
        { label: "Active Leads", value: loading ? "..." : activeLeads.length },
        { label: "Conversion", value: loading ? "..." : `${conversion}%`, tone: conversion >= 25 ? "success" : "warning" },
        { label: "Pending Documents", value: loading ? "..." : pendingDocuments.length, tone: pendingDocuments.length ? "warning" : "success" },
        { label: "Payments Pending", value: loading ? "..." : feesPending.length, tone: feesPending.length ? "warning" : "success" },
      ]}
      activity={visibleApplications.slice(0, 5).map((lead) => ({ title: lead.fullName, detail: `${lead.targetExam} / ${lead.mobile}`, href: "/dashboard/admission-cell#applications", meta: lead.status }))}
      upcoming={[
        { title: "Today's follow-ups", detail: `${todayFollowups.length} lead follow-up(s) scheduled today.`, href: "/crm/followups", meta: "Follow-up" },
        { title: "Branch-wise admissions", detail: branchRows.length ? branchRows.map((row) => `${row.branch}: ${row.count}`).join(" / ") : "No branch admission split yet.", href: "/crm/admissions", meta: "Branch" },
        { title: "Pending approvals", detail: `${pendingApprovals.length} approval request(s) waiting.`, href: "/crm/admissions", meta: "Approval" },
      ]}
    >
      <AdmissionJourneyBanner
        role="DIRECTOR"
        metrics={[
          { label: "Admission Overview", value: admissions.length },
          { label: "Today's Admissions", value: todayAdmissions.length },
          { label: "Conversion", value: `${conversion}%`, tone: conversion >= 25 ? "success" : "warning" },
          { label: "Revenue Forecast", value: `Rs ${revenueForecast.toLocaleString("en-IN")}` },
        ]}
      />
      <AdmissionRoleActions role="DIRECTOR" />
      <section className="grid gap-5 xl:grid-cols-2">
        <AdmissionAutomationPanel />
        <AdmissionDocumentsPanel />
      </section>
      <section className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-5 shadow-[var(--ds-shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="ds-text-label text-[var(--ds-color-primary)]">Applicant Queue</p>
            <h2 className="mt-1 text-xl font-black">Open applicant and take action</h2>
          </div>
          <Link href="/dashboard/admission-cell#applications" className="rounded-[var(--ds-radius-large)] bg-[var(--ds-color-primary)] px-4 py-3 text-sm font-black text-[var(--ds-color-primary-foreground)]">Open AO Desk</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleApplications.map((lead) => (
            <article key={lead.id} className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-muted-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">{lead.fullName}</h3>
                  <p className="mt-1 text-sm text-[var(--ds-color-muted)]">{lead.targetExam} / {lead.mobile}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{lead.status}</span>
              </div>
              <div className="mt-4 grid gap-2">
                <Link href="/dashboard/admission-cell#applications" className="rounded-xl border border-[var(--ds-color-border)] bg-white px-3 py-2 text-center text-xs font-black">Application</Link>
                <Link href="/dashboard/admission-cell#fees" className="rounded-xl border border-[var(--ds-color-border)] bg-white px-3 py-2 text-center text-xs font-black">Fee</Link>
                <Link href="/dashboard/admission-cell#activation" className="rounded-xl bg-[var(--ds-color-primary)] px-3 py-2 text-center text-xs font-black text-[var(--ds-color-primary-foreground)]">Activate</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </WorkspaceDashboard>
  );
}
