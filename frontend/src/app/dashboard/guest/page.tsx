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
import { AssessmentMissionCard } from "@/components/assessments/assessment-mission-card";
import { assessmentAccessStrategy, buildAssessmentProgress, recommendedAssessmentPath } from "@/components/assessments/assessment-catalog";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useGuestDashboard } from "@/hooks/use-dashboard";

const guestPrograms = [
  { title: "Free recorded lessons", description: "Preview course videos before joining the full academy program.", href: "/recorded-lectures" },
  { title: "Free mock tests", description: "Try published public tests and understand the exam practice format.", href: "/tests" },
  { title: "NIDUS Guru quests", description: "Start transformation quests for focus, discipline, confidence, and future readiness.", href: "/guru" },
  { title: "Assessments", description: "Try officer readiness, leadership, discipline, focus, and career-fit assessments.", href: "/psychometric" },
  { title: "Live programs", description: "Join public webinars and orientation sessions.", href: "/live-classes" },
  { title: "Course catalog", description: "Compare NDA, CDS, AFCAT, SSB, AISSEE, RIMC and RMS programs.", href: "/courses" },
  { title: "Counselling request", description: "Ask the academy team to guide you to the right program.", href: "/crm/counselling" }
];

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

  const guestAssessments = buildAssessmentProgress(0, "guest");
  const freeGuestAssessments = guestAssessments.filter((assessment) => assessment.access === "FREE");
  const recommendedGuestAssessments = recommendedAssessmentPath
    .map((id) => guestAssessments.find((assessment) => assessment.id === id))
    .filter((assessment): assessment is NonNullable<typeof assessment> => Boolean(assessment));

  return (
    <RoleDashboardGuard role="GUEST">
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Guest Access"
        title="Try NIDUS before joining"
        description="A simple guest area for public recorded courses, free mock tests, psychometric previews, live programs, counselling requests, and upgrade paths."
        actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh dashboard"}</Button>}
        stats={[
          { value: String(data.featuredCourses.length), label: "featured courses" },
          { value: String(freeGuestAssessments.length), label: "free assessments" },
          { value: String(data.latestNews.length), label: "latest briefs" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Featured Courses" value={String(data.featuredCourses.length)} note={data.featuredCourses[0]?.title ?? "No featured courses"} />
        <StatCard label="Free Assessments" value={String(freeGuestAssessments.length)} note="Preview result, then create account to save full report" />
        <StatCard label="Announcements" value={String(data.latestNews.length)} note="Latest exam and academy updates" />
      </section>

      <SectionHeader eyebrow="Guest Conversion Path" title="Try, preview, save full report" action="Phase 6" />
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { title: "Take Free Assessment", description: "Start Officer Readiness, Discipline, Leadership, Dream Addiction, or Career Fit.", tag: "1" },
          { title: "See Preview Result", description: "Get a score and a simple interpretation to understand your defence potential.", tag: "2" },
          { title: "Create Account", description: "Save the full report, profile score, archetype, and recommendations.", tag: "3" },
          { title: "Next Action", description: "Move into NIDUS Guru, counselling, or academy admission pathway.", tag: "4" }
        ].map((item) => <AnnouncementCard key={item.title} title={item.title} description={item.description} tag={item.tag} />)}
      </section>

      <SectionHeader eyebrow="Free Assessments" title="Start with the highest-converting tests" action={`${freeGuestAssessments.length} free previews`} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {recommendedGuestAssessments.map((assessment) => (
          <AssessmentMissionCard key={assessment.id} assessment={assessment} compact />
        ))}
      </section>

      <SectionHeader eyebrow="Access Strategy" title="What guests unlock after joining" />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {assessmentAccessStrategy.map((row) => (
          <div key={row.feature} className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <p className="font-semibold text-white">{row.feature}</p>
            <div className="mt-4 grid gap-2 text-xs text-muted">
              <p><span className="font-semibold text-gold">Guest:</span> {row.guest}</p>
              <p><span className="font-semibold text-gold">Student:</span> {row.student}</p>
              <p><span className="font-semibold text-gold">Premium:</span> {row.premium}</p>
            </div>
          </div>
        ))}
      </section>

      <SectionHeader eyebrow="Guest Facilities" title="What guests can access" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {guestPrograms.map((program) => <QuickActionCard key={program.title} title={program.title} description={program.description} href={program.href} />)}
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
        <QuickActionCard title="Create full account" description="Move from guest preview to full student dashboard." href="/register" />
        <QuickActionCard title="Start NIDUS Guru" description="Explore transformation quests for focus, discipline, and confidence." href="/guru" />
        <QuickActionCard title="View progress report format" description="Understand how monthly growth will be reported." href="/progress-reports" />
      </section>

      {data.featuredCourses.length === 0 ? (
        <EmptyState title="No featured courses" description="Featured courses will appear here soon." />
      ) : null}
    </motion.div>
    </RoleDashboardGuard>
  );
}
