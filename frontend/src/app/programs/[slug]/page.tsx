import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, ClipboardCheck, Dumbbell, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { academyPrograms, getAcademyProgram } from "@/components/academy/academy-programs";
import { ProgramEnquiryForm } from "@/components/academy/program-enquiry-form";
import { PublicCta } from "@/components/marketing/public-branding";

export function generateStaticParams() {
  return academyPrograms.map((program) => ({ slug: program.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const program = getAcademyProgram(params.slug);
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

export default function ProgramDetailPage({ params }: { params: { slug: string } }) {
  const program = getAcademyProgram(params.slug);
  if (!program) notFound();

  return (
    <div className="bg-[#f6f7fb] pt-20 text-[#111827]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(38,58,143,0.18),transparent_28rem),radial-gradient(circle_at_84%_12%,rgba(201,166,70,0.22),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f6f7fb_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/programs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#263a8f]">
            <ArrowLeft className="h-4 w-4" />
            Back to Academy
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_28rem] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">{program.category}</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[0.98] sm:text-7xl">{program.title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#536072] sm:text-lg">{program.summary}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PublicCta href="#enquire">
                  Enquire Now <ArrowRight className="h-4 w-4" />
                </PublicCta>
                <PublicCta href="/join" variant="secondary">
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
          <div className="rounded-lg border border-[#263a8f]/10 bg-white p-6 shadow-[0_20px_70px_rgba(19,35,72,0.09)]">
            <GraduationCap className="h-7 w-7 text-[#263a8f]" />
            <h2 className="mt-5 text-3xl font-semibold">Program Benefits</h2>
            <div className="mt-6 grid gap-3">
              {program.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 rounded border border-[#263a8f]/10 bg-[#f8fafc] p-3 text-sm font-semibold text-[#111827]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#c9a646]" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {detailBlocks.map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded-lg border border-[#263a8f]/10 bg-white p-5 shadow-[0_18px_60px_rgba(19,35,72,0.08)]">
                <Icon className="h-6 w-6 text-[#263a8f]" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#536072]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#111827] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f3d981]">Career Opportunities</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">A pathway built for direction, discipline, and selection confidence.</h2>
            <p className="mt-5 text-sm leading-7 text-white/70">NIDUS positions every student through a practical blend of exam preparation, confidence development, mentoring, and active progress tracking.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {program.careerOpportunities.map((opportunity) => (
              <div key={opportunity} className="rounded border border-white/10 bg-white/[0.06] p-4 text-sm font-semibold">
                <ShieldCheck className="mb-3 h-4 w-4 text-[#f3d981]" />
                {opportunity}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="enquire" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">Enquiry</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Get admission guidance for {program.title}.</h2>
            <p className="mt-5 text-sm leading-7 text-[#536072]">Submit the form and the NIDUS support team can follow up from the lead management dashboard.</p>
          </div>
          <ProgramEnquiryForm programTitle={program.title} source="Academy Program Detail Page" />
        </div>
      </section>
    </div>
  );
}
