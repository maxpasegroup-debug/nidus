import type { AuthRole } from "@/services/auth.v2";
import type { AuthUser } from "@/services/auth.v2";

export const roleDashboardPath: Record<AuthRole, string> = {
  ADMIN: "/dashboard/director",
  GUEST: "/dashboard/student",
  STUDENT: "/dashboard/student",
  PARENT: "/dashboard/parent",
  TEACHER: "/dashboard/teacher",
  DIRECTOR: "/dashboard/director",
  TELECALLER: "/dashboard/business-development",
  MARKETING_COORDINATOR: "/dashboard/business-development"
};

function dashboardTemplate(user?: Pick<AuthUser, "roleMetadata"> | null) {
  const metadata = user?.roleMetadata && typeof user.roleMetadata === "object" ? user.roleMetadata : {};
  return typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate.toUpperCase() : "";
}

export function effectiveDashboardPath(user?: Pick<AuthUser, "role" | "roleMetadata"> | null) {
  if (!user) return "/login";
  const template = dashboardTemplate(user);
  if (user.role === "DIRECTOR") return "/dashboard/director";
  if (template === "ACADEMIC_HEAD") return "/dashboard/academic-head";
  if (template === "ADMISSION_CELL") return "/dashboard/admission-cell";
  if (template === "MARKETING" || template === "SALES_BOOSTER") return "/dashboard/business-development";
  return roleDashboardPath[user.role];
}

export function canAccessDashboardPath(user: Pick<AuthUser, "role" | "roleMetadata"> | null | undefined, path: string) {
  if (!user) return false;
  if (path === "/dashboard/settings") return true;
  const template = dashboardTemplate(user);
  if (template === "ACADEMIC_HEAD") {
    return path.startsWith("/dashboard/academic-head") || path.startsWith("/dashboard/teacher") || path.startsWith("/dashboard/director/academic") || path.startsWith("/dashboard/director/materials") || path.startsWith("/dashboard/director/exams");
  }
  if (template === "ADMISSION_CELL") return path === "/dashboard/admission-cell";
  if (template === "MARKETING" || template === "SALES_BOOSTER") {
    return path === "/dashboard/business-development";
  }
  if (user.role === "ADMIN") return true;
  if (user.role === "DIRECTOR") return path.startsWith("/dashboard/director") || path === "/dashboard/teacher" || path.startsWith("/admin-center");
  if (user.role === "TEACHER") return path.startsWith("/dashboard/teacher");
  if (user.role === "MARKETING_COORDINATOR") return path === "/dashboard/business-development";
  if (user.role === "TELECALLER") return path === "/dashboard/business-development";
  if (user.role === "STUDENT") return path === "/dashboard/student";
  if (user.role === "PARENT") return path === "/dashboard/parent";
  if (user.role === "GUEST") return path === "/dashboard/student";
  return false;
}

export const examCards = [
  { title: "NDA", subtitle: "National Defence Academy", metric: "Academy program" },
  { title: "CDS", subtitle: "Combined Defence Services", metric: "Academy program" },
  { title: "AFCAT", subtitle: "Air Force Common Admission Test", metric: "Academy program" },
  { title: "SSB", subtitle: "Interview readiness", metric: "Academy program" },
  { title: "AISSEE", subtitle: "Sainik School entrance", metric: "Academy program" },
  { title: "RIMC", subtitle: "Military college prep", metric: "Academy program" }
];
