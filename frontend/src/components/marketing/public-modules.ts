import { BrainCircuit, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PublicTile = {
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  icon: LucideIcon;
};

export type GuruQuest = PublicTile & {
  tagline: string;
  promise: string;
  trainer: string;
  trainerRole: string;
  missionCount: string;
  tags: string[];
  focus: string[];
  missions: string[];
  tone: string;
};

const wikiImage = (fileName: string, width = 900) => `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=${width}`;

export const publicImages = {
  hero: wikiImage("Indian%20Armed%20Forces%20-%20Republic%20day%20parade%202024.jpg", 1600),
  army: wikiImage("Indian%20Army%20contingent%20Republic%20Day%20parade%202023%20Img5.jpg", 1000),
  cadets: wikiImage("Ncc%20cadets%20in%20India%20during%20parade.jpg", 800),
  navy: wikiImage("Passing%20out%20Parade%20Spring%20Term%202017%20held%20at%20Indian%20Naval%20Academy%2C%20Ezhimala%20%287%29.jpg", 900),
  airforce: wikiImage("IAFRafale.jpg", 900),
  airforceMarch: wikiImage("Indian%20Air%20Force%20Marching%20Contingent.jpg", 800),
  customs: wikiImage("Customs%20%26%20Central%20Officer%20on%20Republic%20Day.jpg", 800),
  drdo: wikiImage("Tata%20DRDO%20whap.jpg", 900),
  republic: wikiImage("Indian%20soldiers%20at%20the%20Republic%20day%20parade.jpg", 900),
  para: wikiImage("Para%20contingent%20republic%20day%202022.jpg", 900)
};

export const guruRecordedQuests: GuruQuest[] = [
  {
    slug: "dream-addiction",
    title: "Dream Addiction™",
    subtitle: "Replace Distractions With Ambition.",
    tagline: "Replace Distractions With Ambition.",
    promise: "Identify distraction patterns, understand emotional triggers, and convert ambition into a mission mindset.",
    href: "/guru/quests/dream-addiction",
    image: publicImages.hero,
    icon: Sparkles,
    trainer: "NIDUS Transformation Mentor",
    trainerRole: "Dream systems, identity and student performance",
    missionCount: "2 parts / 12 missions",
    tags: ["Dopamine Awareness", "Ambition Systems", "Mission Mindset"],
    focus: ["dopamine awareness", "distraction patterns", "self-analysis", "digital addictions", "procrastination", "emotional triggers", "dream obsession", "productive habits"],
    missions: ["Part 1: Know Your Addictions™", "Digital Distraction Audit", "Emotional Trigger Map", "Procrastination Pattern Reset", "Part 2: Upgrade Your Addictions™", "Future Identity Builder", "Dream Obsession System", "Daily Mission Loop"],
    tone: "from-[#071d36] via-[#314832] to-[#b9913f]"
  },
  {
    slug: "focus-reset",
    title: "Focus Reset™",
    subtitle: "Defeat Distractions. Build Deep Focus.",
    tagline: "Defeat Distractions. Build Deep Focus.",
    promise: "Rebuild attention, create digital discipline, and train the mind for study focus and consistency.",
    href: "/guru/quests/focus-reset",
    image: publicImages.drdo,
    icon: Target,
    trainer: "NIDUS Focus Coach",
    trainerRole: "Attention, study rhythm and deep work systems",
    missionCount: "8 missions",
    tags: ["Concentration", "Digital Discipline", "Deep Work"],
    focus: ["concentration", "attention rebuilding", "digital discipline", "study focus", "consistency", "deep work systems"],
    missions: ["Attention Baseline", "Distraction Removal Protocol", "Deep Study Sprint", "Phone Boundary Mission", "Focus Recovery Reflection", "Consistency Loop", "Study Environment Reset", "Deep Focus Challenge"],
    tone: "from-[#071d36] via-[#234b63] to-[#6e8faf]"
  },
  {
    slug: "warrior-discipline",
    title: "Warrior Discipline™",
    subtitle: "Build Unstoppable Habits & Discipline.",
    tagline: "Build Unstoppable Habits & Discipline.",
    promise: "Create routine, execution rhythm, self-control and momentum through simple daily missions.",
    href: "/guru/quests/warrior-discipline",
    image: publicImages.army,
    icon: ShieldCheck,
    trainer: "NIDUS Discipline Mentor",
    trainerRole: "Routine, execution and discipline psychology",
    missionCount: "10 missions",
    tags: ["Routine", "Execution", "Momentum"],
    focus: ["routine", "execution", "consistency", "self-control", "momentum", "discipline psychology"],
    missions: ["Discipline Identity", "Morning Command Routine", "Execution Before Motivation", "Self-Control Drill", "Momentum Tracker", "No-Excuse Reflection", "Routine Repair", "Habit Chain", "Pressure Day Mission", "Discipline Review"],
    tone: "from-[#071d36] via-[#3f4a32] to-[#8a7442]"
  },
  {
    slug: "active-learning-transformation",
    title: "Active Learning Transformation™",
    subtitle: "Learn. Reflect. Apply. Repeat. Transform.",
    tagline: "Learn. Reflect. Apply. Repeat. Transform.",
    promise: "The foundational onboarding quest that teaches students how NIDUS Guru turns learning into action and transformation.",
    href: "/guru/quests/active-learning-transformation",
    image: publicImages.cadets,
    icon: BrainCircuit,
    trainer: "NIDUS Active Learning Guide",
    trainerRole: "Transformation systems, reflection and performance psychology",
    missionCount: "6 missions",
    tags: ["Onboarding", "Reflection", "Action Learning"],
    focus: ["passive learning vs active learning", "mission systems", "reflection systems", "action-based learning", "consistency loops", "performance psychology"],
    missions: ["Why Passive Learning Fails", "The Active Learning Loop", "Mission-Based Growth", "Reflection System", "Action Challenge Design", "Transformation Rhythm"],
    tone: "from-[#f7f3ea] via-[#dce9f3] to-[#b9913f]"
  }
];

export const academyMenuItems = [
  ["NDA", "/programs/nda-crash-course"],
  ["CDS", "/programs/cds-f1"],
  ["AFCAT", "/programs/afcat"],
  ["SSB", "/programs/ssb-interview-guidance"],
  ["AISSEE", "/programs/aissee-class-6"],
  ["Agniveer", "/programs/agniveer-army"],
  ["Foundation Programs", "/programs/foundation-nda-civil-services"],
  ["Physical Training", "/programs/agniveer-army"],
  ["Interview Guidance", "/programs/ssb-interview-guidance"]
] as const;

export const guruMenuItems = [
  ["Quest Arena", "/guru"],
  ...guruRecordedQuests.slice(0, 5).map((quest) => [quest.title, quest.href] as const)
] as const;

export function getGuruQuest(slug: string) {
  return guruRecordedQuests.find((quest) => quest.slug === slug);
}
