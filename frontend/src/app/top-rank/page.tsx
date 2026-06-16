import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Crosshair, RadioTower, Shield, Ship, Swords } from "lucide-react";

import { topRankApplyHref, topRankDivisions, topRankPrograms } from "@/data/top-rank";

export const metadata: Metadata = {
  title: "TOP RANK Defence Career Hub | NIDUS Academy Kerala",
  description: "TOP RANK is the public defence career division of NIDUS Academy for Army, Navy, Air Force, Coast Guard and officer-entry preparation in Kerala."
};

const divisionIcons = {
  army: Swords,
  navy: Ship,
  "air-force": RadioTower,
  "coast-guard": Shield,
  "officer-entry": Crosshair
} as const;

export default function TopRankPage() {
  return (
    <main className="min-h-screen bg-[#071d36] text-white">
      <section className="relative overflow-hidden px-5 py-20 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(231,200,115,0.28),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(110,143,175,0.22),transparent_32rem),linear-gradient(135deg,#071d36_0%,#102a43_58%,#1f3d2f_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[#e7c873]">NIDUS Defence Career Division</p>
            <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-normal md:text-7xl">
              TOP RANK
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/76">
              A dedicated public defence career hub for Army, Navy, Air Force, Coast Guard and officer-entry aspirants.
              Built for Kerala students who need clear guidance, disciplined preparation and a direct path to admission.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={topRankApplyHref("TOP RANK")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#e7c873]/40 bg-[linear-gradient(135deg,#fff3bf,#e7c873_42%,#b9913f)] px-5 py-3 font-black text-[#071d36] shadow-xl">
                Apply Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={topRankApplyHref("Counselling")} className="inline-flex min-h-12 items-center justify-center rounded border border-white/18 bg-white/10 px-5 py-3 font-black text-white">
                Talk To Counsellor
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {topRankDivisions.map((division) => {
              const Icon = divisionIcons[division.slug as keyof typeof divisionIcons] ?? Shield;
              return (
                <Link key={division.slug} href={`/top-rank/${division.slug}`} className="group rounded border border-white/14 bg-white/8 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#e7c873]/70 hover:bg-white/12">
                  <div className="grid h-12 w-12 place-items-center rounded border border-[#e7c873]/35 bg-[#e7c873]/12">
                    <Icon className="h-6 w-6 text-[#e7c873]" />
                  </div>
                  <h2 className="mt-5 text-2xl font-black">{division.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/68">{division.tagline}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#e7c873]">
                    Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#f7f3ea] px-5 py-16 text-[#071d36] md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[#b9913f]">Programs</p>
              <h2 className="mt-3 text-4xl font-black">Defence career paths under TOP RANK.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#40516a]">
              These programs connect to the existing NIDUS CRM, BDE counselling, Administrative Officer admission flow, batches and student activation.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {topRankPrograms.map((program) => (
              <Link key={program.slug} href={`/top-rank/${program.slug}`} className="rounded border border-[#071d36]/12 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b9913f]">TOP RANK</p>
                <h3 className="mt-4 text-2xl font-black">{program.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#40516a]">{program.summary}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-black">
                  View path <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
