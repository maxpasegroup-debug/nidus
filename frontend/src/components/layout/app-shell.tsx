"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicNavbar } from "@/components/marketing/public-navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";

const publicRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/contact",
  "/nidus-ai-ecosystem",
  "/programs",
  "/toprank",
  "/guru",
  "/psychometric",
  "/join",
  "/start-free",
  "/privacy-policy",
  "/terms-and-conditions",
  "/refund-policy",
  "/cancellation-policy",
  "/disclaimer"
]);

const publicPrefixes = ["/programs/", "/toprank/", "/guru/quests/"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname ? publicRoutes.has(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix)) : false;

  if (isPublicRoute) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#f6f7fb] text-[#111827]">
        <PublicNavbar />
        <main id="main-content">{children}</main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="subtle-grid min-h-screen">
      <TopNavbar />
      <Sidebar />
      <main id="main-content" className="px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(var(--nav-height)+1rem)] sm:px-6 lg:ml-[var(--sidebar-width)] lg:px-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
