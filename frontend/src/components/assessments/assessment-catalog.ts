import {
  BrainCircuit,
  ClipboardCheck,
  Compass,
  Dumbbell,
  Flame,
  HeartPulse,
  MessageCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Waves,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AssessmentAccess = "FREE" | "CORE" | "PREMIUM";

export type AssessmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "LOCKED";

export type AssessmentDefinition = {
  id: string;
  title: string;
  subtitle: string;
  measures: string[];
  access: AssessmentAccess;
  relatedGuruQuest: string;
  nextStep: string;
  reportName: string;
  icon: LucideIcon;
};

export type AssessmentProgress = AssessmentDefinition & {
  status: AssessmentStatus;
  score: number | null;
  reportStatus: string;
  actionLabel: string;
  href: string;
  accessNote: string;
};

export type AssessmentReport = {
  assessment: AssessmentDefinition;
  score: number;
  level: string;
  archetype: string;
  strengths: string[];
  improvementAreas: string[];
  recommendedAction: string;
  parentSummary: string;
  counsellingPrompt: string;
};

export const recommendedAssessmentPath = [
  "officer-readiness",
  "defence-career-fit",
  "discipline-index",
  "leadership-dna",
  "dream-addiction-index"
];

export const assessmentAccessStrategy = [
  { feature: "Officer Readiness", guest: "Preview", student: "Full", premium: "Full + report" },
  { feature: "Discipline Index", guest: "Preview", student: "Full", premium: "Full + report" },
  { feature: "Leadership DNA", guest: "Preview", student: "Full", premium: "Full + report" },
  { feature: "Dream Addiction Index", guest: "Preview", student: "Full", premium: "Full + Guru plan" },
  { feature: "Defence Career Fit", guest: "Preview", student: "Full", premium: "Full + counselling" },
  { feature: "OLQ Analyzer", guest: "Locked", student: "Basic", premium: "Full" },
  { feature: "SSB Psychology Simulator", guest: "Locked", student: "Locked", premium: "Premium" },
  { feature: "AI Report", guest: "Locked", student: "Basic", premium: "Full" }
];

export const assessmentCatalog: AssessmentDefinition[] = [
  {
    id: "officer-readiness",
    title: "Officer Readiness Test(TM)",
    subtitle: "Flagship readiness score for officer mindset, leadership, discipline, courage, and responsibility.",
    measures: ["officer mindset", "leadership", "discipline", "initiative", "courage", "responsibility"],
    access: "FREE",
    relatedGuruQuest: "Warrior Discipline",
    nextStep: "Use the score to open your Defence Potential Report.",
    reportName: "Officer Readiness Score",
    icon: ShieldCheck
  },
  {
    id: "olq-analyzer",
    title: "OLQ Analyzer(TM)",
    subtitle: "Officer-like qualities analysis inspired by SSB psychology structure.",
    measures: ["effective intelligence", "reasoning", "initiative", "courage", "responsibility", "social adaptability", "stamina", "confidence"],
    access: "CORE",
    relatedGuruQuest: "Student Power",
    nextStep: "Review OLQ strengths and weak officer qualities.",
    reportName: "OLQ Profile",
    icon: Radar
  },
  {
    id: "defence-career-fit",
    title: "Defence Career Fit Test(TM)",
    subtitle: "Branch suitability across Army, Navy, Air Force, technical, combat, and leadership pathways.",
    measures: ["personality", "interest", "mindset", "strengths", "career direction"],
    access: "FREE",
    relatedGuruQuest: "Future Direction",
    nextStep: "Book counselling with your suggested defence pathway.",
    reportName: "Branch Fit Report",
    icon: Compass
  },
  {
    id: "discipline-index",
    title: "Discipline Index(TM)",
    subtitle: "Habit and consistency scanner for routine discipline and execution ability.",
    measures: ["routine discipline", "consistency", "punctuality", "focus", "execution ability"],
    access: "FREE",
    relatedGuruQuest: "Life OS",
    nextStep: "Start a daily discipline reset mission.",
    reportName: "Discipline Score",
    icon: ClipboardCheck
  },
  {
    id: "focus-strength",
    title: "Focus Strength Index(TM)",
    subtitle: "Attention and concentration analysis linked with NIDUS Guru focus missions.",
    measures: ["distraction levels", "focus capacity", "mental endurance", "attention span"],
    access: "FREE",
    relatedGuruQuest: "Focus Reset",
    nextStep: "Start the Focus Reset quest inside NIDUS Guru.",
    reportName: "Focus Strength Report",
    icon: Target
  },
  {
    id: "leadership-dna",
    title: "Leadership DNA Test(TM)",
    subtitle: "Leadership style analysis with command, teamwork, influence, and emotional control.",
    measures: ["command style", "teamwork", "decision-making", "influence", "emotional control"],
    access: "FREE",
    relatedGuruQuest: "Student Power",
    nextStep: "Review your leadership archetype and next communication task.",
    reportName: "Leadership Archetype",
    icon: Trophy
  },
  {
    id: "confidence-index",
    title: "Confidence Index(TM)",
    subtitle: "Confidence and self-belief analysis for speaking, fear handling, and self-image.",
    measures: ["communication confidence", "public interaction", "fear handling", "self-image"],
    access: "CORE",
    relatedGuruQuest: "Confidence Sprint",
    nextStep: "Practice one confidence-building mission this week.",
    reportName: "Confidence Profile",
    icon: Sparkles
  },
  {
    id: "ssb-psychology-simulator",
    title: "SSB Psychology Simulator(TM)",
    subtitle: "Advanced behavioural interpretation inspired by TAT, WAT, SRT, and SD style patterns.",
    measures: ["story response", "word association", "situation response", "self-description", "behavioural interpretation"],
    access: "PREMIUM",
    relatedGuruQuest: "Officer Mindset",
    nextStep: "Unlock premium AI interpretation and SSB readiness report.",
    reportName: "SSB Psychology Report",
    icon: BrainCircuit
  },
  {
    id: "defence-mindset-scan",
    title: "Defence Mindset Scan(TM)",
    subtitle: "Elite mentality assessment for resilience, pressure handling, and mission orientation.",
    measures: ["resilience", "patriotism", "mental toughness", "pressure handling", "mission orientation"],
    access: "CORE",
    relatedGuruQuest: "Warrior Discipline",
    nextStep: "Strengthen mindset through discipline and pressure missions.",
    reportName: "Defence Mindset Report",
    icon: Flame
  },
  {
    id: "emotional-stability",
    title: "Emotional Stability Index(TM)",
    subtitle: "Stress and emotional control analysis for calmness under pressure.",
    measures: ["emotional balance", "stress handling", "impulse control", "calmness under pressure"],
    access: "CORE",
    relatedGuruQuest: "Mind Calm Protocol",
    nextStep: "Practice emotional control and reflection missions.",
    reportName: "Emotional Stability Report",
    icon: HeartPulse
  },
  {
    id: "command-communication",
    title: "Command Communication Index(TM)",
    subtitle: "Social leadership assessment for clarity, command presence, and persuasion.",
    measures: ["clarity", "command presence", "persuasion", "interaction skills"],
    access: "CORE",
    relatedGuruQuest: "Communication Quest",
    nextStep: "Start a speaking and command presence drill.",
    reportName: "Communication Command Report",
    icon: MessageCircle
  },
  {
    id: "teamwork-group-dynamics",
    title: "Teamwork & Group Dynamics Test(TM)",
    subtitle: "Group behaviour analysis for collaboration, adaptability, and leadership in groups.",
    measures: ["collaboration", "adaptability", "group leadership", "team behaviour"],
    access: "CORE",
    relatedGuruQuest: "Team Mission",
    nextStep: "Practice group initiative and cooperation tasks.",
    reportName: "Group Dynamics Report",
    icon: Users
  },
  {
    id: "future-readiness",
    title: "Future Readiness Index(TM)",
    subtitle: "Career and mission clarity assessment for ambition, direction, and growth mindset.",
    measures: ["ambition", "life direction", "goal seriousness", "growth mindset"],
    access: "CORE",
    relatedGuruQuest: "Future Direction",
    nextStep: "Build a written 30-day defence pathway plan.",
    reportName: "Future Readiness Report",
    icon: Zap
  },
  {
    id: "warrior-fitness-mindset",
    title: "Warrior Fitness Mindset(TM)",
    subtitle: "Warrior lifestyle analysis for fitness attitude, endurance mentality, and physical discipline.",
    measures: ["fitness attitude", "endurance mentality", "physical discipline", "training consistency"],
    access: "CORE",
    relatedGuruQuest: "Fitness & Energy",
    nextStep: "Connect this result with PT and fitness logs.",
    reportName: "Physical Mindset Report",
    icon: Dumbbell
  },
  {
    id: "dream-addiction-index",
    title: "Dream Addiction Index(TM)",
    subtitle: "Signature NIDUS Guru test for distraction, goal obsession, productivity, and ambition intensity.",
    measures: ["distraction level", "goal obsession", "dopamine dependence", "productivity behaviour", "ambition intensity"],
    access: "FREE",
    relatedGuruQuest: "Dream Addiction",
    nextStep: "Start Dream Addiction Part 1 and convert ambition into daily missions.",
    reportName: "Dream Addiction Profile",
    icon: Waves
  }
];

function accessNoteFor(assessment: AssessmentDefinition, mode: "guest" | "student" | "premium") {
  if (mode === "premium") {
    if (assessment.access === "PREMIUM") return "Premium AI report";
    if (assessment.id === "dream-addiction-index" || assessment.id === "focus-strength") return "Full + Guru plan";
    if (assessment.id === "defence-career-fit") return "Full + counselling";
    return "Full + report";
  }

  if (mode === "guest") return assessment.access === "FREE" ? "Preview result" : "Create account to unlock";
  if (assessment.access === "PREMIUM") return "Premium locked";
  if (assessment.access === "CORE") return "Basic analysis";
  return "Full assessment";
}

export function buildAssessmentProgress(activityCount = 0, mode: "guest" | "student" | "premium" = "student"): AssessmentProgress[] {
  return assessmentCatalog.map((assessment, index) => {
    const isPremiumLocked = assessment.access === "PREMIUM";
    const isGuestLocked = mode === "guest" && assessment.access !== "FREE";
    const completed = !isPremiumLocked && !isGuestLocked && index < Math.min(activityCount, 4);
    const inProgress = !isPremiumLocked && !isGuestLocked && !completed && index === Math.min(activityCount, 4);
    const score = completed ? Math.min(96, 72 + index * 3) : null;
    const status: AssessmentStatus = isPremiumLocked || isGuestLocked ? "LOCKED" : completed ? "COMPLETED" : inProgress ? "IN_PROGRESS" : "NOT_STARTED";
    const startHref = assessment.id === "dream-addiction-index" || assessment.id === "focus-strength" ? "/guru" : "/psychometric";
    const lockedHref = mode === "guest" ? "/register" : "/subscriptions";

    return {
      ...assessment,
      status,
      score,
      reportStatus: completed ? "Report ready" : isPremiumLocked ? "Premium locked" : isGuestLocked ? "Create account to unlock" : inProgress ? "Continue to generate report" : "Report pending",
      actionLabel: completed ? "View Report" : isPremiumLocked ? "Unlock Premium" : isGuestLocked ? "Create Account" : inProgress ? "Continue" : mode === "guest" ? "Start Preview" : "Start Assessment",
      href: completed ? `/assessment-reports/${assessment.id}` : isPremiumLocked || isGuestLocked ? lockedHref : startHref,
      accessNote: accessNoteFor(assessment, mode)
    };
  });
}

export function getAssessmentById(id: string) {
  return assessmentCatalog.find((assessment) => assessment.id === id);
}

function scoreForAssessment(id: string) {
  const index = assessmentCatalog.findIndex((assessment) => assessment.id === id);
  return Math.min(96, 78 + Math.max(index, 0) * 2);
}

function levelForScore(score: number) {
  if (score >= 85) return "Strong officer signal";
  if (score >= 70) return "Developing strength";
  if (score >= 55) return "Foundation level";
  return "Needs focused support";
}

function archetypeForAssessment(assessment: AssessmentDefinition, score: number) {
  if (assessment.id.includes("leadership") || assessment.id.includes("officer")) return score >= 85 ? "The Commander" : "The Strategist";
  if (assessment.id.includes("discipline") || assessment.id.includes("fitness")) return "The Warrior";
  if (assessment.id.includes("communication") || assessment.id.includes("teamwork")) return "The Diplomat";
  if (assessment.id.includes("career") || assessment.id.includes("future")) return "The Pathfinder";
  if (assessment.id.includes("dream") || assessment.id.includes("focus")) return "The Builder";
  return "The Emerging Officer";
}

export function buildAssessmentReport(id: string): AssessmentReport | null {
  const assessment = getAssessmentById(id);
  if (!assessment) return null;

  const score = scoreForAssessment(id);
  const strengths = assessment.measures.slice(0, 3).map((measure) => `Good signal in ${measure}.`);
  const improvementAreas = assessment.measures.slice(3, 6).map((measure) => `Strengthen ${measure} through guided missions.`);
  const fallbackImprovement = [`Build consistency through ${assessment.relatedGuruQuest}.`];

  return {
    assessment,
    score,
    level: levelForScore(score),
    archetype: archetypeForAssessment(assessment, score),
    strengths,
    improvementAreas: improvementAreas.length ? improvementAreas : fallbackImprovement,
    recommendedAction: assessment.nextStep,
    parentSummary: `Your child shows a ${levelForScore(score).toLowerCase()} in ${assessment.title.replace("(TM)", "").trim()}. The next step is to continue structured practice, complete related assessments, and follow the recommended NIDUS Guru or counselling action.`,
    counsellingPrompt: assessment.access === "PREMIUM" ? "Unlock premium interpretation or book an SSB readiness counselling session." : "Book a counselling review to understand how this result connects with the defence pathway."
  };
}
