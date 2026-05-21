"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, ClipboardCheck, MessageCircle, Sparkles, Target } from "lucide-react";

export type NidusAiCommand = {
  title: string;
  description: string;
  href: string;
  tag: string;
};

const defaultCommands: NidusAiCommand[] = [
  {
    title: "Take the next assessment",
    description: "NIDUS AI uses assessment signals to sharpen your digital profile and report interpretation.",
    href: "/psychometric",
    tag: "Assessment"
  },
  {
    title: "Open Digital Profile",
    description: "See how learning, training, Guru quests, and reports combine into one readiness identity.",
    href: "/digital-profile",
    tag: "Profile"
  },
  {
    title: "Start Guru mission",
    description: "Move from insight to action through focus, discipline, confidence, and life-direction quests.",
    href: "/guru",
    tag: "Guru"
  },
  {
    title: "Book counselling",
    description: "Convert the AI interpretation into a practical academy action plan.",
    href: "/join",
    tag: "Counselling"
  }
];

const iconMap = {
  Assessment: ClipboardCheck,
  Profile: BrainCircuit,
  Guru: Sparkles,
  Counselling: MessageCircle,
  Action: Target
};

export function NidusAiCommandPanel({ title = "NIDUS AI platform control", description = "NIDUS AI can guide assessments, reports, digital profile, Guru missions, and counselling next actions from one command layer.", commands = defaultCommands }: { title?: string; description?: string; commands?: NidusAiCommand[] }) {
  return (
    <section className="rounded-lg border border-gold/20 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">NIDUS AI</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{description}</p>
        </div>
        <span className="rounded border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Guidance active</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {commands.map((command) => {
          const Icon = iconMap[command.tag as keyof typeof iconMap] ?? Target;
          return (
            <Link key={command.title} href={command.href} className="group rounded border border-white/10 bg-navy-deep/55 p-4 transition hover:-translate-y-1 hover:border-gold/40 hover:bg-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded bg-gold/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-gold">{command.tag}</span>
                <Icon className="h-4 w-4 text-gold-soft" />
              </div>
              <h3 className="mt-4 text-sm font-semibold leading-6 text-white">{command.title}</h3>
              <p className="mt-2 min-h-16 text-xs leading-6 text-muted">{command.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gold-soft">
                Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
