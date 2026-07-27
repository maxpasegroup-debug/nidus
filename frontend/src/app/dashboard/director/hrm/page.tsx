"use client";

import { Archive, KeyRound, UserPlus, Users } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";
import { OperationsOsWorkspace } from "@/components/operations/operations-os-workspace";

const tiles: DirectorTile[] = [
  {
    label: "Add Staff",
    href: "/dashboard/director/management?mode=add",
    icon: UserPlus,
    note: "Create staff profiles for teachers, trainers and office roles.",
  },
  {
    label: "Manage Staff",
    href: "/dashboard/director/management?mode=manage",
    icon: Users,
    note: "Review active employees, role assignment and staff details.",
  },
  {
    label: "Archive Staff",
    href: "/dashboard/director/management?mode=archive",
    icon: Archive,
    note: "Move inactive staff out of daily operations.",
  },
  {
    label: "Access & PIN",
    href: "/dashboard/director/management?mode=access",
    icon: KeyRound,
    note: "Reset PIN, unlock accounts and handle login access.",
  },
];

export default function DirectorHrmPage() {
  return (
    <>
      <section className="bg-[var(--page-bg)] px-4 pt-6">
        <div className="mx-auto max-w-[1500px]">
        <OperationsOsWorkspace
          title="HR Operating System"
          description="Recruitment, employee profile, documents, attendance, leave, payroll, performance, training and exit are organized here without replacing the existing staff management tools."
          metrics={[
            { label: "Employee Directory", value: "Staff", note: "Open Manage Staff for live directory", tone: "info" },
            { label: "Recruitment", value: "Add", note: "Create employee profile and access", tone: "success" },
            { label: "Payroll", value: "Linked", note: "Payroll calculations stay in existing payroll workflow", tone: "info" },
            { label: "Exit", value: "Archive", note: "Move inactive staff out of daily operations", tone: "default" },
          ]}
          alerts={[
            { title: "HR health", detail: "Use Manage Staff for staff strength, access risk and archived history.", href: "/dashboard/director/management?mode=manage", tone: "info" },
            { title: "Payroll summary", detail: "Review staff records first; payroll can be connected from the accounts workflow when finalized.", href: "/dashboard/director/management?mode=manage", tone: "info" },
            { title: "Leave and approvals", detail: "Keep staff access and archive decisions inside Director staff management.", href: "/dashboard/director/management?mode=archive", tone: "info" },
          ]}
        />
        </div>
      </section>
        <DirectorLauncher
          eyebrow="HRM"
          title="Staff And Access"
          description="Simple staff management: add staff, manage details, reset access and archive inactive staff."
          tiles={tiles}
          backHref="/dashboard/director"
        />
    </>
  );
}
