"use client";

import { motion } from "framer-motion";
import { ActivityTimeline, AnnouncementCard, DashboardError, DashboardSkeleton, QuickActionCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useBusinessDevelopmentDashboard } from "@/hooks/use-dashboard";

const workFlow = [
  { title: "Capture Lead", description: "Open new leads and understand the student or parent requirement.", tag: "1" },
  { title: "Follow Up", description: "Call, WhatsApp, record notes, and move the lead to the right stage.", tag: "2" },
  { title: "Close Admission", description: "Book counselling, confirm interest, and complete the admission form.", tag: "3" },
  { title: "Send for Processing", description: "Send the case to Administrative Officer for fee collection, documents, and approval.", tag: "4" }
];

const dailyButtons = [
  { title: "1. New Leads", description: "Start with fresh enquiries from website, calls, WhatsApp and campaigns.", href: "/crm/leads" },
  { title: "2. Follow-ups", description: "Call people who asked us to contact later.", href: "/crm/followups" },
  { title: "3. Counselling", description: "Book counselling for interested parents and students.", href: "/crm/counselling" },
  { title: "4. Admissions", description: "Fill admission details and hand over confirmed cases.", href: "/crm/admissions" }
];

export default function BusinessDevelopmentDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useBusinessDevelopmentDashboard();

  if (isLoading) return <RoleDashboardGuard role={["TELECALLER", "MARKETING_COORDINATOR"]}><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role={["TELECALLER", "MARKETING_COORDINATOR"]}><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;
  const focusAreas = data.customDashboard.focusAreas.length ? data.customDashboard.focusAreas : ["New leads", "Follow-ups", "Counselling", "Admissions"];

  return (
    <RoleDashboardGuard role={["TELECALLER", "MARKETING_COORDINATOR"]}>
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Business Development Executive"
          title="Lead. Follow up. Close. Hand over."
          description="A simple daily sales desk for lead management, counselling booking, admission form filling, and handover to Administrative Officer for fee collection and final admission processing."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.leadPipeline.new), label: "new leads" },
            { value: String(data.scheduling.callbacksToday), label: "call today" },
            { value: String(data.scheduling.overdueFollowUps), label: "late follow-up" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="New Leads" value={String(data.leadPipeline.new)} note="Start here every day" />
          <StatCard label="Follow-ups" value={String(data.scheduling.callbacksToday)} note="Calls scheduled today" />
          <StatCard label="Admissions" value={String(data.leadPipeline.enrolled)} note="Confirmed cases sent forward" />
        </section>

        <SectionHeader eyebrow="Daily Work" title="Use these 4 buttons" />
        <section className="grid gap-4 md:grid-cols-4">
          {dailyButtons.map((item) => <QuickActionCard key={item.title} title={item.title} description={item.description} href={item.href} />)}
        </section>

        <SectionHeader eyebrow="Sales Flow" title="End-to-end admission work" />
        <section className="grid gap-4 md:grid-cols-4">
          {workFlow.map((item) => <AnnouncementCard key={item.title} title={item.title} description={item.description} tag={item.tag} />)}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">When the lead is ready</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">Send to Administrative Officer</h2>
            <p className="mt-3 text-sm leading-7 text-[#40516a]">Open Admissions, fill the confirmed case, and the Administrative Officer will continue fees, documents, and final approval.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="/crm/admissions">Fill Admission Form</Button>
              <Button href="/messages" variant="secondary">Message Administrative Officer</Button>
            </div>
          </div>
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Call Support</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Simple call script</h2>
            <div className="mt-5 grid gap-3">
              {data.aiCallScripts.map((item) => <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>)}
            </div>
          </div>
        </section>

        <SectionHeader eyebrow="Today's Reminder" title="Important work" action={data.customDashboard.department} />
        <section id="reports" className="grid gap-4 md:grid-cols-4">
          {focusAreas.map((area) => (
            <AnnouncementCard key={area} title={area} description="Check this and close the pending work today." tag="Daily" />
          ))}
        </section>

        <ActivityTimeline title="What this dashboard is for" items={data.modules} />
      </motion.div>
    </RoleDashboardGuard>
  );
}
