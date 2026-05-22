import type { PsychometricQuestion, PsychometricResult, PsychometricTest } from "@/types/psychometric";

export type NidusAssessmentDimension = "leadership" | "discipline" | "confidence" | "pressure" | "focus" | "future" | "teamwork" | "emotional";

export type NidusQuestionSignal = {
  questionId: string;
  order: number;
  dimension: NidusAssessmentDimension;
  trait: string;
  aiPrompt: string;
  choices: string[];
};

export type NidusGeneratedReport = {
  score: number;
  level: string;
  simpleMeaning: string;
  dimensionScores?: Array<{ dimension: string; label: string; score: number; answered: number; total: number }>;
  strengths: string[];
  improvementAreas: string[];
  behaviourPattern: string;
  officerReadinessSignal: string;
  parentSummary: string;
  counsellorSummary?: string;
  recommendedNextTest: string;
  recommendedGuruQuest: string;
  counsellingAction: string;
  sevenDayActionPlan?: string[];
  answerSignals: Array<{
    question: string;
    answer: string;
    dimension: string;
    dimensionLabel?: string;
    score?: number;
    interpretation: string;
  }>;
};

const genericOptions = new Set(["strongly agree", "agree", "neutral", "disagree", "strongly disagree", "yes", "no", "sometimes"]);

const contextualChoiceBank = {
  leadership: [
    "I take command, create a small plan, and move first.",
    "I bring the group together and assign clear responsibilities.",
    "I support the strongest person and help the team stay steady.",
    "I wait for direction because I do not want to disturb the group."
  ],
  discipline: [
    "I restart the routine quickly without making it dramatic.",
    "I reduce the target and protect consistency for the day.",
    "I wait for motivation before returning fully.",
    "I feel guilty and lose more time before acting."
  ],
  confidence: [
    "I speak clearly even if my answer is not perfect.",
    "I prepare my points and then participate with control.",
    "I stay quiet unless I am directly asked.",
    "I avoid the moment because I fear being judged."
  ],
  pressure: [
    "I choose the harder correct action when it protects the mission.",
    "I slow down, judge the facts, and take the next clean step.",
    "I delay the decision until the pressure reduces.",
    "I follow the group even when I am unsure."
  ],
  focus: [
    "I protect one important task and remove distractions.",
    "I work in short blocks and rebuild attention gradually.",
    "I keep checking my phone while promising to restart soon.",
    "I switch tasks whenever the work starts feeling difficult."
  ],
  future: [
    "I convert the goal into a daily action immediately.",
    "I write the goal and review it when my routine slips.",
    "I think about the future often but act inconsistently.",
    "I change goals when distractions become stronger."
  ],
  teamwork: [
    "I listen first, then add a practical suggestion.",
    "I help quieter members contribute to the group.",
    "I focus only on my role and avoid group friction.",
    "I become impatient when others slow the task down."
  ],
  emotional: [
    "I notice the emotion and still choose the useful action.",
    "I take a short pause before responding.",
    "I hide the emotion but carry it for a long time.",
    "I react quickly and understand the damage later."
  ]
} satisfies Record<string, string[]>;

const keywordThemes: Array<[string, keyof typeof contextualChoiceBank]> = [
  ["leader", "leadership"],
  ["team", "teamwork"],
  ["group", "teamwork"],
  ["discipline", "discipline"],
  ["routine", "discipline"],
  ["habit", "discipline"],
  ["confiden", "confidence"],
  ["speak", "confidence"],
  ["pressure", "pressure"],
  ["stress", "emotional"],
  ["emotion", "emotional"],
  ["focus", "focus"],
  ["distract", "focus"],
  ["future", "future"],
  ["goal", "future"],
  ["career", "future"]
];

const traitCopy: Record<NidusAssessmentDimension, string> = {
  leadership: "command style and initiative",
  discipline: "routine discipline and execution",
  confidence: "communication confidence",
  pressure: "decision-making under pressure",
  focus: "attention control and distraction resistance",
  future: "goal seriousness and direction",
  teamwork: "social adaptability and group behaviour",
  emotional: "emotional control and recovery"
};

const nextTestByDimension: Record<NidusAssessmentDimension, string> = {
  leadership: "Leadership DNA Test",
  discipline: "Discipline Index",
  confidence: "Confidence Index",
  pressure: "SSB Psychology Simulator",
  focus: "Focus Strength Index",
  future: "Defence Career Fit Test",
  teamwork: "Teamwork & Group Dynamics Test",
  emotional: "Emotional Stability Index"
};

