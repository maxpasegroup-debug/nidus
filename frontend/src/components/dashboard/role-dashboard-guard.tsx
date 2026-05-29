"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }

    const allowedRoles = Array.isArray(role) ? role : compatibleRoles[role] ?? [role];

    if (!isLoading && user?.mustChangePassword && pathname !== "/dashboard/settings") {
      router.replace("/dashboard/settings?mustChangePassword=1");
      return;
    }

    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.replace(roleDashboardPath[user.role]);
    }
  }, [isLoading, pathname, role, router, user]);

  const allowedRoles = Array.isArray(role) ? role : compatibleRoles[role] ?? [role];

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return <DashboardRouteLoader />;
  }

  return children;
}

function DashboardRouteLoader() {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-[#fffdf8] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#071d36]/10 bg-white/85 p-6 text-center shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-[#b9913f]/40 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_45%,#b9913f_100%)]" />
        <p className="mt-4 text-sm font-semibold text-[#071d36]">Opening your NIDUS dashboard</p>
        <p className="mt-2 text-xs leading-5 text-[#64748b]">Please wait a moment.</p>
      </div>
    </main>
  );
}
