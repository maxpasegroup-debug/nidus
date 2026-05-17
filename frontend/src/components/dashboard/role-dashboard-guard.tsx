"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { roleDashboardPath } from "@/lib/dashboard-data";
import type { AuthRole } from "@/services/auth.v2";

const compatibleRoles: Partial<Record<AuthRole, AuthRole[]>> = {
  ADMIN: ["ADMIN"],
  DIRECTOR: ["DIRECTOR", "ADMIN"],
  TEACHER: ["TEACHER", "ADMIN"],
  TELECALLER: ["TELECALLER", "ADMIN", "DIRECTOR"],
  MARKETING_COORDINATOR: ["MARKETING_COORDINATOR", "ADMIN", "DIRECTOR"]
};

export function RoleDashboardGuard({
  role,
  children
}: {
  role: AuthRole | AuthRole[];
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }

    const allowedRoles = Array.isArray(role) ? role : compatibleRoles[role] ?? [role];

    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.replace(roleDashboardPath[user.role]);
    }
  }, [isLoading, role, router, user]);

  const allowedRoles = Array.isArray(role) ? role : compatibleRoles[role] ?? [role];

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return <DashboardSkeleton />;
  }

  return children;
}
