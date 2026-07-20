import type { ReactNode } from "react";
import { TopRankRoleLayout } from "@/components/toprank";

export default function TopRankStudentLayout({ children }: { children: ReactNode }) {
  return <TopRankRoleLayout role="student" title="TopRank Student Workspace">{children}</TopRankRoleLayout>;
}
