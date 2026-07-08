"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { GuestApplicantDashboard } from "@/components/dashboard/guest-applicant-dashboard";

type StudentPlanProbe = {
  batches?: Array<{ id: string; status?: string | null }>;
};

async function apiJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) return {} as T;
  return response.json() as Promise<T>;
}

export default function GuestDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const planQuery = useQuery({
    queryKey: ["guest", "activation-probe"],
    queryFn: () => apiJson<StudentPlanProbe>("/api/academy/my-plan"),
    enabled: user?.role === "STUDENT",
    retry: false,
  });
  const isActivatedLearner = Boolean(planQuery.data?.batches?.some((batch) => batch.status === "ACTIVE"));

  useEffect(() => {
    if (user?.role === "STUDENT" && isActivatedLearner) router.replace("/dashboard/student");
  }, [isActivatedLearner, router, user?.role]);

  return <GuestApplicantDashboard name={user?.name} />;
}
