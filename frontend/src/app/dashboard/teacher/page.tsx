"use client";

import { motion } from "framer-motion";
import { ActivityTimeline, AnnouncementCard, DashboardError, DashboardSkeleton, ProgressCard, QuickActionCard, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useTeacherDashboard } from "@/hooks/use-dashboard";

export default function TeacherDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useTeacherDashboard();

  if (isLoading) return <RoleDashboardGuard role="TEACHER"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="TEACHER"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  return (
    <RoleDashboardGuard role="TEACHER">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Teacher Command"
          title="Classroom delivery and academic intervention"
          description="Subject ownership, lecture uploads, notes, assignments, CBT creation, attendance, weak-student alerts, parent communication, and AI recommendations in one operating view."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.subjects.length), label: "subjects" },
            { value: `${data.classPerformance.attendance}%`, label: "attendance" },
            { value: String(data.classPerformance.weakStudentCount), label: "alerts" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Class Average" value={`${data.classPerformance.averageScore}%`} note="Current performance index" />
          <StatCard label="Assignments Due" value={String(data.classPerformance.assignmentsDue)} note="Pending submissions and review" />
          <StatCard label="Lectures" value={String(data.contentOps.lectureUploads)} note="Uploaded learning videos" />
          <StatCard label="CBT Drafts" value={String(data.contentOps.cbtDrafts)} note="Tests awaiting publish" />
        </section>

        <SectionHeader eyebrow="Subjects" title="Assigned academic tracks" action={data.subjects.join(" | ")} />
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {data.subjects.map((subject) => <AnnouncementCard key={subject} title={subject} description="Assignment, notes, CBT, and attendance workflows enabled." tag="Subject" />)}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.modules.map((module) => <AnnouncementCard key={module.title} title={module.title} description={module.metric} tag={module.status} />)}
          </div>
          <div className="space-y-4">
            <ProgressCard title="Class performance" value={data.classPerformance.averageScore} label="Academic readiness" />
            <ProgressCard title="Attendance marking" value={data.classPerformance.attendance} label="Latest class attendance" />
            <ActivityTimeline title="Weak student alerts" items={data.weakStudentAlerts} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <AnnouncementCard title="AI recommendations" description={data.aiRecommendations.join(" ")} tag="AI" />
          <QuickActionCard title="Upload lecture" description="Open media library for class learning assets." href="/media-library" />
          <QuickActionCard title="Create CBT" description="Prepare and manage tests for assigned subjects." href="/tests" />
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
