import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";

export function AppShell({ children }: { children: ReactNode }) {
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
