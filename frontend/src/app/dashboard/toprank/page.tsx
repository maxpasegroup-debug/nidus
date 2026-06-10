"use client";

import Link from "next/link";
import { Bot, CheckCircle2, ShieldCheck, Trophy } from "lucide-react";

const steps = [
  "Subscribe once for full TOPRANK access",
  "Choose NDA, CDS, AFCAT, Agniveer or SSB practice",
  "Train with AI practice, regular tests and progress review",
  "Continue your exam loop from the TOPRANK arena",
];

export default function ToprankDashboardPage() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">TOPRANK Exam Coaching</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">AI trainer for defence exam practice</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            One subscription unlocks the TOPRANK practice arena for all supported defence exams. Students continue with practice,
            tests, review and rank-focused improvement from here.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg" href="/toprank">
              Open TOPRANK Arena
            </Link>
            <Link className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black" href="/start-free">
              Start Free Account
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Feature icon={Bot} title="24/7 AI Trainer" text="Practice guidance, performance review and next-step direction." />
          <Feature icon={Trophy} title="Rank Focus" text="Designed for speed, accuracy, consistency and exam confidence." />
          <Feature icon={ShieldCheck} title="One Access" text="A single TOPRANK subscription opens the full exam coaching arena." />
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Simple Flow</p>
          <div className="mt-5 grid gap-3">
            {steps.map((step) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
                <CheckCircle2 className="h-5 w-5 text-[var(--gold)]" />
                <span className="font-bold">{step}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof Bot; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
        <Icon className="h-6 w-6 text-[var(--navy)]" />
      </div>
      <h2 className="mt-5 text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
    </article>
  );
}
