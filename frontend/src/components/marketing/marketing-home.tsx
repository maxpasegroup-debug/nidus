import Link from "next/link";
import { ArrowRight, BrainCircuit, ClipboardCheck, GraduationCap, ShieldCheck, Sparkles, Target } from "lucide-react";

const exams = ["NDA", "CDS", "AFCAT", "SSB", "AISSEE", "RIMC", "Agniveer", "INET", "Physical Training", "Interview Guidance"];

const modules = [
  {
    label: "Academy",
    title: "Defence Training Academy",
    text: "Clear coaching, discipline, physical training and mentor support for students who dream of a career in uniform.",
    href: "/programs",
    cta: "Explore Academy",
    icon: GraduationCap,
    className: "bg-[#f7f3ea] text-[#101827]"
  },
  {
    label: "TOP RANK",
    title: "Defence Career Hub",
    text: "Army, Navy, Air Force, Coast Guard and officer-entry exam coaching paths under the public defence career division of NIDUS.",
    href: "/top-rank",
    cta: "Explore TOP RANK",
    icon: BrainCircuit,
    className: "bg-[#dce9f3] text-[#101827]"
  },
  {
    label: "NIDUS Guru",
    title: "Focus and Discipline Quests",
    text: "Simple transformation quests that help students reduce distractions, build confidence and stay consistent.",
    href: "/guru",
    cta: "Explore Quests",
    icon: Sparkles,
    className: "bg-white text-[#101827]"
  }
] as const;

function PillButton({ href, children, variant = "solid" }: { href: string; children: React.ReactNode; variant?: "solid" | "ghost" }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
        variant === "solid" ? "border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] text-[#071d36] shadow-[0_18px_46px_rgba(185,145,63,0.24)] hover:brightness-105" : "border border-[#071d36]/14 bg-white/76 text-[#071d36] shadow-sm hover:bg-white"
      }`}
    >
      {children}
    </Link>
  );
}

function ModuleBand({ module }: { module: (typeof modules)[number] }) {
  const Icon = module.icon;
  return (
    <section className={`${module.className} border-t border-[#071d36]/8 px-4 py-24 text-center sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#b9913f]/24 bg-white/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#3f4a32] shadow-sm">
          <Icon className="h-4 w-4" />
          {module.label}
        </span>
        <h2 className="mt-8 text-5xl font-semibold leading-[1.02] tracking-normal text-[#071d36] sm:text-7xl">{module.title}</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#64748b] sm:text-xl">{module.text}</p>
        <div className="mt-8">
          <PillButton href={module.href}>
            {module.cta} <ArrowRight className="h-4 w-4" />
          </PillButton>
        </div>
      </div>
    </section>
  );
}

function ExamStream() {
  const stream = [...exams, ...exams, ...exams];

  return (
    <section className="overflow-hidden bg-[#071d36] py-8 text-white">
      <div className="flex w-max animate-[nidus-marquee_34s_linear_infinite] items-center gap-14 whitespace-nowrap">
        {stream.map((exam, index) => (
          <span key={`${exam}-${index}`} className="text-3xl font-black uppercase tracking-normal text-[#F8F4EA] sm:text-5xl">
            {exam}
          </span>
        ))}
      </div>
    </section>
  );
}

export function MarketingHome() {
  return (
    <main className="bg-[#f7f3ea] text-[#101827]">
      <style>{`
        @keyframes nidus-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(185,145,63,0.22),transparent_28rem),radial-gradient(circle_at_86%_14%,rgba(110,143,175,0.22),transparent_30rem),linear-gradient(135deg,#fbf8f1_0%,#f7f3ea_58%,#dce9f3_100%)] px-4 pb-24 pt-32 text-center text-[#101827] sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f7f3ea] to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <p className="mx-auto inline-flex rounded-full border border-[#b9913f]/24 bg-white/62 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#3f4a32] backdrop-blur-xl">
            Kerala&apos;s Integrated Defence Career Campus
          </p>
          <h1 className="mx-auto mt-10 max-w-5xl text-5xl font-semibold leading-[1.02] tracking-normal text-[#071d36] sm:text-7xl lg:text-8xl">
            From Aspirant to Officer.
          </h1>
          <p className="mx-auto mt-7 max-w-3xl text-base font-semibold leading-8 text-[#40516a] sm:text-2xl">
            Coaching, physical training, exam practice and personal guidance for NDA, CDS, AFCAT, SSB, AISSEE and Agniveer aspirants.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PillButton href="/start-free?intent=general">
              Start Free <ArrowRight className="h-4 w-4" />
            </PillButton>
            <PillButton href="/programs" variant="ghost">Explore Academy</PillButton>
          </div>
        </div>
      </section>

      <ExamStream />

      {modules.map((module) => (
        <ModuleBand key={module.label} module={module} />
      ))}

      <section className="bg-[#f7f3ea] px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D6A842]/30 bg-white/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#123C8C]">
            <ClipboardCheck className="h-4 w-4" />
            Free Assessment
          </span>
          <h2 className="mt-8 text-4xl font-semibold leading-tight text-[#061B34] sm:text-6xl">Know your strengths before you begin.</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#40516a]">
            Start with a simple free profile. Understand your confidence, discipline and best defence career direction.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/start-free?intent=assessment" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-5 py-3 text-sm font-semibold text-[#071d36] shadow-[0_18px_42px_rgba(185,145,63,0.24)] transition hover:-translate-y-0.5 hover:brightness-105">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/start-free?intent=counselling" className="inline-flex min-h-11 items-center justify-center gap-2 rounded px-5 py-3 text-sm font-semibold text-[#061B34] transition hover:-translate-y-0.5">
              Talk to Mentor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#071d36] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#fff3bf,#b9913f_70%,#8a6426)] text-[#071d36]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/68">NIDUS Academy is built for parents and students who want a clear defence training path.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold">Academy</h3>
              <div className="mt-5 grid gap-3 text-sm text-white/66">
                <Link href="/programs">Programs</Link>
                <Link href="/top-rank">TOP RANK</Link>
                <Link href="/start-free?intent=academy">Join NIDUS</Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Student</h3>
              <div className="mt-5 grid gap-3 text-sm text-white/66">
                <Link href="/start-free?intent=general">Start Free</Link>
                <Link href="/psychometric">Assessments</Link>
                <Link href="/guru">NIDUS Guru</Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Support</h3>
              <div className="mt-5 grid gap-3 text-sm text-white/66">
                <Link href="/contact">Contact</Link>
                <Link href="/privacy-policy">Privacy</Link>
                <Link href="/terms-and-conditions">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sr-only">
        <Target />
      </section>
    </main>
  );
}
