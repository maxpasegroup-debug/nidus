import { HeroBanner, SectionHeading, TopRankPublicLayout } from "@/components/toprank";
import { TopRankAssessmentClient } from "@/components/toprank/toprank-assessment-client";

export default function TopRankAssessmentPage() {
  return (
    <TopRankPublicLayout>
      <HeroBanner
        eyebrow="Diagnostic Assessment"
        title="Know Your Starting Point"
        description="TopRank APR begins with a structured diagnostic assessment across academics, physical readiness, learning behaviour, discipline and career clarity."
      />
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Why it matters" title="Your baseline decides your training path" description="This assessment takes around 12 to 15 minutes. It does not pass or fail you. It identifies your current level before TopRank training begins." />
        <div className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-5">
          {["Academic Assessment", "Physical Assessment", "Learning Assessment", "Personality & Discipline", "Readiness Index"].map((item) => (
            <article key={item} className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-5 text-center text-sm font-black text-white">{item}</article>
          ))}
        </div>
      </section>
      <TopRankAssessmentClient />
    </TopRankPublicLayout>
  );
}

