"use client";

import { Archive, KeyRound, UserPlus, Users } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

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
    label: "Access & Password",
    href: "/dashboard/director/management?mode=access",
    icon: KeyRound,
    note: "Reset password, unlock accounts and handle login access.",
  },
];

export default function DirectorHrmPage() {
  return (
    <DirectorLauncher
      eyebrow="HRM"
      title="Staff And Access"
      description="Simple staff management: add staff, manage details, reset access and archive inactive staff."
      tiles={tiles}
      backHref="/dashboard/director"
    />
  );
}
