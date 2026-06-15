export type DashboardNavItem = {
  label: string;
  href: string;
};

export type NavItem = DashboardNavItem;

const studentMenu: DashboardNavItem[] = [
  { label: "My Journey", href: "/dashboard/student" },
  { label: "Classes", href: "/dashboard/student#classes" },
  { label: "Exams", href: "/dashboard/student#exams" },
  { label: "Assignments", href: "/dashboard/student#assignments" },
  { label: "Attendance", href: "/dashboard/student#attendance" },
  { label: "Library", href: "/dashboard/student#library" },
  { label: "Assessments", href: "/dashboard/student#assessments" },
  { label: "Digital Profile", href: "/dashboard/student#profile" },
];

const teacherMenu: DashboardNavItem[] = [
  { label: "Classes", href: "/dashboard/teacher/classes" },
  { label: "Exams", href: "/dashboard/teacher/exams" },
  { label: "Assignments", href: "/dashboard/teacher/assignments" },
  { label: "Attendance", href: "/dashboard/teacher/attendance" },
  { label: "Library", href: "/dashboard/teacher/library" },
  { label: "Academic Calendar", href: "/dashboard/teacher/academic-calendar" },
];

const academicHeadMenu: DashboardNavItem[] = [
  { label: "Classes", href: "/dashboard/academic-head/classes" },
  { label: "Exams", href: "/dashboard/academic-head/exams" },
  { label: "Assignments", href: "/dashboard/academic-head/assignments" },
  { label: "Attendance", href: "/dashboard/academic-head/attendance" },
  { label: "Library", href: "/dashboard/academic-head/library" },
  { label: "Academic Calendar", href: "/dashboard/academic-head/academic-calendar" },
  { label: "HOD", href: "/dashboard/director/academic" },
];

const administrativeOfficerMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/admission-cell" },
  { label: "Enquiries", href: "/dashboard/admission-cell#enquiries" },
  { label: "Applications", href: "/dashboard/admission-cell#applications" },
  { label: "Counselling", href: "/dashboard/admission-cell#counselling" },
  { label: "Approvals", href: "/dashboard/admission-cell#approval" },
  { label: "Reports", href: "/dashboard/admission-cell#reports" },
];

const businessDevelopmentMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/business-development" },
  { label: "Leads", href: "/crm/leads" },
  { label: "Follow-ups", href: "/crm/followups" },
  { label: "Counselling", href: "/crm/counselling" },
  { label: "Admissions", href: "/crm/admissions" },
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
    return [];
  }

  if (normalizedRole === "ACADEMIC_HEAD" || normalizedTemplate === "ACADEMIC_HEAD") {
    return academicHeadMenu;
  }

  if (normalizedRole === "TEACHER" || normalizedRole === "PHYSICAL_INSTRUCTOR") {
    return teacherMenu;
  }

  if (normalizedRole === "ADMIN" || normalizedRole === "ADMISSION_CELL") {
    return administrativeOfficerMenu;
  }

  if (normalizedRole === "MARKETING_COORDINATOR" || normalizedRole === "SALES_BOOSTER" || normalizedRole === "TELECALLER") {
    return businessDevelopmentMenu;
  }

  if (normalizedRole === "STUDENT") {
    return studentMenu;
  }

  if (normalizedRole === "GUEST") {
    return studentMenu;
  }

  if (normalizedRole === "SUPER_ADMIN" || normalizedRole === "MANAGEMENT") {
    return adminMenu;
  }

  return studentMenu;
}
