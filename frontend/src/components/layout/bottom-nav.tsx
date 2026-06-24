"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpenCheck, CalendarDays, ClipboardCheck, FileText, Library, Menu, Users, X } from "lucide-react";
import { getNavItems } from "@/components/layout/nav-items";
import { useAuth } from "@/components/providers/auth-provider-v2";

function NavIcon({ label }: { label: string }) {
  const value = label.toLowerCase();
  if (value.includes("student") || value.includes("team")) return <Users size={18} />;
  if (value.includes("calendar") || value === "today") return <CalendarDays size={18} />;
  if (value.includes("attendance")) return <ClipboardCheck size={18} />;
  if (value.includes("assignment")) return <FileText size={18} />;
  if (value.includes("exam")) return <BookOpenCheck size={18} />;
  if (value.includes("library")) return <Library size={18} />;
  return <Menu size={18} />;
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const dashboardTemplate = typeof user?.roleMetadata?.dashboardTemplate === "string" ? user.roleMetadata.dashboardTemplate : null;
  const navItems = getNavItems(user?.role, dashboardTemplate);
  const primaryItems = navItems.slice(0, 4);
  const remainingItems = navItems.slice(4);

  useEffect(() => setMoreOpen(false), [pathname]);

  if (!navItems.length) return null;

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-[70] bg-slate-950/50 lg:hidden" role="presentation" onClick={() => setMoreOpen(false)}>
          <section className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-[var(--border)] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl" role="dialog" aria-modal="true" aria-label="More dashboard modules" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">Dashboard</p><h2 className="mt-1 text-xl font-black">More tools</h2></div>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close more tools" className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)]"><X size={18} /></button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {remainingItems.map((item) => (
                <Link key={`${item.label}-${item.href}`} href={item.href} className="flex min-h-20 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4 font-black text-[var(--ink)]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white"><NavIcon label={item.label} /></span>
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 grid border-t border-[#071d36]/10 bg-[#f7f3ea]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden ${remainingItems.length ? "grid-cols-5" : "grid-cols-4"}`} aria-label="Mobile primary navigation">
        {primaryItems.map((item) => (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[0.62rem] font-black transition ${
              pathname === item.href ? "bg-white text-[#071d36]" : "text-[#64748b] hover:bg-white/70 hover:text-[#071d36]"
            }`}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <NavIcon label={item.label} />
            <span className="line-clamp-1">{item.label}</span>
          </Link>
        ))}
        {remainingItems.length ? (
          <button type="button" onClick={() => setMoreOpen(true)} className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.62rem] font-black ${remainingItems.some((item) => pathname === item.href) ? "bg-white text-[#071d36]" : "text-[#64748b]"}`} aria-label="Open more dashboard modules">
            <Menu size={18} /><span>More</span>
          </button>
        ) : null}
      </nav>
    </>
  );
}
