"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  ["Home", "/"],
  ["Exams", "/#exams"],
  ["AI Platform", "/#ai-platform"],
  ["SSB Training", "/#ssb"],
  ["Courses", "/#courses"],
  ["Results", "/#success"],
  ["About", "/#about"],
  ["Contact", "/contact"]
] as const;

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 transition duration-300 ${scrolled || open ? "border-b border-white/10 bg-navy-deep/84 shadow-[0_16px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-11 w-11 place-items-center rounded border border-gold/45 bg-gold/12 text-sm font-bold text-gold-soft shadow-[0_0_28px_rgba(201,166,70,0.18)]">N</span>
          <span>
            <span className="block text-lg font-semibold tracking-normal text-ink">NIDUS</span>
            <span className="block text-[0.65rem] uppercase tracking-[0.24em] text-gold-soft">From Aspirant To Officer</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-medium text-muted transition hover:text-gold-soft">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded border border-white/12 px-4 py-2 text-sm font-semibold text-ink transition hover:border-gold/40 hover:bg-gold/10">Login</Link>
          <Link href="/register" className="rounded bg-gold px-4 py-2 text-sm font-semibold text-navy-deep shadow-[0_14px_36px_rgba(201,166,70,0.22)] transition hover:bg-gold-soft">Register</Link>
        </div>

        <button type="button" className="rounded border border-white/12 p-2 text-gold-soft lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle public navigation">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-navy-deep/95 px-4 py-4 backdrop-blur-2xl lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded px-3 py-3 text-sm font-medium text-muted transition hover:bg-white/7 hover:text-gold-soft">
                {label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Link href="/login" onClick={() => setOpen(false)} className="rounded border border-white/12 px-4 py-3 text-center text-sm font-semibold text-ink">Login</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="rounded bg-gold px-4 py-3 text-center text-sm font-semibold text-navy-deep">Register</Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
