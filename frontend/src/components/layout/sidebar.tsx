"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getNavItems } from "@/components/layout/nav-items";
import { useAuth } from "@/components/providers/auth-provider";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navItems = getNavItems(user?.role);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed left-4 top-[calc(1rem+env(safe-area-inset-top))] z-50 grid h-11 w-11 place-items-center rounded border border-gold/30 bg-navy-deep/85 text-gold shadow-xl backdrop-blur-xl lg:hidden"
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
        aria-controls="primary-sidebar"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        id="primary-sidebar"
        className={`fixed left-0 top-0 z-40 h-screen w-[var(--sidebar-width)] border-r border-white/10 bg-navy-deep/85 px-5 py-6 shadow-[30px_0_90px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Primary navigation"
      >
        <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <span className="grid h-11 w-11 place-items-center rounded border border-gold/40 bg-gold/10 text-sm font-bold text-gold">
            N
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-normal">NIDUS</span>
            <span className="block text-xs uppercase tracking-[0.18em] text-muted">Command OS</span>
          </span>
        </Link>

        <nav className="mt-10 max-h-[calc(100vh-13rem)] space-y-2 overflow-y-auto pr-1" aria-label="Main sections">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block min-h-11 rounded border px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "border-gold/35 bg-gold/10 text-gold"
                    : "border-transparent text-muted hover:border-gold/20 hover:bg-white/5 hover:text-white"
                }`}
              aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Secure Node</p>
          <p className="mt-2 text-sm text-muted">Role: {user?.role ?? "GUEST"}</p>
        </div>
      </aside>
    </>
  );
}
