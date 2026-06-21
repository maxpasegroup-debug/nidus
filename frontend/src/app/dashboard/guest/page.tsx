"use client";

import { useAuth } from "@/components/providers/auth-provider-v2";
import { GuestApplicantDashboard } from "@/components/dashboard/guest-applicant-dashboard";

export default function GuestDashboardPage() {
  const { user } = useAuth();
  return <GuestApplicantDashboard name={user?.name} />;
}
