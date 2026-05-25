import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BrainCircuit, ClipboardCheck, Target } from "lucide-react";
import { ProgramEnquiryForm } from "@/components/academy/program-enquiry-form";
import { getTopRankExam, topRankExams } from "@/components/marketing/public-modules";

export function generateStaticParams() {
  return topRankExams.map((exam) => ({ slug: exam.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const exam = getTopRankExam(params.slug);
  return {
    title: exam ? `${exam.title} TOPRANK Arena | NIDUS` : "TOPRANK Arena | NIDUS",
    description: exam?.subtitle ?? "NIDUS TOPRANK exam practice arena"
  };
}

export default function TopRankArenaPage({ params }: { params: { slug: string } }) {
  const exam = getTopRankExam(params.slug);
  if (!exam) notFound();
  const Icon = exam.icon;

  return (
    <div className="bg-[#f6f3ec] pt-20 text-[#111827]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(38,58,143,0.16),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(201,166,70,0.22),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f6f3ec_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/toprank" className="inline-flex items-center gap-2 text-sm font-semibold text-[#263a8f]"><ArrowLeft className="h-4 w-4" /> Back to TOPRANK</Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_30rem] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">TOPRANK Arena</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[0.95] sm:text-7xl">{exam.title} Practice Arena</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#536072]">{exam.subtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                  Start Practice <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#enquire" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#263a8f]/18 bg-white px-5 py-3 text-sm font-semibold text-[#263a8f] transition hover:-translate-y-0.5">
                  Get Guidance
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/70 bg-white p-3 shadow-[0_28px_90px_rgba(19,35,72,0.14)]">
              <div className="relative min-h-[28rem] rounded bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.04),rgba(5,10,20,0.54)),url('${exam.image}')` }}>
                <Icon className="absolute left-5 top-5 h-8 w-8 text-white" />
                <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/70 bg-white/86 p-4 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#263a8f]">Arena Status</p>
                  <h2 className="mt-2 text-2xl font-semibold">Practice arena opens after signup.</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["AI Profiling", "Understand speed, accuracy, memory, and weak zones.", BrainCircuit],
            ["Daily Practice", "Move through structured missions instead of random tests.", Target],
            ["Report Loop", "Get mentor-ready reports and next action clarity.", ClipboardCheck]
          ].map(([title, text, FeatureIcon]) => {
            const CardIcon = FeatureIcon as typeof BrainCircuit;
            return (
              <article key={String(title)} className="rounded-lg border border-[#263a8f]/10 bg-white p-5 shadow-[0_18px_60px_rgba(19,35,72,0.08)]">
                <CardIcon className="h-6 w-6 text-[#263a8f]" />
                <h3 className="mt-5 text-xl font-semibold">{String(title)}</h3>
                <p className="mt-3 text-sm leading-7 text-[#536072]">{String(text)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="enquire" className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Guidance</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Get {exam.title} training guidance.</h2>
            <p className="mt-5 text-sm leading-7 text-[#536072]">Submit your details with WhatsApp number. It will reach the NIDUS lead management dashboard.</p>
          </div>
          <ProgramEnquiryForm programTitle={`TOPRANK ${exam.title}`} source="TOPRANK Exam Arena" />
        </div>
      </section>
    </div>
  );
}
