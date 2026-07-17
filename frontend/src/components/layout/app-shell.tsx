"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getNavItems } from "@/components/layout/nav-items";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicNavbar } from "@/components/marketing/public-navbar";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { QuickActionDock } from "@/components/dashboard/quick-action-dock";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";

const publicRoutes = new Set([
  "/",
  "/about-nidus",
  "/admissions",
  "/why-choose-nidus",
  "/faculty",
  "/success-stories",
  "/facilities",
  "/gallery",
  "/events",
  "/blog",
  "/faq",
  "/login",
  "/register",
  "/contact",
  "/nidus-ai-ecosystem",
  "/programs",
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

const publicPrefixes = ["/programs/", "/guru/quests/"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading, user } = useAuth();
  const isPublicRoute = pathname ? publicRoutes.has(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix)) : false;
  const dashboardTemplate = typeof user?.roleMetadata?.dashboardTemplate === "string" ? user.roleMetadata.dashboardTemplate : null;
  const isFocusedClassroom = Boolean(pathname?.match(/^\/dashboard\/(?:teacher|academic-head)\/my-classes(?:\/|$)/));
  const isFocusedAdmissionDesk = Boolean(pathname?.startsWith("/dashboard/admission-cell"));
  const isFocusedTimetable = Boolean(pathname?.match(/^\/dashboard\/(?:academic-head\/hod|director\/academic)\/timetable(?:\/|$)/));
  const isFocusedDirectorWorkspace = Boolean(pathname?.startsWith("/dashboard/director"));
  const isFocusedWorkspace = isFocusedClassroom || isFocusedAdmissionDesk || isFocusedTimetable || isFocusedDirectorWorkspace;
  const hasSidebar = !isFocusedWorkspace && !isLoading && !!user && getNavItems(user.role, dashboardTemplate).length > 0;

  if (isPublicRoute) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#f7f3ea] text-[#101827]">
        <PublicNavbar />
        <main id="main-content">{children}</main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="subtle-grid min-h-screen bg-[#f7f3ea] text-[#101827]">
      <TopNavbar hasSidebar={hasSidebar} />
      {hasSidebar ? <Sidebar /> : null}
      <main
        id="main-content"
        className={`px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(var(--nav-height)+1rem)] sm:px-6 lg:px-8 ${
          hasSidebar ? "lg:ml-[var(--sidebar-width)]" : ""
        }`}
      >
        <div className={`mx-auto w-full ${isFocusedWorkspace ? "max-w-none" : "max-w-7xl"}`}>{children}</div>
      </main>
      {isFocusedDirectorWorkspace ? <QuickActionDock role="DIRECTOR" /> : null}
      {!isFocusedWorkspace ? <BottomNav /> : null}
    </div>
  );
}
