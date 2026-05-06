import type { AuthRole } from "@/services/auth";
import { roleDashboardPath } from "@/lib/dashboard-data";

export function getNavItems(role?: AuthRole) {
  return [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: role ? roleDashboardPath[role] : "/dashboard" },
    { label: "Courses", href: "/courses" },
    { label: "My Courses", href: "/my-courses" }
  ];
}
