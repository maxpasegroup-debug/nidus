"use client";

import { BadgeIndianRupee, ClipboardCheck, UserPlus, Users, WalletCards } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

const tiles: DirectorTile[] = [
  {
    label: "Applications",
    href: "/dashboard/admission-cell#applications",
    icon: ClipboardCheck,
    note: "Open and verify new applications.",
  },
  {
    label: "Admissions / Activation",
    href: "/dashboard/director/admissions",
    icon: UserPlus,
    note: "Approve paid learners and activate them into batches.",
  },
  {
    label: "Collect Fee",
    href: "/dashboard/director/accounts?tab=collect",
    icon: WalletCards,
    note: "Search student, collect amount and save receipt.",
  },
  {
    label: "Student Records",
    href: "/dashboard/admission-cell#students",
    icon: Users,
    note: "View admitted students, batch status and profile records.",
  },
  {
    label: "Finance Reports",
    href: "/dashboard/director/accounts?tab=reports",
    icon: BadgeIndianRupee,
    note: "Open filtered collection, pending due and monthly reports.",
  },
];

export default function DirectorAdminAccountsPage() {
  return (
    <DirectorLauncher
      eyebrow="Admin And Accounts"
      title="Admissions, Finance And Reports"
      description="Simple office flow: applications, admission activation, payments, student records and finance reports."
      tiles={tiles}
      backHref="/dashboard/director"
    />
  );
}
