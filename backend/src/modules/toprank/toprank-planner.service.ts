import type { Prisma, TopRankAPR, TopRankStudentProfile } from "../../generated/prisma/client.js";

export type MissionDraft = {
  title: string;
  description: string;
  missionType: string;
  difficulty: string;
  priority: number;
  estimatedMinutes: number;
  dayNumber: number;
  weekNumber: number;
  objectives: string[];
  tasks: Array<{ title: string; taskType: string; durationMinutes: number; sequence: number }>;
  metadata: Prisma.InputJsonObject;
};

function weakAreas(apr: TopRankAPR | null) {
  const scoreMap = {
    Mathematics: apr?.academicScore ?? 50,
    Running: apr?.physicalScore ?? 50,
    Revision: apr?.learningScore ?? 50,
    Discipline: apr?.disciplineScore ?? 50,
    "Career Clarity": apr?.careerScore ?? 50
  };
  return Object.entries(scoreMap).sort((a, b) => a[1] - b[1]).map(([name]) => name);
}

function difficulty(score: number) {
  if (score < 45) return "Foundation";
  if (score < 65) return "Build";
  if (score < 80) return "Advance";
  return "Sharpen";
}

function studyMinutes(profile: TopRankStudentProfile | null) {
  const hours = profile?.dailyStudyHours ?? 3;
  return Math.max(45, Math.min(150, Math.round(hours * 35)));
}

export const topRankPlannerService = {
  createRoadmap(input: { apr: TopRankAPR | null; profile: TopRankStudentProfile | null; startDate: Date; durationDays?: number }) {
    const durationDays = input.durationDays ?? 180;
    const weakest = weakAreas(input.apr);
    const studyTime = studyMinutes(input.profile);
    const drafts: MissionDraft[] = [];
    const academicDifficulty = difficulty(input.apr?.academicScore ?? 50);
    const physicalDifficulty = difficulty(input.apr?.physicalScore ?? 50);

    for (let day = 1; day <= durationDays; day += 1) {
      const weekNumber = Math.ceil(day / 7);
      const focus = weakest[(day - 1) % weakest.length] ?? "Mathematics";
      const isBattleDay = day % 7 === 0;
      const isRevisionDay = day % 3 === 0;
      const isCurrentAffairsDay = day % 2 === 0;

      drafts.push({
        title: isBattleDay ? `Battle Test Baseline ${weekNumber}` : `${focus} Mission Day ${day}`,
        description: isBattleDay ? "Complete a controlled battle test placeholder and review readiness." : `Work on ${focus} based on your APR baseline.`,
        missionType: isBattleDay ? "Battle Test" : isRevisionDay ? "Revision" : "Study",
        difficulty: academicDifficulty,
        priority: focus === weakest[0] ? 1 : 2,
        estimatedMinutes: isBattleDay ? 60 : studyTime,
        dayNumber: day,
        weekNumber,
        objectives: isBattleDay ? ["Attempt timed practice", "Review mistakes", "Record confidence"] : [`Improve ${focus}`, "Complete planned learning block", "Record one doubt"],
        tasks: [
          { title: "Warm-up recall", taskType: "Revision", durationMinutes: 10, sequence: 1 },
          { title: isBattleDay ? "Attempt battle test placeholder" : `Study ${focus}`, taskType: isBattleDay ? "Battle Test" : "Study", durationMinutes: Math.max(25, studyTime - 25), sequence: 2 },
          { title: "Write completion notes", taskType: "Reflection", durationMinutes: 10, sequence: 3 }
        ],
        metadata: { generatedBy: "TOPRANK_RC5_RULE_ENGINE", focus }
      });

      drafts.push({
        title: `Physical Goal Day ${day}`,
        description: "Build physical consistency according to your readiness baseline.",
        missionType: "Physical",
        difficulty: physicalDifficulty,
        priority: (input.apr?.physicalScore ?? 50) < 55 ? 1 : 3,
        estimatedMinutes: 35,
        dayNumber: day,
        weekNumber,
        objectives: ["Complete running or stamina drill", "Track effort level", "Recover properly"],
        tasks: [
          { title: "Mobility warm-up", taskType: "Physical", durationMinutes: 8, sequence: 1 },
          { title: (input.apr?.physicalScore ?? 50) < 55 ? "Foundation running drill" : "Endurance drill", taskType: "Physical", durationMinutes: 22, sequence: 2 },
          { title: "Cool down and hydration", taskType: "Physical", durationMinutes: 5, sequence: 3 }
        ],
        metadata: { generatedBy: "TOPRANK_RC5_RULE_ENGINE", focus: "Physical readiness" }
      });

      if (isCurrentAffairsDay) {
        drafts.push({
          title: `Current Affairs Scan Day ${day}`,
          description: "Maintain defence awareness with a short current affairs routine.",
          missionType: "Current Affairs",
          difficulty: "Build",
          priority: 3,
          estimatedMinutes: 20,
          dayNumber: day,
          weekNumber,
          objectives: ["Read daily defence news", "Note 3 important facts"],
          tasks: [
            { title: "Read daily brief placeholder", taskType: "Current Affairs", durationMinutes: 15, sequence: 1 },
            { title: "Write 3 facts", taskType: "Reflection", durationMinutes: 5, sequence: 2 }
          ],
          metadata: { generatedBy: "TOPRANK_RC5_RULE_ENGINE", focus: "Current Affairs" }
        });
      }

      if ((input.apr?.disciplineScore ?? 50) < 60 && day % 4 === 0) {
        drafts.push({
          title: `Discipline Reflection Day ${day}`,
          description: "Strengthen consistency through a short discipline reflection.",
          missionType: "Reflection",
          difficulty: "Foundation",
          priority: 2,
          estimatedMinutes: 15,
          dayNumber: day,
          weekNumber,
          objectives: ["Review yesterday", "Set tomorrow's discipline target"],
          tasks: [
            { title: "Write one win", taskType: "Reflection", durationMinutes: 5, sequence: 1 },
            { title: "Write one correction", taskType: "Reflection", durationMinutes: 5, sequence: 2 },
            { title: "Commit tomorrow target", taskType: "Motivation", durationMinutes: 5, sequence: 3 }
          ],
          metadata: { generatedBy: "TOPRANK_RC5_RULE_ENGINE", focus: "Discipline" }
        });
      }
    }
    return drafts;
  }
};

