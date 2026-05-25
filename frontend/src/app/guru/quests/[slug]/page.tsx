import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, PlayCircle, Sparkles } from "lucide-react";
import { getGuruQuest, guruRecordedQuests } from "@/components/marketing/public-modules";

export function generateStaticParams() {
  return guruRecordedQuests.map((quest) => ({ slug: quest.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const quest = getGuruQuest(params.slug);
  return {
    title: quest ? `${quest.title} | NIDUS Guru` : "NIDUS Guru Quest",
    description: quest?.subtitle ?? "NIDUS Guru recorded quest"
  };
}

export default function GuruQuestPage({ params }: { params: { slug: string } }) {
  const quest = getGuruQuest(params.slug);
  if (!quest) notFound();
  const Icon = quest.icon;

  return (
    <div className="bg-[#fbf7ef] pt-20 text-[#181915]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(111,116,78,0.16),transparent_26rem),radial-gradient(circle_at_82%_18%,rgba(233,210,125,0.28),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#fbf7ef_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/guru" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f744e]"><ArrowLeft className="h-4 w-4" /> Back to NIDUS Guru</Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_30rem] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f744e]">Recorded Quest</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[0.95] sm:text-7xl">{quest.title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#5d6653]">{quest.subtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/start-free" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#181915] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                  Notify Me <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/psychometric" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#6f744e]/18 bg-white px-5 py-3 text-sm font-semibold text-[#6f744e] transition hover:-translate-y-0.5">
                  Take Assessment
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/70 bg-white p-3 shadow-[0_28px_90px_rgba(48,54,35,0.12)]">
              <div className="relative min-h-[28rem] rounded bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgba(24,25,21,0.03),rgba(24,25,21,0.58)),url('${quest.image}')` }}>
                <div className="absolute left-5 top-5 rounded-full bg-white/86 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6f744e] backdrop-blur-xl">Coming Soon</div>
                <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/70 bg-white/86 p-4 backdrop-blur-xl">
                  <Icon className="h-6 w-6 text-[#6f744e]" />
                  <h2 className="mt-3 text-2xl font-semibold">Recorded quest releasing soon.</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            [PlayCircle, "Recorded lessons", "Short guided videos released in phases."],
            [Clock, "Daily missions", "Simple actions students can follow every day."],
            [Sparkles, "Mentor direction", "NIDUS AI and mentors guide the next step."]
          ].map(([FeatureIcon, title, text]) => {
            const CardIcon = FeatureIcon as typeof PlayCircle;
            return (
              <article key={String(title)} className="rounded-lg border border-[#6f744e]/12 bg-white p-5 shadow-[0_18px_60px_rgba(48,54,35,0.08)]">
                <CardIcon className="h-6 w-6 text-[#6f744e]" />
                <h3 className="mt-5 text-xl font-semibold">{String(title)}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5d6653]">{String(text)}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
