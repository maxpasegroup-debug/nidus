import { CurriculumCard, HeroBanner, SectionHeading, TopRankPublicLayout } from "@/components/toprank";
import { getCurriculumCards } from "@/services/toprank-content-service";

export default function AgniveerCurriculumPage() {
  return (
    <TopRankPublicLayout>
      <HeroBanner
        eyebrow="Agniveer Curriculum"
        title="Structured For Six Months"
        description="A clean subject-wise curriculum view for students and parents. Real lesson content will connect in the learning engine phase."
        primaryHref="/toprank/gateway/agniveer/trainers"
        primaryLabel="Meet Trainers"
        secondaryHref="/toprank/join"
        secondaryLabel="Join TopRank"
      />
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Curriculum" title="What the program covers" description="Each card shows the subject, expected training hours and preparation objectives." />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {getCurriculumCards().map((card) => <CurriculumCard key={card.subject} {...card} />)}
          </div>
        </div>
      </section>
    </TopRankPublicLayout>
  );
}
