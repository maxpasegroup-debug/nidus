"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpenCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  Menu,
  Settings,
  UserRound,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DirectorMenuChild = {
  label: string;
  href?: string;
  tab?: string;
  disabled?: boolean;
};

type DirectorMenuItem = {
  label: string;
  subtitle?: string;
  href?: string;
  icon: LucideIcon;
  match?: string[];
  children?: DirectorMenuChild[];
};

const storageKey = "nidus-director-sidebar-collapsed";

const directorMenu: DirectorMenuItem[] = [
  { label: "Today", subtitle: "AI Command Center", href: "/dashboard/director", icon: Home, match: ["/dashboard/director"] },
  {
    label: "Admissions",
    subtitle: "Growth Pipeline",
    icon: UserRoundCheck,
    match: ["/dashboard/director/admissions"],
    children: [
      { label: "Admissions Home", href: "/dashboard/director/admissions" },
      { label: "Leads", href: "/dashboard/director/admissions", tab: "leads" },
      { label: "Applications", href: "/dashboard/director/admissions", tab: "applications" },
      { label: "Approvals", href: "/dashboard/director/admissions", tab: "approvals" },
      { label: "Fee Handover", href: "/dashboard/director/admissions", tab: "fees" },
      { label: "Activation", href: "/dashboard/director/admissions", tab: "activation" },
    ],
  },
  {
    label: "Academics",
    icon: GraduationCap,
    match: ["/dashboard/director/academic", "/dashboard/director/exams", "/dashboard/director/teaching/academic-calendar"],
    children: [
      { label: "Programs", href: "/dashboard/director/academic/programs" },
      { label: "Batches", href: "/dashboard/director/academic/batches" },
      { label: "Timetable", href: "/dashboard/director/academic/timetable" },
      { label: "Exams", href: "/dashboard/director/exams" },
      { label: "Academic Calendar", href: "/dashboard/director/teaching/academic-calendar" },
    ],
  },
  { label: "Students", subtitle: "Learner Control", href: "/dashboard/director/students", icon: Users, match: ["/dashboard/director/students", "/dashboard/director/academic/student-progress"] },
  {
    label: "Accounts",
    icon: WalletCards,
    match: ["/dashboard/director/accounts", "/fees", "/payments", "/invoices"],
    children: [
      { label: "Fees", href: "/dashboard/director/accounts", tab: "collect" },
      { label: "Collections", href: "/dashboard/director/accounts", tab: "overview" },
      { label: "Pending Dues", href: "/dashboard/director/accounts", tab: "dues" },
      { label: "Receipts", href: "/dashboard/director/accounts", tab: "receipts" },
      { label: "Expenses", disabled: true },
      { label: "Reports", href: "/dashboard/director/accounts", tab: "reports" },
    ],
  },
  {
    label: "People",
    icon: UserRound,
    match: ["/dashboard/director/management", "/dashboard/director/hrm", "/dashboard/director/academic/teachers", "/dashboard/director/academic/teacher-performance", "/dashboard/director/teaching/attendance"],
    children: [
      { label: "Teachers", href: "/dashboard/director/academic/teachers" },
      { label: "Staff", href: "/dashboard/director/management" },
      { label: "Roles & Access", href: "/dashboard/director/management" },
      { label: "Attendance", href: "/dashboard/director/teaching/attendance" },
      { label: "Performance", href: "/dashboard/director/academic/teacher-performance" },
    ],
  },
  {
    label: "NDP",
    subtitle: "Digital Profile",
    icon: BookOpenCheck,
    match: ["/dashboard/director/academic/ndp", "/dashboard/director/academic/student-progress", "/dashboard/director/academic/reports"],
    children: [
      { label: "Student Profiles", href: "/dashboard/director/academic/ndp" },
      { label: "Teacher Profiles", href: "/dashboard/director/academic/teachers" },
      { label: "Academic Progress", href: "/dashboard/director/academic/student-progress" },
      { label: "Performance Reports", href: "/dashboard/director/academic/reports" },
      { label: "Skill Progress", href: "/dashboard/director/academic/ndp" },
      { label: "Achievements", href: "/dashboard/director/academic/ndp" },
      { label: "Growth Timeline", href: "/dashboard/director/academic/ndp" },
    ],
  },
  { label: "Reports", href: "/dashboard/director/reports", icon: BarChart3, match: ["/dashboard/director/reports"] },
];

const bottomMenu = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings, match: ["/dashboard/settings"] },
];

function withTab(item: DirectorMenuChild) {
  if (!item.href || !item.tab) return item.href ?? "#";
  return `${item.href}?tab=${item.tab}`;
}

function isPathActive(pathname: string | null, item: DirectorMenuItem | { match?: string[]; href?: string }) {
  if (!pathname) return false;
  const matches = item.match ?? (item.href ? [item.href] : []);
  return matches.some((match) => (match === "/dashboard/director" ? pathname === match : pathname.startsWith(match)));
}

