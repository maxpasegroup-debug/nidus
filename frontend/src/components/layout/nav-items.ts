import type { AuthRole } from "@/services/auth";
import { roleDashboardPath } from "@/lib/dashboard-data";

export function getNavItems(role?: AuthRole) {
  return [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: role ? roleDashboardPath[role] : "/dashboard" },
    { label: "Courses", href: "/courses" },
    { label: "Tests", href: "/tests" },
    { label: "SSB", href: "/psychometric" },
    { label: "AI Plan", href: "/ai-study-planner" },
    { label: "Live", href: "/live-classes" },
    { label: "My Courses", href: "/my-courses" },
    { label: "Hostel", href: "/hostel" },
    { label: "Mess", href: "/mess-menu" }
  ];
}
