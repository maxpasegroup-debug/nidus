"use client";

import Link from "next/link";
import { Brain, Compass, Flame, Focus, Sparkles } from "lucide-react";

const quests = [
  { title: "Dream Addiction", text: "Replace distractions with ambition.", icon: Flame },
  { title: "Focus Reset", text: "Defeat distractions and rebuild deep focus.", icon: Focus },
  { title: "Warrior Discipline", text: "Build routine, execution and self-control.", icon: Compass },
  { title: "Active Learning Transformation", text: "Learn, reflect, apply, repeat and transform.", icon: Brain },
];

export default function GuruDashboardPage() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">NIDUS Guru</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Grab an extraordinary life with NIDUS Guru</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            Personal growth quests built on Active Learning Transformation. These are guided transformation journeys, not passive
            courses.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg" href="/guru">
              Explore Quests
            </Link>
            <Link className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black" href="/start-free">
              Start Free
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          {quests.map((quest) => {
            const Icon = quest.icon;
            return (
              <article key={quest.title} className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                  <Icon className="h-6 w-6 text-[var(--navy)]" />
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Coming Soon</p>
                <h2 className="mt-2 text-2xl font-black">{quest.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{quest.text}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <Sparkles className="mt-1 h-6 w-6 text-[var(--gold)]" />
            <div>
              <h2 className="text-2xl font-black">Active Learning Transformation</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">
                Every quest is designed around missions, reflection and action. The student learns, applies, tracks progress and
                builds a stronger identity over time.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
