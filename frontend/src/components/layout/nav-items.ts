import type { AuthRole } from "@/services/auth";
import { roleDashboardPath } from "@/lib/dashboard-data";

export function getNavItems(role?: AuthRole) {
  return [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: role ? roleDashboardPath[role] : "/dashboard" },
    { label: "Courses", href: role === "GUEST" ? "/dashboard/guest" : "/dashboard/student" },
    { label: "Reports", href: role === "ADMIN" ? "/dashboard/admin" : "/dashboard" }
  ];
}
