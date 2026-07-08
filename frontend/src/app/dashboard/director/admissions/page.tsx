"use client";

import Link from "next/link";
import { type ChangeEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BadgeIndianRupee, CheckCircle2, ClipboardCheck, FileArchive, FileUp, PhoneCall, UserCheck, UserPlus, Users } from "lucide-react";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "../academic/_components";
import { createBulkLeads, getAdmissions, getApprovals, getFollowups, getLeads } from "@/services/crm";
import type { BulkLeadInput, Lead } from "@/types/crm";

type Employee = { id: string; name: string; email: string; mobile?: string | null; role: string; roleMetadata?: Record<string, unknown> | null; isDisabled?: boolean };
type PreviewLead = BulkLeadInput & { rowId: string; warning?: string; assignedName?: string };

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Request failed");
  }
  return response.json() as Promise<T>;
}

export default function DirectorAdmissionsPage() {
  const queryClient = useQueryClient();
  const [bulkText, setBulkText] = useState("");
  const [bulkSource, setBulkSource] = useState("Director Import");
  const [bulkNote, setBulkNote] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewLead[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const leadsQuery = useQuery({ queryKey: ["director", "admissions", "leads"], queryFn: () => getLeads() });
  const admissionsQuery = useQuery({ queryKey: ["director", "admissions", "admissions"], queryFn: getAdmissions });
  const followupsQuery = useQuery({ queryKey: ["director", "admissions", "followups"], queryFn: getFollowups });
  const approvalsQuery = useQuery({ queryKey: ["director", "admissions", "approvals"], queryFn: getApprovals });
  const employeesQuery = useQuery({ queryKey: ["director", "admissions", "employees"], queryFn: () => apiJson<Employee[]>("/api/academy/employees") });

  const leads = leadsQuery.data ?? [];
  const admissions = admissionsQuery.data ?? [];
  const followups = followupsQuery.data ?? [];
  const approvals = approvalsQuery.data ?? [];
  const leadExecutives = useMemo(() => (employeesQuery.data ?? []).filter(isLeadExecutive), [employeesQuery.data]);

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
  const existingLeadKeys = useMemo(() => new Set(leads.flatMap((lead) => [lead.mobile, lead.email].filter((item): item is string => Boolean(item)).map((item) => item.toLowerCase()))), [leads]);
  const leadLoadByExecutive = useMemo(() => {
    const result = new Map<string, number>();
    for (const lead of leads) {
      if (!lead.assignedTo || !["NEW", "CONTACTED", "COUNSELLING"].includes(lead.status)) continue;
      result.set(lead.assignedTo, (result.get(lead.assignedTo) ?? 0) + 1);
    }
    return result;
  }, [leads]);

  const bulkMutation = useMutation({
    mutationFn: () => createBulkLeads({ leads: previewRows.map(({ rowId: _rowId, warning: _warning, assignedName: _assignedName, ...row }) => row), source: bulkSource, notes: bulkNote, allocationMode: "ROUND_ROBIN" }),
    onSuccess: async (result) => {
      setImportMessage(`Import complete: ${result.created} created, ${result.skipped} skipped, ${result.invalid} invalid.`);
      setPreviewRows([]);
      setBulkText("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["director", "admissions", "leads"] }),
        queryClient.invalidateQueries({ queryKey: ["crm", "leads"] }),
      ]);
    },
    onError: (error) => setImportMessage(error instanceof Error ? error.message : "Could not import leads."),
  });

  function preparePreview(text: string) {
    const parsed = parseLeadRows(text, bulkSource);
    const seen = new Set<string>();
    const previewLoads = new Map(leadLoadByExecutive);
    setPreviewRows(parsed.map((row, index) => {
      const keys = [row.mobile, row.email].filter((item): item is string => Boolean(item)).map((item) => item.toLowerCase());
      const duplicateInImport = keys.some((key) => seen.has(key));
      keys.forEach((key) => seen.add(key));
      const duplicateExisting = keys.some((key) => existingLeadKeys.has(key));
      const warning = duplicateInImport ? "Duplicate in this import" : duplicateExisting ? "Already exists in CRM" : undefined;
      const orderedExecutives = [...leadExecutives].sort((a, b) => (previewLoads.get(a.id) ?? 0) - (previewLoads.get(b.id) ?? 0) || a.name.localeCompare(b.name));
      const assignee = orderedExecutives.length ? orderedExecutives[index % orderedExecutives.length] : null;
      if (assignee && !warning) previewLoads.set(assignee.id, (previewLoads.get(assignee.id) ?? 0) + 1);
      return { ...row, assignedTo: assignee?.id, assignedName: assignee?.name || "Unassigned", rowId: `${row.mobile}-${index}`, warning };
    }));
    setImportMessage(parsed.length ? `${parsed.length} lead(s) ready for preview. ${leadExecutives.length ? `Round robin across ${leadExecutives.length} BDE(s).` : "No BDE found; leads will remain unassigned."}` : "No valid leads found. Use: Name, Mobile, Course, Email(optional), Source(optional).");
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setBulkText(text);
    preparePreview(text);
  }

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

      <Panel eyebrow="Lead Management" title="Bulk import and auto-allocate leads">
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <p className="text-sm font-black text-[var(--navy)]">Round robin allocation</p>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">
                {leadExecutives.length ? `${leadExecutives.length} active BDE/telecaller account(s) available. Preview shows the assigned person before publishing.` : "No active BDE/telecaller account found. Create a BDE from Director Management before bulk allocation."}
              </p>
              {leadExecutives.length ? <p className="mt-2 text-xs font-black text-[var(--navy)]">{leadExecutives.map((item) => item.name).join(" / ")}</p> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-[var(--navy)]">
                Lead source
                <input value={bulkSource} onChange={(event) => setBulkSource(event.target.value)} className="min-h-12 rounded-2xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--gold-border)]" />
              </label>
              <label className="grid gap-2 text-sm font-black text-[var(--navy)]">
                Common note
                <input value={bulkNote} onChange={(event) => setBulkNote(event.target.value)} placeholder="Campaign, school visit, fair..." className="min-h-12 rounded-2xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--gold-border)]" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-black text-[var(--navy)]">
              Paste leads
              <textarea
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                rows={8}
                placeholder={"One lead per line:\nRahul Nair, 9876543210, NDA\nAkhil P, 9846000000, CDS, akhil@email.com, School Campaign"}
                className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm outline-none focus:border-[var(--gold-border)]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => preparePreview(bulkText)} className="rounded-2xl bg-[var(--navy)] px-5 py-3 text-sm font-black text-white">Preview Leads</button>
              <label className="inline-flex cursor-pointer items-center rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-black text-[var(--navy)]">
                <FileUp className="mr-2 h-4 w-4" /> Upload CSV/TXT
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
              <button type="button" onClick={() => bulkMutation.mutate()} disabled={!previewRows.length || bulkMutation.isPending} className="rounded-2xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--navy)] disabled:opacity-50">
                {bulkMutation.isPending ? "Publishing..." : "Publish to CRM"}
              </button>
            </div>
            {importMessage ? <p className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black text-[var(--navy)]">{importMessage}</p> : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="font-black">Preview</span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{previewRows.length} lead(s)</span>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-[var(--page-bg)] text-xs uppercase tracking-[0.15em] text-[var(--muted-blue)]">
                  <tr><th className="p-3">Name</th><th className="p-3">Mobile</th><th className="p-3">Course</th><th className="p-3">Assigned BDE</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.rowId} className="border-t border-[var(--border)]">
                      <td className="p-3 font-black">{row.fullName}</td>
                      <td className="p-3">{row.mobile}</td>
                      <td className="p-3">{row.targetExam}</td>
                      <td className="p-3">{row.assignedName || "Unassigned"}</td>
                      <td className="p-3"><span className={row.warning ? "rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800" : "rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800"}>{row.warning || "Ready"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!previewRows.length ? <div className="p-4"><EmptyState text="Paste or upload leads, then preview before publishing." /></div> : null}
            </div>
          </div>
        </div>
      </Panel>

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

function parseLeadRows(text: string, fallbackSource: string): BulkLeadInput[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/,|\t/).map((cell) => cell.trim()))
    .map(([fullName, mobile, targetExam, email, source, ...noteParts]) => ({
      fullName: fullName || "",
      mobile: mobile || "",
      targetExam: targetExam || "",
      email: email?.includes("@") ? email : "",
      source: source || fallbackSource || "Director Import",
      notes: noteParts.join(" ").trim(),
    }))
    .filter((lead) => lead.fullName && lead.mobile && lead.targetExam);
}

function isLeadExecutive(employee: Employee) {
  const metadata = employee.roleMetadata ?? {};
  const status = typeof metadata.status === "string" ? metadata.status : "";
  const template = typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate.toUpperCase() : "";
  return (
    !employee.isDisabled &&
    status !== "ARCHIVED" &&
    (
      employee.role === "BUSINESS_DEVELOPMENT_EXECUTIVE" ||
      employee.role === "TELECALLER" ||
      employee.role === "MARKETING_COORDINATOR" ||
      template === "LEAD_SUPPORT"
    )
  );
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
