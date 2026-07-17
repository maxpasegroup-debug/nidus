"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeIndianRupee,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileArchive,
  FileText,
  GraduationCap,
  Handshake,
  MessageSquareText,
  Parentheses,
  PhoneCall,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, Panel, StatusChip } from "@/components/design-system";

export type AdmissionJourneyRole = "DIRECTOR" | "ADMISSION_CELL" | "COUNSELLOR";

type JourneyStep = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const journeySteps: JourneyStep[] = [
  { label: "Lead", href: "/crm/leads", icon: UserPlus, description: "Capture enquiry from CRM, guest applicant or campaign source." },
  { label: "First Contact", href: "/dashboard/business-development?tab=CALLING", icon: PhoneCall, description: "Call the student or parent and record the first response." },
  { label: "Follow-up", href: "/crm/followups", icon: CalendarClock, description: "Schedule the next touchpoint and keep lead notes updated." },
  { label: "Counselling", href: "/crm/counselling", icon: Handshake, description: "Book counselling and confirm program fit." },
  { label: "Application", href: "/dashboard/admission-cell#applications", icon: FileText, description: "Open applicant file and verify admission details." },
  { label: "Documents", href: "/dashboard/admission-cell#documents", icon: FileArchive, description: "Upload and verify admission documents." },
  { label: "Approval", href: "/dashboard/admission-cell#activation", icon: ShieldCheck, description: "Approve admission only after readiness checks pass." },
  { label: "Fees", href: "/dashboard/admission-cell#fees", icon: BadgeIndianRupee, description: "Record fee status using existing payment workflow." },
  { label: "Batch", href: "/dashboard/admission-cell#batch", icon: Users, description: "Allocate the learner to active batch or batches." },
  { label: "Activation", href: "/dashboard/admission-cell#activation", icon: UserCheck, description: "Generate student access and activate dashboard." },
  { label: "Parent Invite", href: "/parent-link", icon: Parentheses, description: "Link parent access after student activation." },
  { label: "Welcome Kit", href: "/messages", icon: MessageSquareText, description: "Send welcome communication and next steps." },
  { label: "Planner", href: "/dashboard/director/academic/batches", icon: BookOpenCheck, description: "Confirm academic planner and timetable access." },
];

const roleActions: Record<AdmissionJourneyRole, JourneyStep[]> = {
  DIRECTOR: [
    { label: "Admission Overview", href: "/dashboard/director/admissions", icon: GraduationCap, description: "Track conversion, approvals, revenue forecast and admissions health." },
    { label: "Today's Admissions", href: "/dashboard/admission-cell#today", icon: ClipboardCheck, description: "Open admission cell work waiting today." },
    { label: "Pending Approvals", href: "/crm/admissions", icon: ShieldCheck, description: "Review admission approvals and scholarship requests." },
    { label: "Revenue Forecast", href: "/dashboard/director/accounts", icon: BadgeIndianRupee, description: "Review pending fees and receipt readiness." },
  ],
  ADMISSION_CELL: [
    { label: "Today's Leads", href: "/crm/leads", icon: UserPlus, description: "Open fresh enquiries and application-ready leads." },
    { label: "Today's Follow-ups", href: "/crm/followups", icon: CalendarClock, description: "Call or update scheduled follow-ups." },
    { label: "Counselling Schedule", href: "/crm/counselling", icon: Handshake, description: "Review counselling bookings and notes." },
    { label: "Pending Documents", href: "/dashboard/admission-cell#documents", icon: FileArchive, description: "Verify uploaded admission documents." },
    { label: "Pending Approvals", href: "/dashboard/admission-cell#activation", icon: ShieldCheck, description: "Move paid and verified applicants to activation." },
    { label: "Completed Admissions", href: "/dashboard/admission-cell#students", icon: UserCheck, description: "Review active learners and batches." },
  ],
  COUNSELLOR: [
    { label: "Today's Calls", href: "/crm/leads", icon: PhoneCall, description: "Open leads needing counsellor action." },
    { label: "Today's Meetings", href: "/crm/counselling", icon: Handshake, description: "Check scheduled counselling sessions." },
    { label: "Lead Notes", href: "/crm/leads", icon: MessageSquareText, description: "Update parent/student discussion notes." },
    { label: "Next Follow-up", href: "/crm/followups", icon: CalendarClock, description: "Schedule next follow-up before closing the call." },
    { label: "Admission Status", href: "/crm/admissions", icon: GraduationCap, description: "Track application and admission progress." },
  ],
};

