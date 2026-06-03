import { pathToFileURL } from "node:url";
import { prisma } from "../config/prisma.js";

type AssessmentType = "TAT" | "WAT" | "SRT" | "SD" | "OLQ" | "Personality" | "Cognitive";

type Dimension =
  | "leadership"
  | "discipline"
  | "focus"
  | "confidence"
  | "pressure"
  | "future"
  | "teamwork"
  | "emotional"
  | "fitness"
  | "communication"
  | "reasoning"
  | "careerFit"
  | "serviceMindset"
  | "dreamDrive";

type SeedAssessment = {
  id: string;
  title: string;
  type: AssessmentType;
  description: string;
  duration: number;
  instructions: string;
  dimensions: Dimension[];
};

const dimensionLabels: Record<Dimension, string> = {
  leadership: "leadership and initiative",
  discipline: "discipline and consistency",
  focus: "focus and distraction control",
  confidence: "confidence and self-belief",
  pressure: "pressure handling and courage",
  future: "future clarity and ambition",
  teamwork: "teamwork and group dynamics",
  emotional: "emotional stability",
  fitness: "physical mindset and endurance",
  communication: "communication and command presence",
  reasoning: "effective intelligence and reasoning",
  careerFit: "branch suitability and career fit",
  serviceMindset: "service mindset and mission orientation",
  dreamDrive: "dream intensity and productivity"
};

const dimensionQuestions: Record<Dimension, string[]> = {
  leadership: [
    "When a group becomes confused before an important task, what do you naturally do first?",
    "When nobody is taking ownership of a situation, how do you respond?",
    "When your idea can help the group but others are louder, what do you do?",
    "When a team starts losing confidence, what role do you take?",
    "When leadership responsibility comes suddenly, what is your first instinct?"
  ],
  discipline: [
    "When your planned routine breaks for two days, what usually happens next?",
    "When nobody checks your work, how does your effort change?",
    "When you wake up late on a training day, how do you recover the day?",
    "When a target feels repetitive and boring, how do you continue?",
    "When you miss a deadline, what is your honest recovery pattern?"
  ],
  focus: [
    "When you sit for a difficult study session, what usually happens after the first 20 minutes?",
    "When your phone distracts you during preparation, how do you respond?",
    "When a task feels mentally heavy, what do you usually do?",
    "When you lose concentration, how do you bring yourself back?",
    "When multiple tasks compete for attention, how do you choose what to finish?"
  ],
  confidence: [
    "When you are asked to introduce yourself suddenly, what happens inside you?",
    "When a senior questions your ability, how do you respond?",
    "When you make a visible mistake, how do you recover?",
    "When you must speak without perfect preparation, what do you do?",
    "When others seem more capable, how does it affect your self-belief?"
  ],
  pressure: [
    "When pressure rises and everyone waits for action, what do you do?",
    "When a plan fails at the last moment, what is your next move?",
    "When you are blamed for something unfairly, how do you respond?",
    "When time is short and information is incomplete, how do you decide?",
    "When fear appears before a major challenge, what guides your action?"
  ],
  future: [
    "How clearly can you explain your future goal to someone serious?",
    "When your goal feels far away, what do you do today?",
    "When people doubt your chosen path, how do you respond?",
    "When ambition is high but routine is weak, what happens?",
    "When choosing between comfort and long-term progress, what do you usually choose?"
  ],
  teamwork: [
    "When group members disagree strongly, what role do you play?",
    "When a quieter member has a useful idea, what do you do?",
    "When a teammate is weak but trying, how do you support them?",
    "When the group ignores your suggestion, how do you behave next?",
    "When a team task becomes stressful, how do you protect morale?"
  ],
  emotional: [
    "When someone criticizes you harshly, what happens first?",
    "When anger appears during a group task, how do you handle it?",
    "When plans change suddenly, how quickly do you become steady again?",
    "When embarrassment happens publicly, how long does it affect you?",
    "When stress builds for many days, how do you manage yourself?"
  ],
  fitness: [
    "When physical training becomes uncomfortable, what keeps you moving?",
    "When you feel low energy before exercise, what do you do?",
    "When your stamina is weaker than others, how do you respond?",
    "When you miss a workout, what happens to your fitness routine?",
    "When training pain appears, how do you interpret it?"
  ],
  communication: [
    "When you explain an idea to a group, how do you ensure clarity?",
    "When people misunderstand your instruction, what do you do?",
    "When you must persuade without sounding aggressive, how do you speak?",
    "When the room feels intense, what happens to your voice and clarity?",
    "When you need to correct someone respectfully, how do you communicate?"
  ],
  reasoning: [
    "When a problem has many possible solutions, how do you choose one?",
    "When information is incomplete, how do you reason before acting?",
    "When your first solution fails, what do you do with the available facts?",
    "When a task requires planning, how do you organize the steps?",
    "When others panic over a complex issue, how do you simplify it?"
  ],
  careerFit: [
    "Which type of defence role naturally attracts your personality?",
    "When choosing between field action, technology, aviation, and leadership, what pulls you most?",
    "How comfortable are you with strict systems, hierarchy, and duty?",
    "When thinking about Army, Navy, Air Force, or technical branches, how do you decide fit?",
    "What kind of mission environment would bring out your best performance?"
  ],
  serviceMindset: [
    "When personal comfort conflicts with duty, what do you choose?",
    "What does wearing a uniform mean in your daily behaviour?",
    "When discipline feels strict, how do you interpret it?",
    "How do you respond to sacrifice when the mission matters?",
    "When the country, team, or institution needs responsibility, what is your instinct?"
  ],
  dreamDrive: [
    "When your dream and distraction compete, what usually wins?",
    "How much does your goal control your daily choices?",
    "When dopamine distractions appear, how do you protect your ambition?",
    "After watching motivational content, what do you actually do?",
    "How strongly do you protect time for your future self?"
  ]
};

