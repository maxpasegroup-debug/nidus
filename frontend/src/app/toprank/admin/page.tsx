import { DashboardCard, TopRankEmptyPanel } from "@/components/toprank";
import { getTopRankAdminDashboardCards } from "@/services/toprank-admin-service";

export default function TopRankAdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-[#f6d17a]">Admin command</p>
      <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">TopRank Platform Control</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {getTopRankAdminDashboardCards().map((card) => (
          <DashboardCard key={card.title} card={card} />
        ))}
      </div>
      <div className="mt-8">
        <TopRankEmptyPanel title="Admin foundation placeholder" description="RC1 establishes independent TopRank administration without touching NIDUS Academy dashboards, APIs or authentication." />
      </div>
    </div>
  );
}
