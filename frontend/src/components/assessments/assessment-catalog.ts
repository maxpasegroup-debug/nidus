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
};

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

export function buildAssessmentProgress(activityCount = 0): AssessmentProgress[] {
  return assessmentCatalog.map((assessment, index) => {
    const isPremiumLocked = assessment.access === "PREMIUM";
    const completed = !isPremiumLocked && index < Math.min(activityCount, 4);
    const inProgress = !isPremiumLocked && !completed && index === Math.min(activityCount, 4);
    const score = completed ? Math.min(96, 72 + index * 3) : null;
    const status: AssessmentStatus = isPremiumLocked ? "LOCKED" : completed ? "COMPLETED" : inProgress ? "IN_PROGRESS" : "NOT_STARTED";

    return {
      ...assessment,
      status,
      score,
      reportStatus: completed ? "Report ready" : isPremiumLocked ? "Premium locked" : inProgress ? "Continue to generate report" : "Report pending",
      actionLabel: completed ? "View Report" : isPremiumLocked ? "Unlock Premium" : inProgress ? "Continue" : "Start Assessment",
      href: isPremiumLocked ? "/subscriptions" : assessment.id === "dream-addiction-index" || assessment.id === "focus-strength" ? "/guru" : "/psychometric"
    };
  });
}

