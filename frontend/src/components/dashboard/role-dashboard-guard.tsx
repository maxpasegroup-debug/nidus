"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { useAuth } from "@/components/providers/auth-provider";
import { roleDashboardPath } from "@/lib/dashboard-data";
import type { AuthRole } from "@/services/auth";

export function RoleDashboardGuard({
  role,
  children
}: {
  role: AuthRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user && user.role !== role) {
      router.replace(roleDashboardPath[user.role]);
    }
  }, [isLoading, role, router, user]);

  if (isLoading || !user || user.role !== role) {
    return <DashboardSkeleton />;
  }

  return children;
}
