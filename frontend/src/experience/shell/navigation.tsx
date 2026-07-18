"use client";

/**
 * Permanent global navigation for NIDUS Experience V2.
 * It stays minimal, keyboard-accessible, and responsive across the cinematic journey.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/components/design-system/utils";
import { useReducedMotionSetting } from "../hooks";
import type { ExperienceNavigationItem } from "./types";

type ExperienceNavigationProps = {
  activeId?: string;
  hidden?: boolean;
  items?: ExperienceNavigationItem[];
  scrolled?: boolean;
};

/**
 * Renders the global institutional navigation layer.
 */
export function ExperienceNavigation({ activeId, hidden = false, items = [], scrolled = false }: ExperienceNavigationProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotionSetting();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  function scrollToItem(href: string) {
    if (!href.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-[60] border-b px-4 transition sm:px-6 lg:px-8",
        reducedMotion ? "duration-0" : "duration-500",
        hidden && !open ? "-translate-y-full" : "translate-y-0",
        scrolled || open ? "border-[#071d36]/10 bg-[#f7f3ea]/88 text-[#071d36] shadow-[0_10px_28px_rgba(7,29,54,0.06)] backdrop-blur-2xl" : "border-white/10 bg-transparent text-white"
      )}
    >
      <nav ref={menuRef} aria-label="NIDUS Experience navigation" className="mx-auto flex h-20 max-w-[96rem] items-center justify-between">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.18em] outline-none focus-visible:ring-2 focus-visible:ring-[#b9913f]/45" onClick={() => setOpen(false)}>
          NIDUS
        </Link>
        <div className="hidden items-center gap-6 lg:flex">
          {items.map((item) => (
            <Link key={item.id} href={item.href} aria-current={activeId === item.id ? "page" : undefined} className={cn("text-xs font-black uppercase tracking-[0.18em] transition hover:text-[#b9913f] focus-visible:ring-2 focus-visible:ring-[#b9913f]/45", activeId === item.id ? "text-[#b9913f]" : "")} onClick={(event) => {
              if (item.href.startsWith("#")) {
                event.preventDefault();
                scrollToItem(item.href);
              }
            }}>
              {item.label}
            </Link>
          ))}
        </div>
        <button type="button" aria-expanded={open} aria-controls="experience-mobile-menu" aria-label={open ? "Close navigation" : "Open navigation"} className="grid h-11 w-11 place-items-center rounded-full border border-current/18 bg-white/10 backdrop-blur lg:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </nav>
      <div id="experience-mobile-menu" className={cn("grid overflow-hidden lg:hidden", open ? "max-h-[calc(100dvh-5rem)] pb-5" : "max-h-0")}>
        <div className="mx-auto grid w-full max-w-[96rem] gap-1">
          {items.map((item) => (
            <Link key={item.id} href={item.href} onClick={(event) => {
              setOpen(false);
              if (item.href.startsWith("#")) {
                event.preventDefault();
                scrollToItem(item.href);
              }
            }} aria-current={activeId === item.id ? "page" : undefined} className={cn("rounded px-3 py-3 text-sm font-black uppercase tracking-[0.16em] hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-[#b9913f]/45", activeId === item.id ? "text-[#b9913f]" : "")}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
