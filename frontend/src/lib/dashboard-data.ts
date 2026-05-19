import type { AuthRole } from "@/services/auth.v2";

export const roleDashboardPath: Record<AuthRole, string> = {
  ADMIN: "/dashboard/admin",
  GUEST: "/dashboard/guest",
  STUDENT: "/dashboard/student",
  PARENT: "/dashboard/parent",
  TEACHER: "/dashboard/teacher",
  DIRECTOR: "/dashboard/director",
  TELECALLER: "/dashboard/telecaller",
  MARKETING_COORDINATOR: "/dashboard/marketing"
};

export const examCards = [
  { title: "NDA", subtitle: "National Defence Academy", metric: "Academy program" },
  { title: "CDS", subtitle: "Combined Defence Services", metric: "Academy program" },
  { title: "AFCAT", subtitle: "Air Force Common Admission Test", metric: "Academy program" },
  { title: "SSB", subtitle: "Interview readiness", metric: "Academy program" },
  { title: "AISSEE", subtitle: "Sainik School entrance", metric: "Academy program" },
  { title: "RIMC", subtitle: "Military college prep", metric: "Academy program" }
];
