import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { guruRecordedQuests } from "@/components/marketing/public-modules";

export default function GuruPage() {
  return (
    <div className="bg-[#fbf7ef] pt-20 text-[#181915]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(111,116,78,0.16),transparent_26rem),radial-gradient(circle_at_80%_18%,rgba(233,210,125,0.28),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#fbf7ef_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f744e]">NIDUS Guru</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.96] sm:text-7xl">Personal transformation arena.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#5d6653] sm:text-lg">
            Recorded quests for focus, confidence, discipline, dream clarity, and student growth. New quests will release one by one.
          </p>
          <div className="mt-8">
            <Link href="#quests" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#181915] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2f3324]">
              View Recorded Quests <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="quests" className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guruRecordedQuests.map(({ title, subtitle, href, image, icon: Icon }, index) => (
              <Link key={title} href={href} className="group overflow-hidden rounded-lg border border-[#6f744e]/12 bg-white shadow-[0_24px_80px_rgba(48,54,35,0.10)] transition hover:-translate-y-1">
                <div className="relative aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgba(24,25,21,0.02),rgba(24,25,21,0.55)),url('${image}')` }}>
                  <div className="absolute left-4 top-4 rounded-full bg-white/82 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6f744e] backdrop-blur-xl">Coming Soon</div>
                  <div className="absolute bottom-4 left-4 grid h-12 w-12 place-items-center rounded-full bg-white/86 text-[#181915] backdrop-blur-xl">
                    <PlayCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f744e]">
                    <Icon className="h-4 w-4" />
                    Quest {index + 1}
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-[#5d6653]">{subtitle}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#181915]">
                    View Details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-[#6f744e]/14 bg-white/76 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Sparkles className="h-6 w-6 text-[#6f744e]" />
            <h2 className="mt-4 text-2xl font-semibold">First recorded quest releases soon.</h2>
            <p className="mt-2 text-sm leading-6 text-[#5d6653]">Join free and we will notify you when the first quest opens.</p>
          </div>
          <Link href="/start-free" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#181915] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