const guruQuestByDimension: Record<NidusAssessmentDimension, string> = {
  leadership: "Student Power",
  discipline: "Life OS",
  confidence: "Confidence Sprint",
  pressure: "Warrior Discipline",
  focus: "Focus Reset",
  future: "Future Direction",
  teamwork: "Communication Quest",
  emotional: "Mind Calm Protocol"
};

export function nidusQuestionPrompt(question: PsychometricQuestion, test: PsychometricTest) {
  const signal = nidusQuestionSignal(question, test);
  return `I am reading your ${signal.trait}. Answer naturally; there is no need to impress me.`;
}

function hasGenericOptions(options: string[]) {
  return options.every((option) => genericOptions.has(option.trim().toLowerCase()));
}

export function nidusAnswerChoices(question: PsychometricQuestion) {
  const options = Array.isArray(question.options) ? question.options.filter(Boolean) : [];
  const uniqueOptions = Array.from(new Set(options.map((option) => option.trim()).filter(Boolean)));

  if (uniqueOptions.length >= 2 && !hasGenericOptions(uniqueOptions)) return uniqueOptions;
  const theme = inferDimension(question);
  const choices = contextualChoiceBank[theme];
  return choices.map((choice, index) => {
    const scenarioNote = `Scenario ${question.order}`;
    if (index === 0) return `${choice} ${scenarioNote}: this is my strongest natural response.`;
    if (index === 1) return `${choice} ${scenarioNote}: this fits me when the situation is serious.`;
    if (index === 2) return `${choice} ${scenarioNote}: this is the pattern I want to improve.`;
    return `${choice} ${scenarioNote}: this happens when my preparation is weak.`;
  });
}

function inferDimension(question: PsychometricQuestion): NidusAssessmentDimension {
  const text = question.questionText.toLowerCase();
  const matchedTheme = keywordThemes.find(([keyword]) => text.includes(keyword))?.[1];
  const fallbackThemes = Object.keys(contextualChoiceBank) as NidusAssessmentDimension[];
  return matchedTheme ?? fallbackThemes[(Math.max(question.order, 1) - 1) % fallbackThemes.length];
}

export function nidusQuestionSignal(question: PsychometricQuestion, test: PsychometricTest): NidusQuestionSignal {
  const dimension = inferDimension(question);
  const testPrefix = test.type === "OLQ" ? "Officer-like quality" : test.type === "SRT" ? "Situation response" : test.type === "TAT" ? "Story-thinking" : "Behaviour pattern";

  return {
    questionId: question.id,
    order: question.order,
    dimension,
    trait: traitCopy[dimension],
    aiPrompt: `${testPrefix}: NIDUS AI is checking ${traitCopy[dimension]}.`,
    choices: nidusAnswerChoices(question)
  };
}

export function nidusAssessmentStructure(test: PsychometricTest) {
  const questions = test.questions ?? [];
  return {
    testId: test.id,
    title: test.title,
    optional: true,
    dimensions: Array.from(new Set(questions.map((question) => inferDimension(question)))),
    profileConnection: ["digital profile", "assessment report", "NIDUS Guru recommendation", "counselling next action"],
    questionSignals: questions.map((question) => nidusQuestionSignal(question, test))
  };
}

export function nidusPlatformGuidance(test?: PsychometricTest | null) {
  if (!test) return "I can guide assessments, reports, Guru quests, digital profile signals, and counselling next steps from one place.";
  return `I will conduct ${test.title}, interpret the pattern, and guide the next action for your defence profile.`;
}

export function nidusOptionalGuidance(profileAccuracy: number) {
  if (profileAccuracy >= 70) return "Your profile already has useful signals. You can continue now or skip this test and still receive guidance.";
  if (profileAccuracy >= 35) return "This test is optional, but completing it will make your NIDUS AI guidance sharper.";
  return "You can skip for now, but this test will improve your digital profile accuracy and final interpretation.";
}

export function nidusProfileAccuracy(answeredCount: number, totalQuestions: number) {
  if (!totalQuestions) return 0;
  return Math.min(100, Math.round((answeredCount / totalQuestions) * 100));
}

export function nidusFinalInterpretation(data: PsychometricResult) {
  const score = data.attempt.score;
  const base = score >= 80
    ? "Your result shows a strong readiness signal. The next step is to convert this strength into consistent training behaviour."
    : score >= 60
      ? "Your result shows developing potential. You are not far away; the main requirement is sharper consistency and guided practice."
      : "Your result shows a foundation stage. This is useful because it clearly shows where NIDUS should guide you first.";

  const recommendation = data.recommendations[0] ?? "Complete the next recommended assessment and save this report to your profile.";
  return `${base} NIDUS AI recommends: ${recommendation}`;
}

