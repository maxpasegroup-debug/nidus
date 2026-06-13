"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { effectiveDashboardPath } from "@/lib/dashboard-data";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(effectiveDashboardPath(user));
    }
  }, [isLoading, router, user]);

  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#fffdf8] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#071d36]/10 bg-white/85 p-6 text-center shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-[#b9913f]/40 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_45%,#b9913f_100%)]" />
        <p className="mt-4 text-sm font-semibold text-[#071d36]">Opening your NIDUS dashboard</p>
        <p className="mt-2 text-xs leading-5 text-[#64748b]">Taking you to the correct journey page.</p>
      </div>
    </main>
  );
}

