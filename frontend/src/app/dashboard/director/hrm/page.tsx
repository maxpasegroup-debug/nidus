"use client";

import { Archive, KeyRound, LockKeyhole, ShieldCheck, UserPlus, Users } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

const tiles: DirectorTile[] = [
  {
    label: "Add Employee",
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
    label: "Lock Access",
    href: "/dashboard/director/management?mode=access",
    icon: LockKeyhole,
    note: "Block account access for selected employees.",
  },
  {
    label: "Reset Password",
    href: "/dashboard/director/management?mode=access",
    icon: KeyRound,
    note: "Help staff regain access without changing their role.",
  },
  {
    label: "Roles",
    href: "/dashboard/director/management?mode=roles",
    icon: ShieldCheck,
    note: "Control what each role can view and operate.",
  },
  {
    label: "Permissions",
    href: "/dashboard/director/management?mode=permissions",
    icon: ShieldCheck,
    note: "Review access rules before using advanced permissions.",
  },
];

export default function DirectorHrmPage() {
  return (
    <DirectorLauncher
      eyebrow="HRM"
      title="Staff And Access"
      description="Simple access to employee creation, staff management, archive, password and role controls."
      tiles={tiles}
      backHref="/dashboard/director"
    />
  );
}
