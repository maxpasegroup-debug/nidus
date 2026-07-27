export type DashboardNavItem = {
  label: string;
  href: string;
};

export type NavItem = DashboardNavItem;

const studentMenu: DashboardNavItem[] = [
  { label: "Home", href: "/dashboard/student" },
  { label: "Learning", href: "/dashboard/student/learning" },
  { label: "Practice", href: "/tests" },
  { label: "Exams", href: "/dashboard/student/exams" },
  { label: "Progress", href: "/dashboard/student/progress" },
  { label: "Profile", href: "/dashboard/settings" },
];

const guestMenu: DashboardNavItem[] = [
  { label: "Home", href: "/dashboard/guest" },
  { label: "Apply", href: "/dashboard/guest/academy" },
  { label: "Assessments", href: "/dashboard/guest/assessments" },
  { label: "Applications", href: "/dashboard/guest/applications" },
  { label: "Profile", href: "/dashboard/settings" },
];

const parentMenu: DashboardNavItem[] = [
  { label: "Home", href: "/dashboard/parent#today" },
  { label: "Child Progress", href: "/dashboard/parent#progress" },
  { label: "Attendance", href: "/dashboard/parent#attendance" },
  { label: "Fees", href: "/dashboard/parent#fees" },
  { label: "Messages", href: "/messages" },
  { label: "Profile", href: "/dashboard/settings" },
];

const teacherMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/teacher" },
  { label: "Classes", href: "/dashboard/teacher/my-classes" },
  { label: "Attendance", href: "/dashboard/teacher/attendance" },
  { label: "Assignments", href: "/dashboard/teacher/assignments" },
  { label: "Exams", href: "/dashboard/teacher/exams" },
  { label: "Students", href: "/dashboard/teacher/students" },
  { label: "NDP", href: "/dashboard/teacher/ndp" },
  { label: "Resources", href: "/dashboard/teacher/library" },
  { label: "Profile", href: "/dashboard/settings" },
];

const videoEditorMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/video-editor" },
  { label: "Uploads", href: "/dashboard/video-editor#uploads" },
  { label: "Pending Videos", href: "/dashboard/video-editor#pending" },
  { label: "Published Videos", href: "/dashboard/video-editor#published" },
  { label: "Profile", href: "/dashboard/settings" },
];

const physicalTrainerMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/physical-trainer" },
  { label: "Batches", href: "/dashboard/physical-trainer/batches" },
  { label: "Attendance", href: "/dashboard/physical-trainer/attendance" },
  { label: "Fitness Records", href: "/dashboard/physical-trainer/fitness-records" },
  { label: "Reports", href: "/dashboard/physical-trainer/reports" },
  { label: "Profile", href: "/dashboard/settings" },
];

const directorMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/director" },
  { label: "Academics", href: "/dashboard/director/academic" },
  { label: "Students", href: "/dashboard/director/students" },
  { label: "Admissions", href: "/dashboard/director/admissions" },
  { label: "Staff & Access", href: "/dashboard/director/management" },
  { label: "Accounts", href: "/dashboard/director/accounts" },
  { label: "Reports", href: "/dashboard/director/reports" },
  { label: "Readiness", href: "/dashboard/director/launch-qa" },
  { label: "Settings", href: "/dashboard/settings" },
];

const academicHeadMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/academic-head" },
  { label: "My Classes", href: "/dashboard/academic-head/my-classes" },
  { label: "Planner", href: "/dashboard/academic-head/hod/timetable" },
  { label: "Faculty", href: "/dashboard/academic-head/hod/teacher-allocation" },
  { label: "Students", href: "/dashboard/academic-head/students" },
  { label: "NDP", href: "/dashboard/academic-head/ndp" },
  { label: "Reports", href: "/dashboard/academic-head/hod/reports" },
  { label: "Profile", href: "/dashboard/settings" },
];

const administrativeOfficerMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/admission-cell#today" },
  { label: "Leads", href: "/crm/leads" },
  { label: "Applications", href: "/dashboard/admission-cell#applications" },
  { label: "Counselling", href: "/crm/counselling" },
  { label: "Admissions", href: "/crm/admissions" },
  { label: "Profile", href: "/dashboard/settings" },
];

const businessDevelopmentMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/business-development" },
  { label: "Leads", href: "/dashboard/business-development?tab=LEADS" },
  { label: "Follow-ups", href: "/dashboard/business-development?tab=FOLLOWUPS" },
  { label: "Reports", href: "/dashboard/business-development?tab=REPORTS" },
  { label: "Profile", href: "/dashboard/settings" },
];

const adminMenu: DashboardNavItem[] = [
  { label: "CEO Dashboard", href: "/admin-center" },
  { label: "Users & Staff", href: "/admin-center/users" },
  { label: "Roles", href: "/admin-center/roles" },
  { label: "Permissions", href: "/admin-center/permissions" },
  { label: "Platform Health", href: "/admin-center/operations" },
  { label: "Branches", href: "/admin-center/branches" },
  { label: "Audit Logs", href: "/admin-center/audit-logs" },
  { label: "System Settings", href: "/admin-center/settings" },
  { label: "Profile", href: "/dashboard/settings" },
];

const accountsMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/director/accounts" },
  { label: "Collect Fee", href: "/dashboard/director/accounts?tab=collect" },
  { label: "Pending Dues", href: "/dashboard/director/accounts?tab=dues" },
  { label: "Receipts", href: "/dashboard/director/accounts?tab=receipts" },
  { label: "Reports", href: "/dashboard/director/accounts?tab=reports" },
  { label: "Profile", href: "/dashboard/settings" },
];

export function getNavItems(role?: string | null, dashboardTemplate?: string | null): DashboardNavItem[] {
  const normalizedRole = role?.toUpperCase();
  const normalizedTemplate = dashboardTemplate?.toUpperCase();

  if (normalizedRole === "DIRECTOR") {
    return directorMenu;
  }

  if (normalizedTemplate === "VIDEO_EDITOR") {
    return videoEditorMenu;
  }

  if (normalizedTemplate === "ACCOUNTS" || normalizedTemplate === "ACCOUNTANT" || normalizedTemplate === "FINANCE") {
    return accountsMenu;
  }

  if (normalizedRole === "ACADEMIC_HEAD" || normalizedTemplate === "ACADEMIC_HEAD") {
    return academicHeadMenu;
  }

  if (normalizedRole === "PHYSICAL_TRAINER" || normalizedRole === "PHYSICAL_INSTRUCTOR") {
    return physicalTrainerMenu;
  }

  if (normalizedRole === "TEACHER") {
    return teacherMenu;
  }

  if (normalizedRole === "ADMINISTRATIVE_OFFICER" || normalizedRole === "ADMISSION_CELL") {
    return administrativeOfficerMenu;
  }

  if (normalizedRole === "BUSINESS_DEVELOPMENT_EXECUTIVE" || normalizedRole === "MARKETING_COORDINATOR" || normalizedRole === "SALES_BOOSTER" || normalizedRole === "TELECALLER") {
    return businessDevelopmentMenu;
  }

  if (normalizedRole === "STUDENT") {
    return studentMenu;
  }

  if (normalizedRole === "PARENT") {
    return parentMenu;
  }

  if (normalizedRole === "GUEST") {
    return guestMenu;
  }

  if (normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN" || normalizedRole === "MANAGEMENT") {
    return adminMenu;
  }

  return studentMenu;
}

export { accountsMenu, directorMenu, guestMenu, parentMenu, studentMenu };
