import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, PlayCircle, Repeat, Sparkles, Target } from "lucide-react";
import { getGuruQuest, guruRecordedQuests } from "@/components/marketing/public-modules";

export function generateStaticParams() {
  return guruRecordedQuests.map((quest) => ({ slug: quest.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const quest = getGuruQuest(params.slug);
  return {
    title: quest ? `${quest.title} | NIDUS Guru` : "NIDUS Guru Quest",
    description: quest?.promise ?? "NIDUS Guru active learning transformation quest"
  };
}

const experience = [
  ["Cinematic Thumbnail", "A clear visual identity for the mission."],
  ["Trainer Identity", "Mentor-like guidance, not lecture delivery."],
  ["Mission Guidance", "What to notice, reflect on, and do."],
  ["Guided Experience", "Immersive learning session for the core idea."],
  ["Reflection Prompt", "A question that makes the student self-analyse."],
  ["Action Challenge", "A practical behaviour to complete."],
  ["Progress Tracking", "Simple completion and consistency visibility."]
] as const;

export default function GuruQuestPage({ params }: { params: { slug: string } }) {
  const quest = getGuruQuest(params.slug);
  if (!quest) notFound();
  const Icon = quest.icon;

  return (
    <div className="bg-[#f7f3ea] pt-20 text-[#101827]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(185,145,63,0.14),transparent_26rem),radial-gradient(circle_at_82%_18%,rgba(110,143,175,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/guru" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f4a32]"><ArrowLeft className="h-4 w-4" /> Back to NIDUS Guru</Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_30rem] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Active Learning Quest</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[0.95] text-[#071d36] sm:text-7xl">{quest.title}</h1>
              <p className="mt-5 text-2xl font-semibold text-[#071d36]">{quest.tagline}</p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#64748b]">{quest.promise}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/start-free" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#b9913f] px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5 hover:bg-[#e7c873]">
                  Notify Me <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/psychometric" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#071d36]/14 bg-white px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5">
                  Discover Your Mind
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/70 bg-white p-3 shadow-[0_28px_90px_rgba(7,29,54,0.10)]">
              <div className={`relative min-h-[30rem] rounded bg-gradient-to-br ${quest.tone} p-5 text-white`}>
                <div className="absolute inset-0 rounded bg-[radial-gradient(circle_at_28%_16%,rgba(255,255,255,0.34),transparent_12rem),linear-gradient(0deg,rgba(7,29,54,0.42),transparent)]" />
                <div className="relative flex min-h-[27rem] flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-full bg-white/86 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#3f4a32] backdrop-blur-xl">Coming Soon</div>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="rounded-lg border border-white/20 bg-white/14 p-4 backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Trainer</p>
                    <h2 className="mt-2 text-2xl font-semibold">{quest.trainer}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/72">{quest.trainerRole}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Sparkles className="h-7 w-7 text-[#3f4a32]" />
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Transformation focus.</h2>
            <p className="mt-5 text-sm leading-7 text-[#64748b]">This quest is designed as a guided mission journey. Students learn, reflect, apply, repeat, and track progress.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quest.focus.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded border border-[#071d36]/10 bg-white p-3 text-sm font-semibold text-[#071d36]">
                <CheckCircle2 className="h-4 w-4 text-[#3f4a32]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/72 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Mission Roadmap</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#071d36] sm:text-5xl">{quest.missionCount}</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quest.missions.map((mission, index) => (
              <article key={mission} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.06)]">
                <span className="text-2xl font-semibold text-[#b9913f]">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 text-lg font-semibold text-[#071d36]">{mission}</h3>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">Guided experience, reflection prompt, action challenge, and progress-ready completion.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            [PlayCircle, "Guided Experience", "Neutral mission sessions designed for immersion and repeat learning."],
            [ClipboardCheck, "Reflection System", "Prompts help students understand patterns instead of passively consuming content."],
            [Target, "Action Challenge", "Every mission ends with a clear behaviour to complete in real life."]
          ].map(([FeatureIcon, title, text]) => {
            const CardIcon = FeatureIcon as typeof PlayCircle;
            return (
              <article key={String(title)} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
                <CardIcon className="h-6 w-6 text-[#3f4a32]" />
                <h3 className="mt-5 text-xl font-semibold text-[#071d36]">{String(title)}</h3>
                <p className="mt-3 text-sm leading-7 text-[#64748b]">{String(text)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-[#071d36]/10 bg-white/82 p-6 shadow-[0_22px_60px_rgba(7,29,54,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Repeat className="h-6 w-6 text-[#3f4a32]" />
            <h2 className="mt-4 text-2xl font-semibold text-[#071d36]">Progress opens with the first mission release.</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Future-ready for video sessions, AI mentor, streaks, journaling, reflections, and community.</p>
          </div>
          <Link href="/start-free" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#b9913f] px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5 hover:bg-[#e7c873]">
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
