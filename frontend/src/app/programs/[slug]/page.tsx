import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Phone, ShieldCheck } from "lucide-react";

import { allAcademyPrograms } from "@/data/academy-programs";

type ProgramPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allAcademyPrograms.map((program) => ({ slug: program.slug }));
}

export default async function ProgramDetailPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const program = allAcademyPrograms.find((item) => item.slug === slug);

  if (!program) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--navy)]">
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <Link className="inline-flex items-center gap-2 text-sm font-black text-[var(--muted-blue)]" href="/programs">
          <ArrowLeft className="h-4 w-4" />
          Back to Academy Programs
        </Link>

        <div className="mt-6 rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{program.groupTitle}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{program.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">{program.outcome}</p>

          <div className="mt-7 grid gap-3 md:grid-cols-2">
            <Info label="Best for" value={program.audience} />
            <Info label="Admission support" value="Free career clarity and counselling guidance" />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg" href="/start-free">
              Book Free Career Clarity
            </Link>
            <a className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black" href="tel:+918593950774">
              Call +91 85939 50774
            </a>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">What students learn</p>
            <h2 className="mt-2 text-3xl font-black">Simple training modules</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {program.modules.map((module) => (
                <div key={module} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
                  <CheckCircle2 className="h-5 w-5 text-[var(--gold)]" />
                  <span className="font-bold">{module}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-6 shadow-sm">
            <ShieldCheck className="h-8 w-8 text-[var(--gold)]" />
            <h2 className="mt-4 text-3xl font-black">Not sure if this is right?</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-blue)]">
              Parents and students can book a free clarity session. Our team will explain eligibility, pathway, class mode and
              next steps in simple language.
            </p>
            <Link className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg" href="/start-free">
              <Phone className="h-4 w-4" />
              Start Free
            </Link>
          </aside>
        </section>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{label}</p>
      <p className="mt-2 font-bold text-[var(--navy)]">{value}</p>
    </div>
  );
}
