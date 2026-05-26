import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, ClipboardCheck, Dumbbell, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { academyPrograms, getAcademyProgram } from "@/components/academy/academy-programs";
import { ProgramEnquiryForm } from "@/components/academy/program-enquiry-form";
import { PublicCta } from "@/components/marketing/public-branding";

export function generateStaticParams() {
  return [
    ...academyPrograms.map((program) => ({ slug: program.slug })),
    { slug: "nda" },
    { slug: "cds" },
    { slug: "afcat" },
    { slug: "ssb" },
    { slug: "aissee" },
    { slug: "agniveer" },
    { slug: "foundation-programs" },
    { slug: "physical-training" },
    { slug: "interview-guidance" }
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getAcademyProgram(slug);
  return {
    title: program ? `${program.title} | NIDUS Academy` : "Program | NIDUS Academy",
    description: program?.summary ?? "NIDUS Academy defence career program"
  };
}

const detailBlocks = [
  { title: "AI Learning Support", text: "Study direction, test insights, weak-area visibility, and readiness signals support consistent improvement.", icon: BrainCircuit },
  { title: "Mentor Support", text: "Students receive structured guidance around exam planning, confidence, discipline, and officer mindset.", icon: Users },
  { title: "Physical + Classroom Integration", text: "Where relevant, academic training is connected with routine, stamina, discipline, and ground confidence.", icon: Dumbbell },
  { title: "Active Learning System", text: "Classes, missions, tests, reports, and feedback loops keep the student moving with clarity.", icon: ClipboardCheck }
];

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getAcademyProgram(slug);
  if (!program) notFound();

  return (
    <div className="bg-[#f7f3ea] pt-20 text-[#101827]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(185,145,63,0.15),transparent_28rem),radial-gradient(circle_at_84%_12%,rgba(110,143,175,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/programs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f4a32]">
            <ArrowLeft className="h-4 w-4" />
            Back to Academy
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_28rem] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">{program.category}</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[0.98] text-[#071d36] sm:text-7xl">{program.title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#64748b] sm:text-lg">{program.summary}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PublicCta href="#enquire">
                  Enquire Now <ArrowRight className="h-4 w-4" />
                </PublicCta>
                <PublicCta href={`/start-free?intent=academy&program=${encodeURIComponent(program.title)}`} variant="secondary">
                  Talk to Assistant
                </PublicCta>
              </div>
            </div>
            <div className={`relative min-h-[26rem] overflow-hidden rounded-lg bg-gradient-to-br ${program.imageTone} p-6 text-white shadow-[0_32px_100px_rgba(19,35,72,0.18)]`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_14%,rgba(255,255,255,0.32),transparent_12rem),linear-gradient(0deg,rgba(0,0,0,0.46),transparent)]" />
              <div className="relative flex h-full min-h-[22rem] flex-col justify-between">
                <div className="grid h-14 w-14 place-items-center rounded border border-white/25 bg-white/14 backdrop-blur-xl">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Mission Profile</p>
                  <h2 className="mt-3 text-3xl font-semibold">{program.title}</h2>
                  <div className="mt-5 grid gap-3">
                    {[
                      ["Target", program.targetStudents],
                      ["Duration", program.duration],
                      ["Format", program.format]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded border border-white/12 bg-white/10 p-3 backdrop-blur-xl">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/62">{label}</p>
                        <p className="mt-1 text-sm font-semibold leading-6">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-6 shadow-[0_20px_70px_rgba(7,29,54,0.08)]">
            <GraduationCap className="h-7 w-7 text-[#3f4a32]" />
            <h2 className="mt-5 text-3xl font-semibold text-[#071d36]">Program Benefits</h2>
            <div className="mt-6 grid gap-3">
              {program.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 rounded border border-[#071d36]/10 bg-[#f7f3ea] p-3 text-sm font-semibold text-[#101827]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#3f4a32]" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {detailBlocks.map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
                <Icon className="h-6 w-6 text-[#3f4a32]" />
                <h3 className="mt-4 text-lg font-semibold text-[#071d36]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#64748b]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#071d36] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e7c873]">Career Opportunities</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">A pathway built for direction, discipline, and selection confidence.</h2>
            <p className="mt-5 text-sm leading-7 text-white/70">NIDUS positions every student through a practical blend of exam preparation, confidence development, mentoring, and active progress tracking.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {program.careerOpportunities.map((opportunity) => (
              <div key={opportunity} className="rounded border border-white/10 bg-white/[0.06] p-4 text-sm font-semibold">
                <ShieldCheck className="mb-3 h-4 w-4 text-[#e7c873]" />
                {opportunity}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="enquire" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Enquiry</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Get admission guidance for {program.title}.</h2>
            <p className="mt-5 text-sm leading-7 text-[#64748b]">Submit the form and the NIDUS support team can follow up from the lead management dashboard.</p>
          </div>
          <ProgramEnquiryForm programTitle={program.title} source="Academy Program Detail Page" />
        </div>
      </section>
    </div>
  );
}
