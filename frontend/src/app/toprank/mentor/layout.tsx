import type { ReactNode } from "react";
import { TopRankRoleLayout } from "@/components/toprank";

export default function TopRankMentorLayout({ children }: { children: ReactNode }) {
  return <TopRankRoleLayout role="mentor" title="TopRank Mentor Workspace">{children}</TopRankRoleLayout>;
}
