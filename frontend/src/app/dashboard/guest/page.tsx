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
      <section className="rounded-lg border border-gold/20 bg-gradient-to-br from-white/10 to-white/[0.04] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Guest Access</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-5xl">
          Explore NIDUS training pathways
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Preview defence exam courses, demo videos, free mock tests, announcements, and upgrade options.
        </p>
        <Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary" className="mt-5">
          {isFetching ? "Refreshing..." : "Refresh dashboard"}
        </Button>
      </section>

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
        <QuickActionCard title="Try free mock test" description="Start a sample test without unlocking the full course." href="/dashboard/guest" />
        <QuickActionCard title="Explore course catalog" description="Compare preparation tracks and batch formats." href="/dashboard/guest" />
        <QuickActionCard title="Request counselling" description="Book a discovery call before upgrading." href="/dashboard/guest" />
      </section>

      {data.featuredCourses.length === 0 ? (
        <EmptyState title="No featured courses" description="Featured courses will appear here soon." />
      ) : null}
    </motion.div>
    </RoleDashboardGuard>
  );
}
