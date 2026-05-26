import { BrainCircuit, Dumbbell, GraduationCap, Medal, MessageCircle, Plane, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PublicTile = {
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  icon: LucideIcon;
};

export type TopRankExam = PublicTile & {
  status: "live" | "staged";
  audience: string;
  whatItIs: string;
  howItPerforms: string[];
  trainingFlow: string[];
  outcomes: string[];
  dashboardNote: string;
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

export const topRankExams: TopRankExam[] = [
  {
    slug: "nda",
    title: "NDA",
    subtitle: "Adaptive NDA speed, accuracy, memory, and rank practice.",
    href: "/toprank/nda",
    image: publicImages.army,
    icon: ShieldCheck,
    status: "live",
    audience: "Plus One, Plus Two and repeat aspirants preparing for NDA Army, Navy, Air Force and Naval Academy routes.",
    whatItIs: "A guided NDA performance arena that profiles the student, starts focused practice, tracks speed and accuracy, and builds a daily mission loop for rank readiness.",
    howItPerforms: ["Creates a tenant-secure TOPRANK launch session from the NIDUS dashboard.", "Routes students into NDA Army, Navy, Air Force or Naval Academy training.", "Uses diagnostic practice, adaptive revision and readiness reporting to guide the next mission."],
    trainingFlow: ["Sign up or log in to NIDUS.", "Open the student dashboard and choose NDA mission route.", "Start TOPRANK NDA AI Training and continue daily practice."],
    outcomes: ["Speed and accuracy clarity", "Weak-zone correction", "Daily NDA mission discipline", "Readiness score and next action"],
    dashboardNote: "NDA is active from the student dashboard through the secure Career7 TOPRANK bridge."
  },
  {
    slug: "cds",
    title: "CDS",
    subtitle: "Graduate-level officer exam practice arena.",
    href: "/toprank/cds",
    image: publicImages.republic,
    icon: Medal,
    status: "staged",
    audience: "Graduates preparing for IMA, INA, AFA and OTA pathways.",
    whatItIs: "A structured CDS training arena planned for English, general knowledge, mathematics, timed practice and officer readiness improvement.",
    howItPerforms: ["Profiles subject confidence and exam rhythm.", "Builds practice missions around speed, accuracy and revision gaps.", "Prepares mentor-readable reports for guided improvement."],
    trainingFlow: ["Submit interest or create a NIDUS account.", "Get mapped to the CDS preparation path.", "Training access will open as the CDS route is enabled."],
    outcomes: ["Subject priority clarity", "Mock readiness direction", "Officer pathway guidance", "Mentor follow-up"],
    dashboardNote: "CDS public arena is ready for guidance. Live TOPRANK launch will be enabled after the CDS bridge route is opened."
  },
  {
    slug: "afcat",
    title: "AFCAT",
    subtitle: "Air Force aptitude, speed, and technical confidence.",
    href: "/toprank/afcat",
    image: publicImages.airforce,
    icon: Plane,
    status: "staged",
    audience: "Air Force aspirants preparing for AFCAT and related officer pathways.",
    whatItIs: "A planned Air Force exam training arena focused on reasoning, verbal ability, numerical ability, general awareness and exam temperament.",
    howItPerforms: ["Identifies aptitude strengths and pressure points.", "Trains speed through focused practice missions.", "Connects practice reports with mentor guidance."],
    trainingFlow: ["Explore the AFCAT arena.", "Submit guidance request or create free account.", "Access will open when AFCAT training launch is enabled."],
    outcomes: ["Aptitude clarity", "Time management direction", "Air Force pathway awareness", "Practice discipline"],
    dashboardNote: "AFCAT public arena is ready for onboarding interest. Live bridge launch is staged."
  },
  {
    slug: "agniveer",
    title: "Agniveer",
    subtitle: "Written exam and physical readiness practice.",
    href: "/toprank/agniveer",
    image: publicImages.airforceMarch,
    icon: Dumbbell,
    status: "staged",
    audience: "Agniveer aspirants who need written exam, routine and physical-readiness discipline.",
    whatItIs: "A written-plus-physical preparation arena planned to combine exam practice, fitness discipline, routine building and readiness tracking.",
    howItPerforms: ["Maps written exam practice with physical preparation habits.", "Uses mission-style routines to improve consistency.", "Creates a clear follow-up path for academy support."],
    trainingFlow: ["Choose Agniveer arena.", "Share WhatsApp details for counselling.", "Begin academy-guided preparation while digital launch is staged."],
    outcomes: ["Written exam direction", "Fitness mindset", "Routine discipline", "Counselling clarity"],
    dashboardNote: "Agniveer digital TOPRANK launch is staged. Enquiries are captured for academy follow-up."
  },
  {
    slug: "ssb",
    title: "SSB",
    subtitle: "OLQ, interview, psychology, and group task preparation.",
    href: "/toprank/ssb",
    image: publicImages.navy,
    icon: MessageCircle,
    status: "staged",
    audience: "Aspirants preparing for SSB psychology, interview, GTO and officer-like qualities.",
    whatItIs: "A planned SSB readiness arena that helps students understand officer-like qualities, communication, emotional control and selection-stage preparation.",
    howItPerforms: ["Connects psychometric insight with SSB improvement areas.", "Structures interview, psychology and group-task preparation into missions.", "Keeps reports ready for mentor review."],
    trainingFlow: ["Explore SSB readiness.", "Start free assessment or submit guidance request.", "Join SSB mentor pathway when training access opens."],
    outcomes: ["OLQ clarity", "Interview confidence", "Psychology readiness", "Mentor action plan"],
    dashboardNote: "SSB arena is detailed for guidance. Live TOPRANK launch is staged."
  },
  {
    slug: "aissee",
    title: "AISSEE",
    subtitle: "Sainik School entrance practice for younger aspirants.",
    href: "/toprank/aissee",
    image: publicImages.cadets,
    icon: GraduationCap,
    status: "staged",
    audience: "Class 6 and Class 9 aspirants preparing for Sainik School entrance.",
    whatItIs: "A foundation-level entrance preparation arena planned for younger defence aspirants with parent-friendly guidance and structured practice.",
    howItPerforms: ["Builds basic subject confidence with guided practice.", "Supports parents with clear preparation direction.", "Creates a foundation route toward disciplined defence learning."],
    trainingFlow: ["Open AISSEE arena.", "Submit parent or student details.", "NIDUS counselling team maps the correct class pathway."],
    outcomes: ["Foundation clarity", "Parent guidance", "Study routine", "Entrance readiness"],
    dashboardNote: "AISSEE arena is ready for enquiries. Live adaptive launch is staged."
  }
];

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
  ["CDS", "/programs/cds-afcat-inet"],
  ["AFCAT", "/programs/cds-afcat-inet"],
  ["SSB", "/programs/ssb-interview-guidance"],
  ["AISSEE", "/programs/aissee-class-6"],
  ["Agniveer", "/programs/agniveer-full-program"],
  ["Foundation Programs", "/programs/mission-2028-after-10th"],
  ["Physical Training", "/programs/agniveer-physical-training"],
  ["Interview Guidance", "/programs/ssb-interview-guidance"]
] as const;

export const topRankMenuItems = topRankExams.map((exam) => [exam.title, exam.href] as const);
export const guruMenuItems = [
  ["Quest Arena", "/guru"],
  ...guruRecordedQuests.slice(0, 5).map((quest) => [quest.title, quest.href] as const)
] as const;

export function getTopRankExam(slug: string) {
  return topRankExams.find((exam) => exam.slug === slug);
}

export function getGuruQuest(slug: string) {
  return guruRecordedQuests.find((quest) => quest.slug === slug);
}
