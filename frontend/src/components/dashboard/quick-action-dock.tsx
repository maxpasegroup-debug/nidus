"use client";

import Link from "next/link";
import { Bell, CalendarDays, ClipboardCheck, GraduationCap, Megaphone, Users, WalletCards, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const directorActions: QuickAction[] = [
  { label: "Admin", href: "/dashboard/director/admin-accounts", icon: ClipboardCheck },
  { label: "Notifications", href: "/dashboard/director/notifications", icon: Bell },
  { label: "Academics", href: "/dashboard/director/academic", icon: GraduationCap },
  { label: "HRM", href: "/dashboard/director/hrm", icon: Users },
  { label: "Accounts", href: "/dashboard/director/accounts", icon: WalletCards },
];

const academicHeadActions: QuickAction[] = [
  { label: "Timetable", href: "/dashboard/academic-head/hod/timetable", icon: CalendarDays },
  { label: "Teachers", href: "/dashboard/academic-head/hod/teacher-allocation", icon: Users },
  { label: "Approvals", href: "/dashboard/academic-head/hod/approvals", icon: ClipboardCheck },
  { label: "Notify", href: "/dashboard/academic-head/notifications", icon: Bell },
  { label: "Reports", href: "/dashboard/academic-head/hod/reports", icon: Megaphone },
];

export function QuickActionDock({ role }: { role: "DIRECTOR" | "ACADEMIC_HEAD" }) {
  const actions = role === "DIRECTOR" ? directorActions : academicHeadActions;

  return (
    <div className="fixed bottom-5 right-5 z-50 group">
      <div className="mb-3 hidden w-56 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-2xl group-hover:block group-focus-within:block">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-black hover:bg-[var(--gold-soft)]">
              <Icon className="h-4 w-4" />
              {action.label}
            </Link>
          );
        })}
      </div>
      <button type="button" className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl ring-4 ring-white">
        <Zap className="h-6 w-6" />
      </button>
    </div>
  );
}
