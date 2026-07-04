import Link from "next/link";
import { ArrowRight, Crosshair, RadioTower, Shield, Ship, Swords } from "lucide-react";

import { topRankDivisions, topRankPrograms } from "@/data/top-rank";

const divisionIcons = {
  army: Swords,
  navy: Ship,
  "air-force": RadioTower,
  "coast-guard": Shield,
  "officer-entry": Crosshair,
} as const;

export default function StudentTopRankPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--ink)] p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">TOP RANK</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">AI powered exam coaching loop.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
              Choose your defence path, understand the opportunity, and start a disciplined preparation loop from your student dashboard.
            </p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-[var(--gold)]">
            Starter / PTO / TOP RANK
          </span>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Choose Division</p>
            <h2 className="mt-2 text-2xl font-black">Defence categories</h2>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-sm font-black">{topRankDivisions.length} divisions</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {topRankDivisions.map((division) => {
            const Icon = divisionIcons[division.slug as keyof typeof divisionIcons] ?? Shield;
            return (
              <Link
                key={division.slug}
                href={`/dashboard/student/top-rank/${division.slug}`}
                className="group min-h-44 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5 transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:bg-white hover:shadow-md"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                  <Icon className="h-6 w-6 text-[var(--gold)]" />
                </div>
                <h3 className="mt-4 text-xl font-black">{division.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted-blue)]">{division.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[var(--gold)]">
                  Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Programs</p>
            <h2 className="mt-2 text-2xl font-black">Available exam paths</h2>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-sm font-black">{topRankPrograms.length} exams</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topRankPrograms.map((program) => (
            <Link
              key={program.slug}
              href={`/dashboard/student/top-rank/${program.slug}`}
              className="rounded-2xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-md"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">TOP RANK Exam</p>
              <h3 className="mt-3 text-xl font-black">{program.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted-blue)]">{program.summary}</p>
              <span className="mt-4 inline-flex items-center gap-2 font-black">
                View coaching loop <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
