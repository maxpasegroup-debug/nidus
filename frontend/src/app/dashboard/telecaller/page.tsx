"use client";

import { motion } from "framer-motion";
import { ActivityTimeline, AnnouncementCard, DashboardError, DashboardSkeleton, ProgressCard, QuickActionCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useTelecallerDashboard } from "@/hooks/use-dashboard";

const callFlow = [
  { title: "New lead", description: "Call within the same day and add first note.", tag: "1" },
  { title: "Interested", description: "Schedule counselling or send course details.", tag: "2" },
  { title: "Counselling", description: "Confirm date, parent/student details, and requirement.", tag: "3" },
  { title: "Admission", description: "Move qualified leads to admission and fee follow-up.", tag: "4" }
];

export default function TelecallerDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useTelecallerDashboard();

  if (isLoading) return <RoleDashboardGuard role="TELECALLER"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="TELECALLER"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;
  const isLeadSupport = data.customDashboard.dashboardTemplate === "LEAD_SUPPORT";
  const focusAreas = data.customDashboard.focusAreas.length ? data.customDashboard.focusAreas : ["New leads", "Follow-ups", "Counselling", "Admissions"];

  return (
    <RoleDashboardGuard role="TELECALLER">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow={isLeadSupport ? "Student Support & Lead Dashboard" : "Admissions Workbench"}
          title={isLeadSupport ? "Lead management and support desk" : "Calls, follow-ups, and admissions"}
          description={isLeadSupport ? "Manage new enquiries, callbacks, parent communication, support tickets, and admission handovers from one focused CRM dashboard." : "A simple CRM dashboard for daily calls, pending follow-ups, counselling bookings, admission movement, and Ask NIDUS call support."}
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.leadPipeline.assignedLeads), label: "assigned leads" },
            { value: String(data.scheduling.callbacksToday), label: "callbacks today" },
            { value: `${data.performance.conversionRate}%`, label: "conversion" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Calls Today" value={String(data.performance.callsToday)} note={`Avg response ${data.performance.averageResponseTime}`} />
          <StatCard label="New Leads" value={String(data.leadPipeline.new)} note="Need first contact" />
          <StatCard label="Counselling" value={String(data.scheduling.counselling)} note="Booked counselling sessions" />
          <StatCard label="Overdue" value={String(data.scheduling.overdueFollowUps)} note="Follow up immediately" />
        </section>

        <SectionHeader eyebrow="Call Flow" title="Simple admission pipeline" />
        <section className="grid gap-4 md:grid-cols-4">
          {callFlow.map((item) => <AnnouncementCard key={item.title} title={item.title} description={item.description} tag={item.tag} />)}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <ProgressCard title="Contacted leads" value={data.leadPipeline.contacted} label={`${data.leadPipeline.new} new leads waiting`} />
            <ProgressCard title="Admission conversion" value={data.performance.conversionRate} label={`${data.leadPipeline.enrolled} enrollments`} />
            <AnnouncementCard title="WhatsApp templates" description={`${data.whatsappShell.templates} templates, ${data.whatsappShell.pendingOptIns} opt-ins pending.`} tag={data.whatsappShell.status} />
          </div>
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Ask NIDUS</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Call support</h2>
            <div className="mt-5 grid gap-3">
              {data.aiCallScripts.map((item) => <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>)}
            </div>
          </div>
        </section>

        <SectionHeader eyebrow="Quick Actions" title="Move admissions forward" />
        <section className="grid gap-4 md:grid-cols-3">
          <QuickActionCard title="Open leads" description="Call, update status, and add lead notes." href="/crm/leads" />
          <QuickActionCard title="Book counselling" description="Schedule counselling and parent discussion." href="/crm/counselling" />
          <QuickActionCard title="Admissions list" description="Check admitted students and pending cases." href="/crm/admissions" />
        </section>

        <SectionHeader eyebrow="Personal Desk" title="Pinned support priorities" action={data.customDashboard.department} />
        <section className="grid gap-4 md:grid-cols-4">
          {focusAreas.map((area) => (
            <AnnouncementCard key={area} title={area} description="Pinned to this dashboard for daily tracking and closure." tag={data.customDashboard.designation || "Support"} />
          ))}
        </section>

        <ActivityTimeline title="CRM facilities" items={data.modules} />
      </motion.div>
    </RoleDashboardGuard>
  );
}
