"use client";

import { motion } from "framer-motion";
import { ActivityTimeline, AnnouncementCard, DashboardError, DashboardSkeleton, ProgressCard, QuickActionCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useTelecallerDashboard } from "@/hooks/use-dashboard";

export default function TelecallerDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useTelecallerDashboard();

  if (isLoading) return <RoleDashboardGuard role="TELECALLER"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="TELECALLER"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  return (
    <RoleDashboardGuard role="TELECALLER">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Telecaller CRM"
          title="Lead follow-up and counselling pipeline"
          description="Lead pipeline, enquiries, callbacks, counselling slots, follow-ups, notes, conversion analytics, AI call-script suggestions, and WhatsApp workflow shell."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.leadPipeline.assignedLeads), label: "assigned leads" },
            { value: String(data.scheduling.callbacksToday), label: "callbacks today" },
            { value: `${data.performance.conversionRate}%`, label: "conversion" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Calls Today" value={String(data.performance.callsToday)} note={`Avg response ${data.performance.averageResponseTime}`} />
          <StatCard label="Counselling" value={String(data.scheduling.counselling)} note="Scheduled counselling sessions" />
          <StatCard label="Overdue" value={String(data.scheduling.overdueFollowUps)} note="Follow-ups needing attention" />
          <StatCard label="Notes" value={String(data.performance.notesAdded)} note="Lead notes and follow-ups" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.modules.map((module) => <AnnouncementCard key={module} title={module} description="CRM workflow enabled for production operations." tag="CRM" />)}
          </div>
          <div className="space-y-4">
            <ProgressCard title="Contacted pipeline" value={data.leadPipeline.contacted} label={`${data.leadPipeline.new} new leads pending`} />
            <ProgressCard title="Conversion analytics" value={data.performance.conversionRate} label={`${data.leadPipeline.enrolled} enrollments from active pipeline`} />
            <ActivityTimeline title="AI call-script suggestions" items={data.aiCallScripts} />
          </div>
        </section>

        <SectionHeader eyebrow="Actions" title="CRM movement" />
        <section className="grid gap-4 md:grid-cols-3">
          <AnnouncementCard title="WhatsApp integration shell" description={`${data.whatsappShell.templates} templates, ${data.whatsappShell.pendingOptIns} opt-ins pending.`} tag={data.whatsappShell.status} />
          <QuickActionCard title="Open leads" description="Work the lead pipeline and enquiry list." href="/crm/leads" />
          <QuickActionCard title="Schedule counselling" description="Create or review counselling bookings." href="/crm/counselling" />
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
