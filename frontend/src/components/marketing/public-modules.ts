import { BrainCircuit, Dumbbell, GraduationCap, Landmark, Medal, MessageCircle, Plane, ShieldCheck, Sparkles, Target, Trophy, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PublicTile = {
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  icon: LucideIcon;
};

export const publicImages = {
  hero: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Armed%20Forces%20-%20Republic%20day%20parade%202024.jpg",
  army: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Army%20contingent%20Republic%20Day%20parade%202023%20Img5.jpg",
  cadets: "https://commons.wikimedia.org/wiki/Special:FilePath/Ncc%20cadets%20in%20India%20during%20parade.jpg",
  navy: "https://commons.wikimedia.org/wiki/Special:FilePath/Passing%20out%20Parade%20Spring%20Term%202017%20held%20at%20Indian%20Naval%20Academy%2C%20Ezhimala%20%287%29.jpg",
  airforce: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Air%20Force%20Rafale%20fighter.jpg",
  airforceMarch: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Air%20Force%20Marching%20Contingent.jpg",
  customs: "https://commons.wikimedia.org/wiki/Special:FilePath/Customs%20%26%20Central%20Officer%20on%20Republic%20Day.jpg",
  drdo: "https://commons.wikimedia.org/wiki/Special:FilePath/Tata%20DRDO%20whap.jpg",
  republic: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20soldiers%20at%20the%20Republic%20day%20parade.jpg",
  para: "https://commons.wikimedia.org/wiki/Special:FilePath/Para%20contingent%20republic%20day%202022.jpg"
};

export const topRankExams: PublicTile[] = [
  { slug: "nda", title: "NDA", subtitle: "Adaptive NDA speed, accuracy, memory, and rank practice.", href: "/toprank/nda", image: publicImages.army, icon: ShieldCheck },
  { slug: "cds", title: "CDS", subtitle: "Graduate-level officer exam practice arena.", href: "/toprank/cds", image: publicImages.republic, icon: Medal },
  { slug: "afcat", title: "AFCAT", subtitle: "Air Force aptitude, speed, and technical confidence.", href: "/toprank/afcat", image: publicImages.airforce, icon: Plane },
  { slug: "agniveer", title: "Agniveer", subtitle: "Written exam and physical readiness practice.", href: "/toprank/agniveer", image: publicImages.airforceMarch, icon: Dumbbell },
  { slug: "ssb", title: "SSB", subtitle: "OLQ, interview, psychology, and group task preparation.", href: "/toprank/ssb", image: publicImages.navy, icon: MessageCircle },
  { slug: "aissee", title: "AISSEE", subtitle: "Sainik School entrance practice for younger aspirants.", href: "/toprank/aissee", image: publicImages.cadets, icon: GraduationCap }
];

export const guruRecordedQuests: PublicTile[] = [
  { slug: "dream-addiction", title: "Dream Addiction", subtitle: "Turn ambition into a daily obsession for growth.", href: "/guru/quests/dream-addiction", image: publicImages.hero, icon: Sparkles },
  { slug: "focus-reset", title: "Focus Reset", subtitle: "Reduce distraction and rebuild concentration.", href: "/guru/quests/focus-reset", image: publicImages.drdo, icon: Target },
  { slug: "confidence-builder", title: "Confidence Builder", subtitle: "Build self-belief, speaking comfort, and courage.", href: "/guru/quests/confidence-builder", image: publicImages.cadets, icon: Trophy },
  { slug: "warrior-discipline", title: "Warrior Discipline", subtitle: "Create routine, consistency, and action habits.", href: "/guru/quests/warrior-discipline", image: publicImages.army, icon: ShieldCheck },
  { slug: "student-power", title: "Student Power", subtitle: "A simple student system for study, energy, and direction.", href: "/guru/quests/student-power", image: publicImages.navy, icon: Zap },
  { slug: "life-os", title: "Life OS", subtitle: "Upgrade habits, planning, and daily decision making.", href: "/guru/quests/life-os", image: publicImages.customs, icon: BrainCircuit }
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
