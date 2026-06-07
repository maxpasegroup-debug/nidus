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

const optionStopWords = new Set([
  "when",
  "what",
  "which",
  "where",
  "how",
  "does",
  "your",
  "you",
  "usually",
  "naturally",
  "first",
  "before",
  "after",
  "with",
  "into",
  "from",
  "that",
  "this",
  "there",
  "their",
  "becomes",
  "important",
  "situation"
]);

function optionFocus(questionText: string) {
  const cleaned = questionText.toLowerCase();
  if (cleaned.includes("information") && cleaned.includes("incomplete")) return "incomplete facts";
  if (cleaned.includes("confused")) return "group confusion";
  if (cleaned.includes("ownership")) return "ownership gap";
  if (cleaned.includes("quieter")) return "quiet member";
  if (cleaned.includes("teammate") && cleaned.includes("weak")) return "weak teammate";
  if (cleaned.includes("disagree")) return "disagreement";
  if (cleaned.includes("suggestion")) return "ignored suggestion";
  if (cleaned.includes("phone") || cleaned.includes("distract")) return "digital distraction";
  if (cleaned.includes("routine")) return "routine break";
  if (cleaned.includes("deadline")) return "missed deadline";
  if (cleaned.includes("team") && cleaned.includes("confidence")) return "team confidence";
  if (cleaned.includes("goal")) return "goal clarity";
  if (cleaned.includes("future")) return "future plan";
  if (cleaned.includes("pressure")) return "pressure moment";
  if (cleaned.includes("fitness") || cleaned.includes("training") || cleaned.includes("stamina")) return "training challenge";
  if (cleaned.includes("speak") || cleaned.includes("voice") || cleaned.includes("communicate")) return "speaking moment";

  const words = cleaned
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !optionStopWords.has(word));
  return words.slice(0, 2).join(" ") || "the moment";
}

