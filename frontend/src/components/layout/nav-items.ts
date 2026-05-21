import type { AuthRole } from "@/services/auth.v2";
import { roleDashboardPath } from "@/lib/dashboard-data";

const sharedLearningMenu = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Courses", href: "/courses" },
  { label: "Tests", href: "/tests" },
  { label: "Reports", href: "/progress-reports" },
  { label: "NIDUS AI", href: "/nidus-ai" },
  { label: "Live", href: "/live-classes" },
  { label: "Media", href: "/media-library" },
  { label: "Docs", href: "/documents" },
  { label: "Messages", href: "/messages" },
  { label: "Settings", href: "/dashboard/settings" }
];

const learnerGuruMenu = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Digital Profile", href: "/digital-profile" },
  { label: "Learning", href: "/courses" },
  { label: "Assessments", href: "/psychometric" },
  { label: "NIDUS Guru", href: "/guru" },
  { label: "Profile", href: "/dashboard/settings" },
  { label: "Progress", href: "/progress-reports" },
  { label: "Mock Tests", href: "/tests" },
  { label: "Live", href: "/live-classes" },
  { label: "Messages", href: "/messages" }
];

export function getNavItems(role?: AuthRole) {
  if (role === "ADMIN") {
    return [
      { label: "Dashboard", href: "/dashboard/admin" },
      { label: "Today", href: "/operations-hub" },
      { label: "Academic Department", href: "/courses" },
      { label: "Admission Cell", href: "/crm" },
      { label: "HR Department", href: "/admin-center/users" },
      { label: "Programs & Fees", href: "/fees" },
      { label: "Classes & Content", href: "/live-classes" },
      { label: "Exams & Progress", href: "/tests" },
      { label: "Finance", href: "/payments" },
      { label: "NIDUS AI", href: "/nidus-ai" },
      { label: "Reports", href: "/progress-reports" },
      { label: "Messages", href: "/messages" },
      { label: "Settings", href: "/admin-center" }
    ];
  }

  if (role === "DIRECTOR") {
    return [
      { label: "Dashboard", href: "/dashboard/director" },
      { label: "Today", href: "/operations-hub" },
      { label: "Academic Department", href: "/courses" },
      { label: "Admission Cell", href: "/crm" },
      { label: "HR Department", href: "/staff-hr" },
      { label: "Classes & Content", href: "/live-classes" },
      { label: "Exams & Progress", href: "/tests" },
      { label: "Finance", href: "/payments" },
      { label: "NIDUS AI", href: "/nidus-ai" },
      { label: "Reports", href: "/progress-reports" },
      { label: "Messages", href: "/messages" },
      { label: "Settings", href: "/dashboard/settings" }
    ];
  }

  if (role === "GUEST" || role === "STUDENT" || role === "PARENT") {
    return learnerGuruMenu.map((item) => (item.label === "Dashboard" ? { ...item, href: roleDashboardPath[role] } : item));
  }

  return sharedLearningMenu.map((item) => (item.label === "Dashboard" ? { ...item, href: role ? roleDashboardPath[role] : "/dashboard" } : item));
}
