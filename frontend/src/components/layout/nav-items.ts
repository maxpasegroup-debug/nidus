export type DashboardNavItem = {
  label: string;
  href: string;
};

export type NavItem = DashboardNavItem;

const studentMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/student#today" },
  { label: "Classes", href: "/dashboard/student#classes" },
  { label: "Assignments", href: "/dashboard/student#assignments" },
  { label: "Exams", href: "/dashboard/student#exams" },
  { label: "Attendance & Leaves", href: "/dashboard/student#attendance" },
  { label: "Library", href: "/dashboard/student#library" },
  { label: "NIDUS Digital Profile", href: "/dashboard/student#profile" },
];

const guestMenu: DashboardNavItem[] = [
  { label: "Assessments", href: "/dashboard/guest#assessments" },
  { label: "TOP RANK", href: "/dashboard/guest#top-rank" },
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
  { label: "My Students", href: "/dashboard/teacher/students" },
  { label: "Calendar", href: "/dashboard/teacher/academic-calendar" },
  { label: "Attendance", href: "/dashboard/teacher/attendance" },
  { label: "Assignments", href: "/dashboard/teacher/assignments" },
  { label: "Exams", href: "/dashboard/teacher/exams" },
  { label: "Library", href: "/dashboard/teacher/library" },
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
  { label: "Team", href: "/dashboard/director/management" },
  { label: "Finance", href: "/dashboard/director/accounts" },
  { label: "Reports", href: "/dashboard/director/reports" },
  { label: "Teaching Today", href: "/dashboard/director/teaching/classes" },
  { label: "My Students", href: "/dashboard/director/teaching/students" },
  { label: "Teaching Calendar", href: "/dashboard/director/teaching/academic-calendar" },
  { label: "Attendance", href: "/dashboard/director/teaching/attendance" },
  { label: "Assignments", href: "/dashboard/director/teaching/assignments" },
  { label: "Exams", href: "/dashboard/director/teaching/exams" },
  { label: "Library", href: "/dashboard/director/teaching/library" },
];

const academicHeadMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/academic-head/classes" },
  { label: "My Students", href: "/dashboard/academic-head/students" },
  { label: "Calendar", href: "/dashboard/academic-head/academic-calendar" },
  { label: "Attendance", href: "/dashboard/academic-head/attendance" },
  { label: "Assignments", href: "/dashboard/academic-head/assignments" },
  { label: "Exams", href: "/dashboard/academic-head/exams" },
  { label: "Library", href: "/dashboard/academic-head/library" },
  { label: "HOD Control", href: "/dashboard/academic-head/hod" },
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