function scoreLevel(score: number) {
  if (score >= 85) return "Strong officer signal";
  if (score >= 70) return "Developing officer potential";
  if (score >= 50) return "Foundation stage";
  return "Needs guided support";
}

function scoreMeaning(score: number) {
  if (score >= 85) return "You already show strong readiness signals. The priority now is consistency, pressure practice, and leadership exposure.";
  if (score >= 70) return "You have visible potential, but the result suggests some habits still need structure and repeated practice.";
  if (score >= 50) return "You are building the base. With the right routine and guidance, this can improve steadily.";
  return "This result is an early diagnostic. It helps NIDUS identify where guidance should begin.";
}

function interpretationForAnswer(answer: string, dimension: NidusAssessmentDimension) {
  const lower = answer.toLowerCase();
  if (lower.includes("strongest") || lower.includes("take command") || lower.includes("protect") || lower.includes("restart")) {
    return `Strong signal in ${traitCopy[dimension]}. This answer suggests action orientation.`;
  }
  if (lower.includes("improve") || lower.includes("wait") || lower.includes("quiet") || lower.includes("delay")) {
    return `Development signal in ${traitCopy[dimension]}. This area should be trained through guided missions.`;
  }
  return `Balanced signal in ${traitCopy[dimension]}. NIDUS AI will compare this with other answers for a clearer pattern.`;
}

export function nidusGenerateReport(data: PsychometricResult): NidusGeneratedReport {
  if (data.report) return data.report;

  const answered = data.attempt.answers.filter((answer) => answer.answerText || answer.selectedOption);
  const signals = answered.map((answer) => {
    const dimension = inferDimension(answer.question);
    const selectedAnswer = answer.selectedOption ?? answer.answerText ?? "No response captured";
    return {
      question: answer.question.questionText,
      answer: selectedAnswer,
      dimension,
      interpretation: interpretationForAnswer(selectedAnswer, dimension)
    };
  });
  const dimensionCounts = signals.reduce<Record<NidusAssessmentDimension, number>>((acc, signal) => {
    acc[signal.dimension] = (acc[signal.dimension] ?? 0) + 1;
    return acc;
  }, {} as Record<NidusAssessmentDimension, number>);
  const dominantDimension = (Object.entries(dimensionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as NidusAssessmentDimension | undefined) ?? "discipline";
  const score = Math.round(data.scoring?.score ?? data.attempt.score);
  const recommendations = data.recommendations.length ? data.recommendations : ["Complete one more assessment to sharpen your profile."];
  const backendStrongest = data.scoring?.strongestDimensions?.map((item) => `${item.label}: ${item.score}/100`) ?? [];
  const backendWeakest = data.scoring?.weakestDimensions?.map((item) => `${item.label}: ${item.score}/100`) ?? [];

  return {
    score,
    level: data.scoring?.readinessBand ?? scoreLevel(score),
    simpleMeaning: scoreMeaning(score),
    strengths: [
      backendStrongest.length ? `Strongest dimensions: ${backendStrongest.join(", ")}.` : `Primary signal: ${traitCopy[dominantDimension]}.`,
      recommendations[0],
      data.scoring ? `Quality score ${data.scoring.qualityScore}/100 with ${data.scoring.completionScore}% completion.` : score >= 70 ? "The result shows usable readiness for guided advancement." : "The result gives a clear starting point for improvement."
    ],
    improvementAreas: [
      backendWeakest.length ? `Development dimensions: ${backendWeakest.join(", ")}.` : `Build repeatable practice around ${traitCopy[dominantDimension]}.`,
      "Complete related assessments to improve report accuracy.",
      "Follow one NIDUS Guru mission for the next 7 days."
    ],
    behaviourPattern: data.scoring ? `NIDUS AI scored ${data.scoring.answered}/${data.scoring.totalQuestions} responses across dimension-wise readiness signals.` : `Your answers currently point most strongly toward ${traitCopy[dominantDimension]}. NIDUS AI will refine this as more assessments are completed.`,
    officerReadinessSignal: score >= 70 ? "Positive officer-readiness signal with scope for structured sharpening." : "Early officer-readiness signal that needs routine, confidence, and guided practice.",
    parentSummary: `The student has completed ${answered.length} response${answered.length === 1 ? "" : "s"} in ${data.attempt.test.title}. The current score is ${score}, which indicates ${scoreLevel(score).toLowerCase()}. The next step is structured practice, one related assessment, and counselling review if needed.`,
    recommendedNextTest: nextTestByDimension[dominantDimension],
    recommendedGuruQuest: guruQuestByDimension[dominantDimension],
    counsellingAction: score >= 70 ? "Book a review to convert this strength into a defence pathway plan." : "Book counselling to identify the first improvement mission and assessment path.",
    answerSignals: signals
  };
}
