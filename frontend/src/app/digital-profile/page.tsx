"use client";

import { DashboardError, DashboardSkeleton, RoleDashboardGuard } from "@/components/dashboard";
import { DigitalProfileOverview } from "@/components/digital-profile/digital-profile-overview";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useStudentDashboard } from "@/hooks/use-dashboard";

export default function DigitalProfilePage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useStudentDashboard();

  if (isLoading) return <RoleDashboardGuard role="STUDENT"><DashboardSkeleton /></RoleDashboardGuard>;
  if (error || !data) return <RoleDashboardGuard role="STUDENT"><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  return (
    <RoleDashboardGuard role="STUDENT">
      <DigitalProfileOverview data={data} user={user} />
    </RoleDashboardGuard>
  );
}
