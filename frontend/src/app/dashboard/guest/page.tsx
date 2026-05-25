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
  { title: "Academy programs", description: "Compare NDA, CDS, AFCAT, SSB, AISSEE, RIMC and Agniveer programs.", href: "/programs" },
  { title: "Apply to physical academy", description: "Send your details for admission guidance and counselling.", href: "/join" }
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
        title="Explore NIDUS as a guest"
        description="See academy programs, NIDUS Guru, assessments, TOPRANK training, reports, and the physical academy application path."
        actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh dashboard"}</Button>}
        stats={[
          { value: String(data.featuredCourses.length), label: "featured courses" },
          { value: String(freeGuestAssessments.length), label: "free assessments" },
          { value: String(data.latestNews.length), label: "latest briefs" }
        ]}
      />

      <section className="rounded-lg border border-gold/25 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(212,175,55,0.12))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Physical Academy Admission</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Apply to NIDUS Physical Academy</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">Share your details. The academy team will guide you about programs, batches, fees, counselling, and the right defence pathway.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <QuickActionCard title="Apply Now" description="Start the admission enquiry." href="/join" />
            <QuickActionCard title="Explore Academy" description="See all public programs." href="/programs" />
          </div>
        </div>
      </section>

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
        <QuickActionCard title="Create free account" description="Move from guest preview to full student dashboard." href="/register" />
        <QuickActionCard title="Start NIDUS Guru" description="Explore transformation quests for focus, discipline, and confidence." href="/guru" />
        <QuickActionCard title="Apply to physical academy" description="Request counselling and admission support." href="/join" />
      </section>

      {data.featuredCourses.length === 0 ? (
        <EmptyState title="No featured courses" description="Featured courses will appear here soon." />
      ) : null}
    </motion.div>
    </RoleDashboardGuard>
  );
}
