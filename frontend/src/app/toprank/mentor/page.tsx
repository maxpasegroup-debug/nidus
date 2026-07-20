import { DashboardCard, EmptyState, SectionHeading } from "@/components/toprank";
import { getTopRankMentorDashboardCards } from "@/services/toprank-mentor-service";

export default function TopRankMentorDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-[#f6d17a]">Mentor console</p>
      <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">Today&apos;s Mentor Workspace</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {getTopRankMentorDashboardCards().map((card) => (
          <DashboardCard key={card.title} card={card} />
        ))}
      </div>
      <div className="mt-8">
        <SectionHeading eyebrow="Assigned students" title="Mentor View Prepared" description="Assigned students, batch lists and student profiles are prepared as RC3 mentor management surfaces." />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Assigned Students", "Student Profiles", "Batch List"].map((item) => (
            <DashboardCard key={item} card={{ title: item, description: `${item} placeholder connected to the TopRank mentor architecture.`, status: "RC3" }} />
          ))}
        </div>
        <div className="mt-8"><EmptyState title="Learning tools not enabled" description="Live classes, reviews and learning engines are intentionally reserved for later TopRank release candidates." /></div>
      </div>
    </div>
  );
}
