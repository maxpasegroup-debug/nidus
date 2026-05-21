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
  { title: "Today", description: "Daily classes, pending fees, admissions follow-ups, tests, staff tasks, and alerts.", href: "/operations-hub" },
  { title: "Academic Department", description: "Manage classes, subjects, teachers, attendance, exams, materials, and progress.", href: "/courses" },
  { title: "Admission Cell", description: "Handle leads, enquiries, calls, counselling, onboarding, documents, and collections.", href: "/crm" },
  { title: "HR Department", description: "Add employees, assign roles, manage onboarding, folders, contracts, and reviews.", href: "/admin-center/users" },
  { title: "Programs & Fees", description: "Foundation, defence entrance, specialized modules, fee plans, and instalments.", href: "/payments" },
  { title: "Classes & Content", description: "Schedule live classes, add recorded lessons, upload PDFs, notes, and assignments.", href: "/live-classes" },
  { title: "Exams & Progress", description: "Host exams, set timing, generate questions with NIDUS AI, and track reports.", href: "/tests" },
  { title: "Finance", description: "Fee collection, pending dues, invoices, receipts, refunds, and approvals.", href: "/payments" },
  { title: "NIDUS AI", description: "Ask what is pending, generate work, create exams, and guide staff actions.", href: "/nidus-ai" },
  { title: "Reports", description: "Admission, fee, attendance, test, staff, and student progress reports.", href: "/progress-reports" },
  { title: "Settings", description: "Users, roles, permissions, branches, audit logs, and academy controls.", href: "/admin-center" }
];

const dailyActions = [
  { title: "Add employee", description: "Create a teacher, director, telecaller, or marketing staff login.", href: "/admin-center/users" },
  { title: "Add student or parent", description: "Create learner and parent accounts with the correct dashboard.", href: "/admin-center/users" },
  { title: "Create course", description: "Add a regular, live, recorded, or hybrid course.", href: "/courses" },
  { title: "Upload material", description: "Add notes, PDFs, recordings, assignments, and class resources.", href: "/courses" },
  { title: "Schedule live class", description: "Plan an online class for a batch with teacher access.", href: "/live-classes" },
  { title: "Host exam", description: "Generate questions, set time, publish exam, and track attempts.", href: "/tests" },
  { title: "Collect fee", description: "Open fee collection, invoices, pending dues, and receipts.", href: "/payments" },
  { title: "Ask NIDUS", description: "Get pending work, exam ideas, reports, and staff next actions.", href: "/nidus-ai" }
];

const programTracks = [
  {
    title: "Foundation & Long-Term Programs",
    description: "Mission 2028, After Plus One, Foundation NDA / Civil Services, and yearly plans.",
    tag: "Track 1"
  },
  {
    title: "Defence Entrance & Academic Preparation",
    description: "AISSEE, RIMC, NDA crash course, CDS, AFCAT, INET, and school entry preparation.",
    tag: "Track 2"
  },
  {
    title: "Specialized Modules",
    description: "Agniveer test series, physical test, AFMC preparation, and SSB interview guidance.",
    tag: "Track 3"
  }
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
          eyebrow="NIDUS Academy Admin"
          title={isOperationsAdmin ? "Administration operations desk" : "Simple management dashboard"}
          description={isOperationsAdmin ? "Manage student records, documents, fees, staff records, notices, and daily office work from one operations dashboard." : "Three clear departments for daily work: Academic Department, Admission Cell, and HR Department. All hybrid tools stay inside simple menus."}
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

        <SectionHeader eyebrow="Admin Menu" title="Choose the work area" />
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
                "Check today&apos;s classes, absentees, pending fees, and admissions follow-ups.",
                "Confirm teachers have uploaded notes, recordings, or assignments for active batches.",
                "Prepare the next monthly test, aptitude test, or psychometric growth check.",
                "Review progress reports and send clear actions to teachers, parents, and students."
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

        <SectionHeader eyebrow="Programs" title="Three channels of NIDUS programs" />
        <section className="grid gap-4 md:grid-cols-3">
          {programTracks.map((track) => (
            <AnnouncementCard key={track.title} title={track.title} description={track.description} tag={track.tag} />
          ))}
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
