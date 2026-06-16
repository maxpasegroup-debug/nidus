import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Dumbbell, FileCheck2, ShieldCheck, Target } from "lucide-react";

import { getTopRankDivision, getTopRankProgram, topRankApplyHref, topRankDivisions, topRankPrograms, topRankSeoAliases } from "@/data/top-rank";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return [
    ...topRankDivisions.map((division) => ({ slug: division.slug })),
    ...topRankPrograms.map((program) => ({ slug: program.slug })),
    ...Object.keys(topRankSeoAliases).map((slug) => ({ slug }))
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const division = getTopRankDivision(slug);
  const program = getTopRankProgram(slug);

  if (division) {
    return {
      title: `TOP RANK ${division.title} Division | NIDUS Academy Kerala`,
      description: division.description
    };
  }

  if (program) {
    return {
      title: `${program.title} Coaching in Kerala | TOP RANK by NIDUS`,
      description: `${program.summary} Apply through TOP RANK and continue through the NIDUS admission workflow.`
    };
  }

  return {};
}

export default async function TopRankDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const division = getTopRankDivision(slug);
  const program = getTopRankProgram(slug);

  if (division) return <DivisionPage division={division} />;
  if (program) return <ProgramPage program={program} seoSlug={slug} />;

  notFound();
}

function DivisionPage({ division }: { division: NonNullable<ReturnType<typeof getTopRankDivision>> }) {
  const programs = division.programs.map((slug) => getTopRankProgram(slug)).filter(Boolean);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#071d36]">
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <Link href="/top-rank" className="inline-flex items-center gap-2 text-sm font-black text-[#40516a]">
          <ArrowLeft className="h-4 w-4" />
          Back to TOP RANK
        </Link>
        <div className="mt-6 rounded border border-[#071d36]/12 bg-[#071d36] p-6 text-white shadow-xl md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.42em] text-[#e7c873]">TOP RANK Division</p>
          <h1 className="mt-5 text-5xl font-black md:text-7xl">{division.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/72">{division.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={topRankApplyHref(division.title)} className="rounded bg-[linear-gradient(135deg,#fff3bf,#e7c873_42%,#b9913f)] px-5 py-3 font-black text-[#071d36]">
              Apply Now
            </Link>
            <Link href={topRankApplyHref(`${division.title} Counselling`)} className="rounded border border-white/18 bg-white/10 px-5 py-3 font-black text-white">
              Talk To Counsellor
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((program) => (
            <Link key={program!.slug} href={`/top-rank/${program!.slug}`} className="rounded border border-[#071d36]/12 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b9913f]">Program</p>
              <h2 className="mt-4 text-2xl font-black">{program!.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#40516a]">{program!.summary}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-black">
                View program <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}

function ProgramPage({ program, seoSlug }: { program: NonNullable<ReturnType<typeof getTopRankProgram>>; seoSlug: string }) {
  const isSeoAlias = seoSlug !== program.slug;
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#071d36]">
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <Link href="/top-rank" className="inline-flex items-center gap-2 text-sm font-black text-[#40516a]">
          <ArrowLeft className="h-4 w-4" />
          Back to TOP RANK
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded border border-[#071d36]/12 bg-white p-6 shadow-xl md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[#b9913f]">TOP RANK Program</p>
            <h1 className="mt-5 text-5xl font-black leading-none md:text-7xl">{program.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">{program.summary}</p>
            {isSeoAlias ? (
              <p className="mt-4 rounded border border-[#b9913f]/25 bg-[#fff8df] px-4 py-3 text-sm font-bold">
                Kerala-focused counselling, preparation and admission support available through NIDUS Academy.
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={topRankApplyHref(program.title)} className="rounded bg-[linear-gradient(135deg,#fff3bf,#e7c873_42%,#b9913f)] px-5 py-3 font-black text-[#071d36] shadow-lg">
                Apply Now
              </Link>
              <Link href={topRankApplyHref(`${program.title} Counselling`)} className="rounded border border-[#071d36]/12 bg-white px-5 py-3 font-black">
                Talk To Counsellor
              </Link>
            </div>
          </div>

          <aside className="rounded border border-[#071d36]/12 bg-[#071d36] p-6 text-white shadow-xl">
            <ShieldCheck className="h-9 w-9 text-[#e7c873]" />
            <h2 className="mt-4 text-3xl font-black">NIDUS admission connected.</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Every TOP RANK enquiry moves through the existing NIDUS CRM, BDE counselling, Administrative Officer admission,
              batch allocation and student activation flow.
            </p>
          </aside>
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <InfoBlock icon={FileCheck2} title="Eligibility" items={[program.eligibility]} />
          <InfoBlock icon={Dumbbell} title="Physical Requirements" items={[program.physicalRequirements]} />
          <InfoBlock icon={Target} title="Career Paths" items={program.careerPaths} />
          <InfoBlock icon={CheckCircle2} title="Selection Process" items={program.selectionProcess} />
        </section>
      </section>
    </main>
  );
}

function InfoBlock({ icon: Icon, title, items }: { icon: typeof ShieldCheck; title: string; items: string[] }) {
  return (
    <div className="rounded border border-[#071d36]/12 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded border border-[#b9913f]/30 bg-[#fff8df]">
          <Icon className="h-5 w-5 text-[#b9913f]" />
        </div>
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <p key={item} className="rounded border border-[#071d36]/8 bg-[#f8fafc] px-4 py-3 text-sm font-bold leading-6 text-[#40516a]">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
