"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function TopNavbar({ hasSidebar = true }: { hasSidebar?: boolean }) {
  const { isAuthenticated, logout, user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const designation = typeof user?.roleMetadata?.designation === "string" ? user.roleMetadata.designation : "";
  const roleLabel = designation || (user?.role === "ADMIN" && user?.roleMetadata?.superAdmin === true ? "Management" : user?.role);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-40 border-b border-[#071d36]/10 bg-[#f7f3ea]/82 text-[#101827] backdrop-blur-xl ${
        hasSidebar ? "lg:left-[var(--sidebar-width)]" : ""
      }`}
    >
      <div className="flex h-[var(--nav-height)] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 lg:hidden">
          <span className="grid h-10 w-10 place-items-center rounded border border-[#b9913f]/30 bg-[#071d36] text-sm font-bold text-[#e7c873]">
            N
          </span>
          <span className="font-semibold text-[#071d36]">NIDUS</span>
        </Link>

        <div className="hidden lg:block">
          <p className="text-xs uppercase tracking-[0.2em] text-[#3f4a32]">Defence Training Platform</p>
          <p className="mt-1 text-sm text-[#64748b]">Command readiness, courses, and personnel development.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded border border-[#071d36]/10 bg-white/70 text-[#3f4a32] transition hover:border-[#b9913f]/35 hover:bg-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#b9913f] shadow-[0_0_14px_rgba(185,145,63,0.6)]" />
          </button>
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((current) => !current)}
                className="flex h-10 items-center gap-3 rounded border border-[#071d36]/10 bg-white/70 px-3 text-sm text-[#071d36] transition hover:border-[#b9913f]/35 hover:bg-white"
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
              >
                <span className="grid h-7 w-7 place-items-center rounded bg-[#071d36] text-xs font-bold text-white">
                  {user?.name?.slice(0, 1).toUpperCase() ?? "N"}
                </span>
                <span className="hidden md:block">{user?.name}</span>
                <ChevronDown className="h-4 w-4 text-[#64748b]" />
              </button>
              {isProfileOpen ? (
                <div className="absolute right-0 mt-3 w-64 rounded-lg border border-[#071d36]/10 bg-white/96 p-3 shadow-2xl backdrop-blur-xl" role="menu">
                  <p className="font-semibold text-[#071d36]">{user?.name}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{user?.email}</p>
                  <p className="mt-3 rounded border border-[#b9913f]/20 bg-[#f7f3ea] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f4a32]">
                    {roleLabel}
                  </p>
                  <Button onClick={logout} size="sm" variant="secondary" className="mt-3 w-full">
                    Logout
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <Button href="/login" size="sm">Login</Button>
          )}
        </div>
      </div>
    </header>
  );
}
