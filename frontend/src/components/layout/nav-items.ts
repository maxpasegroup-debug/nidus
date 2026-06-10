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
  { label: "Today", href: "/dashboard/teacher#today" },
  { label: "Classroom", href: "/dashboard/teacher#classroom" },
  { label: "Exams", href: "/dashboard/teacher#exams" },
  { label: "Assignments", href: "/dashboard/teacher#assignments" },
  { label: "Attendance", href: "/dashboard/teacher#attendance" },
  { label: "Library", href: "/dashboard/teacher#library" },
  { label: "Academic Calendar", href: "/dashboard/teacher#calendar" }
];

const academicHeadMenu = [
  { label: "Today", href: "/dashboard/teacher#today" },
  { label: "Batches", href: "/dashboard/teacher#batches" },
  { label: "Teacher Allocation", href: "/dashboard/teacher#teachers" },
  { label: "Timetable", href: "/dashboard/teacher#timetable" },
  { label: "Syllabus Tracker", href: "/dashboard/teacher#syllabus" },
  { label: "Exam Approval", href: "/examination-center" },
  { label: "Student Progress", href: "/performance-analytics" },
  { label: "Reports", href: "/progress-reports" }
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
  { label: "Send to Admission Cell", href: "/crm/admissions" },
  { label: "Messages", href: "/messages" },
  { label: "Reports", href: "/progress-reports" },
  { label: "Settings", href: "/dashboard/settings" }
];

const adminOperationsMenu = [
  { label: "Admission Cell", href: "/dashboard/admin" },
  { label: "Enquiries", href: "/crm/leads" },
  { label: "Applications", href: "/crm/admissions" },
  { label: "Examination Center", href: "/examination-center" },
  { label: "Question Bank", href: "/examination-center/question-bank" },
  { label: "Exams", href: "/examination-center/exams" },
  { label: "Published Exams", href: "/examination-center/published" },
  { label: "Results", href: "/examination-center/results" },
  { label: "Analytics", href: "/examination-center/analytics" },
  { label: "Follow-ups", href: "/crm/followups" },
  { label: "Fees", href: "/payments" },
  { label: "Documents", href: "/documents" },
  { label: "Messages", href: "/messages" },
  { label: "Reports", href: "/progress-reports" },
  { label: "Settings", href: "/dashboard/settings" }
];

const directorMenu = [
  { label: "Management", href: "/dashboard/director" },
  { label: "Today", href: "/dashboard/director#today" },
  { label: "Academy", href: "/dashboard/director#academy" },
  { label: "Academic Department", href: "/dashboard/director/academic" },
  { label: "Admissions", href: "/crm/admissions" },
  { label: "TOPRANK", href: "/dashboard/toprank" },
  { label: "NIDUS Guru", href: "/admin-center/guru" },
  { label: "Assessments", href: "/psychometric/admin" },
  { label: "Sales Booster", href: "/dashboard/marketing" },
  { label: "Finance", href: "/payments" },
  { label: "Team", href: "/staff-hr" },
  { label: "Reports", href: "/progress-reports" },
  { label: "Settings", href: "/dashboard/settings" }
];

export function getNavItems(role?: AuthRole, dashboardTemplate?: string | null) {
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
    return dashboardTemplate === "ACADEMIC_HEAD" ? academicHeadMenu : facultyMenu;
  }

  if (role === "MARKETING_COORDINATOR") {
    return salesBoosterMenu;
  }

  if (role === "TELECALLER") {
    return telecallerMenu;
  }

  return sharedLearningMenu.map((item) => (item.label === "Dashboard" ? { ...item, href: role ? roleDashboardPath[role] : "/dashboard" } : item));
}
