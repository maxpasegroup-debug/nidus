import type { TopRankDashboardCard } from "@/types/toprank";

export function getTopRankAdminDashboardCards(): TopRankDashboardCard[] {
  return [
    { title: "Students", description: "TopRank learner management placeholder for RC1.", status: "Foundation" },
    { title: "Mentors", description: "Mentor management placeholder for RC1.", status: "Foundation" },
    { title: "Gateways", description: "Gateway management placeholder for RC1.", status: "Foundation" },
    { title: "Programs", description: "Program setup placeholder for RC1.", status: "Foundation" },
    { title: "Content", description: "Content operations placeholder for RC1.", status: "Later" },
    { title: "Question Bank", description: "Question operations placeholder for RC1.", status: "Later" },
    { title: "Reports", description: "Reporting placeholder for RC1.", status: "Later" },
    { title: "Settings", description: "Platform settings placeholder for RC1.", status: "Foundation" },
  ];
}
