import { DashboardCard, EmptyState, SectionHeading } from "@/components/toprank";
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
        <SectionHeading eyebrow="Student management" title="Enrollment Control" description="Search, profile review, enrollment approval placeholders and batch assignment are prepared for RC3 administration." />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["View Students", "Search and Filter", "Approve Enrollment", "Batch Assignment", "View Profiles", "Gateway Students"].map((item) => (
            <DashboardCard key={item} card={{ title: item, description: `${item} surface prepared for TopRank administration.`, status: "RC3" }} />
          ))}
        </div>
        <div className="mt-8"><EmptyState title="Analytics not enabled" description="Reports, APR, leaderboards and learning analytics are intentionally reserved for later TopRank release candidates." /></div>
      </div>
    </div>
  );
}
