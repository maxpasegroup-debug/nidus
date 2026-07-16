"use client";

import { BadgeIndianRupee, Building2, ClipboardCheck, FileText, Mail, PlusCircle, UserPlus, WalletCards } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

const tiles: DirectorTile[] = [
  {
    label: "Admissions",
    href: "/dashboard/director/admissions",
    icon: UserPlus,
    note: "Open applications, payments, approvals and admission status.",
  },
  {
    label: "Applications",
    href: "/dashboard/admission-cell#applications",
    icon: ClipboardCheck,
    note: "Open the admission cell application queue.",
  },
  {
    label: "Approvals",
    href: "/crm/admissions",
    icon: ClipboardCheck,
    note: "Review admission approvals and handoff records.",
  },
  {
    label: "Add Student",
    href: "/dashboard/admission-cell#activation",
    icon: PlusCircle,
    note: "Activate admitted learners after payment and verification.",
  },
  {
    label: "Admission Cell",
    href: "/dashboard/admission-cell",
    icon: Building2,
    note: "Open the office desk for applications, documents and batches.",
  },
  {
    label: "Finance",
    href: "/dashboard/director/accounts?mode=overview",
    icon: BadgeIndianRupee,
    note: "Track collections, pending dues and account signals.",
  },
  {
    label: "Email Report",
    href: "/dashboard/director/accounts?mode=reports",
    icon: Mail,
    note: "Prepare date-filtered accounts reports for email sharing.",
  },
  {
    label: "Custom Report",
    href: "/dashboard/director/reports?mode=custom",
    icon: FileText,
    note: "Download filtered institution reports.",
  },
  {
    label: "Accounts",
    href: "/dashboard/director/accounts?mode=invoices",
    icon: WalletCards,
    note: "Open the complete accounts dashboard.",
  },
];

export default function DirectorAdminAccountsPage() {
  return (
    <DirectorLauncher
      eyebrow="Admin And Accounts"
      title="Admissions, Finance And Reports"
      description="Office operations are grouped into one-touch actions without crowding the Director home page."
      tiles={tiles}
      backHref="/dashboard/director"
    />
  );
}
