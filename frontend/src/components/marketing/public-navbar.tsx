"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import { academyMenuItems, guruMenuItems, topRankMenuItems } from "@/components/marketing/public-modules";

function Dropdown({ label, items, highlighted = false }: { label: string; items: readonly (readonly [string, string])[]; highlighted?: boolean }) {
  return (
    <div className="group relative">
      <button type="button" className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${highlighted ? "border border-[#c9a646]/35 bg-[#fff8dd]/80 text-[#5f5428]" : "text-[#263a8f] hover:bg-white/70"}`}>
        {highlighted ? <Sparkles className="h-4 w-4 text-[#b28a2e]" /> : null}
        {label}
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 mt-3 w-64 translate-y-2 rounded-lg border border-[#263a8f]/10 bg-white/95 p-2 opacity-0 shadow-[0_24px_80px_rgba(19,35,72,0.16)] backdrop-blur-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {items.map(([item, href]) => (
          <Link key={item} href={href} className="block rounded px-3 py-2.5 text-sm font-semibold text-[#536072] transition hover:bg-[#f4f7fb] hover:text-[#263a8f]">
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}

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
    <header className={`fixed left-0 right-0 top-0 z-50 transition duration-300 ${scrolled || open ? "border-b border-[#263a8f]/10 bg-white/90 shadow-[0_16px_50px_rgba(38,58,143,0.10)] backdrop-blur-2xl" : "bg-white/54 backdrop-blur-xl"}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-11 w-11 place-items-center rounded border border-[#263a8f]/20 bg-white text-[#263a8f] shadow-[0_12px_32px_rgba(38,58,143,0.12)]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold tracking-normal text-[#111827]">NIDUS</span>
            <span className="block text-[0.65rem] uppercase tracking-[0.24em] text-[#263a8f]">Defence Performance Campus</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          <Dropdown label="Academy" items={academyMenuItems} />
          <Dropdown label="Top Rank" items={topRankMenuItems} />
          <Dropdown label="NIDUS Guru" items={guruMenuItems} highlighted />
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/start-free" className="rounded bg-[#263a8f] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(38,58,143,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
            Start Free
          </Link>
          <Link href="/login" className="rounded border border-[#263a8f]/18 bg-white px-4 py-2 text-sm font-semibold text-[#263a8f] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c9a646]/60">
            Login
          </Link>
        </div>

        <button type="button" className="rounded border border-[#263a8f]/15 bg-white/80 p-2 text-[#263a8f] lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle public navigation">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#263a8f]/10 bg-white/96 px-4 py-4 backdrop-blur-2xl lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-3">
            <MobileGroup title="Academy" items={academyMenuItems} onClick={() => setOpen(false)} />
            <MobileGroup title="Top Rank" items={topRankMenuItems} onClick={() => setOpen(false)} />
            <MobileGroup title="NIDUS Guru" items={guruMenuItems} onClick={() => setOpen(false)} />
            <Link href="/start-free" onClick={() => setOpen(false)} className="rounded bg-[#263a8f] px-4 py-4 text-center text-sm font-semibold text-white shadow-sm">Start Free</Link>
            <Link href="/login" onClick={() => setOpen(false)} className="rounded border border-[#263a8f]/15 bg-white px-4 py-4 text-center text-sm font-semibold text-[#263a8f] shadow-sm">Login</Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function MobileGroup({ title, items, onClick }: { title: string; items: readonly (readonly [string, string])[]; onClick: () => void }) {
  return (
    <div className="rounded-lg border border-[#263a8f]/10 bg-[#f8fafc] p-3">
      <p className="px-2 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#263a8f]">{title}</p>
      <div className="mt-2 grid gap-1">
        {items.map(([item, href]) => (
          <Link key={item} href={href} onClick={onClick} className="rounded px-2 py-2 text-sm font-semibold text-[#536072] hover:bg-white hover:text-[#263a8f]">
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}
