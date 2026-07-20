import type { ReactNode } from "react";
import { TopRankRoleLayout } from "@/components/toprank";

export default function TopRankAdminLayout({ children }: { children: ReactNode }) {
  return <TopRankRoleLayout role="admin" title="TopRank Admin Workspace">{children}</TopRankRoleLayout>;
}
