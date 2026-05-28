"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { academyMenuItems } from "@/components/marketing/public-modules";

const academyLinks = [["All Programs", "/programs"], ...academyMenuItems] as const;

function AcademyDropdown({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [setOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-[#071D36] transition hover:bg-[#071D36]/6 hover:text-[#B9913F]" aria-expanded={open} aria-haspopup="menu">
        Academy
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`absolute left-0 top-full z-50 mt-3 w-72 rounded-lg border border-[#071D36]/10 bg-white/96 p-2 shadow-[0_24px_80px_rgba(7,29,54,0.14)] backdrop-blur-2xl transition ${open ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"}`} role="menu">
        {academyLinks.map(([item, href]) => (
          <Link key={item} href={href} onClick={() => setOpen(false)} className="block rounded px-3 py-2.5 text-sm font-semibold text-[#64748b] transition hover:bg-[#f7f3ea] hover:text-[#071D36]" role="menuitem">
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [academyOpen, setAcademyOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#071D36]/8 bg-[#f7f3ea]/78 text-[#071D36] backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center" onClick={() => setOpen(false)}>
          <span className="text-xl font-black uppercase tracking-[0.08em] text-[#071D36] transition duration-300 group-hover:tracking-[0.16em]">
            NIDUS ACADEMY
          </span>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          <Link href="/psychometric" className="rounded-full px-3 py-2 text-sm font-semibold text-[#071D36] transition hover:bg-[#071D36]/6 hover:text-[#B9913F]">
            Assessments
          </Link>
          <AcademyDropdown open={academyOpen} setOpen={setAcademyOpen} />
          <Link href="/guru" className="rounded-full px-3 py-2 text-sm font-semibold text-[#071D36] transition hover:bg-[#071D36]/6 hover:text-[#B9913F]">
            Nidus Guru
          </Link>
          <Link href="/toprank" className="rounded-full px-3 py-2 text-sm font-semibold text-[#071D36] transition hover:bg-[#071D36]/6 hover:text-[#B9913F]">
            Top Rank
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/start-free?intent=general" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-4 py-2 text-sm font-semibold text-[#071D36] shadow-[0_14px_34px_rgba(185,145,63,0.22)] transition hover:brightness-105">
            Start Free
          </Link>
          <Link href="/login" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-4 py-2 text-sm font-semibold text-[#071D36] shadow-[0_14px_34px_rgba(185,145,63,0.22)] transition hover:brightness-105">
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
            <Link href="/psychometric" onClick={() => setOpen(false)} className="rounded px-3 py-3 text-sm font-semibold text-[#071D36] hover:bg-white">Assessments</Link>
            <p className="px-3 pt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B9913F]">Academy</p>
            {academyLinks.map(([item, href]) => (
              <Link key={item} href={href} onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm font-semibold text-[#64748b] hover:bg-white hover:text-[#071D36]">
                {item}
              </Link>
            ))}
            <Link href="/guru" onClick={() => setOpen(false)} className="rounded px-3 py-3 text-sm font-semibold text-[#071D36] hover:bg-white">Nidus Guru</Link>
            <Link href="/toprank" onClick={() => setOpen(false)} className="rounded px-3 py-3 text-sm font-semibold text-[#071D36] hover:bg-white">Top Rank</Link>
            <Link href="/start-free?intent=general" onClick={() => setOpen(false)} className="mt-2 rounded-full border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-4 py-3 text-center text-sm font-semibold text-[#071D36]">Start Free</Link>
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-full border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-4 py-3 text-center text-sm font-semibold text-[#071D36]">Login</Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
