export type DashboardNavItem = {
  label: string;
  href: string;
};

export type NavItem = DashboardNavItem;

const guestMenu: DashboardNavItem[] = [
  { label: "My Journey", href: "/dashboard/guest" },
  { label: "Assessments", href: "/dashboard/guest#assessments" },
  { label: "TOPRANK", href: "/dashboard/guest#toprank" },
  { label: "NIDUS Guru", href: "/dashboard/guest#guru" },
  { label: "Academy Programs", href: "/dashboard/guest#academy" },
  { label: "Digital Profile", href: "/dashboard/guest#profile" },
];

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
  { label: "Today", href: "/dashboard/teacher#today" },
  { label: "Classes", href: "/dashboard/teacher#classes" },
  { label: "Exams", href: "/dashboard/teacher#exams" },
  { label: "Assignments", href: "/dashboard/teacher#assignments" },
  { label: "Attendance", href: "/dashboard/teacher#attendance" },
  { label: "Library", href: "/dashboard/teacher#library" },
  { label: "Academic Calendar", href: "/dashboard/teacher#academic-calendar" },
  { label: "Profile", href: "/dashboard/teacher#profile" },
];

const academicHeadMenu: DashboardNavItem[] = [
  ...teacherMenu,
  { label: "HOD Mode", href: "/dashboard/academic-head" },
];

const admissionCellMenu: DashboardNavItem[] = [
  { label: "Today", href: "/dashboard/admission-cell" },
  { label: "Enquiries", href: "/dashboard/admission-cell#enquiries" },
  { label: "Applications", href: "/dashboard/admission-cell#applications" },
  { label: "Counselling", href: "/dashboard/admission-cell#counselling" },
  { label: "Approvals", href: "/dashboard/admission-cell#approval" },
  { label: "Reports", href: "/dashboard/admission-cell#reports" },
];

const salesBoosterMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/sales-booster" },
  { label: "Campaigns", href: "/dashboard/sales-booster#campaigns" },
  { label: "Creatives", href: "/dashboard/sales-booster#creatives" },
  { label: "WhatsApp", href: "/dashboard/sales-booster#whatsapp" },
  { label: "Analytics", href: "/dashboard/sales-booster#analytics" },
  { label: "Reports", href: "/dashboard/sales-booster#reports" },
];

const adminMenu: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin" },
  { label: "Users", href: "/admin-center/users" },
  { label: "Roles", href: "/admin-center/roles" },
  { label: "Permissions", href: "/admin-center/permissions" },
  { label: "Settings", href: "/admin-center/settings" },
];

export function getNavItems(role?: string | null): DashboardNavItem[] {
  const normalizedRole = role?.toUpperCase();

  if (normalizedRole === "DIRECTOR") {
    return [];
  }

  if (normalizedRole === "ACADEMIC_HEAD") {
    return academicHeadMenu;
  }

  if (normalizedRole === "TEACHER" || normalizedRole === "PHYSICAL_INSTRUCTOR") {
    return teacherMenu;
  }

  if (normalizedRole === "ADMIN" || normalizedRole === "ADMISSION_CELL") {
    return admissionCellMenu;
  }

  if (normalizedRole === "MARKETING_COORDINATOR" || normalizedRole === "SALES_BOOSTER") {
    return salesBoosterMenu;
  }

  if (normalizedRole === "STUDENT") {
    return studentMenu;
  }

  if (normalizedRole === "GUEST") {
    return guestMenu;
  }

  if (normalizedRole === "SUPER_ADMIN" || normalizedRole === "MANAGEMENT") {
    return adminMenu;
  }

  return guestMenu;
}
