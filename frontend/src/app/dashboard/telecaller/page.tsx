"use client";

import { motion } from "framer-motion";
import { ActivityTimeline, AnnouncementCard, DashboardError, DashboardSkeleton, QuickActionCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useTelecallerDashboard } from "@/hooks/use-dashboard";

const callFlow = [
  { title: "Call", description: "Open New Leads. Call the parent or student.", tag: "1" },
  { title: "Write Note", description: "Write what they said after the call.", tag: "2" },
  { title: "Book Counselling", description: "If interested, book a counselling time.", tag: "3" },
  { title: "Send to Admission Cell", description: "If confirmed, hand over to Admission Cell for fees, documents, and approval.", tag: "4" }
];

const dailyButtons = [
  { title: "1. Call New Leads", description: "Start here every morning. Call people who enquired.", href: "/crm/leads" },
  { title: "2. Today's Follow-ups", description: "Call people who asked us to call later.", href: "/crm/followups" },
  { title: "3. Book Counselling", description: "Fix counselling for interested parents and students.", href: "/crm/counselling" },
  { title: "4. Send Confirmed Admission to Admission Cell", description: "When they say yes, send the case to Admission Cell.", href: "/crm/admissions" }
];

export default function TelecallerDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useTelecallerDashboard();

  if (isLoading) return <RoleDashboardGuard role="TELECALLER"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="TELECALLER"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;
  const focusAreas = data.customDashboard.focusAreas.length ? data.customDashboard.focusAreas : ["New leads", "Follow-ups", "Counselling", "Admissions"];

  return (
    <RoleDashboardGuard role="TELECALLER">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Student Support Desk"
          title="Call. Note. Follow up. Send to Admission Cell."
          description="A simple daily desk for enquiries, phone calls, counselling booking, and confirmed admission handover to Admission Cell."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.leadPipeline.new), label: "new leads" },
            { value: String(data.scheduling.callbacksToday), label: "call today" },
            { value: String(data.scheduling.overdueFollowUps), label: "late follow-up" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Call First" value={String(data.leadPipeline.new)} note="New enquiries waiting" />
          <StatCard label="Call Again" value={String(data.scheduling.callbacksToday)} note="Follow-ups for today" />
          <StatCard label="Admission Cell" value={String(data.leadPipeline.enrolled)} note="Confirmed admission cases" />
        </section>

        <SectionHeader eyebrow="Daily Work" title="Use these 4 buttons" />
        <section className="grid gap-4 md:grid-cols-4">
          {dailyButtons.map((item) => <QuickActionCard key={item.title} title={item.title} description={item.description} href={item.href} />)}
        </section>

        <SectionHeader eyebrow="How to Work" title="Simple call flow" />
        <section className="grid gap-4 md:grid-cols-4">
          {callFlow.map((item) => <AnnouncementCard key={item.title} title={item.title} description={item.description} tag={item.tag} />)}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">When Parent Says Yes</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">Send confirmed admission to Admission Cell</h2>
            <p className="mt-3 text-sm leading-7 text-[#40516a]">Open Applications, update the confirmed case, and Admission Cell will continue fee collection, documents, and final approval.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="/crm/admissions">Send to Admission Cell</Button>
              <Button href="/messages" variant="secondary">Message Admission Cell</Button>
            </div>
          </div>
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">What to Say</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Simple call script</h2>
            <div className="mt-5 grid gap-3">
              {data.aiCallScripts.map((item) => <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>)}
            </div>
          </div>
        </section>

        <SectionHeader eyebrow="Today's Reminder" title="Important work" action={data.customDashboard.department} />
        <section className="grid gap-4 md:grid-cols-4">
          {focusAreas.map((area) => (
            <AnnouncementCard key={area} title={area} description="Check this and close the pending work today." tag="Daily" />
          ))}
        </section>

        <ActivityTimeline title="What this dashboard is for" items={data.modules} />
      </motion.div>
    </RoleDashboardGuard>
  );
}
