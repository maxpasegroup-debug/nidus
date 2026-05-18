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
import { useAdminDashboard } from "@/hooks/use-dashboard";

const commandModules = [
  { title: "Students & Learning", description: "Students, batches, course progress, attendance, and parent-ready updates.", href: "/admin-center/users" },
  { title: "Course Management", description: "Create courses, upload lessons, attach PDFs, and manage recorded learning.", href: "/courses" },
  { title: "Tests & Monthly Exams", description: "Plan monthly tests, aptitude practice, mock exams, and leaderboards.", href: "/tests" },
  { title: "Progress Reports", description: "Review academic, aptitude, attendance, discipline, and AI growth reports.", href: "/progress-reports" },
  { title: "Admissions & CRM", description: "Track enquiries, calls, counselling, admissions, and follow-up ownership.", href: "/crm" },
  { title: "Fees & Finance", description: "Monitor fee collection, invoices, subscriptions, due amounts, and approvals.", href: "/payments" },
  { title: "Staff & HR", description: "Onboard employees, assign roles, and manage staff documents in folders.", href: "/staff-hr" },
  { title: "Admin Settings", description: "Control roles, permissions, branches, audit logs, and production operations.", href: "/admin-center" }
];

const dailyActions = [
  { title: "Add student or staff", description: "Create academy users and assign the right dashboard role.", href: "/admin-center/users" },
  { title: "Create course", description: "Open the LMS builder for a new online or hybrid course.", href: "/courses" },
  { title: "Plan monthly test", description: "Create the next monthly exam or aptitude practice set.", href: "/tests" },
  { title: "Review progress reports", description: "See growth scores and next actions for students.", href: "/progress-reports" },
  { title: "Check admissions", description: "Review leads, counselling, and new admissions.", href: "/crm/admissions" },
  { title: "Open audit logs", description: "Inspect recent admin, auth, and role activity.", href: "/admin-center/audit-logs" }
];

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useAdminDashboard();

  if (isLoading) {
    return (
      <RoleDashboardGuard role="ADMIN">
        <DashboardSkeleton />
      </RoleDashboardGuard>
    );
  }

  if (error || !data) {
    return (
      <RoleDashboardGuard role="ADMIN">
        <DashboardError error={error} onRefresh={() => refetch()} />
      </RoleDashboardGuard>
    );
  }

  const facultyShare = data.staffSummary.totalStaff > 0 ? Math.round((data.staffSummary.faculty / data.staffSummary.totalStaff) * 100) : 0;

  return (
    <RoleDashboardGuard role="ADMIN">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Academy Command Centre"
          title="Simple management dashboard"
          description="A clear control room for students, courses, tests, admissions, fees, staff, progress reports, and NIDUS AI support."
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh dashboard"}</Button>}
          stats={[
            { value: String(data.totalStudents), label: "students" },
            { value: `${data.attendanceAnalytics.average}%`, label: "attendance" },
            { value: String(data.staffSummary.totalStaff), label: "staff" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Students" value={String(data.totalStudents)} note="Total learners in the academy" />
          <StatCard label="Admissions" value={String(data.recentAdmissions.length)} note="Recent admission activity" />
          <StatCard label="Revenue" value={`Rs ${Math.round(data.totalRevenue.amount / 100000)}L`} note={`${data.totalRevenue.quarter} collection view`} />
          <StatCard label="Staff" value={String(data.staffSummary.totalStaff)} note={`${data.staffSummary.faculty} teachers and ${data.staffSummary.operations} operations`} />
        </section>

        <SectionHeader eyebrow="Main Areas" title="What management can control" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {commandModules.map((module) => (
            <QuickActionCard key={module.title} title={module.title} description={module.description} href={module.href} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Ask NIDUS</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Today&apos;s management focus</h2>
            <div className="mt-5 grid gap-3">
              {[
                "Check students with low attendance before monthly tests.",
                "Review open admissions follow-ups and counselling outcomes.",
                "Confirm teachers have uploaded this week&apos;s lesson material.",
                "Generate progress reports for parents before the weekend."
              ].map((item) => (
                <div key={item} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{item}</div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <ProgressCard title="Hostel occupancy" value={data.hostelStats.occupancyPercentage} label={`${data.hostelStats.occupiedBeds}/${data.hostelStats.totalBeds} beds occupied`} />
            <ProgressCard title="Teacher coverage" value={facultyShare} label="Faculty share of staff" />
            <ActivityTimeline title="Recent admissions" items={data.recentAdmissions.map((user) => `${user.name} joined as ${user.role}`)} />
          </div>
        </section>

        <SectionHeader eyebrow="Quick Actions" title="Common daily work" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dailyActions.map((action) => (
            <QuickActionCard key={action.title} title={action.title} description={action.description} href={action.href} />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <AnnouncementCard title="LMS ready for management" description="Course catalog, media library, live classes, and recorded lectures are grouped for easy academy use." tag="LMS" />
          <AnnouncementCard title="Monthly growth system" description="Tests, analytics, psychometric signals, attendance, and teacher remarks feed the progress report view." tag="Reports" />
          <AnnouncementCard title="Role dashboards" description="Director, teacher, student, parent, telecaller, marketing, guest, and admin dashboards remain separate and simpler." tag="Roles" />
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
