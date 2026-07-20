import type { TopRankDashboardCard } from "@/types/toprank";

export function getTopRankMentorDashboardCards(): TopRankDashboardCard[] {
  return [
    { title: "Today's Classes", description: "Mentor class schedule placeholder for RC1.", status: "Foundation" },
    { title: "Upload Videos", description: "Recorded content upload placeholder for RC1.", status: "Later" },
    { title: "Question Bank", description: "Question authoring placeholder for RC1.", status: "Later" },
    { title: "Student Performance", description: "Learner progress placeholder for RC1.", status: "Later" },
    { title: "Pending Reviews", description: "Review queue placeholder for RC1.", status: "Later" },
  ];
}
