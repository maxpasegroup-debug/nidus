import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, ClipboardCheck, LockKeyhole, Target } from "lucide-react";
import { ProgramEnquiryForm } from "@/components/academy/program-enquiry-form";
import { getTopRankExam, topRankExams } from "@/components/marketing/public-modules";

export function generateStaticParams() {
  return topRankExams.map((exam) => ({ slug: exam.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = getTopRankExam(slug);
  return {
    title: exam ? `${exam.title} TOPRANK Arena | NIDUS` : "TOPRANK Arena | NIDUS",
    description: exam?.subtitle ?? "NIDUS TOPRANK exam practice arena"
  };
}

export default async function TopRankArenaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = getTopRankExam(slug);
  if (!exam) notFound();
  const Icon = exam.icon;
  const isLive = exam.status === "live";

  return (
    <div className="bg-[#f7f3ea] pt-20 text-[#101827]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.16),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(110,143,175,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/toprank" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f4a32]"><ArrowLeft className="h-4 w-4" /> Back to TOPRANK</Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_30rem] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">TOPRANK Arena</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[0.95] text-[#071d36] sm:text-7xl">{exam.title} Practice Arena</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#64748b]">{exam.subtitle}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#071d36]">{exam.whatItIs}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={isLive ? "/start-free?intent=toprank&program=TOPRANK%20NDA" : "#enquire"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5 hover:brightness-105">
                  {isLive ? `Start ${exam.title} Training` : "Join Guidance List"} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={isLive ? "/login" : "/start-free?intent=toprank"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#071d36]/14 bg-white px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5">
                  {isLive ? "Create Free Account" : "Start Free"}
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/70 bg-white p-3 shadow-[0_28px_90px_rgba(7,29,54,0.12)]">
              <div className="relative min-h-[28rem] rounded bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.04),rgba(5,10,20,0.54)),url('${exam.image}')` }}>
                <Icon className="absolute left-5 top-5 h-8 w-8 text-white" />
                <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/70 bg-white/86 p-4 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3f4a32]">Arena Status</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#071d36]">{isLive ? "Live from student dashboard." : "Detailed arena ready. Live launch staged."}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">{exam.dashboardNote}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["Who it is for", exam.audience, CheckCircle2],
            ["AI Profiling", "Understand speed, accuracy, memory, and weak zones before practice becomes random.", BrainCircuit],
            ["Report Loop", "Get mentor-ready reports and next action clarity after each training cycle.", ClipboardCheck]
          ].map(([title, text, FeatureIcon]) => {
            const CardIcon = FeatureIcon as typeof BrainCircuit;
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

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-lg border border-[#071d36]/10 bg-white p-6 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <Target className="h-6 w-6 text-[#b9913f]" />
            <h2 className="mt-4 text-3xl font-semibold text-[#071d36]">How this arena performs</h2>
            <div className="mt-6 grid gap-3">
              {exam.howItPerforms.map((item) => (
                <div key={item} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4 text-sm leading-6 text-[#071d36]">{item}</div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#071d36]/10 bg-white p-6 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <LockKeyhole className="h-6 w-6 text-[#b9913f]" />
            <h2 className="mt-4 text-3xl font-semibold text-[#071d36]">How to start</h2>
            <div className="mt-6 grid gap-3">
              {exam.trainingFlow.map((item, index) => (
                <div key={item} className="flex gap-3 rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4 text-sm leading-6 text-[#071d36]">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-[#3f4a32]">{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-lg border border-[#071d36]/10 bg-[#071d36] p-6 text-white shadow-[0_24px_80px_rgba(7,29,54,0.16)]">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e7c873]">Training Outcomes</p>
              <h2 className="mt-3 text-3xl font-semibold">What the student gets clarity on</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {exam.outcomes.map((outcome) => (
                <div key={outcome} className="rounded border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold">{outcome}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="enquire" className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Guidance</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Get {exam.title} training guidance.</h2>
            <p className="mt-5 text-sm leading-7 text-[#64748b]">Submit your details with WhatsApp number. It will reach the NIDUS lead management dashboard.</p>
          </div>
          <ProgramEnquiryForm programTitle={`TOPRANK ${exam.title}`} source="TOPRANK Exam Arena" />
        </div>
      </section>
    </div>
  );
}
