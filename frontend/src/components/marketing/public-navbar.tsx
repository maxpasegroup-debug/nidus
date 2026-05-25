"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronDown, Menu, ShieldCheck, X } from "lucide-react";
import { academyMenuItems } from "@/components/marketing/public-modules";

function AcademyDropdown() {
  return (
    <div className="group relative">
      <button type="button" className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-[#071D36] transition hover:bg-[#071D36]/6 hover:text-[#B9913F]">
        Academy
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 mt-3 w-64 translate-y-2 rounded-lg border border-[#071D36]/10 bg-white/94 p-2 opacity-0 shadow-[0_24px_80px_rgba(7,29,54,0.14)] backdrop-blur-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {academyMenuItems.map(([item, href]) => (
          <Link key={item} href={href} className="block rounded px-3 py-2.5 text-sm font-semibold text-[#64748b] transition hover:bg-[#f7f3ea] hover:text-[#071D36]">
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#071D36]/8 bg-[#f7f3ea]/78 text-[#071D36] backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-[#B9913F]/35 bg-[#071D36] text-[#E7C873]">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="text-xl font-semibold tracking-normal text-[#071D36]">NIDUS</span>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          <AcademyDropdown />
          <Link href="/toprank" className="rounded-full px-3 py-2 text-sm font-semibold text-[#071D36] transition hover:bg-[#071D36]/6 hover:text-[#B9913F]">
            Top Rank
          </Link>
          <Link href="/guru" className="rounded-full px-3 py-2 text-sm font-semibold text-[#071D36] transition hover:bg-[#071D36]/6 hover:text-[#B9913F]">
            NIDUS Guru
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/start-free" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#071D36]/14 bg-white/70 px-4 py-2 text-sm font-semibold text-[#071D36] transition hover:bg-white">
            Start Free
          </Link>
          <Link href="/login" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#071D36] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(7,29,54,0.16)] transition hover:bg-[#0d2a4b]">
            Login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button type="button" className="rounded-full border border-[#071D36]/14 bg-white/70 p-2 text-[#071D36] lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle public navigation">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#071D36]/10 bg-[#f7f3ea]/98 px-4 py-4 backdrop-blur-2xl lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2">
            <p className="px-3 pt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B9913F]">Academy</p>
            {academyMenuItems.map(([item, href]) => (
              <Link key={item} href={href} onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm font-semibold text-[#64748b] hover:bg-white hover:text-[#071D36]">
                {item}
              </Link>
            ))}
            <Link href="/toprank" onClick={() => setOpen(false)} className="rounded px-3 py-3 text-sm font-semibold text-[#071D36] hover:bg-white">Top Rank</Link>
            <Link href="/guru" onClick={() => setOpen(false)} className="rounded px-3 py-3 text-sm font-semibold text-[#071D36] hover:bg-white">NIDUS Guru</Link>
            <Link href="/start-free" onClick={() => setOpen(false)} className="mt-2 rounded-full border border-[#071D36]/14 bg-white/70 px-4 py-3 text-center text-sm font-semibold text-[#071D36]">Start Free</Link>
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-full bg-[#071D36] px-4 py-3 text-center text-sm font-semibold text-white">Login</Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
