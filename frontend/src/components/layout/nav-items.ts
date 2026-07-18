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
  { label: "Profile", href: "/digital-profile" },
];

const guestMenu: DashboardNavItem[] = [
  { label: "Home", href: "/dashboard/guest" },
  { label: "Apply", href: "/dashboard/guest/academy" },
  { label: "Assessments", href: "/dashboard/guest/assessments" },
  { label: "Applications", href: "/dashboard/guest/applications" },
];

const parentMenu: DashboardNavItem[] = [
  { label: "Home", href: "/dashboard/parent#today" },
  { label: "Child Progress", href: "/dashboard/parent#progress" },
  { label: "Attendance", href: "/dashboard/parent#attendance" },
  { label: "Fees", href: "/dashboard/parent#fees" },
  { label: "Messages", href: "/messages" },
];

const teacherMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/teacher" },
  { label: "Classes", href: "/dashboard/teacher/classes" },
  { label: "Attendance", href: "/dashboard/teacher/attendance" },
  { label: "Assignments", href: "/dashboard/teacher/assignments" },
  { label: "Exams", href: "/dashboard/teacher/exams" },
  { label: "Students", href: "/dashboard/teacher/students" },
  { label: "Resources", href: "/dashboard/teacher/library" },
];

const videoEditorMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/video-editor" },
  { label: "Uploads", href: "/dashboard/video-editor#uploads" },
  { label: "Pending Videos", href: "/dashboard/video-editor#pending" },
  { label: "Published Videos", href: "/dashboard/video-editor#published" },
];

const physicalTrainerMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/fitness" },
  { label: "PT Schedule", href: "/fitness/pt-schedule" },
  { label: "Attendance", href: "/fitness/eligibility" },
  { label: "Reports", href: "/fitness/logs" },
];

const directorMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/director" },
  { label: "Academics", href: "/dashboard/director/academic" },
  { label: "Admissions", href: "/dashboard/director/admissions" },
  { label: "Admin & HR", href: "/dashboard/director/management" },
  { label: "Accounts", href: "/dashboard/director/accounts" },
  { label: "Reports", href: "/dashboard/director/reports" },
  { label: "Settings", href: "/dashboard/settings" },
];

const academicHeadMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/academic-head" },
  { label: "My Classes", href: "/dashboard/academic-head/my-classes" },
  { label: "Planner", href: "/dashboard/academic-head/hod/timetable" },
  { label: "Faculty", href: "/dashboard/academic-head/hod/teacher-allocation" },
  { label: "Students", href: "/dashboard/academic-head/students" },
  { label: "Reports", href: "/dashboard/academic-head/hod/reports" },
];

const administrativeOfficerMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/admission-cell#today" },
  { label: "Leads", href: "/crm/leads" },
  { label: "Applications", href: "/dashboard/admission-cell#applications" },
  { label: "Counselling", href: "/crm/counselling" },
  { label: "Admissions", href: "/crm/admissions" },
];

const businessDevelopmentMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/business-development" },
  { label: "Leads", href: "/dashboard/business-development#leads" },
  { label: "Campaigns", href: "/dashboard/sales-booster" },
  { label: "Follow-ups", href: "/dashboard/business-development#followups" },
  { label: "Reports", href: "/dashboard/business-development#reports" },
];

const adminMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/admin-center/operations" },
  { label: "Employees", href: "/admin-center/users" },
  { label: "Leave", href: "/admin-center/operations#leave" },
  { label: "Payroll", href: "/staff-hr" },
  { label: "Documents", href: "/documents" },
];

const accountsMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/director/accounts" },
  { label: "Fees", href: "/dashboard/director/accounts#pending-fees" },
  { label: "Invoices", href: "/dashboard/director/accounts?mode=invoices#receipts" },
  { label: "Expenses", href: "/dashboard/director/accounts#finance-reports" },
  { label: "Reports", href: "/dashboard/director/accounts?mode=reports#finance-reports" },
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
