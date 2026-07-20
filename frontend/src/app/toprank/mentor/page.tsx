import { DashboardCard, TopRankEmptyPanel } from "@/components/toprank";
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
        <TopRankEmptyPanel title="Mentor engine placeholder" description="RC1 keeps mentor functions static while preserving a separate TopRank architecture for later content, reviews and performance workflows." />
      </div>
    </div>
  );
}
