"use client";

import { motion } from "framer-motion";
import {
  ActivityTimeline,
  AnnouncementCard,
  DashboardError,
  DashboardSkeleton,
  EmptyState,
  QuickActionCard,
  RoleDashboardGuard,
  SectionHeader,
  StatCard
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useGuestDashboard } from "@/hooks/use-dashboard";

export default function GuestDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useGuestDashboard();

  if (isLoading) {
    return (
      <RoleDashboardGuard role="GUEST">
        <DashboardSkeleton />
      </RoleDashboardGuard>
    );
  }

  if (error || !data) {
    return (
      <RoleDashboardGuard role="GUEST">
        <DashboardError error={error} onRefresh={() => refetch()} />
      </RoleDashboardGuard>
    );
  }

  return (
    <RoleDashboardGuard role="GUEST">
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Guest Access"
        title="Explore NIDUS training pathways"
        description="Preview defence exam courses, demo videos, free mock tests, announcements, and upgrade options before joining the full command environment."
        actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh dashboard"}</Button>}
        stats={[
          { value: String(data.featuredCourses.length), label: "featured courses" },
          { value: String(data.freeTests.length), label: "free mocks" },
          { value: String(data.latestNews.length), label: "latest briefs" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Featured Courses" value={String(data.featuredCourses.length)} note={data.featuredCourses[0]?.title ?? "No featured courses"} />
        <StatCard label="Free Mock Tests" value={String(data.freeTests.length)} note={data.freeTests[0]?.title ?? "No free tests"} />
        <StatCard label="Announcements" value={String(data.latestNews.length)} note="Latest exam and academy updates" />
      </section>

      <SectionHeader eyebrow="Explore Courses" title="Defence exam information" action="NDA, CDS, AFCAT, SSB, AISSEE, RIMC" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.featuredCourses.map((course) => (
          <AnnouncementCard key={course.id} title={course.title} description={`${course.duration} · ${course.level}`} tag="Course" />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ActivityTimeline title="Latest announcements" items={data.latestNews} />
        <AnnouncementCard title="Upgrade prompt" description="Unlock full mock-test analytics, AI recommendations, mentor reviews, and parent reports." tag="Premium" />
        <AnnouncementCard title="Free tests" description={data.freeTests.map((test) => `${test.title} (${test.questions} Qs)`).join(", ")} tag="Demo" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickActionCard title="Try free mock test" description="Start a sample test without unlocking the full course." href="/tests" />
        <QuickActionCard title="Explore course catalog" description="Compare preparation tracks and batch formats." href="/courses" />
        <QuickActionCard title="Request counselling" description="Book a discovery call before upgrading." href="/crm/counselling" />
      </section>

      {data.featuredCourses.length === 0 ? (
        <EmptyState title="No featured courses" description="Featured courses will appear here soon." />
      ) : null}
    </motion.div>
    </RoleDashboardGuard>
  );
}
