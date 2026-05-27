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
  { title: "Admission Handover", description: "Receive confirmed admissions from Student Support and continue the official admission process.", href: "/crm/admissions" },
  { title: "Student Records", description: "Create, update, and verify student and parent account records.", href: "/admin-center/users" },
  { title: "Fee Follow-up", description: "Check fee status, pending dues, invoices, receipts, and manual payment updates.", href: "/payments" },
  { title: "Documents", description: "Collect and manage student documents, ID proofs, forms, and academy files.", href: "/documents" },
  { title: "Notices", description: "Send academy notices, reminders, updates, and parent communication.", href: "/announcements" },
  { title: "Staff Records", description: "Review employee records, leave, onboarding status, and basic HR documents.", href: "/staff-hr" },
  { title: "Daily Operations", description: "Check pending operational work, approvals, branch tasks, and closing items.", href: "/operations-hub" },
  { title: "Reports", description: "Open admission, fee, attendance, student, and staff reports.", href: "/progress-reports" },
  { title: "Settings", description: "Manage users, roles, permissions, branches, and system controls.", href: "/admin-center" }
];

const dailyActions = [
  { title: "Take admission handover", description: "Open confirmed cases sent by Student Support.", href: "/crm/admissions" },
  { title: "Create student account", description: "Create or update the student/parent login.", href: "/admin-center/users" },
  { title: "Collect or verify fee", description: "Update payment, invoice, receipt, or due amount.", href: "/payments" },
  { title: "Upload documents", description: "Attach forms, ID proof, certificates, and admission files.", href: "/documents" },
  { title: "Send notice", description: "Send reminders or parent-facing academy communication.", href: "/announcements" },
  { title: "Message team", description: "Coordinate with Student Support, Directors, or faculty.", href: "/messages" }
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
  const isOperationsAdmin = data.customDashboard.dashboardTemplate === "ADMIN_OPERATIONS";

  return (
    <RoleDashboardGuard role="ADMIN">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow="Administration Dashboard"
          title={isOperationsAdmin ? "Admissions, fees, records, and documents" : "Administration operations"}
          description={isOperationsAdmin ? "Receive confirmed admissions from Student Support, complete student records, collect fees, manage documents, send notices, and close daily administration work." : "A focused operations desk for student records, fees, documents, notices, staff records, and admission handover."}
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

        <SectionHeader eyebrow="Administration Menu" title="Choose the work area" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {commandModules.map((module) => (
            <QuickActionCard key={module.title} title={module.title} description={module.description} href={module.href} />
          ))}
        </section>

        {isOperationsAdmin ? (
          <>
            <SectionHeader eyebrow="Personal Desk" title="Administration priorities" action={data.customDashboard.department} />
            <section className="grid gap-4 md:grid-cols-4">
              {data.customDashboard.focusAreas.map((area) => (
                <AnnouncementCard key={area} title={area} description="Pinned for daily administration follow-up and closure." tag={data.customDashboard.designation} />
              ))}
            </section>
          </>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <div className="premium-surface rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Ask NIDUS</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Today&apos;s management focus</h2>
            <div className="mt-5 grid gap-3">
              {[
                "Check confirmed admissions sent by Student Support.",
                "Complete student records, parent details, and document status.",
                "Review pending fees, receipts, invoices, and manual payment updates.",
                "Send notices or messages for missing documents, fees, or admission steps."
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

        <SectionHeader eyebrow="Daily Work" title="Common administration tasks" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dailyActions.map((action) => (
            <QuickActionCard key={action.title} title={action.title} description={action.description} href={action.href} />
          ))}
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
