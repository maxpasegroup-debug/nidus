import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, Compass, Repeat, Sparkles } from "lucide-react";
import { guruRecordedQuests } from "@/components/marketing/public-modules";

const loop = [
  ["Learn", "Enter a guided transformation session."],
  ["Reflect", "Understand your patterns and triggers."],
  ["Apply", "Complete a practical action challenge."],
  ["Repeat", "Build consistency through mission loops."],
  ["Transform", "Convert awareness into daily identity."]
] as const;

export default function GuruPage() {
  return (
    <div className="bg-[#f7f3ea] pt-20 text-[#101827]">
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(185,145,63,0.16),transparent_28rem),radial-gradient(circle_at_84%_12%,rgba(110,143,175,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_26rem] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Active Learning Transformation Ecosystem</p>
            <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.96] text-[#071d36] sm:text-7xl">
              Transform Your Mind.
              <span className="block">Transform Your Future.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#64748b] sm:text-xl">
              Immersive active learning quests designed to help students build focus, discipline, consistency, confidence, and performance.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="#quests" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#b9913f] px-5 py-3 text-sm font-semibold text-[#071d36] shadow-[0_18px_40px_rgba(185,145,63,0.20)] transition hover:-translate-y-0.5 hover:bg-[#e7c873]">
                Explore Quests <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/start-free" className="inline-flex min-h-12 items-center justify-center rounded border border-[#071d36]/14 bg-white/76 px-5 py-3 text-sm font-semibold text-[#071d36] shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
                Start Free
              </Link>
              <Link href="/psychometric" className="inline-flex min-h-12 items-center justify-center rounded px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5">
                Discover Your Mind
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[#071d36]/10 bg-white/80 p-5 shadow-[0_28px_90px_rgba(7,29,54,0.10)] backdrop-blur-2xl">
            <Sparkles className="h-7 w-7 text-[#3f4a32]" />
            <h2 className="mt-5 text-3xl font-semibold text-[#071d36]">Mission-Based Growth</h2>
            <div className="mt-6 grid gap-3">
              {["Guided experience", "Reflection prompt", "Action challenge", "Progress tracking"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded border border-[#071d36]/10 bg-[#f7f3ea] p-3 text-sm font-semibold text-[#071d36]">
                  <CheckCircle2 className="h-4 w-4 text-[#3f4a32]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#071d36]/10 bg-white/74 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">How It Works</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Active learning is not watching. It is becoming.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {loop.map(([title, text], index) => (
              <article key={title} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.06)]">
                <span className="text-2xl font-semibold text-[#b9913f]">{index + 1}</span>
                <h3 className="mt-5 text-xl font-semibold text-[#071d36]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="quests" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Core Quests</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Four journeys. One transformation system.</h2>
            </div>
            <Compass className="hidden h-9 w-9 text-[#b9913f] sm:block" />
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {guruRecordedQuests.map((quest) => {
              const Icon = quest.icon;
              return (
                <Link key={quest.slug} href={quest.href} className="group overflow-hidden rounded-lg border border-[#071d36]/10 bg-white shadow-[0_24px_80px_rgba(7,29,54,0.10)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                  <div className={`relative min-h-64 bg-gradient-to-br ${quest.tone} p-5 text-white`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.34),transparent_12rem),linear-gradient(0deg,rgba(7,29,54,0.42),transparent)]" />
                    <div className="relative flex min-h-56 flex-col justify-between">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/22 bg-white/14 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] backdrop-blur-xl">Coming Soon</span>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/78">{quest.missionCount}</p>
                        <h3 className="mt-2 text-4xl font-semibold leading-tight">{quest.title}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-lg font-semibold text-[#071d36]">{quest.tagline}</p>
                    <p className="mt-3 text-sm leading-7 text-[#64748b]">{quest.promise}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {quest.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-[#3f4a32]">{tag}</span>
                      ))}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                      View Mission Roadmap <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-[#071d36]/10 bg-white/82 p-6 shadow-[0_22px_60px_rgba(7,29,54,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Repeat className="h-6 w-6 text-[#3f4a32]" />
            <h2 className="mt-4 text-2xl font-semibold text-[#071d36]">Transformation quests release one by one.</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Join free to begin onboarding and receive quest release updates.</p>
          </div>
          <Link href="/start-free" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#b9913f] px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5 hover:bg-[#e7c873]">
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
