import { HeroBanner, SectionHeading, TopRankPublicLayout, TrainerCard } from "@/components/toprank";
import { getTrainerCategories } from "@/services/toprank-content-service";

export default function AgniveerTrainersPage() {
  return (
    <TopRankPublicLayout>
      <HeroBanner
        eyebrow="TopRank Trainers"
        title="Mentors Behind The Mission"
        description="A premium trainer showcase foundation for academic mentors, physical trainers, EQ coaches and retired defence officers."
        primaryHref="/toprank/join"
        primaryLabel="Join TopRank"
        secondaryHref="/toprank/gateway/agniveer/curriculum"
        secondaryLabel="View Curriculum"
      />
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Trainer showcase" title="Guidance with discipline and warmth" description="RC2 uses photo placeholders so real verified trainer profiles can be added later without redesign." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {getTrainerCategories().map((trainer) => <TrainerCard key={trainer.category} {...trainer} />)}
          </div>
        </div>
      </section>
    </TopRankPublicLayout>
  );
}
