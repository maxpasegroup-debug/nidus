import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Dumbbell, FileCheck2, ShieldCheck, Target } from "lucide-react";

import { getTopRankDivision, getTopRankProgram } from "@/data/top-rank";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StudentTopRankDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const division = getTopRankDivision(slug);
  const program = getTopRankProgram(slug);

  if (division) {
    const programs = division.programs.map((programSlug) => getTopRankProgram(programSlug)).filter(Boolean);
    return (
      <main className="space-y-6">
        <BackLink />
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--ink)] p-6 text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">TOP RANK Division</p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">{division.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">{division.description}</p>
        </section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((item) => (
            <Link key={item!.slug} href={`/dashboard/student/top-rank/${item!.slug}`} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Program</p>
              <h2 className="mt-3 text-2xl font-black">{item!.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{item!.summary}</p>
              <span className="mt-4 inline-flex items-center gap-2 font-black">Open <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </section>
      </main>
    );
  }

  if (program) {
    return (
      <main className="space-y-6">
        <BackLink />
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">TOP RANK Program</p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{program.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">{program.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Tier title="Starter" text="Understand the exam and begin regular practice." />
              <Tier title="PTO" text="Structured preparation with stronger tracking." />
              <Tier title="TOP RANK" text="Strict daily loop for serious rank-focused training." />
            </div>
          </div>
          <aside className="rounded-3xl border border-[var(--border)] bg-[var(--ink)] p-6 text-white shadow-sm">
            <ShieldCheck className="h-9 w-9 text-[var(--gold)]" />
            <h2 className="mt-4 text-3xl font-black">Student profiling first.</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">
              NIDUS checks current level, exam frequency, discipline and target before recommending the coaching tier.
            </p>
          </aside>
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          <InfoBlock icon={FileCheck2} title="Eligibility" items={[program.eligibility]} />
          <InfoBlock icon={Dumbbell} title="Physical Requirements" items={[program.physicalRequirements]} />
          <InfoBlock icon={Target} title="Career Paths" items={program.careerPaths} />
          <InfoBlock icon={CheckCircle2} title="Selection Process" items={program.selectionProcess} />
        </section>
      </main>
    );
  }

  notFound();
}

function BackLink() {
  return (
    <Link href="/dashboard/student/top-rank" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
      <ArrowLeft className="h-4 w-4" /> Back to TOP RANK
    </Link>
  );
}

function Tier({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-[var(--muted-blue)]">{text}</p>
    </div>
  );
}

function InfoBlock({ icon: Icon, title, items }: { icon: typeof ShieldCheck; title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
          <Icon className="h-5 w-5 text-[var(--gold)]" />
        </div>
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <p key={item} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-bold leading-6 text-[var(--muted-blue)]">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