const automationSteps = [
  "Assign Batch",
  "Generate Student Profile",
  "Generate Parent Account",
  "Assign Academic Planner",
  "Create Timetable Access",
  "Enable Student Dashboard",
  "Send Welcome Notification",
];

const documentGroups = ["Admission Form", "ID Proof", "Certificates", "Photos", "Medical", "Other Documents"];

export function AdmissionJourneyBanner({
  role,
  title = "Admission Journey",
  description = "Admissions now follows one guided path from lead to activated student and academic planner assignment.",
  metrics,
}: {
  role: AdmissionJourneyRole;
  title?: string;
  description?: ReactNode;
  metrics?: Array<{ label: string; value: ReactNode; tone?: "default" | "success" | "warning" | "danger" | "info" }>;
}) {
  return (
    <Panel>
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusChip tone="info">Single CRM</StatusChip>
            <StatusChip tone="success">Guided Admission</StatusChip>
          </div>
          <h2 className="mt-4 text-3xl font-black text-[var(--ds-color-text)]">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ds-color-muted)]">{description}</p>
          <AdmissionJourneyRail className="mt-5" />
        </div>
        <div className="grid gap-3">
          {(metrics ?? []).slice(0, 4).map((metric) => (
            <Card key={metric.label} className="p-4">
              <p className="ds-text-label text-[var(--ds-color-muted)]">{metric.label}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-2xl font-black">{metric.value}</p>
                <StatusChip tone={metric.tone ?? "default"}>{metric.label}</StatusChip>
              </div>
            </Card>
          ))}
          {!metrics?.length ? <AdmissionRoleActions role={role} compact /> : null}
        </div>
      </div>
    </Panel>
  );
}

export function AdmissionRoleActions({ role, compact = false }: { role: AdmissionJourneyRole; compact?: boolean }) {
  return (
    <section className={compact ? "grid gap-2" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
      {roleActions[role].map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={`${role}-${item.label}`}
            href={item.href}
            className="group rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-4 shadow-[var(--ds-shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--ds-color-border-strong)] hover:shadow-[var(--ds-shadow-medium)]"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-black text-[var(--ds-color-text)]">{item.label}</h3>
                {!compact ? <p className="mt-2 text-sm leading-6 text-[var(--ds-color-muted)]">{item.description}</p> : null}
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export function AdmissionJourneyRail({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`} aria-label="NIDUS admission pipeline">
      <div className="flex min-w-max gap-2">
        {journeySteps.map((step, index) => (
          <Link
            key={step.label}
            href={step.href}
            className="rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border)] bg-[var(--ds-color-muted-soft)] px-3 py-2 text-xs font-black text-[var(--ds-color-text)]"
          >
            {index + 1}. {step.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AdmissionAutomationPanel() {
  return (
    <Panel>
      <p className="ds-text-label text-[var(--ds-color-primary)]">After Admission Approval</p>
      <h2 className="mt-1 text-xl font-black">Automation Checklist</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {automationSteps.map((step) => (
          <div key={step} className="flex items-center gap-2 rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-3 py-2 text-sm font-black">
            <CheckCircle2 className="h-4 w-4 text-[var(--ds-color-success)]" aria-hidden="true" />
            {step}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--ds-color-muted)]">
        This uses the existing admission approval and academy activation workflow. No duplicate student creation or payment flow is introduced.
      </p>
    </Panel>
  );
}

export function AdmissionDocumentsPanel() {
  return (
    <Panel>
      <p className="ds-text-label text-[var(--ds-color-primary)]">Document Management</p>
      <h2 className="mt-1 text-xl font-black">Admission document groups</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {documentGroups.map((group) => (
          <Link key={group} href="/dashboard/admission-cell#documents" className="rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-3 py-3 text-sm font-black">
            {group}
          </Link>
        ))}
      </div>
    </Panel>
  );
}
