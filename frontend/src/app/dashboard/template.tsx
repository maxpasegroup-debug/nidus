import { DashboardFetchGuard } from "@/components/auth/dashboard-fetch-guard";
import type { ReactNode } from "react";

export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return <DashboardFetchGuard>{children}</DashboardFetchGuard>;
}
