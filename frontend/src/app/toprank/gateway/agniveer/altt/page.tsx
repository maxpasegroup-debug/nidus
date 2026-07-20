import { HeroBanner, SectionHeading, TopRankPublicLayout } from "@/components/toprank";

const cycle = ["Learn", "Understand", "Practice", "Recall", "Apply", "Battle Test", "Revision", "Mastery", "Continuous Improvement"];

export default function AgniveerAlttPage() {
  return (
    <TopRankPublicLayout>
      <HeroBanner
        eyebrow="Active Learning Transformation Technique"
        title="ALTT"
        description="ALTT is the TopRank learning discipline: students move from passive reading to repeated recall, application, testing, revision and measurable mastery."
        primaryHref="/toprank/gateway/agniveer/curriculum"
        primaryLabel="View Curriculum"
        secondaryHref="/toprank/gateway/agniveer/orientation"
        secondaryLabel="Watch Orientation"
      />
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Learning cycle" title="From learning to mastery" description="The cycle is intentionally simple so students understand what to do every day." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cycle.map((step, index) => (
              <article key={step} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-6">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#d6a447] text-sm font-black text-[#06120e]">{index + 1}</span>
                <h3 className="mt-5 text-2xl font-black text-white">{step}</h3>
                <p className="mt-3 text-sm leading-6 text-[#b9c2b4]">A focused stage in the TopRank preparation rhythm, ready for deeper engine integration in future releases.</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </TopRankPublicLayout>
  );
}
