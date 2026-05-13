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
          eyebrow="Marketing Operations"
          title="Campaigns, attribution, and growth intelligence"
          description="Campaign tracking, lead attribution, webinar registrations, landing page analytics, ROI, content publishing, Daily Intelligence sharing, and social campaign metrics."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.campaignTracking.activeCampaigns), label: "campaigns" },
            { value: String(data.campaignTracking.leadsGenerated), label: "leads" },
            { value: `${data.campaignTracking.roi}x`, label: "ROI" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Cost per Lead" value={`Rs ${data.campaignTracking.costPerLead}`} note="Blended acquisition cost" />
          <StatCard label="Webinars" value={String(data.webinarRegistrations.upcoming)} note={`${data.webinarRegistrations.registered} registrations`} />
          <StatCard label="Landing CVR" value={`${data.landingPageAnalytics.conversionRate}%`} note={data.landingPageAnalytics.topPage} />
          <StatCard label="Social Reach" value={`${Math.round(data.socialCampaignAnalytics.reach / 1000)}K`} note={`${data.socialCampaignAnalytics.enquiries} enquiries`} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <PerformanceChart title="ROI analytics" data={chartData} />
          <div className="space-y-4">
            <ProgressCard title="Landing page analytics" value={Math.round(data.landingPageAnalytics.conversionRate * 10)} label={`${data.landingPageAnalytics.visitors} visitors`} />
            <ProgressCard title="Social engagement" value={Math.round(data.socialCampaignAnalytics.engagement * 10)} label={`${data.socialCampaignAnalytics.engagement}% engagement`} />
            <ActivityTimeline title="Lead attribution" items={data.attribution.map((item) => `${item.channel}: ${item.leads} leads, ${item.conversion}% conversion`)} />
          </div>
        </section>

        <SectionHeader eyebrow="Publishing" title="Marketing execution shells" />
        <section className="grid gap-4 md:grid-cols-3">
          <AnnouncementCard title="Content publishing shell" description={`${data.publishingShell.contentQueue} queued posts and ${data.publishingShell.socialPosts} social campaigns.`} tag="Content" />
          <AnnouncementCard title="Daily Intelligence sharing" description={`${data.publishingShell.dailyIntelligenceShares} shares prepared for lead nurturing.`} tag="DI" />
          <QuickActionCard title="Review CRM attribution" description="Compare campaign output against lead quality." href="/crm/leads" />
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
