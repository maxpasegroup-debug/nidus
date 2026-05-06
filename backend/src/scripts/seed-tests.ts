import "dotenv/config";
import { prisma } from "../config/prisma.js";

const tests = [
  {
    title: "NDA Mathematics Mock Test",
    description: "Timed NDA mathematics mock covering algebra, trigonometry, calculus and coordinate geometry.",
    examType: "NDA",
    category: "Mathematics",
    duration: 120,
    totalMarks: 300,
    isMockTest: true,
    isLive: false,
    questions: [
      {
        questionText: "If sin A = 3/5 and A is acute, what is cos A?",
        optionA: "4/5",
        optionB: "3/4",
        optionC: "5/4",
        optionD: "2/5",
        correctAnswer: "A",
        explanation: "Using sin²A + cos²A = 1, cos A = 4/5 for an acute angle.",
        marks: 4,
        negativeMarks: 1.33,
        difficultyLevel: "Easy",
        topic: "Trigonometry"
      },
      {
        questionText: "The roots of x² - 5x + 6 = 0 are:",
        optionA: "1, 6",
        optionB: "2, 3",
        optionC: "-2, -3",
        optionD: "5, 6",
        correctAnswer: "B",
        explanation: "x² - 5x + 6 factors as (x - 2)(x - 3).",
        marks: 4,
        negativeMarks: 1.33,
        difficultyLevel: "Easy",
        topic: "Algebra"
      }
    ]
  },
  {
    title: "CDS English Practice Test",
    description: "CDS English practice paper focused on grammar, comprehension, ordering and vocabulary.",
    examType: "CDS",
    category: "English",
    duration: 60,
    totalMarks: 100,
    isMockTest: true,
    isLive: false,
    questions: [
      {
        questionText: "Choose the correctly spelt word.",
        optionA: "Accomodate",
        optionB: "Acommodate",
        optionC: "Accommodate",
        optionD: "Acomodate",
        correctAnswer: "C",
        explanation: "The correct spelling is Accommodate.",
        marks: 1,
        negativeMarks: 0.33,
        difficultyLevel: "Easy",
        topic: "Vocabulary"
      },
      {
        questionText: "Select the synonym of 'Valour'.",
        optionA: "Fear",
        optionB: "Courage",
        optionC: "Delay",
        optionD: "Doubt",
        correctAnswer: "B",
        explanation: "Valour means courage in danger.",
        marks: 1,
        negativeMarks: 0.33,
        difficultyLevel: "Easy",
        topic: "Synonyms"
      }
    ]
  },
  {
    title: "AFCAT General Knowledge Drill",
    description: "AFCAT GK drill with defence awareness, geography, polity and current affairs.",
    examType: "AFCAT",
    category: "General Knowledge",
    duration: 45,
    totalMarks: 90,
    isMockTest: true,
    isLive: true,
    questions: [
      {
        questionText: "Who is the Supreme Commander of the Indian Armed Forces?",
        optionA: "Prime Minister",
        optionB: "Defence Minister",
        optionC: "President of India",
        optionD: "Chief of Defence Staff",
        correctAnswer: "C",
        explanation: "The President of India is the Supreme Commander of the Armed Forces.",
        marks: 3,
        negativeMarks: 1,
        difficultyLevel: "Easy",
        topic: "Polity"
      },
      {
        questionText: "Which command is responsible for India's Andaman and Nicobar theatre?",
        optionA: "Western Command",
        optionB: "Andaman and Nicobar Command",
        optionC: "Southern Command",
        optionD: "Eastern Air Command",
        correctAnswer: "B",
        explanation: "The Andaman and Nicobar Command is India's tri-service theatre command.",
        marks: 3,
        negativeMarks: 1,
        difficultyLevel: "Medium",
        topic: "Defence Awareness"
      }
    ]
  }
];

async function main() {
  for (const test of tests) {
    await prisma.test.deleteMany({ where: { title: test.title } });
    await prisma.test.create({
      data: {
        ...test,
        questions: {
          create: test.questions
        }
      }
    });
  }

  console.log(`Seeded ${tests.length} NIDUS tests`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
