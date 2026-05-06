"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSkeleton, SectionHeader } from "@/components/dashboard";
import { useAuth } from "@/components/providers/auth-provider";
import { roleDashboardPath } from "@/lib/dashboard-data";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(roleDashboardPath[user.role]);
    }
  }, [isLoading, router, user]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Routing"
        title="Preparing your command dashboard"
        action="Role-aware access in progress"
      />
      <DashboardSkeleton />
    </div>
  );
}

