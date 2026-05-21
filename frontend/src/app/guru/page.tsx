import Link from "next/link";
import { ArrowRight, BrainCircuit, ClipboardCheck, MessageCircle, Sparkles } from "lucide-react";
import { GuruExperience } from "@/components/guru/guru-content";

export default function GuruPage() {
  return (
    <div className="bg-[#fbf7ef] pt-20">
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 rounded-[1.35rem] border border-[#6f744e]/12 bg-[#181915] p-5 text-white shadow-[0_24px_80px_rgba(24,25,21,0.18)] sm:p-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e9d27d]/25 bg-[#e9d27d]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5df9c]">
              <BrainCircuit className="h-4 w-4" />
              NIDUS AI connected
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Assessment insights become Guru missions.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              NIDUS AI connects focus, discipline, confidence, and readiness reports to the right transformation quest.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Take Assessment", "/psychometric", ClipboardCheck],
              ["Start Mission", "#guru-quests", Sparkles],
              ["Get Guidance", "/join", MessageCircle]
            ].map(([label, href, Icon]) => {
              const ActionIcon = Icon as typeof ClipboardCheck;
              return (
                <Link key={String(label)} href={String(href)} className="flex min-h-12 items-center justify-between rounded border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-[#e9d27d]/40">
                  <span className="flex items-center gap-2"><ActionIcon className="h-4 w-4 text-[#f5df9c]" />{String(label)}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <GuruExperience />
    </div>
  );
}
