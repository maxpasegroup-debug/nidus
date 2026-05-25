import Link from "next/link";
import { ArrowRight, BrainCircuit, ClipboardCheck, Rocket, Sparkles, Target } from "lucide-react";

const journey = [
  {
    step: "1",
    title: "Know Yourself",
    subtitle: "Take simple assessments and understand your strengths.",
    cta: "Take Free Assessment",
    href: "/psychometric",
    icon: ClipboardCheck,
    tone: "border-[#138a5b]/18 bg-[#f0faf4]"
  },
  {
    step: "2",
    title: "Train Smarter",
    subtitle: "Use TOPRANK missions for exam speed, accuracy, and rank readiness.",
    cta: "Open Dashboard",
    href: "/login",
    icon: Rocket,
    tone: "border-[#263a8f]/16 bg-[#eef3ff]"
  },
  {
    step: "3",
    title: "Transform Daily",
    subtitle: "Build focus, confidence, discipline, and better habits.",
    cta: "Start Free Quest",
    href: "/join",
    icon: Sparkles,
    tone: "border-[#c9a646]/24 bg-[#fff8dd]"
  }
];

const quests = ["Dream Addiction", "Focus Reset", "Confidence Builder", "Warrior Discipline", "Student Power", "Life OS"];

export default function GuruPage() {
  return (
    <div className="bg-[#f7f9fc] pt-20 text-[#111827]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(19,138,91,0.13),transparent_25rem),radial-gradient(circle_at_82%_16%,rgba(255,153,51,0.16),transparent_23rem),linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#138a5b]">NIDUS Guru</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] sm:text-7xl">A simple growth path for every student.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#536072] sm:text-lg">
              First understand yourself. Then train smarter. Then build discipline every day.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/psychometric" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(38,58,143,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1f2f75]">
                Start Free Assessment <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#quests" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#263a8f]/18 bg-white px-5 py-3 text-sm font-semibold text-[#263a8f] shadow-sm transition hover:-translate-y-0.5">
                View Quests
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-[#263a8f]/10 bg-white p-5 shadow-[0_24px_80px_rgba(19,35,72,0.10)]">
            <div className="grid gap-4">
              {journey.map(({ step, title, subtitle, cta, href, icon: Icon, tone }) => (
                <Link key={title} href={href} className={`group rounded-lg border p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(19,35,72,0.10)] ${tone}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-[#263a8f] shadow-sm">{step}</span>
                      <div>
                        <h2 className="text-2xl font-semibold">{title}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#536072]">{subtitle}</p>
                      </div>
                    </div>
                    <Icon className="h-6 w-6 shrink-0 text-[#263a8f]" />
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#263a8f]">
                    {cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="quests" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#263a8f]">Personal Transformation</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Small quests. Daily improvement.</h2>
            <p className="mt-4 text-sm leading-7 text-[#536072]">No confusion. Students pick one quest and start building a better routine.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quests.map((quest, index) => (
              <article key={quest} className="rounded-lg border border-[#263a8f]/10 bg-white p-5 shadow-[0_16px_50px_rgba(19,35,72,0.08)]">
                <Target className="h-5 w-5 text-[#c9a646]" />
                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#536072]">Quest {index + 1}</p>
                <h3 className="mt-2 text-2xl font-semibold">{quest}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-[#138a5b]/14 bg-[#f0faf4] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrainCircuit className="h-6 w-6 text-[#138a5b]" />
            <h2 className="mt-4 text-2xl font-semibold">Start with the assessment. Let NIDUS guide the next step.</h2>
          </div>
          <Link href="/psychometric" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#138a5b] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            Begin Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
