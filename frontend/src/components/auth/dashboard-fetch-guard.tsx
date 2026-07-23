"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { canAccessDashboardPath, effectiveDashboardPath } from "@/lib/dashboard-data";

function isInternalApiRequest(input: RequestInfo | URL) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  return url.startsWith("/api/") || url.includes("/api/");
}

export function DashboardFetchGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname ?? "/dashboard";
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (!isInternalApiRequest(input)) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers);

      return originalFetch(input, {
        ...init,
        credentials: init?.credentials ?? "include",
        headers,
      }).then((response) => {
        if (response.status === 401 && !window.location.pathname.startsWith("/login")) {
          window.dispatchEvent(new CustomEvent("nidus:session-expired"));
        }
        return response;
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (currentPath !== "/dashboard" && !canAccessDashboardPath(user, currentPath)) {
      router.replace(effectiveDashboardPath(user));
    }
  }, [currentPath, isLoading, router, user]);

  if (isLoading || !user || (currentPath !== "/dashboard" && !canAccessDashboardPath(user, currentPath))) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-[#fffdf8] px-4">
        <div className="w-full max-w-sm rounded-lg border border-[#071d36]/10 bg-white/85 p-6 text-center shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-[#b9913f]/40 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_45%,#b9913f_100%)]" />
          <p className="mt-4 text-sm font-semibold text-[#071d36]">Opening your correct dashboard</p>
        </div>
      </main>
    );
  }

  return children;
}
