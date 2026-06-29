"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { getNavItems, guestMenu, studentMenu } from "./nav-items";

type StudentPlanProbe = {
  batches?: Array<{ id: string; status?: string | null }>;
};

async function probeStudentActivation() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("nidus_token")
      : null;
  const response = await fetch(`${baseUrl}/api/academy/my-plan`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) return false;
  const payload = (await response.json().catch(() => null)) as StudentPlanProbe | null;
  return Boolean(payload?.batches?.some((batch) => batch.status === "ACTIVE"));
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const [studentActivated, setStudentActivated] = useState<boolean | null>(null);

  const userMetadata = user?.roleMetadata && typeof user.roleMetadata === "object" ? user.roleMetadata : {};
  const dashboardTemplate =
    "dashboardTemplate" in userMetadata && typeof userMetadata.dashboardTemplate === "string"
      ? userMetadata.dashboardTemplate
      : null;
  const designation = typeof userMetadata.designation === "string" ? userMetadata.designation : null;
  const rawRoleLabel = designation ?? dashboardTemplate ?? user?.role ?? "STUDENT";
  const roleLabel =
    rawRoleLabel === "GUEST"
      ? "Applicant"
      : rawRoleLabel === "STUDENT"
        ? studentActivated === false
          ? "Applicant"
          : "Learner"
      : rawRoleLabel === "TELECALLER"
        ? "Business Development Executive"
        : rawRoleLabel === "ADMISSION_CELL"
          ? "Administrative Officer"
          : rawRoleLabel;

  useEffect(() => {
    let cancelled = false;
    setStudentActivated(null);
    if (!user || user.role !== "STUDENT") return;
    probeStudentActivation()
      .then((isActivated) => {
        if (!cancelled) setStudentActivated(isActivated);
      })
      .catch(() => {
        if (!cancelled) setStudentActivated(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const navItems = useMemo(() => {
    if (user?.role === "GUEST") return guestMenu;
    if (user?.role === "STUDENT") {
      if (studentActivated === false) return guestMenu;
      if (studentActivated === true) return studentMenu;
      return [];
    }
    return getNavItems(user?.role, dashboardTemplate);
  }, [dashboardTemplate, studentActivated, user?.role]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (isLoading || !user || !navItems.length) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-2xl border border-[var(--border)] bg-white/95 p-3 shadow-lg backdrop-blur lg:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close dashboard menu" : "Open dashboard menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--border)] bg-[rgba(247,243,234,0.9)] px-5 py-7 shadow-[8px_0_30px_rgba(7,29,54,0.03)] backdrop-blur-xl transition-transform duration-200 lg:fixed lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl px-1 py-2 transition hover:bg-white/60">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ink)] font-black text-[var(--gold)] shadow-sm">
            N
          </span>
          <span>
            <span className="block text-lg font-black tracking-wide text-[var(--ink)] leading-none">NIDUS</span>
            <span className="mt-1 block text-[0.68rem] uppercase tracking-[0.35em] text-[var(--muted)]">Command OS</span>
          </span>
        </Link>

        <nav className="mt-10 space-y-1.5">
          {navItems.map((item) => {
            const isActive = item.href.split("#")[0] === pathname;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group block rounded-2xl px-4 py-3 text-sm font-bold transition duration-200 ${
                  isActive
                    ? "border border-[var(--border-strong)] bg-white text-[var(--ink)] shadow-sm"
                    : "text-[var(--ink)] hover:bg-white/80 hover:shadow-sm"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{item.label}</span>
                  {isActive ? <span className="h-2 w-2 rounded-full bg-[var(--gold)]" /> : null}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-[var(--border)] bg-white/90 p-4 text-sm shadow-sm">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.28em] text-[var(--muted)]">Secure Node</p>
          <p className="mt-2 font-semibold text-[var(--ink)]">Role: {roleLabel}</p>
        </div>
      </aside>
    </>
  );
}
