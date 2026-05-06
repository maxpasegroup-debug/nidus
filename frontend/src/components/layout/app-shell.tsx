"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicNavbar } from "@/components/marketing/public-navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";

const publicRoutes = new Set(["/", "/login", "/register", "/contact"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname ? publicRoutes.has(pathname) : false;

  if (isPublicRoute) {
    return (
      <div className="min-h-screen overflow-hidden bg-navy-deep text-ink">
        <PublicNavbar />
        {children}
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="subtle-grid min-h-screen">
      <TopNavbar />
      <Sidebar />
      <main className="px-4 pb-24 pt-24 sm:px-6 lg:ml-[var(--sidebar-width)] lg:px-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
