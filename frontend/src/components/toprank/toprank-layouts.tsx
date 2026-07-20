import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Shield } from "lucide-react";
import { TopRankAuthGate, TopRankLogoutButton } from "./toprank-auth-gate";

const publicLinks = [
  { label: "Gateways", href: "/toprank/gateway" },
  { label: "Agniveer", href: "/toprank/gateway/agniveer" },
  { label: "ALTT", href: "/toprank/gateway/agniveer/altt" },
  { label: "Curriculum", href: "/toprank/gateway/agniveer/curriculum" },
  { label: "Join", href: "/toprank/join" },
  { label: "Login", href: "/toprank/login" },
];

const roleLinks = {
  student: [
    { label: "Dashboard", href: "/toprank/student" },
    { label: "Missions", href: "/toprank/student/missions" },
    { label: "Calendar", href: "/toprank/student/calendar" },
    { label: "Profile", href: "/toprank/student/profile" },
    { label: "APR", href: "/toprank/student/apr" },
  ],
  mentor: [
    { label: "Dashboard", href: "/toprank/mentor" },
    { label: "Missions", href: "/toprank/mentor" },
    { label: "Classes", href: "/toprank/mentor" },
    { label: "Reviews", href: "/toprank/mentor" },
  ],
  admin: [
    { label: "Dashboard", href: "/toprank/admin" },
    { label: "Missions", href: "/toprank/admin" },
    { label: "Gateways", href: "/toprank/admin" },
    { label: "Reports", href: "/toprank/admin" },
  ],
} as const;

export function TopRankBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/toprank" className="flex items-center gap-3" aria-label="TopRank home">
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#c99b3f]/35 bg-[#c99b3f]/12 text-[#f6d17a] shadow-[0_20px_60px_rgba(201,155,63,0.16)]">
        <Shield className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-lg font-black uppercase tracking-[0.16em] text-white">TopRank</span>
        {!compact ? <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-[#cbbf9a]">Maxpase Group</span> : null}
      </span>
    </Link>
  );
}

export function TopRankNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06120e]/88 backdrop-blur-2xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <TopRankBrand />
        <nav className="hidden items-center gap-2 md:flex" aria-label="TopRank public navigation">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm font-semibold text-[#d9dccf] transition hover:bg-white/8 hover:text-[#f6d17a]">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/toprank/gateway/agniveer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#c99b3f]/45 bg-[#d6a447] px-4 text-sm font-black text-[#06120e] shadow-[0_18px_48px_rgba(201,155,63,0.24)] transition hover:brightness-110">
          Enter Gateway <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

export function TopRankFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#06120e] px-4 py-10 text-[#b9c2b4] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <TopRankBrand compact />
        <p className="max-w-xl text-sm leading-6 text-[#98a493]">
          TopRank is an independent AI-powered defence training platform developed by Maxpase Group. RC2 creates the public experience and enrollment foundation.
        </p>
      </div>
    </footer>
  );
}

export function TopRankPublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#06120e] text-white">
      <TopRankNavbar />
      {children}
      <TopRankFooter />
    </div>
  );
}

export function TopRankRoleLayout({ role, title, children }: { role: keyof typeof roleLinks; title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07120e] text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-[#081611] px-5 py-6 lg:block">
        <TopRankBrand />
        <nav className="mt-10 grid gap-2" aria-label={`${title} navigation`}>
          {roleLinks[role].map((link) => (
            <Link key={`${role}-${link.label}`} href={link.href} className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#c9d0c2] transition hover:bg-white/8 hover:text-[#f6d17a]">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07120e]/86 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="lg:hidden">
              <TopRankBrand compact />
            </div>
            <p className="hidden text-sm font-bold uppercase tracking-[0.2em] text-[#f6d17a] lg:block">{title}</p>
            <TopRankLogoutButton />
          </div>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <TopRankAuthGate role={role}>{children}</TopRankAuthGate>
        </main>
      </div>
    </div>
  );
}
