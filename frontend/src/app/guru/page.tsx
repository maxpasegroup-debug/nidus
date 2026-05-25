import Link from "next/link";
import { ArrowRight, BrainCircuit, ClipboardCheck, Compass, GraduationCap, Rocket, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { GuruExperience } from "@/components/guru/guru-content";

const ecosystemCards = [
  {
    title: "Assessments",
    label: "AI-powered psychometric intelligence",
    text: "Personality, career, intelligence, leadership, confidence, emotional analysis, and learning-style reports designed for practical guidance.",
    href: "/psychometric",
    cta: "Start Assessments",
    icon: ClipboardCheck,
    tone: "from-[#101820] via-[#263a8f] to-[#c9a646]",
    points: ["Personality", "Career fit", "Leadership", "Learning style"]
  },
  {
    title: "TOPRANK Exam Coaching",
    label: "Adaptive exam training engine",
    text: "AI profiling, speed improvement, mock intelligence, mentor guidance, and personalized mission roadmaps for NDA, CDS, AFCAT, Agniveer, and SSB.",
    href: "/login",
    cta: "Open Dashboard",
    icon: Rocket,
    tone: "from-[#111827] via-[#2f4a78] to-[#d6b85c]",
    points: ["NDA", "CDS", "AFCAT", "Agniveer"]
  },
  {
    title: "Personal Transformation Programs",
    label: "Quest-based youth growth",
    text: "Dream Addiction, focus, discipline, confidence building, goal transformation, productivity quests, and youth growth missions.",
    href: "#guru-quests",
    cta: "Explore Quests",
    icon: Sparkles,
    tone: "from-[#181915] via-[#6f744e] to-[#eadfba]",
    points: ["Dream Addiction", "Focus", "Confidence", "Productivity"]
  }
];

const signals = [
  ["Active Learning", "Students move through missions, reports, and next actions.", BrainCircuit],
  ["Future Readiness", "Build clarity, confidence, ambition, and personal direction.", Compass],
  ["Focus Systems", "Turn distraction into routines, streaks, and measurable execution.", Target],
  ["Growth Identity", "Make improvement feel personal, premium, and repeatable.", Trophy]
];

export default function GuruPage() {
  return (
    <div className="bg-[#fbf7ef] pt-20 text-[#181915]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(111,116,78,0.18),transparent_26rem),radial-gradient(circle_at_80%_18%,rgba(233,210,125,0.28),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#fbf7ef_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f744e]">AI-Powered Active Learning Ecosystem</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[0.98] sm:text-7xl">Transform Your Mind. Transform Your Future.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#5d6653] sm:text-lg">
              NIDUS Guru is the transformation layer of NIDUS: assessments, adaptive exam missions, and personal growth quests connected into one active learning experience.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#guru-ecosystem" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#181915] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(26,27,23,0.24)] transition hover:-translate-y-0.5 hover:bg-[#2f3324]">
                Explore Ecosystem <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/psychometric" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#6f744e]/20 bg-white/72 px-5 py-3 text-sm font-semibold text-[#313521] shadow-[0_16px_36px_rgba(49,53,33,0.09)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#c6a95d]/60">
                Start Assessment
              </Link>
            </div>
          </div>
          <div className="relative min-h-[32rem] overflow-hidden rounded-lg border border-[#6f744e]/12 bg-[#181915] p-6 text-white shadow-[0_28px_90px_rgba(24,25,21,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_24%,rgba(245,223,156,0.26),transparent_13rem),radial-gradient(circle_at_16%_80%,rgba(111,116,78,0.34),transparent_18rem)]" />
            <div className="relative flex h-full min-h-[28rem] flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e9d27d]/25 bg-[#e9d27d]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5df9c]">
                  <Zap className="h-4 w-4" />
                  NIDUS AI Connected
                </div>
                <Sparkles className="h-6 w-6 text-[#f5df9c]" />
              </div>
              <div className="grid gap-3">
                {signals.map(([title, text, Icon]) => {
                  const SignalIcon = Icon as typeof BrainCircuit;
                  return (
                    <div key={String(title)} className="rounded border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
                      <SignalIcon className="h-5 w-5 text-[#f5df9c]" />
                      <h3 className="mt-3 font-semibold">{String(title)}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/68">{String(text)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="guru-ecosystem" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f744e]">NIDUS Guru Categories</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Three premium paths inside the transformation ecosystem.</h2>
            <p className="mt-4 text-sm leading-7 text-[#5d6653]">Clean, memorable, and easy for students to understand: know yourself, train smarter, transform daily.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {ecosystemCards.map(({ title, label, text, href, cta, icon: Icon, tone, points }) => (
              <article key={title} className="overflow-hidden rounded-lg border border-[#6f744e]/12 bg-white/76 shadow-[0_24px_80px_rgba(48,54,35,0.10)] backdrop-blur-2xl">
                <div className={`relative aspect-[16/9] bg-gradient-to-br ${tone}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.34),transparent_10rem),linear-gradient(0deg,rgba(0,0,0,0.36),transparent)]" />
                  <div className="absolute bottom-4 left-4 grid h-12 w-12 place-items-center rounded border border-white/25 bg-white/14 text-white backdrop-blur-xl">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f744e]">{label}</p>
                  <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 min-h-28 text-sm leading-7 text-[#5d6653]">{text}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {points.map((point) => (
                      <span key={point} className="rounded-full bg-[#181915]/7 px-3 py-1 text-xs font-semibold text-[#313521]">{point}</span>
                    ))}
                  </div>
                  <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#313521]">
                    {cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <GuruExperience />
    </div>
  );
}
