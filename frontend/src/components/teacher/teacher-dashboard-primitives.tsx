import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";

export function TeacherModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--ink)] sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-blue)]">{description}</p>
        </div>
        {action}
      </div>
    </header>
  );
}

export function TeacherTileGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{children}</div>;
}

export function CompactBatchTile({ name, program, students, subjects, href }: { name: string; program: string; students: number; subjects: number; href: string }) {
  return (
    <Link
      href={href}
      className="group flex aspect-square min-w-0 flex-col justify-between rounded-xl border border-[var(--border)] bg-white p-4 text-[var(--ink)] shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--page-bg)]"><Users size={17} /></span>
        <ArrowUpRight className="h-4 w-4 shrink-0 opacity-50 transition group-hover:opacity-100" />
      </div>
      <div className="min-w-0">
        <p className="line-clamp-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">{program}</p>
        <h3 className="mt-1 line-clamp-3 text-sm font-black leading-5 sm:text-base">{name}</h3>
        <p className="mt-2 text-xs font-bold text-[var(--muted-blue)]">{students} students / {subjects} subjects</p>
      </div>
    </Link>
  );
}