const dimensionOptionChoices: Partial<Record<Dimension, string[][]>> = {
  leadership: [
    ["Organize the group", "Clarify first step", "Support another lead", "Wait silently"],
    ["Take ownership", "Share responsibility", "Wait for seniors", "Avoid pressure"],
    ["Speak clearly", "Pick right moment", "Keep idea inside", "Withdraw"],
    ["Lift morale", "Set small target", "Stay in my role", "Lose energy"],
    ["Accept quickly", "Ask key details", "Need backup", "Feel overwhelmed"]
  ],
  discipline: [
    ["Restart today", "Do a smaller target", "Wait for motivation", "Lose more time"],
    ["Keep full effort", "Do only required", "Need reminders", "Quality drops"],
    ["Recover the day", "Do short training", "Excuse the day", "Skip routine"],
    ["Continue quietly", "Make it measurable", "Need excitement", "Stop midway"],
    ["Own and fix it", "Inform and replan", "Feel stuck", "Hide the delay"]
  ],
  focus: [
    ["Stay locked in", "Reset attention", "Drift slowly", "Quit early"],
    ["Keep phone away", "Use time blocks", "Check sometimes", "Keep scrolling"],
    ["Start one part", "Break into pieces", "Delay it", "Avoid fully"],
    ["Return fast", "Take short reset", "Need external push", "Keep drifting"],
    ["Pick priority", "Make order list", "Jump between tasks", "Leave all pending"]
  ],
  confidence: [
    ["Speak confidently", "Speak with nerves", "Say very little", "Avoid eye contact"],
    ["Answer calmly", "Explain with proof", "Doubt myself", "Become defensive"],
    ["Correct openly", "Recover quietly", "Feel embarrassed", "Give up"],
    ["Speak anyway", "Use simple points", "Stay silent", "Panic"],
    ["Learn from them", "Compete calmly", "Feel smaller", "Stop trying"]
  ],
  pressure: [
    ["Take action", "Stabilize first", "Freeze briefly", "Follow crowd"],
    ["Find next option", "Review facts", "Need direction", "Lose control"],
    ["Stay composed", "Explain facts", "React emotionally", "Carry anger"],
    ["Decide with facts", "Ask key questions", "Wait longer", "Avoid decision"],
    ["Move through fear", "Use preparation", "Need reassurance", "Step back"]
  ],
  future: [
    ["Explain clearly", "Explain roughly", "Still confused", "Change often"],
    ["Do today's task", "Review plan", "Only think about it", "Lose interest"],
    ["Stay committed", "Use doubt as fuel", "Question myself", "Drop the path"],
    ["Build routine", "Start again", "Stay inconsistent", "Only dream"],
    ["Choose progress", "Balance both", "Choose comfort", "Avoid choice"]
  ],
  teamwork: [
    ["Calm the group", "Find common point", "Stay away", "Argue back"],
    ["Invite them", "Mention their idea", "Ignore it", "Dominate"],
    ["Help patiently", "Give small role", "Avoid them", "Get irritated"],
    ["Stay useful", "Try once more", "Feel rejected", "Stop helping"],
    ["Encourage team", "Reduce tension", "Focus only on me", "Spread stress"]
  ],
  emotional: [
    ["Listen calmly", "Take useful part", "Feel hurt", "React fast"],
    ["Control response", "Pause briefly", "Suppress it", "Burst out"],
    ["Adapt quickly", "Replan slowly", "Get disturbed", "Resist change"],
    ["Recover soon", "Laugh and move", "Think for hours", "Avoid people"],
    ["Use routine", "Talk and reset", "Bottle it up", "Break down"]
  ],
  fitness: [
    ["Push safely", "Slow and continue", "Complain inside", "Stop early"],
    ["Start warm-up", "Do light session", "Skip today", "Break routine"],
    ["Train gradually", "Track progress", "Feel ashamed", "Avoid comparison"],
    ["Resume next day", "Do make-up work", "Lose streak", "Quit week"],
    ["Check and continue", "Adjust intensity", "Fear injury", "Stop fully"]
  ],
  communication: [
    ["Keep it clear", "Use examples", "Speak too much", "Stay unclear"],
    ["Re-explain simply", "Check their doubt", "Blame them", "Get irritated"],
    ["Speak respectfully", "Use logic", "Force opinion", "Stay passive"],
    ["Keep voice steady", "Slow down", "Lose clarity", "Go silent"],
    ["Correct politely", "Speak privately", "Sound harsh", "Avoid correction"]
  ],
  reasoning: [
    ["Compare options", "Pick practical one", "Get confused", "Copy others"],
    ["Decide with facts", "Ask key questions", "Wait longer", "Avoid decision"],
    ["Try another route", "Study facts again", "Need someone", "Stop trying"],
    ["List steps", "Set sequence", "Start randomly", "Delay planning"],
    ["Simplify it", "Find root cause", "Get tense", "Add confusion"]
  ],
  careerFit: [
    ["Leadership role", "Technical role", "Field action", "Still exploring"],
    ["Action pathway", "Tech pathway", "Aviation pathway", "Leadership pathway"],
    ["Accept discipline", "Adjust slowly", "Feel restricted", "Resist rules"],
    ["Match strengths", "Ask counselling", "Follow trend", "No clarity"],
    ["High responsibility", "Team operations", "Technical challenge", "Comfort zone"]
  ],
  serviceMindset: [
    ["Choose duty", "Balance both", "Need push", "Choose comfort"],
    ["Daily discipline", "Service pride", "Only status", "Not sure"],
    ["See purpose", "Adjust gradually", "Feel pressure", "Reject it"],
    ["Accept sacrifice", "Think deeply", "Need motivation", "Avoid sacrifice"],
    ["Step forward", "Support team", "Wait for others", "Stay back"]
  ],
  dreamDrive: [
    ["Dream wins", "Fight back", "Distraction wins", "Lose control"],
    ["Guides my day", "Guides sometimes", "Only in mood", "Rarely matters"],
    ["Block them", "Limit them", "Fall often", "Give in"],
    ["Act immediately", "Note one task", "Just feel inspired", "Forget later"],
    ["Protect time", "Schedule it", "Use leftover time", "Waste it"]
  ]
};

function buildOptions(_assessment: SeedAssessment, dimension: Dimension, questionIndex: number) {
  const questionText = dimensionQuestions[dimension][questionIndex] ?? dimensionLabels[dimension];
  const directChoices = dimensionOptionChoices[dimension]?.[questionIndex];
  if (directChoices) return directChoices;

  const focus = optionFocus(questionText);
  const variants = [
    [
      `I take direct responsibility for ${focus} and move the situation forward.`,
      `I pause, read ${focus}, and create a small practical plan.`,
      `I ask for support before handling ${focus} with confidence.`,
      `I avoid ${focus} until pressure or discomfort reduces.`
    ],
    [
      `I step in early and organize the next action around ${focus}.`,
      `I stay calm, understand ${focus}, and then respond clearly.`,
      `I need more time or guidance before dealing with ${focus}.`,
      `I lose rhythm when ${focus} becomes uncomfortable.`
    ],
    [
      `I convert ${focus} into a useful action without waiting too long.`,
      `I break ${focus} into simple steps and follow the next step.`,
      `I depend on someone else to guide me through ${focus}.`,
      `I delay action and hope ${focus} settles by itself.`
    ],
    [
      `I choose the responsible action even when ${focus} feels difficult.`,
      `I keep control, think through ${focus}, and respond steadily.`,
      `I can handle ${focus} only after reassurance or extra time.`,
      `I withdraw when ${focus} becomes stressful.`
    ],
    [
      `I face ${focus} quickly and try to improve the outcome.`,
      `I make a clear mini-plan for ${focus} before acting.`,
      `I look for help because ${focus} lowers my confidence.`,
      `I postpone ${focus} and return only when it feels easier.`
    ]
  ];

  return variants[questionIndex % variants.length];
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
