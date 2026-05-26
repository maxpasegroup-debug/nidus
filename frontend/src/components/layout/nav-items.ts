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
  { label: "TOPRANK", href: "/dashboard/toprank" },
  { label: "NIDUS Guru", href: "/dashboard/nidus-guru" },
  { label: "Academy Programs", href: "/dashboard/academy" },
  { label: "Assessments", href: "/dashboard/assessments" },
  { label: "Digital Profile", href: "/digital-profile" },
  { label: "Learning", href: "/courses" },
  { label: "Progress", href: "/progress-reports" },
  { label: "Mock Tests", href: "/tests" },
  { label: "Live", href: "/live-classes" }
];

const guestJourneyMenu = [
  { label: "My Journey", href: "/dashboard/guest" },
  { label: "TOPRANK", href: "/dashboard/toprank" },
  { label: "NIDUS Guru", href: "/dashboard/nidus-guru" },
  { label: "Academy Programs", href: "/dashboard/academy" },
  { label: "Assessments", href: "/dashboard/assessments" },
  { label: "Digital Profile", href: "/digital-profile" }
];

const facultyMenu = [
  { label: "Dashboard", href: "/dashboard/teacher" },
  { label: "My Classes", href: "/courses" },
  { label: "Students", href: "/performance-analytics" },
  { label: "Attendance", href: "/discipline" },
  { label: "CBT & Tests", href: "/tests" },
  { label: "Question Bank", href: "/pyq-bank" },
  { label: "Assignments", href: "/documents" },
  { label: "Study Materials", href: "/media-library" },
  { label: "Live Classes", href: "/live-classes" },
  { label: "Performance Analytics", href: "/performance-analytics" },
  { label: "Psychometric Reports", href: "/psychometric/reports" },
  { label: "NIDUS Guru", href: "/guru" },
  { label: "Communication Center", href: "/messages" },
  { label: "Timetable", href: "/sessions" },
  { label: "Tasks & Approvals", href: "/operations-hub" },
  { label: "Events & Camps", href: "/announcements" },
  { label: "Leave Management", href: "/staff-hr" },
  { label: "Doubt Support", href: "/ai-doubt-solver" },
  { label: "Counselling Notes", href: "/progress-reports" },
  { label: "My Reports", href: "/progress-reports" },
  { label: "Profile & Settings", href: "/dashboard/settings" }
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

  if (role === "GUEST") {
    return guestJourneyMenu;
  }

  if (role === "STUDENT" || role === "PARENT") {
    return learnerGuruMenu.map((item) => (item.label === "Dashboard" ? { ...item, href: roleDashboardPath[role] } : item));
  }

  if (role === "TEACHER") {
    return facultyMenu;
  }

  return sharedLearningMenu.map((item) => (item.label === "Dashboard" ? { ...item, href: role ? roleDashboardPath[role] : "/dashboard" } : item));
}
