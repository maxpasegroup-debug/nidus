import { fileURLToPath } from "node:url";
import { prisma } from "../config/prisma.js";

const placeholderAudio = "https://cdn.nidusacademy.in/guru/placeholders/intro-audio.mp3";

const quests = [
  {
    slug: "dream-addiction",
    title: "Dream Addiction",
    description: "Break passive dreaming and convert desire into disciplined action.",
    duration: "7 days",
    introduction: "Dream Addiction helps students replace distraction with ambition and daily proof.",
    certificateTitle: "Dream Addiction Transformation Certificate"
  },
  {
    slug: "focus-reset",
    title: "Focus Reset",
    description: "Defeat distractions and build deep study focus.",
    duration: "5 days",
    introduction: "Focus Reset rebuilds attention through small missions and simple reflection.",
    certificateTitle: "Focus Reset Certificate"
  },
  {
    slug: "warrior-discipline",
    title: "Warrior Discipline",
    description: "Build unstoppable habits, routine and execution.",
    duration: "7 days",
    introduction: "Warrior Discipline teaches students to act even when motivation is low.",
    certificateTitle: "Warrior Discipline Certificate"
  },
  {
    slug: "active-learning-transformation",
    title: "Active Learning Transformation",
    description: "Learn the NIDUS Guru loop: listen, reflect, act and transform.",
    duration: "3 days",
    introduction: "This onboarding quest explains how mission-based learning works.",
    certificateTitle: "Active Learning Transformation Certificate"
  },
  {
    slug: "mind-mastery",
    title: "Mind Mastery",
    description: "Strengthen emotional control, clarity and self-command.",
    duration: "7 days",
    introduction: "Mind Mastery helps students notice thoughts and choose better actions.",
    certificateTitle: "Mind Mastery Certificate"
  },
  {
    slug: "purpose-quest",
    title: "Purpose Quest",
    description: "Find direction and connect daily action with a bigger goal.",
    duration: "7 days",
    introduction: "Purpose Quest guides students toward meaningful ambition.",
    certificateTitle: "Purpose Quest Certificate"
  },
  {
    slug: "financial-freedom",
    title: "Financial Freedom",
    description: "Build early awareness of money, responsibility and future planning.",
    duration: "5 days",
    introduction: "Financial Freedom teaches students to respect money and plan wisely.",
    certificateTitle: "Financial Freedom Certificate"
  }
];

const achievements = [
  ["first_lesson_complete", "First Lesson Complete", "Completed the first Guru lesson."],
  ["first_reflection", "First Reflection", "Submitted the first reflection."],
  ["action_mission_complete", "Action Mission Complete", "Completed the first action challenge."],
  ["quest_finisher", "Quest Finisher", "Completed a full transformation quest."],
  ["seven_day_streak", "7 Day Streak", "Completed daily missions for 7 days."]
] as const;

const dailyMissions = [
  ["mission-deep-work", "30 Minute Deep Work", "Complete one focused session with phone away.", 80],
  ["mission-reflect", "One Honest Reflection", "Write one short reflection about today's behaviour.", 50],
  ["mission-action-proof", "Daily Action Proof", "Complete one action that supports your dream.", 70]
] as const;

export async function seedGuru() {
  for (const [index, quest] of quests.entries()) {
    const savedQuest = await prisma.guruQuest.upsert({
      where: { slug: quest.slug },
      update: {
        title: quest.title,
        description: quest.description,
        duration: quest.duration,
        introduction: quest.introduction,
        status: "published",
        locked: false,
        certificateTitle: quest.certificateTitle,
        sortOrder: index + 1
      },
      create: {
        slug: quest.slug,
        title: quest.title,
        description: quest.description,
        duration: quest.duration,
        introduction: quest.introduction,
        status: "published",
        locked: false,
        certificateTitle: quest.certificateTitle,
        sortOrder: index + 1
      }
    });

    const existingLesson = await prisma.guruLesson.findFirst({ where: { questId: savedQuest.id, sortOrder: 1 } });
    if (!existingLesson) {
      await prisma.guruLesson.create({
        data: {
          questId: savedQuest.id,
          title: `${quest.title} - Introduction`,
          description: "Start with the core idea and understand your mission.",
          duration: "12 min",
          mediaType: "audio",
          audioUrl: placeholderAudio,
          required: true,
          sortOrder: 1
        }
      });
    }

    const existingReflection = await prisma.guruReflectionQuestion.findFirst({ where: { questId: savedQuest.id, sortOrder: 1 } });
    if (!existingReflection) {
      await prisma.guruReflectionQuestion.create({
        data: {
          questId: savedQuest.id,
          prompt: "What did you understand about yourself from this mission?",
          type: "text",
          options: [],
          required: true,
          sortOrder: 1
        }
      });
    }

    const existingChallenge = await prisma.guruChallenge.findFirst({ where: { questId: savedQuest.id, sortOrder: 1 } });
    if (!existingChallenge) {
      await prisma.guruChallenge.create({
        data: {
          questId: savedQuest.id,
          title: "Daily Proof Mission",
          description: "Complete one focused action today and write what you did.",
          required: true,
          evidenceRequired: false,
          sortOrder: 1
        }
      });
    }

    const existingCertificate = await prisma.guruCertificate.findFirst({ where: { questId: savedQuest.id } });
    if (!existingCertificate) {
      await prisma.guruCertificate.create({
        data: {
          questId: savedQuest.id,
          title: quest.certificateTitle,
          description: "Issued after completing all required quest actions.",
          enabled: true
        }
      });
    }
  }

  for (const [ruleKey, title, description] of achievements) {
    await prisma.guruAchievement.upsert({
      where: { ruleKey },
      update: { title, description, enabled: true },
      create: { ruleKey, title, description, enabled: true }
    });
  }

  for (const [id, title, description, xp] of dailyMissions) {
    await prisma.guruDailyMission.upsert({
      where: { id },
      update: { title, description, xp, enabled: true },
      create: { id, title, description, xp, enabled: true }
    });
  }

  return { quests: quests.length, achievements: achievements.length, dailyMissions: dailyMissions.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = await seedGuru();
  console.log(JSON.stringify({ seeded: true, ...result }, null, 2));
  await prisma.$disconnect();
}