export function DirectorSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const activeGroup = useMemo(() => directorMenu.find((item) => item.children && isPathActive(pathname, item))?.label ?? null, [pathname]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const currentTab = searchParams?.get("tab") ?? searchParams?.get("mode") ?? "";

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "72px" : "240px");
    window.localStorage.setItem(storageKey, String(collapsed));
    return () => {
      document.documentElement.style.setProperty("--sidebar-width", "272px");
    };
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, currentTab]);

  useEffect(() => {
    if (!activeGroup) return;
    setOpenGroups((current) => ({ ...current, [activeGroup]: true }));
  }, [activeGroup]);

  const shellClass = `fixed inset-y-0 left-0 z-50 border-r border-[var(--border)] bg-[rgba(247,243,234,0.96)] shadow-[8px_0_30px_rgba(7,29,54,0.05)] backdrop-blur-xl transition-all duration-200 lg:translate-x-0 ${collapsed ? "lg:w-[72px]" : "lg:w-60"} ${mobileOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full"}`;

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-[calc(var(--nav-height)+0.75rem)] z-[60] rounded-2xl border border-[var(--border)] bg-white/95 p-3 shadow-lg backdrop-blur lg:hidden"
        onClick={() => setMobileOpen((value) => !value)}
        aria-label={mobileOpen ? "Close director menu" : "Open director menu"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {mobileOpen ? <button type="button" aria-label="Close director menu overlay" className="fixed inset-0 z-40 bg-slate-950/25 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}

      <aside className={shellClass} aria-label="Director navigation">
        <div className="flex h-full flex-col px-3 py-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <Link href="/dashboard/director" className="flex min-w-0 items-center gap-3 rounded-xl px-1 py-1.5 transition hover:bg-white/70" title="Today">
              {collapsed ? (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-white text-xs font-black text-[var(--navy)]">N</span>
              ) : (
                <Image src="/brand/nidus-logo-horizontal.png" alt="NIDUS Academy" width={172} height={48} className="max-h-10 w-auto object-contain" priority />
              )}
            </Link>
            <button
              type="button"
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-white text-[var(--navy)] shadow-sm lg:grid"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand director menu" : "Collapse director menu"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {!collapsed ? <p className="mt-1 px-2 text-[0.66rem] font-black uppercase tracking-[0.28em] text-[var(--muted-blue)]">Director OS</p> : null}

          <nav className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2.5">
              {directorMenu.map((item) => {
                const Icon = item.icon;
                const active = isPathActive(pathname, item);
                const expanded = openGroups[item.label] ?? active;
                const itemClass = `group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-black transition ${active ? "border border-[var(--gold-border)] bg-white text-[var(--navy)] shadow-sm" : "text-[var(--navy)] hover:bg-white/80"} ${collapsed ? "justify-center" : "justify-between"}`;

                if (item.children) {
                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        title={item.label}
                        className={itemClass}
                        onClick={() => {
                          if (collapsed) setCollapsed(false);
                          setOpenGroups((current) => ({ ...current, [item.label]: !expanded }));
                        }}
                      >
                        <span className={`flex min-w-0 items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed ? <span className="truncate">{item.label}</span> : null}
                        </span>
                        {!collapsed ? <ChevronDown className={`h-4 w-4 shrink-0 transition ${expanded ? "rotate-180" : ""}`} /> : null}
                      </button>
                      {!collapsed && expanded ? (
                        <div className="ml-7 mt-2 space-y-1.5 border-l border-[var(--border)] pl-3">
                          {item.children.map((child) => {
                            const childHref = withTab(child);
                            const childActive = Boolean(child.href && pathname === child.href && (!child.tab || currentTab === child.tab));
                            if (child.disabled) {
                              return (
                                <span key={child.label} className="flex min-h-11 items-center justify-between rounded-xl px-3 text-xs font-black text-[var(--muted-blue)] opacity-70" title="Coming soon">
                                  {child.label}
                                  <span className="rounded-full bg-[var(--gold-soft)] px-2 py-0.5 text-[10px] text-[var(--gold-dark)]">Soon</span>
                                </span>
                              );
                            }
                            return (
                              <Link
                                key={`${child.label}-${childHref}`}
                                href={childHref}
                                className={`block rounded-xl px-3 py-2.5 text-xs font-black transition ${childActive ? "bg-[var(--gold-soft)] text-[var(--navy)]" : "text-[var(--muted-blue)] hover:bg-white hover:text-[var(--navy)]"}`}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link key={item.label} href={item.href ?? "#"} title={item.label} className={itemClass}>
                    <span className={`flex min-w-0 items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? (
                        <span className="min-w-0">
                          <span className="block truncate">{item.label}</span>
                          {item.subtitle ? <span className="mt-0.5 block truncate text-[10px] font-bold text-[var(--muted-blue)]">{item.subtitle}</span> : null}
                        </span>
                      ) : null}
                    </span>
                    {!collapsed && active ? <span className="h-2 w-2 rounded-full bg-[var(--gold)]" /> : null}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-3">
            {bottomMenu.map((item) => {
              const Icon = item.icon;
              const active = isPathActive(pathname, item);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.label}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-black transition ${collapsed ? "justify-center" : ""} ${active ? "border border-[var(--gold-border)] bg-white" : "hover:bg-white/80"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed ? item.label : null}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}




