"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, Menu, ShieldCheck, Sparkles, X } from "lucide-react";

const navItems = [
  ["Academy", "/programs"],
  ["NIDUS Guru", "/guru"],
  ["Assessments", "/psychometric"],
  ["Login / Signup", "/login"]
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

        <nav className="hidden items-center gap-3 lg:flex">
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={
                label === "NIDUS Guru"
                  ? "inline-flex items-center gap-2 rounded-full border border-[#b89b4d]/35 bg-[#fff8dd]/80 px-4 py-2 text-sm font-semibold text-[#5f5428] shadow-[0_14px_34px_rgba(184,155,77,0.18)] transition hover:-translate-y-0.5 hover:border-[#87905b]/50 hover:bg-white"
                  : label === "Assessments"
                    ? "inline-flex items-center gap-2 rounded-full border border-[#138a5b]/20 bg-[#eaf7ef]/80 px-4 py-2 text-sm font-semibold text-[#14613f] transition hover:-translate-y-0.5 hover:bg-white"
                  : label === "Login / Signup"
                    ? "rounded border border-[#263a8f]/18 bg-white px-4 py-2 text-sm font-semibold text-[#263a8f] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c9a646]/60"
                  : "text-sm font-medium text-[#536072] transition hover:text-[#263a8f]"
              }
            >
              {label === "NIDUS Guru" ? <Sparkles className="h-4 w-4 text-[#b89b4d]" /> : null}
              {label === "Assessments" ? <ClipboardCheck className="h-4 w-4 text-[#138a5b]" /> : null}
              {label}
            </Link>
          ))}
          <Link href="/join" className="rounded bg-[#263a8f] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(38,58,143,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
            Join NIDUS
          </Link>
        </nav>

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
                    : label === "Assessments"
                      ? "flex items-center justify-between rounded-2xl border border-[#138a5b]/20 bg-[#eaf7ef] px-4 py-4 text-sm font-semibold text-[#14613f]"
                    : label === "Login / Signup"
                      ? "rounded border border-[#263a8f]/15 bg-white px-4 py-4 text-center text-sm font-semibold text-[#263a8f] shadow-sm"
                    : "rounded px-3 py-3 text-sm font-medium text-[#536072] transition hover:bg-[#263a8f]/6 hover:text-[#263a8f]"
                }
              >
                {label}
                {label === "NIDUS Guru" ? <Sparkles className="h-4 w-4 text-[#b89b4d]" /> : null}
                {label === "Assessments" ? <ClipboardCheck className="h-4 w-4 text-[#138a5b]" /> : null}
              </Link>
            ))}
            <Link href="/join" onClick={() => setOpen(false)} className="rounded bg-[#263a8f] px-4 py-4 text-center text-sm font-semibold text-white shadow-sm">
              Join NIDUS
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
