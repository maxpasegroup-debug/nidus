"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getTopRankMe, logoutTopRankUser } from "@/services/toprank-auth-service";
import type { TopRankRole } from "@/types/toprank";

const roleMap: Record<"student" | "mentor" | "admin", TopRankRole[]> = {
  student: ["TOPRANK_STUDENT"],
  mentor: ["TOPRANK_MENTOR"],
  admin: ["TOPRANK_ADMIN", "TOPRANK_SUPER_ADMIN"]
};

export function TopRankAuthGate({ role, children }: { role: keyof typeof roleMap; children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getTopRankMe()
      .then((result) => {
        if (!roleMap[role].includes(result.user.role)) {
          router.replace("/toprank/login");
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace("/toprank/login"));
  }, [role, router]);

  if (!ready) {
    return <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-6 text-sm font-bold text-[#c9d0c2]">Checking TopRank access...</div>;
  }

  return <>{children}</>;
}

export function TopRankLogoutButton() {
  const router = useRouter();

  async function logout() {
    await logoutTopRankUser().catch(() => undefined);
    router.replace("/toprank/login");
  }

  return (
    <button type="button" onClick={() => void logout()} className="rounded-full border border-[#c99b3f]/35 px-4 py-2 text-sm font-bold text-[#f6d17a]">
      Logout
    </button>
  );
}

