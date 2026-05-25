import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { guruRecordedQuests } from "@/components/marketing/public-modules";

export default function GuruPage() {
  return (
    <div className="bg-[#f7f3ea] pt-20 text-[#101827]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(63,74,50,0.14),transparent_26rem),radial-gradient(circle_at_80%_18%,rgba(185,145,63,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">NIDUS Guru</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.96] text-[#071d36] sm:text-7xl">Personal transformation arena.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#64748b] sm:text-lg">
            Recorded quests for focus, confidence, discipline, dream clarity, and student growth. New quests will release one by one.
          </p>
          <div className="mt-8">
            <Link href="#quests" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#071d36] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0d2a4b]">
              View Recorded Quests <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="quests" className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guruRecordedQuests.map(({ title, subtitle, href, image, icon: Icon }, index) => (
              <Link key={title} href={href} className="group overflow-hidden rounded-lg border border-[#071d36]/10 bg-white shadow-[0_24px_80px_rgba(7,29,54,0.10)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <div className="relative aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgba(24,25,21,0.02),rgba(24,25,21,0.55)),url('${image}')` }}>
                  <div className="absolute left-4 top-4 rounded-full bg-white/82 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#3f4a32] backdrop-blur-xl">Coming Soon</div>
                  <div className="absolute bottom-4 left-4 grid h-12 w-12 place-items-center rounded-full bg-white/86 text-[#071d36] backdrop-blur-xl">
                    <PlayCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#3f4a32]">
                    <Icon className="h-4 w-4" />
                    Quest {index + 1}
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-[#64748b]">{subtitle}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                    View Details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-[#071d36]/10 bg-white/82 p-6 shadow-[0_22px_60px_rgba(7,29,54,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Sparkles className="h-6 w-6 text-[#3f4a32]" />
            <h2 className="mt-4 text-2xl font-semibold text-[#071d36]">First recorded quest releases soon.</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Join free and we will notify you when the first quest opens.</p>
          </div>
          <Link href="/start-free" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#071d36] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
