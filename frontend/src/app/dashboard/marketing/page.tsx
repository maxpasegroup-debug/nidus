"use client";

import { motion } from "framer-motion";
import { ActivityTimeline, AnnouncementCard, DashboardError, DashboardSkeleton, ProgressCard, QuickActionCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useMarketingDashboard } from "@/hooks/use-dashboard";

export default function MarketingDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useMarketingDashboard();

  if (isLoading) return <RoleDashboardGuard role="MARKETING_COORDINATOR"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="MARKETING_COORDINATOR"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  const chartData = data.roiAnalytics.map((item) => ({ label: item.month, score: item.roi * 20, attendance: data.landingPageAnalytics.conversionRate * 10 }));

  return (
    <RoleDashboardGuard role="MARKETING_COORDINATOR">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Marketing Coordinator"
          title="Campaigns, enquiries, and events"
          description="A simple marketing workspace for campaign leads, webinar registrations, enquiry sources, content tasks, conversion tracking, and Ask NIDUS growth ideas."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.campaignTracking.activeCampaigns), label: "campaigns" },
            { value: String(data.campaignTracking.leadsGenerated), label: "leads" },
            { value: `${data.campaignTracking.roi}x`, label: "ROI" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Cost per Lead" value={`Rs ${data.campaignTracking.costPerLead}`} note="Average acquisition cost" />
          <StatCard label="Webinars" value={String(data.webinarRegistrations.upcoming)} note={`${data.webinarRegistrations.registered} registrations`} />
          <StatCard label="Landing Page" value={`${data.landingPageAnalytics.conversionRate}%`} note={data.landingPageAnalytics.topPage} />
          <StatCard label="Social Reach" value={`${Math.round(data.socialCampaignAnalytics.reach / 1000)}K`} note={`${data.socialCampaignAnalytics.enquiries} enquiries`} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
          <PerformanceChart title="ROI and conversion trend" data={chartData} />
          <div className="space-y-4">
            <ProgressCard title="Landing conversion" value={Math.round(data.landingPageAnalytics.conversionRate * 10)} label={`${data.landingPageAnalytics.visitors} visitors`} />
            <ProgressCard title="Social engagement" value={Math.round(data.socialCampaignAnalytics.engagement * 10)} label={`${data.socialCampaignAnalytics.engagement}% engagement`} />
            <ActivityTimeline title="Lead source report" items={data.attribution.map((item) => `${item.channel}: ${item.leads} leads, ${item.conversion}% conversion`)} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Ask NIDUS</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Marketing focus</h2>
            <div className="mt-5 grid gap-3">
              {[
                "Prioritize channels with high counselling conversion, not only high lead count.",
                "Use webinar registrations as warm leads for telecaller follow-up.",
                "Create Daily Intelligence posts from high-performing course topics."
              ].map((item) => <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AnnouncementCard title="Content queue" description={`${data.publishingShell.contentQueue} content tasks waiting.`} tag="Content" />
            <AnnouncementCard title="Daily Intelligence" description={`${data.publishingShell.dailyIntelligenceShares} shares prepared.`} tag="DI" />
            <AnnouncementCard title="Social campaigns" description={`${data.publishingShell.socialPosts} social posts in motion.`} tag="Social" />
            <AnnouncementCard title="Event follow-up" description={`${data.webinarRegistrations.attendedLast} attended the last webinar.`} tag="Events" />
          </div>
        </section>

        <SectionHeader eyebrow="Quick Actions" title="Marketing work" />
        <section className="grid gap-4 md:grid-cols-3">
          <QuickActionCard title="Open CRM leads" description="Check enquiry source and lead quality." href="/crm/leads" />
          <QuickActionCard title="Plan live program" description="Coordinate webinar and live program follow-up." href="/live-classes" />
          <QuickActionCard title="Marketing reports" description="Review source, campaign, and conversion movement." href="/dashboard/marketing" />
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
