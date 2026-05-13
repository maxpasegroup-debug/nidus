"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function TopNavbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-navy-deep/70 backdrop-blur-xl lg:left-[var(--sidebar-width)]">
      <div className="flex h-[var(--nav-height)] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 lg:hidden">
          <span className="grid h-10 w-10 place-items-center rounded border border-gold/40 bg-gold/10 text-sm font-bold text-gold">
            N
          </span>
          <span className="font-semibold">NIDUS</span>
        </Link>

        <div className="hidden lg:block">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Defence Training Platform</p>
          <p className="mt-1 text-sm text-muted">Command readiness, courses, and personnel development.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded border border-white/10 bg-white/5 text-gold transition hover:border-gold/30 hover:bg-gold/10"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold shadow-[0_0_14px_rgba(201,166,70,0.9)]" />
          </button>
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((current) => !current)}
                className="flex h-10 items-center gap-3 rounded border border-white/10 bg-white/5 px-3 text-sm text-white transition hover:border-gold/30 hover:bg-gold/10"
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
              >
                <span className="grid h-7 w-7 place-items-center rounded bg-gold/15 text-xs font-bold text-gold">
                  {user?.name?.slice(0, 1).toUpperCase() ?? "N"}
                </span>
                <span className="hidden md:block">{user?.name}</span>
                <ChevronDown className="h-4 w-4 text-muted" />
              </button>
              {isProfileOpen ? (
                <div className="absolute right-0 mt-3 w-64 rounded-lg border border-white/10 bg-navy-deep/95 p-3 shadow-2xl backdrop-blur-xl" role="menu">
                  <p className="font-semibold text-white">{user?.name}</p>
                  <p className="mt-1 text-xs text-muted">{user?.email}</p>
                  <p className="mt-3 rounded border border-gold/20 bg-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                    {user?.role}
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