const assessments: SeedAssessment[] = [
  {
    id: "officer-readiness",
    title: "Officer Readiness Test(TM)",
    type: "OLQ",
    description: "Flagship readiness score for officer mindset, leadership, discipline, courage, and responsibility.",
    duration: 35,
    instructions: "Answer naturally. NIDUS AI will read readiness patterns across leadership, discipline, courage, responsibility, focus, and service mindset.",
    dimensions: ["leadership", "discipline", "pressure", "teamwork", "confidence", "serviceMindset"]
  },
  {
    id: "olq-analyzer",
    title: "OLQ Analyzer(TM)",
    type: "OLQ",
    description: "Officer-like qualities analysis inspired by SSB psychology structure.",
    duration: 40,
    instructions: "Choose the response closest to your real behaviour in officer-like situations. NIDUS AI will map OLQ signals dimension-wise.",
    dimensions: ["reasoning", "leadership", "teamwork", "confidence", "pressure", "emotional"]
  },
  {
    id: "defence-career-fit",
    title: "Defence Career Fit Test(TM)",
    type: "Personality",
    description: "Branch suitability across Army, Navy, Air Force, technical, combat, and leadership pathways.",
    duration: 30,
    instructions: "Select the pathway behaviour that feels closest to your personality, strengths, interests, and defence branch fit.",
    dimensions: ["careerFit", "future", "fitness", "discipline", "teamwork", "serviceMindset"]
  },
  {
    id: "discipline-index",
    title: "Discipline Index(TM)",
    type: "Personality",
    description: "Habit and consistency scanner for routine discipline and execution ability.",
    duration: 30,
    instructions: "NIDUS AI is measuring consistency, routine strength, punctuality, execution, recovery, and self-control.",
    dimensions: ["discipline", "focus", "future", "pressure", "emotional", "fitness"]
  },
  {
    id: "focus-strength",
    title: "Focus Strength Index(TM)",
    type: "Cognitive",
    description: "Attention and concentration analysis linked with NIDUS Guru focus missions.",
    duration: 30,
    instructions: "Answer honestly about attention span, distraction control, deep work, digital discipline, and mental endurance.",
    dimensions: ["focus", "discipline", "pressure", "emotional", "future", "dreamDrive"]
  },
  {
    id: "leadership-dna",
    title: "Leadership DNA Test(TM)",
    type: "Personality",
    description: "Leadership style analysis with command, teamwork, influence, and emotional control.",
    duration: 35,
    instructions: "NIDUS AI will identify your leadership archetype through command style, influence, empathy, and decision behaviour.",
    dimensions: ["leadership", "communication", "teamwork", "pressure", "confidence", "emotional"]
  },
  {
    id: "confidence-index",
    title: "Confidence Index(TM)",
    type: "Personality",
    description: "Confidence and self-belief analysis for speaking, fear handling, and self-image.",
    duration: 30,
    instructions: "Choose the response that best matches your communication confidence, self-belief, fear handling, and recovery pattern.",
    dimensions: ["confidence", "communication", "emotional", "pressure", "future", "teamwork"]
  },
  {
    id: "ssb-psychology-simulator",
    title: "SSB Psychology Simulator(TM)",
    type: "SRT",
    description: "Advanced behavioural interpretation inspired by TAT, WAT, SRT, and SD style patterns.",
    duration: 45,
    instructions: "Respond as you would in real SSB-style pressure and psychology situations. NIDUS AI will interpret behavioural patterns.",
    dimensions: ["pressure", "leadership", "reasoning", "teamwork", "emotional", "communication"]
  },
  {
    id: "defence-mindset-scan",
    title: "Defence Mindset Scan(TM)",
    type: "Personality",
    description: "Elite mentality assessment for resilience, pressure handling, and mission orientation.",
    duration: 32,
    instructions: "NIDUS AI is checking resilience, service orientation, mental toughness, pressure handling, and mission identity.",
    dimensions: ["serviceMindset", "pressure", "discipline", "fitness", "future", "emotional"]
  },
  {
    id: "emotional-stability",
    title: "Emotional Stability Index(TM)",
    type: "Personality",
    description: "Stress and emotional control analysis for calmness under pressure.",
    duration: 30,
    instructions: "Choose the answer closest to your real emotional response under criticism, fear, embarrassment, pressure, and conflict.",
    dimensions: ["emotional", "pressure", "confidence", "teamwork", "communication", "discipline"]
  },
  {
    id: "command-communication",
    title: "Command Communication Index(TM)",
    type: "Personality",
    description: "Social leadership assessment for clarity, command presence, and persuasion.",
    duration: 30,
    instructions: "NIDUS AI will read clarity, persuasion, listening, command presence, correction style, and speaking under intensity.",
    dimensions: ["communication", "leadership", "confidence", "teamwork", "pressure", "emotional"]
  },
  {
    id: "teamwork-group-dynamics",
    title: "Teamwork & Group Dynamics Test(TM)",
    type: "Personality",
    description: "Group behaviour analysis for collaboration, adaptability, and leadership in groups.",
    duration: 30,
    instructions: "Choose your honest group behaviour in cooperation, disagreement, inclusion, reliability, and morale situations.",
    dimensions: ["teamwork", "leadership", "communication", "emotional", "pressure", "serviceMindset"]
  },
  {
    id: "future-readiness",
    title: "Future Readiness Index(TM)",
    type: "Personality",
    description: "Career and mission clarity assessment for ambition, direction, and growth mindset.",
    duration: 30,
    instructions: "NIDUS AI is measuring ambition, clarity, planning, growth mindset, goal seriousness, and career ownership.",
    dimensions: ["future", "dreamDrive", "discipline", "confidence", "focus", "careerFit"]
  },
  {
    id: "warrior-fitness-mindset",
    title: "Warrior Fitness Mindset(TM)",
    type: "Personality",
    description: "Warrior lifestyle analysis for fitness attitude, endurance mentality, and physical discipline.",
    duration: 30,
    instructions: "Answer honestly about physical discipline, endurance mentality, pain tolerance, body confidence, and training identity.",
    dimensions: ["fitness", "discipline", "pressure", "emotional", "future", "serviceMindset"]
  },
  {
    id: "dream-addiction-index",
    title: "Dream Addiction Index(TM)",
    type: "Personality",
    description: "Signature NIDUS Guru test for distraction, goal obsession, productivity, and ambition intensity.",
    duration: 30,
    instructions: "NIDUS AI will compare distraction resistance, ambition intensity, productivity behaviour, dream identity, and dopamine control.",
    dimensions: ["dreamDrive", "focus", "discipline", "future", "confidence", "emotional"]
  }
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function accessForAssessment(id: string) {
  if (["officer-readiness", "defence-career-fit", "discipline-index", "focus-strength", "leadership-dna", "dream-addiction-index"].includes(id)) return "FREE";
  if (id === "ssb-psychology-simulator") return "PREMIUM";
  return "CORE";
}

function categoryForAssessment(id: string) {
  if (["officer-readiness", "olq-analyzer", "defence-mindset-scan", "ssb-psychology-simulator"].includes(id)) return "OFFICER_READINESS";
  if (["defence-career-fit", "future-readiness"].includes(id)) return "CAREER_FIT";
  if (["leadership-dna", "confidence-index", "command-communication", "teamwork-group-dynamics"].includes(id)) return "LEADERSHIP_PERSONALITY";
  return "DISCIPLINE_FOCUS";
}

function buildOptions(assessment: SeedAssessment, dimension: Dimension, questionIndex: number) {
  const label = dimensionLabels[dimension];
  const context = `${assessment.title.replace("(TM)", "").trim()} - ${label} scenario ${questionIndex + 1}`;

  return [
    `${context}: I act early, take responsibility, and convert the situation into a useful next step.`,
    `${context}: I stay steady, understand the situation, and respond after creating a clear small plan.`,
    `${context}: I need support or time before I respond with confidence and consistency.`,
    `${context}: I usually delay, avoid, or lose rhythm when this situation becomes uncomfortable.`
  ];
}

function buildQuestions(assessment: SeedAssessment) {
  const assessmentName = assessment.title.replace("(TM)", "").trim();
  return assessment.dimensions.flatMap((dimension, dimensionIndex) =>
    dimensionQuestions[dimension].map((questionText, questionIndex) => {
      const order = dimensionIndex * 5 + questionIndex + 1;
      const label = dimensionLabels[dimension];
      return {
        id: `${assessment.id}-${slug(dimension)}-${questionIndex + 1}`,
        testId: assessment.id,
        questionText: `${assessmentName} scenario ${order} - ${label}: ${questionText}`,
        questionType: "SINGLE_CHOICE",
        options: buildOptions(assessment, dimension, questionIndex),
        order
      };
    })
  );
}

export async function ensurePsychometricAssessments() {
  let questionCount = 0;

  for (const assessment of assessments) {
    await prisma.psychometricTest.upsert({
      where: { id: assessment.id },
      update: {
        title: assessment.title,
        type: assessment.type,
        description: assessment.description,
        duration: assessment.duration,
        instructions: assessment.instructions,
        access: accessForAssessment(assessment.id),
        category: categoryForAssessment(assessment.id),
        isActive: true
      },
      create: {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        description: assessment.description,
        duration: assessment.duration,
        instructions: assessment.instructions,
        access: accessForAssessment(assessment.id),
        category: categoryForAssessment(assessment.id),
        isActive: true
      }
    });

    const questions = buildQuestions(assessment);
    await prisma.psychometricQuestion.deleteMany({
      where: {
        testId: assessment.id,
        answers: { none: {} }
      }
    });

    await prisma.psychometricQuestion.createMany({
      data: questions,
      skipDuplicates: true
    });

    questionCount += questions.length;
  }

  const [dbAssessments, dbQuestions] = await Promise.all([
    prisma.psychometricTest.count({ where: { id: { in: assessments.map((assessment) => assessment.id) } } }),
    prisma.psychometricQuestion.count({ where: { testId: { in: assessments.map((assessment) => assessment.id) } } })
  ]);

  return {
    assessments: assessments.length,
    questions: questionCount,
    dbAssessments,
    dbQuestions
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await ensurePsychometricAssessments();
  console.log(JSON.stringify({ seeded: true, ...result }));
  await prisma.$disconnect();
}
