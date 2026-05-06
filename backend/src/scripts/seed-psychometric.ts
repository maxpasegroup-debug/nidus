import "dotenv/config";
import { prisma } from "../config/prisma.js";

const tests = [
  {
    title: "TAT Story Perception Drill",
    type: "TAT",
    description: "Write officer-like stories from ambiguous SSB picture prompts.",
    duration: 30,
    instructions: "Observe the picture, identify characters, and write a practical story with action and outcome.",
    questions: [
      {
        questionText: "A young candidate sees a damaged bridge near a village after heavy rain.",
        imageUrl: "https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1000&q=80",
        questionType: "WRITING",
        options: undefined,
        order: 1
      },
      {
        questionText: "A group is gathered outside a school building before sunrise.",
        imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80",
        questionType: "WRITING",
        options: undefined,
        order: 2
      }
    ]
  },
  {
    title: "WAT Rapid Association",
    type: "WAT",
    description: "Respond quickly to words with constructive, natural associations.",
    duration: 15,
    instructions: "Write the first meaningful sentence that reflects practical and positive thinking.",
    questions: ["Courage", "Pressure", "Team", "Failure"].map((word, index) => ({
      questionText: word,
      questionType: "QUICK_RESPONSE",
      order: index + 1
    }))
  },
  {
    title: "SRT Field Response Set",
    type: "SRT",
    description: "Write quick responses to realistic field and social situations.",
    duration: 25,
    instructions: "Give short, practical responses showing initiative, responsibility and calm decision making.",
    questions: [
      "You are leading a trek and one teammate twists an ankle.",
      "You notice unfair behaviour toward a junior in your hostel.",
      "A train is delayed and your team may miss reporting time."
    ].map((prompt, index) => ({ questionText: prompt, questionType: "SITUATION", order: index + 1 }))
  },
  {
    title: "Self Description Assessment",
    type: "SD",
    description: "Guided self-description from parents, teachers, friends and personal perspective.",
    duration: 35,
    instructions: "Write honest, balanced responses with improvement intent.",
    questions: ["Parents' opinion", "Teachers' opinion", "Friends' opinion", "Self opinion", "Qualities to improve"].map((prompt, index) => ({
      questionText: prompt,
      questionType: "GUIDED_WRITING",
      order: index + 1
    }))
  },
  {
    title: "OLQ Officer Readiness Assessment",
    type: "OLQ",
    description: "Evaluate officer-like qualities through structured behavioural choices.",
    duration: 20,
    instructions: "Choose responses that best represent your natural behaviour.",
    questions: [
      {
        questionText: "When a group is confused, I usually:",
        questionType: "MCQ",
        options: ["Wait for instructions", "Organize options and suggest a plan", "Avoid involvement", "Ask someone else to decide"],
        order: 1
      },
      {
        questionText: "Under pressure, my decisions are usually:",
        questionType: "MCQ",
        options: ["Delayed", "Balanced and timely", "Impulsive", "Dependent on others"],
        order: 2
      }
    ]
  }
];

async function main() {
  for (const test of tests) {
    await prisma.psychometricTest.deleteMany({ where: { title: test.title } });
    await prisma.psychometricTest.create({
      data: {
        title: test.title,
        type: test.type,
        description: test.description,
        duration: test.duration,
        instructions: test.instructions,
        questions: {
          create: test.questions.map((question) => ({
            questionText: question.questionText,
            imageUrl: "imageUrl" in question ? question.imageUrl : undefined,
            questionType: question.questionType,
            options: "options" in question ? question.options : undefined,
            order: question.order
          }))
        }
      }
    });
  }
  console.log(`Seeded ${tests.length} psychometric tests`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
