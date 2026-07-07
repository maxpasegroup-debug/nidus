export type DashboardNavItem = {
  label: string;
  href: string;
};

export type NavItem = DashboardNavItem;

const studentMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/student" },
  { label: "My Classes", href: "/dashboard/student/classes" },
  { label: "Exams", href: "/dashboard/student/exams" },
  { label: "Assignments", href: "/dashboard/student/assignments" },
  { label: "Calendar", href: "/dashboard/student/calendar" },
  { label: "Academic Library", href: "/dashboard/student/learning" },
  { label: "Assessments", href: "/dashboard/student/assessments" },
  { label: "NDP", href: "/dashboard/student/progress" },
];

const guestMenu: DashboardNavItem[] = [
  { label: "Assessments", href: "/dashboard/guest#assessments" },
  { label: "NIDUS Guru", href: "/dashboard/guest#guru" },
  { label: "Academy Courses", href: "/dashboard/guest#academy" },
  { label: "My Applications", href: "/dashboard/guest#applications" },
];

const parentMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/parent#today" },
  { label: "Attendance", href: "/dashboard/parent#attendance" },
  { label: "Assignments", href: "/dashboard/parent#assignments" },
  { label: "Exams", href: "/dashboard/parent#exams" },
  { label: "Progress", href: "/dashboard/parent#progress" },
  { label: "Fees", href: "/dashboard/parent#fees" },
  { label: "Reports", href: "/dashboard/parent#reports" },
  { label: "Notifications", href: "/dashboard/parent#notifications-list" },
];

const teacherMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/teacher/classes" },
  { label: "My Classes", href: "/dashboard/teacher/my-classes" },
  { label: "My Workspace", href: "/dashboard/teacher/workspace" },
  { label: "Messages & Notifications", href: "/dashboard/teacher/communications" },
  { label: "My Profile", href: "/dashboard/teacher/profile" },
];

const videoEditorMenu: DashboardNavItem[] = [
  { label: "Upload Lessons", href: "/dashboard/video-editor" },
];

const physicalTrainerMenu: DashboardNavItem[] = [
  { label: "Today", href: "/fitness" },
  { label: "My Batches", href: "/fitness/pt-schedule" },
  { label: "Attendance", href: "/fitness/pt-schedule" },
  { label: "Fitness Records", href: "/fitness/eligibility" },
  { label: "Student Fitness", href: "/fitness/eligibility" },
  { label: "Reports", href: "/fitness/logs" },
];

const directorMenu: DashboardNavItem[] = [
  { label: "Command Center", href: "/dashboard/director" },
  { label: "Admissions", href: "/dashboard/director/admissions" },
  { label: "Academics", href: "/dashboard/director/academic" },
  { label: "Students", href: "/dashboard/director/academic/student-progress" },
  { label: "Team", href: "/dashboard/director/management" },
  { label: "Finance", href: "/dashboard/director/accounts" },
  { label: "Teaching Mode", href: "/dashboard/director/teaching" },
];

const academicHeadMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/academic-head/hod" },
  { label: "My Classes", href: "/dashboard/academic-head/my-classes" },
  { label: "My Workspace", href: "/dashboard/academic-head/workspace" },
  { label: "Messages & Notifications", href: "/dashboard/academic-head/communications" },
  { label: "My Profile", href: "/dashboard/academic-head/profile" },
  { label: "HOD Control", href: "/dashboard/academic-head/hod/control" },
];

const administrativeOfficerMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/admission-cell#today" },
  { label: "Applications", href: "/dashboard/admission-cell#applications" },
  { label: "Documents", href: "/dashboard/admission-cell#documents" },
  { label: "Fees & Receipts", href: "/dashboard/admission-cell#fees" },
  { label: "Batch Allocation", href: "/dashboard/admission-cell#batch" },
  { label: "Student Activation", href: "/dashboard/admission-cell#activation" },
  { label: "Students", href: "/dashboard/admission-cell#students" },
  { label: "Reports", href: "/dashboard/admission-cell#reports" },
];

const businessDevelopmentMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/business-development" },
  { label: "Leads", href: "/dashboard/business-development#leads" },
  { label: "Follow-ups", href: "/dashboard/business-development#followups" },
  { label: "Counselling", href: "/dashboard/business-development#followups" },
  { label: "Reports", href: "/dashboard/business-development#reports" },
];

const adminMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin" },
  { label: "Users", href: "/admin-center/users" },
  { label: "Roles", href: "/admin-center/roles" },
  { label: "Permissions", href: "/admin-center/permissions" },
  { label: "Settings", href: "/admin-center/settings" },
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

  if (normalizedRole === "ACADEMIC_HEAD" || normalizedTemplate === "ACADEMIC_HEAD") {
    return academicHeadMenu;
  }

  if (normalizedRole === "PHYSICAL_TRAINER" || normalizedRole === "PHYSICAL_INSTRUCTOR") {
    return physicalTrainerMenu;
  }

  if (normalizedRole === "TEACHER") {
    return teacherMenu;
  }

  if (normalizedRole === "ADMINISTRATIVE_OFFICER" || normalizedRole === "ADMIN" || normalizedRole === "ADMISSION_CELL") {
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

  if (normalizedRole === "SUPER_ADMIN" || normalizedRole === "MANAGEMENT") {
    return adminMenu;
  }

  return studentMenu;
}

export { directorMenu, guestMenu, parentMenu, studentMenu };
