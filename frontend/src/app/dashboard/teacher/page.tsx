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
import { FacultyManualCard } from "@/components/faculty/faculty-manual-card";
import { PageHero } from "@/components/layout/page-hero";
import { useTeacherDashboard } from "@/hooks/use-dashboard";

const teacherWorkflow = [
  { title: "Plan today's lesson", description: "Subject, topic, class goal, homework, and next class note.", href: "/documents" },
  { title: "Mark attendance", description: "Present, absent, or late. Keep it quick after class starts.", href: "/discipline" },
  { title: "Upload notes", description: "Add PDF notes, assignments, answer keys, and recorded classes.", href: "/media-library" },
  { title: "Create practice test", description: "Make a simple subject test or monthly practice test.", href: "/tests" },
  { title: "Host live class", description: "Schedule Google Meet or Zoom style online classes.", href: "/live-classes" },
  { title: "Students needing help", description: "Find students with low marks, low attendance, or missed work.", href: "/performance-analytics" },
  { title: "Message parent", description: "Send a simple update about progress, attendance, or concern.", href: "/messages" }
];

const academicHeadWorkflow = [
  { title: "Review batches", description: "Check batch progress, attendance, tests, and syllabus status.", href: "/courses" },
  { title: "Faculty coverage", description: "Confirm assigned faculty, replacement needs, and class continuity.", href: "/staff-hr" },
  { title: "Weak students", description: "Open low-score, low-attendance, and missed-test student lists.", href: "/performance-analytics" },
  { title: "Test planning", description: "Create or review weekly, monthly, and subject-wise tests.", href: "/tests" },
  { title: "Academic reports", description: "Prepare progress reports for directors, parents, and faculty.", href: "/progress-reports" },
  { title: "Class content", description: "Review notes, recordings, assignments, and study material uploads.", href: "/media-library" }
];

const physicalWorkflow = [
  { title: "PT schedule", description: "Plan drills, runs, warmups, and physical test sessions.", href: "/fitness/pt-schedule" },
  { title: "Mark PT attendance", description: "Record attendance and remarks for physical sessions.", href: "/fitness/logs" },
  { title: "Fitness eligibility", description: "Review physical eligibility, stamina, BMI, and readiness.", href: "/fitness/eligibility" },
  { title: "Daily fitness logs", description: "Track training output, workout duration, and student progress.", href: "/fitness" },
  { title: "Parade performance", description: "Monitor discipline, drill quality, and performance records.", href: "/parade-performance" },
  { title: "Student concerns", description: "Flag injury, low stamina, or repeated absence concerns.", href: "/messages" }
];

function dashboardCopy(template: string, subject?: string | null) {
  if (template === "ACADEMIC_HEAD") {
    return {
      eyebrow: "Academic Head Dashboard",
      title: "Academic operations workbench",
      description: "Monitor faculty coverage, batch progress, tests, attendance, weak students, and academic reporting from one focused dashboard.",
      workflow: academicHeadWorkflow
    };
  }

  if (template === "PHYSICAL_INSTRUCTOR") {
    return {
      eyebrow: "Physical Instructor Dashboard",
      title: "Training and fitness command",
      description: "Plan PT sessions, mark physical attendance, track fitness readiness, record remarks, and surface students needing intervention.",
      workflow: physicalWorkflow
    };
  }

  return {
    eyebrow: `${subject ?? "Subject"} Faculty Dashboard`,
    title: `${subject ?? "Subject"} classroom workbench`,
    description: "Plan lessons, mark attendance, upload materials, review tests, support weak students, and keep subject progress moving cleanly.",
    workflow: teacherWorkflow
  };
}

export default function TeacherDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useTeacherDashboard();

  if (isLoading) return <RoleDashboardGuard role="TEACHER"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="TEACHER"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;
  const custom = data.customDashboard;
  const copy = dashboardCopy(custom.dashboardTemplate, custom.subject);
  const focusAreas = custom.focusAreas.length ? custom.focusAreas : data.subjects;

  return (
    <RoleDashboardGuard role="TEACHER">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh"}</Button>}
          stats={[
            { value: String(data.subjects.length), label: custom.dashboardTemplate === "ACADEMIC_HEAD" ? "coverage areas" : "subjects" },
            { value: `${data.classPerformance.attendance}%`, label: "attendance" },
            { value: String(data.classPerformance.weakStudentCount), label: "need help" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Class Score" value={`${data.classPerformance.averageScore}%`} note="Average student performance" />
          <StatCard label="Attendance" value={`${data.classPerformance.attendance}%`} note="Latest class attendance" />
          <StatCard label="To Check" value={String(data.contentOps.pendingReviews)} note="Notes, work, or tests to review" />
          <StatCard label="Test Drafts" value={String(data.contentOps.cbtDrafts)} note="Tests waiting to publish" />
        </section>

        <SectionHeader eyebrow="Today" title="Teacher actions" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {copy.workflow.map((item) => (
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
            <ProgressCard title="Class score" value={data.classPerformance.averageScore} label="Average student performance" />
            <ProgressCard title="Attendance" value={data.classPerformance.attendance} label="Class participation" />
            <ActivityTimeline title="Students needing help" items={data.weakStudentAlerts} />
          </div>
        </section>

        <SectionHeader eyebrow="Subjects" title="Assigned subjects and facilities" action={data.subjects.join(" | ")} />
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {focusAreas.map((subject) => (
            <AnnouncementCard key={subject} title={subject} description="Plan, track, review, and close the work assigned to this dashboard." tag={custom.designation || "Staff"} />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {data.modules.map((module) => (
            <AnnouncementCard key={module.title} title={module.title} description={module.metric} tag={module.status} />
          ))}
        </section>

        <FacultyManualCard />
      </motion.div>
    </RoleDashboardGuard>
  );
}
