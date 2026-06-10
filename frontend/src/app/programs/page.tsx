import Link from "next/link";
import { ArrowRight, GraduationCap, Phone, ShieldCheck } from "lucide-react";

import { academyProgramGroups } from "@/data/academy-programs";

export default function ProgramsPage() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--navy)]">
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">NIDUS Academy</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            Choose the right defence career path with clarity.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            Simple program groups for school students, Plus Two students, graduates, medical aspirants and Agniveer candidates.
            No confusion. Select a path and book a free career clarity session.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg" href="/start-free">
              Book Free Career Clarity
            </Link>
            <a className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black" href="tel:+918593950774">
              Call +91 85939 50774
            </a>
          </div>
        </div>

        <section className="mt-10 grid gap-6">
          {academyProgramGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Academy Vertical</p>
                  <h2 className="mt-2 text-3xl font-black">{group.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">{group.subtitle}</p>
                </div>
                <ShieldCheck className="hidden h-10 w-10 text-[var(--gold)] md:block" />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.programs.map((program) => (
                  <Link
                    key={program.slug}
                    className="group rounded-2xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
                    href={`/programs/${program.slug}`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                      <GraduationCap className="h-6 w-6 text-[var(--navy)]" />
                    </div>
                    <h3 className="mt-5 text-xl font-black">{program.title}</h3>
                    <p className="mt-2 text-sm font-bold text-[var(--muted-blue)]">{program.audience}</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted-blue)]">{program.outcome}</p>
                    <span className="mt-5 inline-flex items-center gap-2 font-black text-[var(--navy)]">
                      View program <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Need help choosing?</p>
              <h2 className="mt-2 text-3xl font-black">Book a free career clarity session.</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">
                Our admission team will help parents and students select the right defence pathway.
              </p>
            </div>
            <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg" href="/start-free">
              <Phone className="h-4 w-4" />
              Start Free
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
