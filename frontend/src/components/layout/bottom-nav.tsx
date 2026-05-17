"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems } from "@/components/layout/nav-items";
import { useAuth } from "@/components/providers/auth-provider-v2";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = getNavItems(user?.role).slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-white/10 bg-navy-deep/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Mobile primary navigation">
      {navItems.map((item) => (
        <Link
          key={`${item.label}-${item.href}`}
          href={item.href}
          className={`flex min-h-14 items-center justify-center px-2 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition ${
            pathname === item.href ? "bg-gold/10 text-gold" : "text-muted hover:bg-white/5 hover:text-gold"
          }`}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
