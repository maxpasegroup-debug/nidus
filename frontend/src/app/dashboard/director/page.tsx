"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeIndianRupee, BarChart3, Bell, GraduationCap, Megaphone, ShieldCheck, UserCog } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";
import { getDirectorDashboard } from "@/services/dashboard";

export default function DirectorDashboardPage() {
  const directorQuery = useQuery({ queryKey: ["dashboard", "director", "control-panel"], queryFn: getDirectorDashboard });
  const commandCenter = directorQuery.data?.commandCenter;
  const pendingAdmissions = commandCenter?.operationalAlerts.pendingAdmissions ?? 0;
  const pendingFees = commandCenter?.operationalAlerts.pendingFees ?? 0;
  const activeStudents = commandCenter?.students.active ?? directorQuery.data?.instituteAnalytics.students ?? 0;

  const tiles: DirectorTile[] = [
    {
      label: "Academics",
      href: "/dashboard/director/academic",
      icon: GraduationCap,
      note: "Courses, timetable, batches, teachers, student progress and academic reports.",
    },
    {
      label: "HRM",
      href: "/dashboard/director/hrm",
      icon: UserCog,
      note: "Add staff, manage access, archive employees, reset passwords and roles.",
    },
    {
      label: "Marketing & Sales",
      href: "/dashboard/director/marketing-sales",
      icon: Megaphone,
      note: "Telecallers, BDE team, leads, campaigns, follow-ups and future social channels.",
    },
    {
      label: "Admin & Accounts",
      href: "/dashboard/director/admin-accounts",
      icon: BadgeIndianRupee,
      badge: pendingAdmissions || pendingFees || undefined,
      note: "Admissions, approvals, student activation, finance, accounts and custom reports.",
    },
    {
      label: "Notifications",
      href: "/dashboard/director/notifications",
      icon: Bell,
      note: "One-click announcements for teachers, students and selected batches.",
    },
    {
      label: "Reports",
      href: "/dashboard/director/reports",
      icon: BarChart3,
      note: "Institute health, academic delivery, finance pressure and launch readiness.",
    },
    {
      label: "Launch QA",
      href: "/dashboard/director/launch-qa",
      icon: ShieldCheck,
      note: "Final public-launch checklist across users, classes, finance and content.",
    },
  ];

  return (
    <DirectorLauncher
      eyebrow="Director"
      title="NIDUS Control Panel"
      description="Choose one department. Each tile opens a separate workspace so the Director screen stays simple, readable and fast."
      tiles={tiles}
      stats={[
        { label: "Admissions", value: directorQuery.isLoading ? "..." : pendingAdmissions },
        { label: "Students", value: directorQuery.isLoading ? "..." : activeStudents },
        { label: "Fees Due", value: directorQuery.isLoading ? "..." : pendingFees },
      ]}
    />
  );
}
