"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, Handshake, LayoutDashboard, ListChecks, Users } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdmissionCard, CounsellingCard, CRMEmptyState, CRMStatCard, FollowupTimeline, LeadCard, ReferralCard, StatusPill } from "@/components/crm/crm-components";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdmissions, useCounselling, useFollowups, useLeads, useReferrals } from "@/hooks/use-crm";
import type { Lead, LeadStatus } from "@/types/crm";

type CRMView = "dashboard" | "leads" | "followups" | "admissions" | "counselling" | "referrals";

const links = [
  ["/crm", "Dashboard", LayoutDashboard],
  ["/crm/leads", "Leads", Users],
  ["/crm/followups", "Followups", CalendarDays],
  ["/crm/admissions", "Admissions", ListChecks],
  ["/crm/counselling", "Counselling", Handshake],
  ["/crm/referrals", "Referrals", Handshake]
] as const;

const statusFlow: LeadStatus[] = ["NEW", "CONTACTED", "COUNSELLING", "ENROLLED", "LOST"];

function value(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function CRMConsole({ view }: { view: CRMView }) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<LeadStatus | undefined>();
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const leads = useLeads({ status, search: search || undefined });
  const followups = useFollowups();
  const admissions = useAdmissions();
  const counselling = useCounselling();
  const referrals = useReferrals();
  const leadData = leads.data ?? [];
  const followupData = followups.data ?? [];
  const admissionData = admissions.data ?? [];
  const counsellingData = counselling.data ?? [];
  const referralData = referrals.data ?? [];
  const approvalData = admissions.approvals.data ?? [];

  useEffect(() => setMounted(true), []);

  const sourceData = useMemo(() => Object.entries(leadData.reduce<Record<string, number>>((acc, lead) => ({ ...acc, [lead.source]: (acc[lead.source] ?? 0) + 1 }), {})).map(([name, value]) => ({ name, value })), [leadData]);
  const funnelData = statusFlow.map((name) => ({ name, value: leadData.filter((lead) => lead.status === name).length }));
  const revenue = admissionData.reduce((sum, item) => sum + (item.course?.price ?? 0), 0);
  const conversion = leadData.length ? Math.round((leadData.filter((lead) => lead.status === "ENROLLED").length / leadData.length) * 100) : 0;
  const monthlyAdmissions = admissionData.map((item, index) => ({ label: new Date(item.admissionDate).toLocaleDateString(undefined, { month: "short" }), admissions: index + 1, revenue: item.course?.price ?? 0 }));

  return (
    <motion.div className="space-y-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">NIDUS Growth Command</p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">CRM, Admissions & Lead Management</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">A military-clean sales cockpit for leads, counselling, follow-ups, referrals, admissions and revenue tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2">{links.map(([href, label, Icon]) => <Link key={href} href={href} className="inline-flex h-10 items-center gap-2 rounded border border-white/10 px-3 text-sm text-ink transition hover:border-gold/50 hover:text-gold"><Icon className="h-4 w-4" />{label}</Link>)}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <CRMStatCard label="Total Leads" value={String(leadData.length)} note="Filtered lead pipeline" icon="lead" />
        <CRMStatCard label="Conversion Rate" value={`${conversion}%`} note="Enrolled against visible leads" icon="win" />
        <CRMStatCard label="Revenue Overview" value={`Rs ${Math.round(revenue).toLocaleString()}`} note="Course price sum from admissions" icon="money" />
        <CRMStatCard label="New Admissions" value={String(admissionData.length)} note="Admission records tracked" icon="calendar" />
      </section>

      {view === "dashboard" ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card className="p-5"><h3 className="mb-4 font-bold text-white">Source Performance</h3><div className="h-64">{mounted ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceData} dataKey="value" outerRadius={90}>{sourceData.map((entry, index) => <Cell key={entry.name} fill={index % 2 ? "#2dd4bf" : "#c9a646"} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}</div></Card>
          <FollowupTimeline items={followupData.slice(0, 5)} />
          <Card className="p-5"><h3 className="mb-4 font-bold text-white">Conversion Funnel</h3><div className="h-64">{mounted ? <ResponsiveContainer width="100%" height="100%"><FunnelChart><Tooltip /><Funnel dataKey="value" data={funnelData} fill="#c9a646" /></FunnelChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}</div></Card>
          <Card className="p-5"><h3 className="mb-4 font-bold text-white">Monthly Admissions</h3><div className="h-64">{mounted ? <ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyAdmissions}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#9fb0c7" /><YAxis stroke="#9fb0c7" /><Tooltip /><Line dataKey="admissions" stroke="#f2d675" strokeWidth={3} /></LineChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}</div></Card>
        </section>
      ) : null}

      {view === "leads" ? (
        <section className="space-y-4">
          <Card className="p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input label="Search leads" value={search} onChange={(event) => setSearch(event.target.value)} /><label className="block"><span className="text-sm font-medium text-ink">Status</span><select className="mt-2 h-12 w-full rounded border border-white/12 bg-navy px-3 text-sm text-white" value={status ?? ""} onChange={(event) => setStatus(event.target.value ? event.target.value as LeadStatus : undefined)}><option value="">All</option>{statusFlow.map((item) => <option key={item}>{item}</option>)}</select></label></div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Create Lead</h2>
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; leads.create.mutate({ fullName: value(form, "fullName"), mobile: value(form, "mobile"), email: value(form, "email"), targetExam: value(form, "targetExam"), source: value(form, "source"), status: value(form, "status") as LeadStatus, assignedTo: value(form, "assignedTo") || undefined, notes: value(form, "notes") }); form.reset(); }}>
              <FormGrid><Input name="fullName" label="Full Name" required /><Input name="mobile" label="Mobile" required /><Input name="email" label="Email" type="email" required /><Input name="targetExam" label="Target Exam" required /><Input name="source" label="Source" required /><Input name="status" label="Status" defaultValue="NEW" required /><Input name="assignedTo" label="Assigned User ID" /><Input name="notes" label="Notes" /></FormGrid>
              <div className="mt-4"><Button size="sm" disabled={leads.create.isPending}>{leads.create.isPending ? "Saving..." : "Add Lead"}</Button></div>
            </form>
          </Card>
          <div className="table-scroll rounded-lg border border-white/10"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/8 text-muted"><tr><th className="p-3">Lead</th><th>Contact</th><th>Exam</th><th>Source</th><th>Status</th><th>Action</th></tr></thead><tbody>{leadData.map((lead) => <tr key={lead.id} className="border-t border-white/10"><td className="p-3 font-semibold text-white">{lead.fullName}</td><td className="text-ink">{lead.mobile}<br />{lead.email}</td><td>{lead.targetExam}</td><td>{lead.source}</td><td><StatusPill value={lead.status} /></td><td><button className="text-gold" onClick={() => setSelectedLead(lead)}>Open</button></td></tr>)}</tbody></table></div>
          {selectedLead ? <div className="fixed inset-y-0 right-0 z-40 w-[min(420px,100vw)] border-l border-white/10 bg-navy-deep p-6 shadow-2xl"><button className="mb-5 text-sm text-gold" onClick={() => setSelectedLead(null)}>Close</button><LeadCard lead={selectedLead} onAdvance={() => leads.update.mutate({ id: selectedLead.id, status: "CONTACTED" })} /><p className="mt-5 text-sm leading-6 text-muted">{selectedLead.notes || "No notes captured yet."}</p></div> : null}
        </section>
      ) : null}

      {view === "followups" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Schedule Followup</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; followups.create.mutate({ leadId: value(form, "leadId"), followUpDate: value(form, "followUpDate"), remarks: value(form, "remarks"), status: value(form, "status") }); }}><FormGrid><Input name="leadId" label="Lead ID" required /><Input name="followUpDate" label="Follow-up Date" type="datetime-local" required /><Input name="remarks" label="Remarks" required /><Input name="status" label="Status" defaultValue="PENDING" required /></FormGrid><div className="mt-4"><Button size="sm">Schedule</Button></div></form></Card>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1fr]"><FollowupTimeline items={followupData} /><Card className="p-5"><h3 className="mb-4 font-bold text-white">Calendar View</h3><div className="grid grid-cols-7 gap-2 text-center text-xs text-muted">{Array.from({ length: 35 }).map((_, index) => <span key={index} className="rounded border border-white/10 p-3">{index + 1}</span>)}</div></Card></div>
        </section>
      ) : null}

      {view === "admissions" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Admission Tracking</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; admissions.create.mutate({ leadId: value(form, "leadId") || undefined, studentId: value(form, "studentId"), courseId: value(form, "courseId"), admissionDate: value(form, "admissionDate"), paymentStatus: value(form, "paymentStatus"), batch: value(form, "batch"), admissionMode: value(form, "admissionMode") as "ONLINE" | "MANUAL", instituteId: value(form, "instituteId") || undefined, branchId: value(form, "branchId") || undefined, totalFee: Number(value(form, "totalFee") || 0), remarks: value(form, "remarks") || undefined }); }}><FormGrid><Input name="leadId" label="Lead ID" /><Input name="studentId" label="Student ID" required /><Input name="courseId" label="Course ID" required /><Input name="admissionDate" label="Admission Date" type="date" required /><Input name="paymentStatus" label="Payment Status" defaultValue="PENDING" required /><Input name="batch" label="Batch" required /><Input name="admissionMode" label="Mode" defaultValue="MANUAL" /><Input name="totalFee" label="Total Fee" type="number" defaultValue="0" /><Input name="instituteId" label="Institute ID" /><Input name="branchId" label="Branch ID" /><Input name="remarks" label="Remarks" /></FormGrid><div className="mt-4"><Button size="sm">Submit Admission</Button></div></form></Card>
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Approval Queue</h2><div className="grid gap-3">{approvalData.slice(0, 6).map((approval) => <div key={approval.id} className="rounded border border-white/10 p-3"><p className="font-semibold text-white">{approval.type} - {approval.status}</p><p className="text-sm text-muted">{approval.reason ?? approval.targetType}</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => admissions.approve.mutate({ id: approval.admission?.id ?? approval.targetId ?? "", approved: true, remarks: "Approved from CRM console" })}>Approve</Button><Button size="sm" variant="secondary" onClick={() => admissions.approve.mutate({ id: approval.admission?.id ?? approval.targetId ?? "", approved: false, remarks: "Rejected from CRM console" })}>Reject</Button></div></div>)}</div></Card>
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Scholarship / Discount Request</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; admissions.scholarship.mutate({ studentId: value(form, "studentId"), admissionId: value(form, "admissionId") || undefined, type: value(form, "type") as "SCHOLARSHIP" | "DISCOUNT" | "FEE_WAIVER", title: value(form, "title"), amount: Number(value(form, "amount")), reason: value(form, "reason") || undefined }); }}><FormGrid><Input name="studentId" label="Student ID" required /><Input name="admissionId" label="Admission ID" /><Input name="type" label="Type" defaultValue="DISCOUNT" required /><Input name="title" label="Title" required /><Input name="amount" label="Amount" type="number" required /><Input name="reason" label="Reason" /></FormGrid><div className="mt-4"><Button size="sm">Request Approval</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{admissionData.length ? admissionData.map((item) => <AdmissionCard key={item.id} admission={item} />) : <CRMEmptyState title="No admissions" note="Admission records will appear here." />}</div>
        </section>
      ) : null}

      {view === "counselling" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Counsellor Schedule</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; counselling.create.mutate({ leadId: value(form, "leadId"), counsellorName: value(form, "counsellorName"), bookingDate: value(form, "bookingDate"), mode: value(form, "mode") as "ONLINE" | "OFFLINE", status: value(form, "status") }); }}><FormGrid><Input name="leadId" label="Lead ID" required /><Input name="counsellorName" label="Counsellor Name" required /><Input name="bookingDate" label="Booking Date" type="datetime-local" required /><Input name="mode" label="Mode" defaultValue="ONLINE" required /><Input name="status" label="Status" defaultValue="SCHEDULED" required /></FormGrid><div className="mt-4"><Button size="sm">Book Session</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{counsellingData.map((item) => <CounsellingCard key={item.id} booking={item} />)}</div>
        </section>
      ) : null}

      {view === "referrals" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Referral Tracking</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; referrals.create.mutate({ referrerUserId: value(form, "referrerUserId"), referredUserId: value(form, "referredUserId"), rewardStatus: value(form, "rewardStatus") }); }}><FormGrid><Input name="referrerUserId" label="Referrer User ID" required /><Input name="referredUserId" label="Referred User ID" required /><Input name="rewardStatus" label="Reward Status" defaultValue="PENDING" required /><Input label="Invite Link Placeholder" value="Coming soon" readOnly /></FormGrid><div className="mt-4"><Button size="sm">Track Referral</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{referralData.map((item) => <ReferralCard key={item.id} referral={item} />)}</div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><h3 className="mb-4 font-bold text-white">Enrollment Trends</h3><div className="h-56">{mounted ? <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyAdmissions}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#9fb0c7" /><YAxis stroke="#9fb0c7" /><Tooltip /><Bar dataKey="admissions" fill="#c9a646" /></BarChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}</div></Card>
        <Card className="p-5"><h3 className="mb-4 font-bold text-white">Course-wise Revenue</h3><div className="h-56">{mounted ? <ResponsiveContainer width="100%" height="100%"><BarChart data={admissionData.map((item) => ({ label: item.course?.title ?? item.courseId, revenue: item.course?.price ?? 0 }))}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#9fb0c7" /><YAxis stroke="#9fb0c7" /><Tooltip /><Bar dataKey="revenue" fill="#2dd4bf" /></BarChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}</div></Card>
      </section>
    </motion.div>
  );
}
