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
  { label: "My Journey", href: "/dashboard" },
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

const parentMenu = [
  { label: "Parent View", href: "/dashboard/parent" },
  { label: "Progress", href: "/progress-reports" },
  { label: "Assessments", href: "/dashboard/assessments" },
  { label: "Digital Profile", href: "/digital-profile" },
  { label: "Fees", href: "/payments" },
  { label: "Messages", href: "/messages" },
  { label: "Settings", href: "/dashboard/settings" }
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
  { label: "My Dashboard", href: "/dashboard/teacher" },
  { label: "Classes", href: "/live-classes" },
  { label: "Teachers", href: "/staff-hr" },
  { label: "Students", href: "/performance-analytics" },
  { label: "Exams & Tests", href: "/tests" },
  { label: "Attendance", href: "/discipline" },
  { label: "Assignments", href: "/documents" },
  { label: "Study Materials", href: "/media-library" },
  { label: "NIDUS AI Professor", href: "/tests" },
  { label: "Reports", href: "/progress-reports" },
  { label: "Settings", href: "/dashboard/settings" }
];

const salesBoosterMenu = [
  { label: "Sales Booster", href: "/dashboard/marketing" },
  { label: "Campaign Builder", href: "/dashboard/marketing" },
  { label: "Lead CRM", href: "/crm/leads" },
  { label: "Creatives", href: "/media-library" },
  { label: "WhatsApp Center", href: "/messages" },
  { label: "Analytics", href: "/performance-analytics" },
  { label: "Reports", href: "/progress-reports" },
  { label: "Settings", href: "/dashboard/settings" }
];

const telecallerMenu = [
  { label: "My Calls", href: "/dashboard/telecaller" },
  { label: "New Leads", href: "/crm/leads" },
  { label: "Follow-ups", href: "/crm/followups" },
  { label: "Counselling", href: "/crm/counselling" },
  { label: "Send to Admin", href: "/crm/admissions" },
  { label: "Messages", href: "/messages" },
  { label: "Reports", href: "/progress-reports" },
  { label: "Settings", href: "/dashboard/settings" }
];

const adminOperationsMenu = [
  { label: "Administration", href: "/dashboard/admin" },
  { label: "Admission Handover", href: "/crm/admissions" },
  { label: "Student Records", href: "/admin-center/users" },
  { label: "Fee Follow-up", href: "/payments" },
  { label: "Documents", href: "/documents" },
  { label: "Notices", href: "/announcements" },
  { label: "Staff Records", href: "/staff-hr" },
  { label: "Reports", href: "/progress-reports" },
  { label: "Messages", href: "/messages" },
  { label: "Settings", href: "/admin-center" }
];

const directorMenu = [
  { label: "Director Desk", href: "/dashboard/director" },
  { label: "Today", href: "/operations-hub" },
  { label: "Admissions", href: "/crm" },
  { label: "Academics", href: "/courses" },
  { label: "Finance", href: "/payments" },
  { label: "Staff & HR", href: "/staff-hr" },
  { label: "Assessment Command", href: "/psychometric/admin" },
  { label: "Reports", href: "/progress-reports" },
  { label: "NIDUS AI", href: "/nidus-ai" },
  { label: "Settings", href: "/dashboard/settings" }
];

export function getNavItems(role?: AuthRole) {
  if (role === "ADMIN") {
    return adminOperationsMenu;
  }

  if (role === "DIRECTOR") {
    return directorMenu;
  }

  if (role === "GUEST") {
    return guestJourneyMenu;
  }

  if (role === "STUDENT") {
    return learnerGuruMenu.map((item) => (item.label === "My Journey" ? { ...item, href: roleDashboardPath[role] } : item));
  }

  if (role === "PARENT") {
    return parentMenu;
  }

  if (role === "TEACHER") {
    return facultyMenu;
  }

  if (role === "MARKETING_COORDINATOR") {
    return salesBoosterMenu;
  }

  if (role === "TELECALLER") {
    return telecallerMenu;
  }

  return sharedLearningMenu.map((item) => (item.label === "Dashboard" ? { ...item, href: role ? roleDashboardPath[role] : "/dashboard" } : item));
}
