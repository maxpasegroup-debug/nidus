"use client";

import { motion } from "framer-motion";
import { AnnouncementCard, QuickActionCard, SectionHeader, StatCard } from "@/components/dashboard";
import { PageHero } from "@/components/layout/page-hero";

const releaseChecks = [
  { title: "Authentication", description: "Login, session cookies, admin access, password change, and role dashboard routing.", tag: "Auth" },
  { title: "Payments", description: "Fees, invoices, subscriptions, Razorpay checkout, manual payment, and due follow-up.", tag: "Finance" },
  { title: "Reports", description: "Monthly progress reports, print/export readiness, parent view, and AI action plan.", tag: "Reports" },
  { title: "Content", description: "Courses, recorded lessons, media folders, documents, and live class links.", tag: "LMS" },
  { title: "Operations", description: "Hostel, mess, discipline, attendance, staff HR, and admin settings.", tag: "Campus" },
  { title: "Production", description: "Build, lint, health checks, env checks, audit logs, monitoring, and backups.", tag: "Go Live" }
];

export default function OperationsHubPage() {
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Operations & Production Hub"
        title="Finance, campus, reports, and go-live controls"
        description="A final operations view for management polish: fee workflows, campus operations, documents, reporting, audit, production readiness, and launch checks."
        stats={[
          { value: "14", label: "phases mapped" },
          { value: "6", label: "release checks" },
          { value: "100%", label: "management view" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Finance" value="Ready" note="Fees, payments, invoices, subscriptions" />
        <StatCard label="Campus" value="Ready" note="Hostel, mess, discipline, documents" />
        <StatCard label="Reports" value="Monthly" note="Progress and parent-ready reporting" />
        <StatCard label="Production" value="Checked" note="Build, lint, audit, and monitoring path" />
      </section>

      <SectionHeader eyebrow="Release Checklist" title="Final production-grade areas" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {releaseChecks.map((check) => <AnnouncementCard key={check.title} title={check.title} description={check.description} tag={check.tag} />)}
      </section>

      <SectionHeader eyebrow="Operations Shortcuts" title="Management work areas" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard title="Fees and payments" description="Collection, dues, invoices, and receipts." href="/payments" />
        <QuickActionCard title="Hostel operations" description="Rooms, allocations, leave, in/out, and mess." href="/hostel" />
        <QuickActionCard title="Documents" description="Staff, student, academic, and admin folders." href="/documents" />
        <QuickActionCard title="Admin operations" description="Runtime, queues, health, analytics, and environment status." href="/admin-center/operations" />
        <QuickActionCard title="Progress reports" description="Monthly parent-ready student growth reports." href="/progress-reports" />
        <QuickActionCard title="Staff HR" description="Employee onboarding and document management." href="/staff-hr" />
        <QuickActionCard title="Audit logs" description="Review auth, role, and admin activity." href="/admin-center/audit-logs" />
        <QuickActionCard title="NIDUS AI" description="Ask NIDUS for pending work and next actions." href="/nidus-ai" />
      </section>
    </motion.div>
  );
}
