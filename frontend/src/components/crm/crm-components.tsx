"use client";

import { motion } from "framer-motion";
import { CalendarClock, IndianRupee, PhoneCall, ShieldCheck, Trophy, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Admission, CounsellingBooking, FollowUp, Lead, Referral } from "@/types/crm";

export function CRMEmptyState({ title, note }: { title: string; note: string }) {
  return <Card className="p-6 text-center text-sm text-muted"><p className="text-base font-bold text-ink">{title}</p><p className="mt-2">{note}</p></Card>;
}

export function CRMSkeleton() {
  return <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-lg border border-white/10 bg-white/8" />)}</div>;
}

export function CRMStatCard({ label, value, note, icon }: { label: string; value: string; note: string; icon?: "lead" | "money" | "calendar" | "win" }) {
  const Icon = icon === "money" ? IndianRupee : icon === "calendar" ? CalendarClock : icon === "win" ? Trophy : UserPlus;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted">{label}</p><Icon className="h-5 w-5 text-gold" /></div>
      <b className="mt-3 block text-3xl text-white">{value}</b>
      <p className="mt-2 text-xs text-muted">{note}</p>
    </Card>
  );
}

export function LeadCard({ lead, onSelect, onAdvance }: { lead: Lead; onSelect?: () => void; onAdvance?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="text-lg font-bold text-white">{lead.fullName}</h3><p className="text-sm text-muted">{lead.targetExam} - {lead.source}</p></div>
          <StatusPill value={lead.status} />
        </div>
        <div className="mt-4 grid gap-2 text-sm text-ink"><span>{lead.mobile}</span><span>{lead.email}</span><span>Owner: {lead.assignee?.name ?? lead.assignedTo ?? "Unassigned"}</span></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {onSelect ? <button className="rounded border border-gold/35 px-3 py-2 text-sm text-gold" onClick={onSelect}>Profile</button> : null}
          {onAdvance ? <button className="rounded border border-white/12 px-3 py-2 text-sm text-ink" onClick={onAdvance}>Quick action</button> : null}
        </div>
      </Card>
    </motion.div>
  );
}

export function FollowupTimeline({ items }: { items: FollowUp[] }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-lg font-bold text-white">Upcoming Followups</h3>
      <div className="space-y-4">
        {items.length ? items.map((item) => <div key={item.id} className="border-l-2 border-gold/50 pl-4"><p className="font-semibold text-ink">{item.lead?.fullName ?? item.leadId}</p><p className="text-sm text-muted">{new Date(item.followUpDate).toLocaleString()} - {item.status}</p><p className="mt-1 text-sm text-ink">{item.remarks}</p></div>) : <p className="text-sm text-muted">No reminders scheduled.</p>}
      </div>
    </Card>
  );
}

export function AdmissionCard({ admission }: { admission: Admission }) {
  return <Card className="p-5"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-white">{admission.student?.name ?? admission.studentId}</h3><p className="text-sm text-muted">{admission.course?.title ?? admission.courseId} - {admission.batch}</p></div><StatusPill value={admission.paymentStatus} /></div><p className="mt-4 text-sm text-ink">Admitted {new Date(admission.admissionDate).toLocaleDateString()}</p></Card>;
}

export function CounsellingCard({ booking }: { booking: CounsellingBooking }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{booking.lead?.fullName ?? booking.leadId}</h3><p className="text-sm text-muted">{booking.counsellorName} - {booking.mode}</p></div><PhoneCall className="h-5 w-5 text-gold" /></div><p className="mt-4 text-sm text-ink">{new Date(booking.bookingDate).toLocaleString()}</p><div className="mt-3"><StatusPill value={booking.status} /></div></Card>;
}

export function ReferralCard({ referral }: { referral: Referral }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{referral.referrer?.name ?? referral.referrerUserId}</h3><p className="text-sm text-muted">Referred {referral.referred?.name ?? referral.referredUserId}</p></div><ShieldCheck className="h-5 w-5 text-gold" /></div><p className="mt-4 text-sm text-ink">Reward: {referral.rewardStatus}</p></Card>;
}

export function StatusPill({ value }: { value: string }) {
  const tone = ["ENROLLED", "PAID", "COMPLETED", "APPROVED"].includes(value) ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100" : ["LOST", "FAILED", "REJECTED"].includes(value) ? "border-red-400/40 bg-red-400/15 text-red-100" : "border-gold/35 bg-gold/15 text-gold-soft";
  return <span className={`rounded border px-2 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
