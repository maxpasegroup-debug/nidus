"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, ShieldCheck, Sparkles, X } from "lucide-react";

const navItems = [
  ["Programs", "/#programs"],
  ["NIDUS Guru", "/#nidus-guru"],
  ["Psychometric Tests", "/#psychometric-tests"],
  ["Join NIDUS", "/#admissions"]
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
    <header className={`fixed left-0 right-0 top-0 z-50 transition duration-300 ${scrolled || open ? "border-b border-[#263a8f]/10 bg-white/82 shadow-[0_16px_50px_rgba(38,58,143,0.10)] backdrop-blur-2xl" : "bg-white/28 backdrop-blur-sm"}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-11 w-11 place-items-center rounded border border-[#263a8f]/20 bg-white/70 text-[#263a8f] shadow-[0_12px_32px_rgba(38,58,143,0.12)]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold tracking-normal text-[#111827]">NIDUS</span>
            <span className="block text-[0.65rem] uppercase tracking-[0.24em] text-[#263a8f]">From Aspirant To Officer</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={
                label === "NIDUS Guru"
                  ? "inline-flex items-center gap-2 rounded-full border border-[#b89b4d]/35 bg-[#fff8dd]/80 px-4 py-2 text-sm font-semibold text-[#5f5428] shadow-[0_14px_34px_rgba(184,155,77,0.18)] transition hover:-translate-y-0.5 hover:border-[#87905b]/50 hover:bg-white"
                  : label === "Join NIDUS"
                    ? "rounded bg-[#263a8f] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(38,58,143,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]"
                  : "text-sm font-medium text-[#536072] transition hover:text-[#263a8f]"
              }
            >
              {label === "NIDUS Guru" ? <Sparkles className="h-4 w-4 text-[#b89b4d]" /> : null}
              {label}
              {label === "Psychometric Tests" ? <span className="ml-1 rounded-full bg-[#fff8dd] px-2 py-0.5 text-[0.62rem] font-bold text-[#7c6418]">FREE</span> : null}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded border border-[#263a8f]/15 bg-white/60 px-4 py-2 text-sm font-semibold text-[#263a8f] transition hover:border-[#263a8f]/35">Login / Signup</Link>
        </div>

        <button type="button" className="rounded border border-[#263a8f]/15 bg-white/70 p-2 text-[#263a8f] lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle public navigation">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#263a8f]/10 bg-white/95 px-4 py-4 backdrop-blur-2xl lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2">
            {navItems.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={
                  label === "NIDUS Guru"
                    ? "flex items-center justify-between rounded-2xl border border-[#b89b4d]/35 bg-[#fff8dd] px-4 py-4 text-sm font-semibold text-[#5f5428] shadow-sm"
                    : label === "Join NIDUS"
                      ? "rounded bg-[#263a8f] px-4 py-4 text-center text-sm font-semibold text-white shadow-sm"
                    : "rounded px-3 py-3 text-sm font-medium text-[#536072] transition hover:bg-[#263a8f]/6 hover:text-[#263a8f]"
                }
              >
                {label}
                {label === "NIDUS Guru" ? <Sparkles className="h-4 w-4 text-[#b89b4d]" /> : null}
                {label === "Psychometric Tests" ? <span className="ml-2 rounded-full bg-[#fff8dd] px-2 py-0.5 text-[0.62rem] font-bold text-[#7c6418]">FREE</span> : null}
              </Link>
            ))}
            <div className="mt-2 grid gap-3">
              <Link href="/login" onClick={() => setOpen(false)} className="rounded border border-[#263a8f]/15 px-4 py-3 text-center text-sm font-semibold text-[#263a8f]">Login / Signup</Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
