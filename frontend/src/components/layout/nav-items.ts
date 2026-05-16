import type { AuthRole } from "@/services/auth";
import { roleDashboardPath } from "@/lib/dashboard-data";

export function getNavItems(role?: AuthRole) {
  return [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: role ? roleDashboardPath[role] : "/dashboard" },
    { label: "Courses", href: "/courses" },
    { label: "Tests", href: "/tests" },
    { label: "PYQ", href: "/pyq-bank" },
    { label: "Battles", href: "/quiz-battles" },
    { label: "SSB", href: "/psychometric" },
    { label: "AI Plan", href: "/ai-study-planner" },
    { label: "AI Interview", href: "/ai-interview" },
    { label: "Live", href: "/live-classes" },
    { label: "Media", href: "/media-library" },
    { label: "Docs", href: "/documents" },
    { label: "Fitness", href: "/fitness" },
    { label: "My Courses", href: "/my-courses" },
    { label: "CRM", href: "/crm" },
    { label: "Admin", href: "/admin-center" },
    { label: "Settings", href: "/dashboard/settings" },
    { label: "Payments", href: "/payments" },
    { label: "Messages", href: "/messages" },
    { label: "Hostel", href: "/hostel" },
    { label: "Mess", href: "/mess-menu" }
  ];
}
