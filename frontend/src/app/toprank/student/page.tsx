import { DashboardCard, TopRankEmptyPanel } from "@/components/toprank";
import { getTopRankStudentDashboardCards } from "@/services/toprank-student-service";

export default function TopRankStudentDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-[#f6d17a]">Welcome to TopRank</p>
      <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">Welcome to TopRank</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {getTopRankStudentDashboardCards().map((card) => (
          <DashboardCard key={card.title} card={card} />
        ))}
      </div>
      <div className="mt-8">
        <TopRankEmptyPanel title="Student engine placeholder" description="RC1 creates the workspace shell only. Missions, APR, tests, learning and training engines will connect in later releases." />
      </div>
    </div>
  );
}
