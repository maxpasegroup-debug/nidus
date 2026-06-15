"use client";

import { motion } from "framer-motion";
import { AnnouncementCard, QuickActionCard, SectionHeader, StatCard } from "@/components/dashboard";
import { PageHero } from "@/components/layout/page-hero";

const hrFolders = [
  { title: "Identity Documents", description: "Aadhaar, PAN, address proof, photo, and emergency contact files.", tag: "ID" },
  { title: "Certificates", description: "Degree, teaching certificates, experience letters, and training records.", tag: "Docs" },
  { title: "Contracts", description: "Appointment letter, agreement, salary terms, and joining confirmation.", tag: "HR" },
  { title: "Performance", description: "Review notes, student feedback, monthly observation, and director remarks.", tag: "Review" },
  { title: "Attendance", description: "Staff attendance, leave history, late marks, and duty assignment records.", tag: "Time" },
  { title: "Payroll Notes", description: "Salary notes, incentives, deductions, and finance coordination files.", tag: "Pay" }
];

const onboardingSteps = [
  "Create staff profile and assign role.",
  "Upload identity, certificates, contract, and joining documents.",
  "Assign department, subject, batches, and dashboard access.",
  "Review performance and documents every month."
];

export default function StaffHrPage() {
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="HR & Staff Management"
        title="Employee onboarding and document folders"
        description="A simple HR workspace for staff profiles, role assignment, document folders, attendance, contracts, certificates, and monthly performance notes."
        stats={[
          { value: "6", label: "folder types" },
          { value: "4", label: "onboarding steps" },
          { value: "100%", label: "role access" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Staff Profiles" value="Ready" note="Create employees through Admin Center users" />
        <StatCard label="Documents" value="Folders" note="Organize files like computer folders" />
        <StatCard label="Roles" value="Controlled" note="Director, academic head, teacher, administrative officer and business development" />
        <StatCard label="Reviews" value="Monthly" note="Performance notes and follow-up actions" />
      </section>

      <SectionHeader eyebrow="Staff Folders" title="Documents management structure" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hrFolders.map((folder) => <AnnouncementCard key={folder.title} title={folder.title} description={folder.description} tag={folder.tag} />)}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="premium-surface rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Onboarding Flow</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">How HR should use this</h2>
          <div className="mt-5 grid gap-3">
            {onboardingSteps.map((step) => <div key={step} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{step}</div>)}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickActionCard title="Create staff user" description="Add staff and assign teacher, business development, administrative officer, academic head, or director role." href="/admin-center/users" />
          <QuickActionCard title="Upload documents" description="Use documents and media folders for HR files." href="/documents" />
          <QuickActionCard title="Manage permissions" description="Control what each employee can access." href="/admin-center/permissions" />
          <QuickActionCard title="Teacher dashboard" description="Open the simplified teaching workbench." href="/dashboard/teacher" />
        </div>
      </section>
    </motion.div>
  );
}
