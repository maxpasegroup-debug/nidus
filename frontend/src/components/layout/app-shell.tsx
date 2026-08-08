"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DirectorSidebar } from "@/components/layout/director-sidebar";
import { getNavItems } from "@/components/layout/nav-items";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicNavbar } from "@/components/marketing/public-navbar";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";

const publicRoutes = new Set([
  "/",
  "/legacy-home",
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
  const isDirectorNavigationPath = Boolean(isFocusedDirectorWorkspace || (user?.role === "DIRECTOR" && (pathname?.startsWith("/crm/leads") || pathname === "/dashboard/settings")));
  const isSettingsSetup = pathname === "/dashboard/settings";
  const isFocusedWorkspace = isFocusedClassroom || isFocusedAdmissionDesk || isFocusedTimetable || isDirectorNavigationPath || isSettingsSetup;
  const hasStandardSidebar = !isFocusedWorkspace && !isLoading && !!user && getNavItems(user.role, dashboardTemplate).length > 0;
  const hasDirectorSidebar = isDirectorNavigationPath && !isLoading && !!user;
  const hasSidebar = hasStandardSidebar || hasDirectorSidebar;

  useEffect(() => {
    document.documentElement.style.setProperty("--nav-height", hasDirectorSidebar ? "56px" : "72px");
    return () => {
      document.documentElement.style.setProperty("--nav-height", "72px");
    };
  }, [hasDirectorSidebar]);

  if (pathname === "/") {
    return <>{children}</>;
  }

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
      {hasStandardSidebar ? <Sidebar /> : null}
      {hasDirectorSidebar ? <DirectorSidebar /> : null}
      <main
        id="main-content"
        className={`px-4 pt-[calc(var(--nav-height)+1rem)] sm:px-6 lg:px-8 ${hasDirectorSidebar ? "pb-4" : "pb-[calc(6rem+env(safe-area-inset-bottom))]"} ${
          hasSidebar ? "lg:ml-[var(--sidebar-width)]" : ""
        }`}
      >
        <div className={`mx-auto w-full ${isFocusedWorkspace ? "max-w-none" : "max-w-[1500px]"}`}>{children}</div>
      </main>
      {!isFocusedWorkspace ? <BottomNav /> : null}
    </div>
  );
}




