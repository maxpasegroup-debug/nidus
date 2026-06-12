"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getNavItems } from "./nav-items";

type StoredUser = {
  role?: string | null;
  roleMetadata?: Record<string, unknown> | null;
};

const USER_STORAGE_KEYS = ["user", "nidus_user", "authUser"];

function readStoredUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of USER_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (!value) {
      continue;
    }

    try {
      const parsed = JSON.parse(value) as StoredUser & {
        user?: StoredUser;
        data?: { user?: StoredUser };
      };
      return parsed.user ?? parsed.data?.user ?? parsed;
    } catch {
      continue;
    }
  }

  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  const userMetadata = user?.roleMetadata && typeof user.roleMetadata === "object" ? user.roleMetadata : {};
  const dashboardTemplate =
    "dashboardTemplate" in userMetadata && typeof userMetadata.dashboardTemplate === "string"
      ? userMetadata.dashboardTemplate
      : null;

  const navItems = useMemo(() => getNavItems(user?.role, dashboardTemplate), [dashboardTemplate, user?.role]);

  useEffect(() => {
    setUser(readStoredUser());
    setHydrated(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!hydrated || !navItems.length) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-xl border border-[var(--border)] bg-white p-3 shadow-lg lg:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close dashboard menu" : "Open dashboard menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--border)] bg-[var(--page-bg)] px-5 py-8 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--ink)] font-black text-[var(--gold)]">
            N
          </span>
          <span>
            <span className="block text-lg font-black tracking-wide text-[var(--ink)]">NIDUS</span>
            <span className="block text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Command OS</span>
          </span>
        </Link>

        <nav className="mt-10 space-y-2">
          {navItems.map((item) => {
            const isActive = item.href.split("#")[0] === pathname;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border border-[var(--gold-border)] bg-white text-[var(--ink)] shadow-sm"
                    : "text-[var(--ink)] hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-xl border border-[var(--border)] bg-white p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Secure Node</p>
          <p className="mt-2 text-[var(--muted)]">Role: {user?.role ?? "GUEST"}</p>
        </div>
      </aside>
    </>
  );
}
