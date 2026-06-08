"use client";

import { motion } from "framer-motion";
import {
  AnnouncementCard,
  DashboardError,
  DashboardSkeleton,
  QuickActionCard,
  RoleDashboardGuard,
  SectionHeader,
  StatCard
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { useAdminDashboard } from "@/hooks/use-dashboard";

const commandModules = [
  { title: "New Enquiries", description: "See enquiries from website, calls, WhatsApp, social media, and campaigns.", href: "/crm/leads" },
  { title: "Applications", description: "Open student applications, check details, and approve the next step.", href: "/crm/admissions" },
  { title: "Follow-ups", description: "Call parents or students who need one more reminder or counselling.", href: "/crm/followups" },
  { title: "Fees", description: "Check payment status, receipts, pending amounts, and manual fee updates.", href: "/payments" },
  { title: "Documents", description: "Collect admission forms, ID proof, certificates, and student files.", href: "/documents" },
  { title: "Messages", description: "Send simple updates to Student Support, parents, directors, or faculty.", href: "/messages" }
];

const dailyActions = [
  { title: "1. Check enquiries", description: "Open fresh leads and see who needs a call today.", href: "/crm/leads" },
  { title: "2. Review application", description: "Check student details, selected course, phone, and blood group.", href: "/crm/admissions" },
  { title: "3. Verify fee", description: "Confirm paid, pending, or partial fee status.", href: "/payments" },
  { title: "4. Collect documents", description: "Upload missing certificates, ID proof, and admission forms.", href: "/documents" },
  { title: "5. Approve admission", description: "Move confirmed students into the proper student flow.", href: "/crm/admissions" },
  { title: "6. Inform family", description: "Send a simple message about the next academy step.", href: "/messages" }
];

const admissionFlow = [
  "Enquiry received",
  "Call or counselling done",
  "Application checked",
  "Fee and documents verified",
  "Admission approved"
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

  const isOperationsAdmin = data.customDashboard.dashboardTemplate === "ADMIN_OPERATIONS";
  const isAdmissionCell = isOperationsAdmin && data.customDashboard.designation === "Admission Cell";
  const pageName = isAdmissionCell ? "Admission Cell" : "Management";

  return (
    <RoleDashboardGuard role="ADMIN">
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHero
          eyebrow={pageName}
          title={isAdmissionCell ? "Simple admission desk" : "Management"}
          description={isAdmissionCell ? "Handle enquiries, applications, fees, documents, and admission approval in one clear place." : "Review platform-level operations, users, roles, branches, reports, and system controls."}
          actions={<Button type="button" onClick={() => refetch()} disabled={isFetching} variant="secondary">{isFetching ? "Refreshing..." : "Refresh dashboard"}</Button>}
          stats={[
            { value: String(data.totalStudents), label: "students" },
            { value: String(data.recentAdmissions.length), label: "applications" },
            { value: `Rs ${Math.round(data.totalRevenue.amount / 100000)}L`, label: "collected" }
          ]}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Students" value={String(data.totalStudents)} note="Active student records" />
          <StatCard label="Applications" value={String(data.recentAdmissions.length)} note="Latest admission records" />
          <StatCard label="Fees" value={`Rs ${Math.round(data.totalRevenue.amount / 100000)}L`} note={`${data.totalRevenue.quarter} collection`} />
          <StatCard label="Today" value={String(data.attendanceAnalytics.totalMarked)} note="Attendance entries marked" />
        </section>

        <SectionHeader eyebrow={pageName} title={isAdmissionCell ? "Choose what you want to do" : "Management work areas"} />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {commandModules.map((module) => (
            <QuickActionCard key={module.title} title={module.title} description={module.description} href={module.href} />
          ))}
        </section>

        {isAdmissionCell ? (
          <>
            <SectionHeader eyebrow="Daily Priority" title="Admission Cell focus" action={data.customDashboard.department} />
            <section className="grid gap-4 md:grid-cols-4">
              {data.customDashboard.focusAreas.map((area) => (
                <AnnouncementCard key={area} title={area} description="Keep this checked and updated before closing the day." tag="Admission" />
              ))}
            </section>
          </>
        ) : null}

        <section className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">{isAdmissionCell ? "Simple Flow" : "Control Flow"}</p>
          <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">{isAdmissionCell ? "From enquiry to admitted student" : "Management review flow"}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {admissionFlow.map((item, index) => (
              <div key={item} className="rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#071d36] text-xs font-bold text-[#e7c873]">{index + 1}</span>
                <p className="mt-3 text-sm font-semibold text-[#071d36]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">Latest Applications</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">Real admission records</h2>
            <div className="mt-5 grid gap-3">
              {data.recentAdmissions.length ? data.recentAdmissions.map((user) => (
                <div key={user.id} className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
                  <p className="text-sm font-semibold text-[#071d36]">{user.name}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{user.mobile || user.email || "Contact not added"}</p>
                </div>
              )) : (
                <div className="rounded-lg border border-[#071d36]/10 bg-[#fffdf8] p-4">
                  <p className="text-sm font-semibold text-[#071d36]">No applications yet</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">New applications will appear here when students apply from Academy Programs.</p>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6426]">NIDUS Help</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">What to do today</h2>
            <div className="mt-5 grid gap-3">
              {dailyActions.slice(0, 4).map((action) => (
                <QuickActionCard key={action.title} title={action.title} description={action.description} href={action.href} />
              ))}
            </div>
          </div>
        </section>

        <SectionHeader eyebrow="Daily Work" title="Admission Cell checklist" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dailyActions.map((action) => (
            <QuickActionCard key={action.title} title={action.title} description={action.description} href={action.href} />
          ))}
        </section>
      </motion.div>
    </RoleDashboardGuard>
  );
}
