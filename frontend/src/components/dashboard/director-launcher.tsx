"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type DirectorTile = {
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | number;
  note?: string;
  muted?: boolean;
};

export function DirectorLauncher({
  eyebrow,
  title,
  description,
  tiles,
  stats,
  backHref,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tiles: DirectorTile[];
  stats?: { label: string; value: string | number }[];
  backHref?: string;
}) {
  return (
    <main className="relative flex min-h-[calc(100vh-var(--nav-height)-2rem)] flex-col bg-[var(--page-bg)] px-3 py-3 text-[var(--navy)] lg:h-[calc(100vh-var(--nav-height)-2rem)] lg:overflow-hidden">
      <section className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-3 overflow-hidden">
        <header className="shrink-0 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm lg:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              {backHref ? (
                <Link href={backHref} className="mb-2 inline-flex items-center gap-2 text-sm font-black text-[var(--muted-blue)] transition hover:text-[var(--navy)]">
                  <ArrowLeft className="h-4 w-4" />
                  Control Panel
                </Link>
              ) : null}
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{eyebrow}</p>
              <h1 className="mt-1 text-2xl font-black leading-tight">{title}</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">{description}</p>
            </div>
            {stats?.length ? (
              <div className="grid gap-2 sm:grid-cols-3 lg:w-[560px]">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{stat.label}</p>
                    <p className="text-base font-black">{stat.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tiles.map((tile) => (
            <DirectorActionTile key={tile.label} tile={tile} />
          ))}
        </section>
      </section>
    </main>
  );
}

function DirectorActionTile({ tile }: { tile: DirectorTile }) {
  const Icon = tile.icon;
  const className = `group relative overflow-hidden rounded-2xl border text-left shadow-sm transition ${
    tile.muted
      ? "border-dashed border-[var(--border)] bg-white/60 text-[var(--muted-blue)]"
      : "border-[var(--border)] bg-white hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)] hover:shadow-md"
  }`;

  const content = (
    <>
      <div className="relative flex h-14 items-center justify-center bg-[var(--gold-soft)]">
        <Icon className="h-5 w-5 text-[var(--navy)]" />
        {tile.badge ? <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700">{tile.badge}</span> : null}
      </div>
      <div className="p-3.5">
        <h2 className="text-base font-black leading-tight">{tile.label}</h2>
        {tile.note ? (
          <p className="mt-1.5 overflow-hidden text-sm leading-6 text-[var(--muted-blue)]" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {tile.note}
          </p>
        ) : null}
        {tile.muted ? <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em]">Future API</p> : null}
        {!tile.muted ? (
          <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--gold)]">
            Open
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        ) : null}
      </div>
    </>
  );

  if (!tile.href || tile.muted) {
    return (
      <button type="button" disabled className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={tile.href} className={className}>
      {content}
    </Link>
  );
}
