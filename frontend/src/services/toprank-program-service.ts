import type { TopRankProgram } from "@/types/toprank";

export function getTopRankPrograms(): TopRankProgram[] {
  return [
    {
      id: "agniveer-six-month",
      gatewayId: "agniveer",
      title: "6 Month AI Powered TopRank Training Program",
      duration: "6 months",
      fee: "Published by admissions team",
      status: "ACTIVE",
    },
  ];
}

export function getAgniveerProgramDetails() {
  return {
    overview: "A structured six-month preparation pathway for students who want discipline, clarity and guided preparation for Agniveer selection.",
    duration: "6 months",
    fee: "Published by admissions team",
    batchSchedule: ["1st of every month", "15th of every month"],
    admissionStatus: "Admissions Open",
    seatsRemaining: "Limited seats per batch",
    salary: ["Monthly package as per official Agniveer structure", "Seva Nidhi benefit as per government rules", "Skill and discipline foundation for future opportunities"],
    careerGrowth: ["Armed forces exposure", "Skill certificate and disciplined routine", "Future preparation confidence for defence and uniformed services"],
    selectionProcess: ["Online application guidance", "Written exam preparation", "Physical readiness", "Medical and document readiness", "Final merit preparation"],
    admissionProcess: ["Speak to admissions", "Submit basic details", "Choose batch date", "Complete registration", "Attend orientation"],
  };
}
