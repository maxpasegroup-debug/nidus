"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeIndianRupee, CheckCircle2, ClipboardCheck, FileCheck2, FilePlus2, PenLine, PhoneCall, UserCheck, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAdmissions, getApprovals, getFollowups, getLeads } from "@/services/crm";
import type { Lead } from "@/types/crm";

type ActionCard = {
  title: string;
  note: string;
  href: string;
  icon: LucideIcon;
  value?: string | number;
};

function hasNote(lead: Lead, text: string) {
  return String(lead.notes || "").toLowerCase().includes(text.toLowerCase());
}

export default function DirectorAdmissionsPage() {
  const leadsQuery = useQuery({ queryKey: ["director", "simple-admissions", "leads"], queryFn: () => getLeads() });
  const admissionsQuery = useQuery({ queryKey: ["director", "simple-admissions", "admissions"], queryFn: getAdmissions });
  const followupsQuery = useQuery({ queryKey: ["director", "simple-admissions", "followups"], queryFn: getFollowups });
  const approvalsQuery = useQuery({ queryKey: ["director", "simple-admissions", "approvals"], queryFn: getApprovals });

  const leads = leadsQuery.data ?? [];
  const admissions = admissionsQuery.data ?? [];
  const followups = followupsQuery.data ?? [];
  const approvals = approvalsQuery.data ?? [];
  const activeLeads = leads.filter((lead) => lead.status !== "ENROLLED" && lead.status !== "LOST");
  const applications = activeLeads.filter((lead) => hasNote(lead, "application") || hasNote(lead, "Ready For Admission") || lead.status === "COUNSELLING");
  const documentsPending = activeLeads.filter((lead) => hasNote(lead, "Documents: PENDING") || !hasNote(lead, "Documents: VERIFIED"));
  const feesPending = activeLeads.filter((lead) => hasNote(lead, "Fees: PENDING") || (!hasNote(lead, "Fees: PAID") && !hasNote(lead, "Fees: APPROVED")));
  const pendingApprovals = approvals.filter((approval) => approval.status === "PENDING");
  const today = new Date().toISOString().slice(0, 10);
  const todayFollowups = followups.filter((followup) => followup.followUpDate?.slice(0, 10) === today);
  const loading = leadsQuery.isLoading || admissionsQuery.isLoading || followupsQuery.isLoading || approvalsQuery.isLoading;

  const actions: ActionCard[] = [
    { title: "Leads", note: "New enquiries and follow-ups", href: "/crm/leads", icon: PhoneCall, value: leads.length },
    { title: "Applications", note: "Open and verify applicant files", href: "/dashboard/admission-cell#applications", icon: ClipboardCheck, value: applications.length },
    { title: "Admissions", note: "Activated/admitted students", href: "/crm/admissions", icon: UserCheck, value: admissions.length },
    { title: "Add Application", note: "Create or open AO intake", href: "/dashboard/admission-cell#applications", icon: FilePlus2 },
    { title: "Verify Documents", note: "Check uploads and request changes", href: "/dashboard/admission-cell#documents", icon: FileCheck2, value: documentsPending.length },
    { title: "Record Payment", note: "Enter fee and receipt details", href: "/dashboard/admission-cell#fees", icon: BadgeIndianRupee, value: feesPending.length },
    { title: "Approve & Sign", note: "Approve after payment verification", href: "/crm/admissions", icon: PenLine, value: pendingApprovals.length },
    { title: "Activate Student", note: "Allocate batch and open dashboard", href: "/dashboard/admission-cell#activation", icon: CheckCircle2 },
  ];

  const visibleApplications = useMemo(() => (applications.length ? applications : activeLeads).slice(0, 8), [activeLeads, applications]);

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-5 text-[var(--navy)] md:px-6">
      <section className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Admissions</p>
              <h1 className="mt-2 text-3xl font-black">Simple admission desk</h1>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[520px]">
              <Metric label="Applications" value={loading ? "..." : applications.length} />
              <Metric label="Follow-ups Today" value={loading ? "..." : todayFollowups.length} />
              <Metric label="Approvals" value={loading ? "..." : pendingApprovals.length} />
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => <ActionTile key={action.title} action={action} />)}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Applications</p>
              <h2 className="mt-1 text-2xl font-black">Open applicant and take action</h2>
            </div>
            <Link href="/dashboard/admission-cell#applications" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Open AO Desk</Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {visibleApplications.map((lead) => (
              <article key={lead.id} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{lead.fullName}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{lead.targetExam} / {lead.mobile}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{lead.status}</span>
                </div>
                <div className="mt-4 grid gap-2">
                  <Link href="/dashboard/admission-cell#applications" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-xs font-black">Open Application</Link>
                  <Link href="/dashboard/admission-cell#documents" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-xs font-black">Verify Documents</Link>
                  <Link href="/dashboard/admission-cell#fees" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-xs font-black">Record Payment</Link>
                  <Link href="/crm/admissions" className="rounded-xl bg-slate-950 px-3 py-2 text-center text-xs font-black text-white">Approve / Sign</Link>
                </div>
              </article>
            ))}
            {!visibleApplications.length ? <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-blue)]">No active applications are waiting right now.</div> : null}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function ActionTile({ action }: { action: ActionCard }) {
  const Icon = action.icon;
  return (
    <Link href={action.href} className="relative flex min-h-32 flex-col justify-between rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]">
      {typeof action.value !== "undefined" ? <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700">{action.value}</span> : null}
      <Icon className="h-6 w-6 text-[var(--gold)]" />
      <div>
        <h3 className="text-lg font-black">{action.title}</h3>
        <p className="mt-1 text-sm leading-5 text-[var(--muted-blue)]">{action.note}</p>
      </div>
    </Link>
  );
}
