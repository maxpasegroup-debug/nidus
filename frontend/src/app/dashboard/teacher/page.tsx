"use client";

import { motion } from "framer-motion";
import {
  ActivityTimeline,
  AnnouncementCard,
  DashboardError,
  DashboardSkeleton,
  ProgressCard,
  QuickActionCard,
  RoleDashboardGuard,
  SectionHeader,
  StatCard
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useTeacherDashboard } from "@/hooks/use-dashboard";

const teacherWorkflow = [
  { title: "Plan today's lesson", description: "Write the topic, class objective, homework, and materials needed.", href: "/documents" },
  { title: "Mark attendance", description: "Record present, absent, and late students for the class.", href: "/discipline" },
  { title: "Upload study material", description: "Add notes, PDFs, recorded lessons, worksheets, and answer keys.", href: "/media-library" },
  { title: "Create or review test", description: "Prepare CBT tests, monthly practice, and weak-topic correction sets.", href: "/tests" },
  { title: "Check weak students", description: "See students needing extra attention before the next monthly test.", href: "/performance-analytics" },
  { title: "Send parent update", description: "Share remarks, progress, and attendance concerns.", href: "/messages" }
];

export default function TeacherDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useTeacherDashboard();

  if (isLoading) return <RoleDashboardGuard role="TEACHER"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="TEACHER"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  return (
    <RoleDashboardGuard role="TEACHER">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Teacher Dashboard"
          title="Simple classroom workbench"
          description="Plan lessons, mark attendance, upload materials, review tests, support weak students, and ask NIDUS for the next best action."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.subjects.length), label: "subjects" },
            { value: `${data.classPerformance.attendance}%`, label: "attendance" },
            { value: String(data.classPerformance.weakStudentCount), label: "students need support" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Class Average" value={`${data.classPerformance.averageScore}%`} note="Current academic score" />
          <StatCard label="Attendance" value={`${data.classPerformance.attendance}%`} note="Latest class attendance" />
          <StatCard label="Pending Review" value={String(data.contentOps.pendingReviews)} note="Materials and tests to check" />
          <StatCard label="CBT Drafts" value={String(data.contentOps.cbtDrafts)} note="Tests awaiting publish" />
        </section>

        <SectionHeader eyebrow="Daily Work" title="Teacher actions in simple English" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teacherWorkflow.map((item) => (
            <QuickActionCard key={item.title} title={item.title} description={item.description} href={item.href} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Ask NIDUS</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">What should I do next?</h2>
            <div className="mt-5 grid gap-3">
              {data.aiRecommendations.map((item) => (
                <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <ProgressCard title="Class performance" value={data.classPerformance.averageScore} label="Academic readiness" />
            <ProgressCard title="Attendance marking" value={data.classPerformance.attendance} label="Class participation" />
            <ActivityTimeline title="Weak student alerts" items={data.weakStudentAlerts} />
          </div>
        </section>

        <SectionHeader eyebrow="Subjects" title="Assigned subjects and facilities" action={data.subjects.join(" | ")} />
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {data.subjects.map((subject) => (
            <AnnouncementCard key={subject} title={subject} description="Lesson plan, notes, attendance, test review, and student remarks." tag="Subject" />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {data.modules.map((module) => (
            <AnnouncementCard key={module.title} title={module.title} description={module.metric} tag={module.status} />
          ))}
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
