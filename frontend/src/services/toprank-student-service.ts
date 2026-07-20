import type { TopRankDashboardCard } from "@/types/toprank";

export function getTopRankStudentDashboardCards(): TopRankDashboardCard[] {
  return [
    { title: "Today's Mission", description: "Mission planner placeholder for RC1.", status: "Foundation" },
    { title: "APR", description: "AI Performance Report placeholder for RC1.", status: "Later" },
    { title: "Leaderboard", description: "Competition board placeholder for RC1.", status: "Later" },
    { title: "Live Class", description: "Live training room placeholder for RC1.", status: "Later" },
    { title: "Battle Test", description: "Exam battle mode placeholder for RC1.", status: "Later" },
    { title: "Physical Training", description: "Physical readiness placeholder for RC1.", status: "Later" },
  ];
}
