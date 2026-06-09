import { fileURLToPath } from "node:url";
import { prisma } from "../config/prisma.js";

const topic = "Medieval India";
const subCategory = "NDA";
const batchName = "NDA Foundation Batch A";
const programSlug = "mission-nda-2-year-program";
const testTitle = "NDA FOUNDATION TEST 01";

const rulers = [
  "Delhi Sultanate",
  "Vijayanagara Empire",
  "Mughal Empire",
  "Bahmani Sultanate",
  "Chola administration",
  "Bhakti movement",
  "Sufi traditions",
  "Akbar's policies",
  "Sher Shah Suri's reforms",
  "Maratha rise",
  "Rajput states",
  "medieval trade routes",
  "Iqta system",
  "Mansabdari system",
  "temple architecture",
  "Persian chronicles",
  "provincial administration",
  "land revenue systems",
  "regional kingdoms",
  "military organization"
];

const skills = [
  "political authority",
  "administrative structure",
  "cultural development",
  "economic policy",
  "religious interaction"
];

function makeQuestion(index: number) {
  const subject = rulers[index % rulers.length];
  const skill = skills[index % skills.length];
  const difficulty = index % 5 === 0 ? "HARD" : index % 2 === 0 ? "MEDIUM" : "EASY";
  return {
    questionText: `In Medieval India, which statement best explains ${subject} in relation to ${skill}?`,
    questionType: "SINGLE_CHOICE",
    optionA: `It shaped ${skill} through organised governance and regional influence.`,
    optionB: `It had no connection with ${skill} or state formation.`,
    optionC: `It was limited only to foreign trade and ignored administration.`,
    optionD: `It removed all local institutions immediately across India.`,
    correctAnswer: "A",
    explanation: `${subject} must be studied through its role in ${skill}, institutions, society, and long-term political impact.`,
    category: "Defence",
    subCategory,
    topic,
    subTopic: subject,
    difficulty,
    marks: 1,
    negativeMarks: 0,
    status: "ACTIVE"
  };
}

export async function seedPilotExam() {
  const existingBankCount = await prisma.questionBankItem.count({
    where: { category: "Defence", subCategory, topic, status: "ACTIVE" }
  });

  if (existingBankCount < 100) {
    await prisma.questionBankItem.createMany({
      data: Array.from({ length: 100 - existingBankCount }).map((_, index) => makeQuestion(existingBankCount + index)),
      skipDuplicates: true
    });
  }

  const batch = await prisma.batch.upsert({
    where: { name_programSlug: { name: batchName, programSlug } },
    update: { status: "ACTIVE" },
    create: {
      name: batchName,
      batchType: "REGULAR",
      programSlug,
      status: "ACTIVE"
    }
  });

  const existingTest = await prisma.test.findFirst({
    where: { title: testTitle, batchId: batch.id }
  });

  if (existingTest) {
    return { questionBank: Math.max(existingBankCount, 100), batch: batch.name, test: existingTest.title, created: false };
  }

  const bankQuestions = await prisma.questionBankItem.findMany({
    where: { category: "Defence", subCategory, topic, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    take: 100
  });

  const test = await prisma.test.create({
    data: {
      title: testTitle,
      description: "Pilot NDA Foundation CBT exam. Topic: Medieval India. Duration: 60 minutes. Instant result and explanations enabled.",
      examType: "NDA",
      category: "Defence",
      subject: "History",
      topic,
      batchId: batch.id,
      publishAt: new Date(),
      status: "PUBLISHED",
      reviewedAt: new Date(),
      approvedAt: new Date(),
      duration: 60,
      totalMarks: 100,
      isMockTest: true,
      isLive: true,
      questions: {
        create: bankQuestions.map((question) => ({
          questionText: question.questionText,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          difficultyLevel: question.difficulty,
          topic: question.topic
        }))
      }
    }
  });

  return { questionBank: bankQuestions.length, batch: batch.name, test: test.title, created: true };
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;

if (isDirectRun) {
  seedPilotExam()
    .then((result) => {
      console.log(JSON.stringify({ seeded: true, ...result }, null, 2));
    })
    .catch((error) => {
      console.error("Failed to seed pilot exam", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
