import Link from "next/link";
import { ArrowRight, BrainCircuit, ClipboardCheck, GraduationCap, ShieldCheck, Sparkles, Target } from "lucide-react";

const exams = ["NDA", "CDS", "AFCAT", "SSB", "AISSEE", "RIMC", "Agniveer", "INET", "Physical Training", "Interview Guidance"];

const modules = [
  {
    label: "Academy",
    title: "Defence Career Campus",
    text: "Classroom training, physical discipline, SSB guidance and mentor support for serious defence aspirants.",
    href: "/programs",
    cta: "Explore Academy",
    icon: GraduationCap,
    className: "from-[#260a3f] via-[#2d104f] to-[#470c2f]"
  },
  {
    label: "Top Rank",
    title: "AI Exam Practice Arena",
    text: "Practice NDA, CDS, AFCAT and SSB with profiling, diagnostics, speed training and rank-readiness reports.",
    href: "/toprank",
    cta: "Enter Top Rank",
    icon: BrainCircuit,
    className: "from-[#063848] via-[#0b3d5c] to-[#102554]"
  },
  {
    label: "NIDUS Guru",
    title: "Personal Transformation Quests",
    text: "Recorded quests for focus, confidence, discipline, dream clarity and student growth. New quests release soon.",
    href: "/guru",
    cta: "Explore Quests",
    icon: Sparkles,
    className: "from-[#082927] via-[#103b36] to-[#233115]"
  }
] as const;

function PillButton({ href, children, variant = "solid" }: { href: string; children: React.ReactNode; variant?: "solid" | "ghost" }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
        variant === "solid" ? "bg-white/22 text-white shadow-[0_18px_46px_rgba(10,18,40,0.20)] hover:bg-white/30" : "border border-white/22 bg-white/8 text-white hover:bg-white/14"
      }`}
    >
      {children}
    </Link>
  );
}

function ModuleBand({ module }: { module: (typeof modules)[number] }) {
  const Icon = module.icon;
  return (
    <section className={`bg-gradient-to-r ${module.className} px-4 py-24 text-center text-white sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/24 bg-[#071024]/42 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/76 shadow-inner shadow-white/5">
          <Icon className="h-4 w-4" />
          {module.label}
        </span>
        <h2 className="mt-8 text-5xl font-semibold leading-[1.02] tracking-normal text-white sm:text-7xl">{module.title}</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/76 sm:text-xl">{module.text}</p>
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
    <section className="overflow-hidden bg-[#070711] py-8 text-white">
      <div className="flex w-max animate-[nidus-marquee_34s_linear_infinite] items-center gap-14 whitespace-nowrap">
        {stream.map((exam, index) => (
          <span key={`${exam}-${index}`} className="text-3xl font-black uppercase tracking-normal text-white sm:text-5xl">
            {exam}
          </span>
        ))}
      </div>
    </section>
  );
}

export function MarketingHome() {
  return (
    <main className="bg-[#f4f6fb] text-[#111827]">
      <style>{`
        @keyframes nidus-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(255,153,51,0.22),transparent_28rem),radial-gradient(circle_at_86%_14%,rgba(71,123,255,0.38),transparent_30rem),linear-gradient(135deg,#160725_0%,#273d68_46%,#6fb5ff_100%)] px-4 pb-24 pt-32 text-center text-white sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#587fc7]/48 to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <p className="mx-auto inline-flex rounded-full border border-white/18 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/76 backdrop-blur-xl">
            India&apos;s AI-Powered Defence Career Campus
          </p>
          <h1 className="mx-auto mt-10 max-w-5xl text-5xl font-semibold leading-[1.02] tracking-normal text-white sm:text-7xl lg:text-8xl">
            From Aspirant to Officer.
          </h1>
          <p className="mx-auto mt-7 max-w-3xl text-base font-semibold leading-8 text-white/78 sm:text-2xl">
            NDA, CDS, AFCAT, SSB, AISSEE and Agniveer training with academy discipline, AI guidance and mentor support.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PillButton href="/start-free">
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

      <section className="bg-[#e4f1ff] px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#263a8f]/14 bg-white/62 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#263a8f]">
            <ClipboardCheck className="h-4 w-4" />
            Free Assessment
          </span>
          <h2 className="mt-8 text-4xl font-semibold leading-tight text-[#071024] sm:text-6xl">Discover your strengths before your journey begins.</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#334155]">
            Start with a simple AI-guided profile and understand your readiness, confidence and defence career fit.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/start-free" className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#4948f5] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#3533d6]">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/join" className="inline-flex min-h-11 items-center justify-center gap-2 rounded px-5 py-3 text-sm font-semibold text-[#071024] transition hover:-translate-y-0.5">
              Talk to Mentor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#171923] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#6aa7ff] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/68">NIDUS Academy is built for parents and students who want a clear defence training path.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold">Academy</h3>
              <div className="mt-5 grid gap-3 text-sm text-white/66">
                <Link href="/programs">Programs</Link>
                <Link href="/toprank">Top Rank</Link>
                <Link href="/join">Join NIDUS</Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Student</h3>
              <div className="mt-5 grid gap-3 text-sm text-white/66">
                <Link href="/start-free">Start Free</Link>
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
