import "dotenv/config";
import { prisma } from "../config/prisma.js";

const pyqData = [
  {
    category: { name: "Mathematics", examType: "NDA" },
    questions: [
      { year: 2023, subject: "Mathematics", topic: "Trigonometry", questionText: "If tan A = 1, where A is acute, what is A?", optionA: "30 degrees", optionB: "45 degrees", optionC: "60 degrees", optionD: "90 degrees", correctAnswer: "B", explanation: "tan 45 degrees equals 1.", difficultyLevel: "Easy" },
      { year: 2022, subject: "Mathematics", topic: "Algebra", questionText: "The sum of roots of x^2 - 7x + 10 = 0 is:", optionA: "5", optionB: "7", optionC: "10", optionD: "17", correctAnswer: "B", explanation: "For ax^2 + bx + c, sum of roots is -b/a = 7.", difficultyLevel: "Easy" }
    ]
  },
  {
    category: { name: "General Knowledge", examType: "CDS" },
    questions: [
      { year: 2023, subject: "General Knowledge", topic: "Defence", questionText: "Which force operates the aircraft carrier INS Vikrant?", optionA: "Indian Army", optionB: "Indian Navy", optionC: "Indian Air Force", optionD: "Coast Guard", correctAnswer: "B", explanation: "INS Vikrant is operated by the Indian Navy.", difficultyLevel: "Easy" },
      { year: 2021, subject: "General Knowledge", topic: "Polity", questionText: "The President of India is elected by:", optionA: "Lok Sabha only", optionB: "Rajya Sabha only", optionC: "Electoral college", optionD: "State governors", correctAnswer: "C", explanation: "The President is elected by an electoral college.", difficultyLevel: "Medium" }
    ]
  }
];

const currentAffairs = [
  {
    title: "Tri-service integration and theatre commands remain a key reform focus",
    description: "India's defence reforms continue to emphasize jointness, integrated planning and faster operational response across services.",
    category: "Defence Reform",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
    publishedDate: "2026-05-01",
    quizzes: [{ question: "Tri-service integration primarily aims to improve:", optionA: "Civil aviation", optionB: "Joint military operations", optionC: "Banking policy", optionD: "Sports training", correctAnswer: "B" }]
  },
  {
    title: "Maritime domain awareness is central to Indian Ocean security",
    description: "Naval surveillance, island territories and partner coordination are central themes for India's maritime security posture.",
    category: "Maritime Security",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    publishedDate: "2026-05-02",
    quizzes: [{ question: "Maritime domain awareness relates to:", optionA: "Ocean security awareness", optionB: "Mountain rescue", optionC: "Currency supply", optionD: "Railway signaling", correctAnswer: "A" }]
  }
];

const battles = [
  { title: "NDA Rapid Fire: Maths & GK", category: "NDA", startTime: "2026-05-10T10:00:00.000Z", endTime: "2026-05-10T10:30:00.000Z" },
  { title: "CDS Defence Awareness Duel", category: "CDS", startTime: "2026-05-11T14:00:00.000Z", endTime: "2026-05-11T14:25:00.000Z" }
];

async function main() {
  for (const item of pyqData) {
    const category = await prisma.pYQCategory.upsert({
      where: { name_examType: item.category },
      update: {},
      create: item.category
    });
    await prisma.pYQQuestion.deleteMany({ where: { categoryId: category.id } });
    await prisma.pYQQuestion.createMany({ data: item.questions.map((question) => ({ ...question, categoryId: category.id })) });
  }

  await prisma.currentAffair.deleteMany({});
  for (const item of currentAffairs) {
    await prisma.currentAffair.create({
      data: { ...item, publishedDate: new Date(item.publishedDate), quizzes: { create: item.quizzes } }
    });
  }

  await prisma.quizBattle.deleteMany({});
  await prisma.quizBattle.createMany({ data: battles.map((battle) => ({ ...battle, startTime: new Date(battle.startTime), endTime: new Date(battle.endTime) })) });

  const users = await prisma.user.findMany({ where: { role: "STUDENT" }, take: 5, orderBy: { createdAt: "asc" } });
  await Promise.all(users.map((user, index) => prisma.leaderboard.upsert({
    where: { userId: user.id },
    update: { points: 1200 - index * 140, streak: 9 - index, rank: index + 1 },
    create: { userId: user.id, points: 1200 - index * 140, streak: 9 - index, rank: index + 1 }
  })));

  console.log("Seeded learning hub content");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
