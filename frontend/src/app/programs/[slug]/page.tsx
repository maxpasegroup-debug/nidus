import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { academyPrograms, getAcademyProgram } from "@/components/academy/academy-programs";
import { ProgramEnquiryForm } from "@/components/academy/program-enquiry-form";

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

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getAcademyProgram(slug);
  if (!program) notFound();

  const simplePoints = [
    ["Who can join?", program.targetStudents, Users],
    ["How long?", program.duration, Clock],
    ["How training happens?", program.format, GraduationCap]
  ] as const;

  return (
    <div className="bg-[#fffdf8] pt-20 text-[#071d36]">
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.15),transparent_28rem),radial-gradient(circle_at_80%_14%,rgba(63,74,50,0.12),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/programs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f4a32]">
            <ArrowLeft className="h-4 w-4" />
            Back to Academy
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">{program.category}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">{program.title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#40516a]">{program.summary}</p>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#40516a]">
                If you are confused about the right defence path, this page gives the simple idea. Share your details below and our team will explain the next step clearly.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="#apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-5 py-3 text-sm font-semibold text-[#071d36] shadow-[0_14px_34px_rgba(185,145,63,0.22)] transition hover:brightness-105">
                  Apply Now <ArrowRight className="h-4 w-4" />
                </a>
                <Link href={`/start-free?intent=academy&program=${encodeURIComponent(program.title)}`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#071d36]/14 bg-white px-5 py-3 text-sm font-semibold text-[#071d36] shadow-sm transition hover:-translate-y-0.5">
                  Ask NIDUS Assistant
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-[#b9913f]/35 bg-white p-5 shadow-[0_24px_80px_rgba(7,29,54,0.10)]">
              <div className={`grid min-h-44 place-items-center rounded-lg bg-gradient-to-br ${program.imageTone} p-6 text-center text-white`}>
                <ShieldCheck className="h-10 w-10" />
                <h2 className="mt-4 text-3xl font-semibold">{program.title}</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {simplePoints.map(([label, value, Icon]) => (
                  <div key={label} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-[#8a6426]" />
                      <p className="text-sm font-semibold text-[#071d36]">{label}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#40516a]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-6 shadow-[0_18px_56px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">In Simple Words</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">What this program helps with</h2>
            <p className="mt-4 text-sm leading-7 text-[#40516a]">
              This program helps the student study with direction, practise regularly, build discipline, and understand the defence career path without confusion.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {program.benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 rounded-lg border border-[#b9913f]/35 bg-white p-4 text-sm font-semibold leading-6 text-[#071d36] shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#8a6426]" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f3ea] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Career Direction</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#071d36]">Possible pathway after this training</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {program.careerOpportunities.map((opportunity) => (
              <div key={opportunity} className="rounded-lg border border-[#b9913f]/35 bg-white p-4 text-sm font-semibold text-[#071d36] shadow-sm">
                {opportunity}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">Application Support</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Need help joining {program.title}?</h2>
            <p className="mt-5 text-sm leading-7 text-[#40516a]">
              Fill this form with student details and blood group. The application will reach Administration for review and approval.
            </p>
          </div>
          <ProgramEnquiryForm programTitle={program.title} source="Academy Program Detail Page" />
        </div>
      </section>
    </div>
  );
}
