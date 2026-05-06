"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { useAuth } from "@/components/providers/auth-provider";
import { roleDashboardPath } from "@/lib/dashboard-data";
import type { AuthRole } from "@/services/auth";

const compatibleRoles: Partial<Record<AuthRole, AuthRole[]>> = {
  ADMIN: ["ADMIN", "DIRECTOR"],
  FACULTY: ["FACULTY", "TEACHER"],
  TEACHER: ["TEACHER", "FACULTY"]
};

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
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }

    const allowedRoles = compatibleRoles[role] ?? [role];

    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.replace(roleDashboardPath[user.role]);
    }
  }, [isLoading, role, router, user]);

  const allowedRoles = compatibleRoles[role] ?? [role];

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return <DashboardSkeleton />;
  }

  return children;
}
