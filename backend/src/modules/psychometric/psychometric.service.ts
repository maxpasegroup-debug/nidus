import PDFDocument from "pdfkit";
import { prisma } from "../../config/prisma.js";
import type { Prisma, Role } from "../../generated/prisma/client.js";
import { ensurePsychometricAssessments } from "../../scripts/psychometric-assessments.js";
import { psychometricAiService } from "./psychometric-ai.service.js";

type SubmitAnswer = {
  questionId: string;
  answerText?: string;
  selectedOption?: string;
};

type QuestionForScoring = {
  id: string;
  testId: string;
  options: unknown;
};

type DimensionScore = {
  dimension: string;
  label: string;
  score: number;
  answered: number;
  total: number;
};

type ScoringResult = ReturnType<typeof buildScoring>;
type AssessmentAccess = "FREE" | "CORE" | "PREMIUM";
type PublicScoring = ReturnType<typeof publicScoring>;
type StructuredReport = ReturnType<typeof buildStructuredReport>;

const includeQuestions = {
  questions: { orderBy: { order: "asc" as const } }
};

const attemptGraceMinutes = 15;
const maxStartsPerHour = 8;
let psychometricSeedPromise: Promise<unknown> | null = null;

const assessmentAccess: Record<string, AssessmentAccess> = {
  "officer-readiness": "FREE",
  "defence-career-fit": "FREE",
  "discipline-index": "FREE",
  "focus-strength": "FREE",
  "leadership-dna": "FREE",
  "dream-addiction-index": "FREE",
  "olq-analyzer": "CORE",
  "confidence-index": "CORE",
  "defence-mindset-scan": "CORE",
  "emotional-stability": "CORE",
  "command-communication": "CORE",
  "teamwork-group-dynamics": "CORE",
  "future-readiness": "CORE",
  "warrior-fitness-mindset": "CORE",
  "ssb-psychology-simulator": "PREMIUM"
};

async function ensureSeededPsychometricCatalog() {
  if (!psychometricSeedPromise) {
    psychometricSeedPromise = ensurePsychometricAssessments().finally(() => {
      psychometricSeedPromise = null;
    });
  }
  await psychometricSeedPromise;
}

const olqKeys = [
  "effectiveIntelligence",
  "reasoningAbility",
  "organizingAbility",
  "socialAdaptability",
  "cooperation",
  "senseOfResponsibility",
  "initiative",
  "selfConfidence",
  "speedOfDecision",
  "abilityToInfluence",
  "liveliness",
  "determination",
  "courage",
  "stamina",
  "emotionalStability"
] as const;

const dimensionLabels: Record<string, string> = {
  leadership: "Leadership",
  discipline: "Discipline",
  focus: "Focus",
  confidence: "Confidence",
  pressure: "Pressure Handling",
  future: "Future Readiness",
  teamwork: "Teamwork",
  emotional: "Emotional Stability",
  fitness: "Physical Mindset",
  communication: "Communication",
  reasoning: "Reasoning",
  careerFit: "Career Fit",
  serviceMindset: "Service Mindset",
  dreamDrive: "Dream Drive"
};

const olqDimensionMap: Partial<Record<keyof typeof dimensionLabels, (typeof olqKeys)[number][]>> = {
  leadership: ["initiative", "abilityToInfluence", "organizingAbility"],
  discipline: ["determination", "senseOfResponsibility", "stamina"],
  focus: ["effectiveIntelligence", "reasoningAbility", "determination"],
  confidence: ["selfConfidence", "liveliness", "courage"],
  pressure: ["speedOfDecision", "courage", "emotionalStability"],
  future: ["determination", "senseOfResponsibility", "initiative"],
  teamwork: ["cooperation", "socialAdaptability", "abilityToInfluence"],
  emotional: ["emotionalStability", "selfConfidence", "liveliness"],
  fitness: ["stamina", "determination", "courage"],
  communication: ["abilityToInfluence", "socialAdaptability", "selfConfidence"],
  reasoning: ["effectiveIntelligence", "reasoningAbility", "organizingAbility"],
  careerFit: ["effectiveIntelligence", "organizingAbility", "senseOfResponsibility"],
  serviceMindset: ["senseOfResponsibility", "courage", "stamina"],
  dreamDrive: ["determination", "initiative", "stamina"]
};

const nextTestByDimension: Record<string, string> = {
  leadership: "Leadership DNA Test",
  discipline: "Discipline Index",
  focus: "Focus Strength Index",
  confidence: "Confidence Index",
  pressure: "SSB Psychology Simulator",
  future: "Future Readiness Index",
  teamwork: "Teamwork & Group Dynamics Test",
  emotional: "Emotional Stability Index",
  fitness: "Warrior Fitness Mindset",
  communication: "Command Communication Index",
  reasoning: "OLQ Analyzer",
  careerFit: "Defence Career Fit Test",
  serviceMindset: "Defence Mindset Scan",
  dreamDrive: "Dream Addiction Index"
};

const guruQuestByDimension: Record<string, string> = {
  leadership: "Student Power",
  discipline: "Life OS",
  focus: "Focus Reset",
  confidence: "Confidence Sprint",
  pressure: "Warrior Discipline",
  future: "Future Direction",
  teamwork: "Communication Quest",
  emotional: "Mind Calm Protocol",
  fitness: "Fitness & Energy",
  communication: "Social & Communication",
  reasoning: "Student Power",
  careerFit: "Future & Career",
  serviceMindset: "Warrior Discipline",
  dreamDrive: "Dream Addiction"
};

const staffResultRoles: Role[] = ["ADMIN", "DIRECTOR"];

function camelDimension(value: string) {
  return value.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function dimensionFromQuestion(question: Pick<QuestionForScoring, "id" | "testId">) {
  const withoutTest = question.id.startsWith(`${question.testId}-`) ? question.id.slice(question.testId.length + 1) : question.id;
  const withoutIndex = withoutTest.replace(/-\d+$/, "");
  return camelDimension(withoutIndex);
}

function normalizeOptions(options: unknown) {
  return Array.isArray(options) ? options.map((option) => String(option)) : [];
}

function answerValue(answer: SubmitAnswer) {
  return answer.selectedOption ?? answer.answerText ?? "";
}

function scoreAnswer(answer: SubmitAnswer, question?: QuestionForScoring) {
  const selected = answerValue(answer).trim();
  if (!selected) return 0;
  const options = normalizeOptions(question?.options);
  const optionIndex = options.findIndex((option) => option.trim() === selected);
  if (optionIndex >= 0) return [10, 8, 5, 2][optionIndex] ?? 4;
  return Math.min(8, Math.max(5, Math.round(selected.length / 18)));
}

function readinessBand(score: number) {
  if (score >= 85) return "Strong officer signal";
  if (score >= 70) return "Developing officer potential";
  if (score >= 50) return "Foundation stage";
  return "Needs guided support";
}

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function buildScoring(answers: SubmitAnswer[], questions: QuestionForScoring[]) {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const totalQuestions = questions.length;
  const answeredRows = answers
    .map((answer) => {
      const question = questionMap.get(answer.questionId);
      const score = scoreAnswer(answer, question);
      const dimension = question ? dimensionFromQuestion(question) : "general";
      return { answer, question, score, dimension };
    })
    .filter((row) => row.score > 0);
  const answered = answeredRows.length;
  const qualityScore = answered ? Math.round((answeredRows.reduce((sum, row) => sum + row.score, 0) / answered) * 10) : 0;
  const completionScore = totalQuestions ? Math.round((answered / totalQuestions) * 100) : 0;
  const overallScore = Math.min(100, Math.round(qualityScore * 0.85 + completionScore * 0.15));

  const allDimensions = Array.from(new Set(questions.map((question) => dimensionFromQuestion(question))));
  const dimensionScores: DimensionScore[] = allDimensions.map((dimension) => {
    const total = questions.filter((question) => dimensionFromQuestion(question) === dimension).length;
    const rows = answeredRows.filter((row) => row.dimension === dimension);
    return {
      dimension,
      label: dimensionLabels[dimension] ?? dimension,
      score: rows.length ? Math.round((rows.reduce((sum, row) => sum + row.score, 0) / rows.length) * 10) : 0,
      answered: rows.length,
      total
    };
  });
  const riskIndicators = dimensionScores.filter((item) => item.score > 0 && item.score < 55).map((item) => item.label);
  const strongestDimensions = [...dimensionScores].filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  const weakestDimensions = [...dimensionScores].filter((item) => item.score > 0).sort((a, b) => a.score - b.score).slice(0, 3);

  return {
    score: overallScore,
    qualityScore,
    completionScore,
    answered,
    totalQuestions,
    readinessBand: readinessBand(overallScore),
    dimensionScores,
    riskIndicators,
    strongestDimensions,
    weakestDimensions,
    answerRows: answeredRows
  };
}

function normalizeAccess(value?: string | null): AssessmentAccess | null {
  return value === "FREE" || value === "CORE" || value === "PREMIUM" ? value : null;
}

function accessForTest(testId: string, storedAccess?: string | null): AssessmentAccess {
  return normalizeAccess(storedAccess) ?? assessmentAccess[testId] ?? "CORE";
}

function expiryForAttempt(attempt: { startedAt: Date; test: { duration: number } }) {
  return new Date(attempt.startedAt.getTime() + (attempt.test.duration + attemptGraceMinutes) * 60 * 1000);
}

function isAttemptExpired(attempt: { startedAt: Date; test: { duration: number } }) {
  return Date.now() > expiryForAttempt(attempt).getTime();
}

function roleBypass(role?: Role) {
  return role === "ADMIN" || role === "DIRECTOR";
}

function assertAssessmentAccess(role: Role | undefined, test: { id: string; access?: string | null; isActive?: boolean }) {
  if (roleBypass(role)) return;
  if (test.isActive === false) throw new Error("Assessment is currently inactive.");
  accessForTest(test.id, test.access);
}

async function assertStartRateLimit(userId: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentStarts = await prisma.psychometricAttempt.count({ where: { userId, startedAt: { gte: since } } });
  if (recentStarts >= maxStartsPerHour) throw new Error("Too many assessment starts. Please wait before starting another assessment.");
}

function integritySignalsForAttempt(
  attempt: {
    startedAt: Date;
    completedAt?: Date | null;
    answers: Array<{ answerText?: string | null; selectedOption?: string | null }>;
    test: { duration: number };
  },
  scoring: ScoringResult
) {
  const signals: string[] = [];
  const elapsedSeconds = attempt.completedAt ? Math.round((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000) : 0;
  const completionFloorSeconds = Math.max(90, scoring.totalQuestions * 4);

  if (scoring.completionScore < 60) signals.push(`Low completion signal: ${scoring.answered}/${scoring.totalQuestions} answered.`);
  if (elapsedSeconds > 0 && elapsedSeconds < completionFloorSeconds) signals.push(`Fast completion signal: completed in ${Math.round(elapsedSeconds / 60)} minute(s).`);

  const normalizedAnswers = attempt.answers
    .map((answer) => (answer.selectedOption ?? answer.answerText ?? "").trim())
    .filter(Boolean);
  const answerCounts = new Map<string, number>();
  for (const answer of normalizedAnswers) answerCounts.set(answer, (answerCounts.get(answer) ?? 0) + 1);
  const mostRepeated = Math.max(0, ...Array.from(answerCounts.values()));
  const repeatRatio = normalizedAnswers.length ? mostRepeated / normalizedAnswers.length : 0;
  if (normalizedAnswers.length >= 10 && repeatRatio >= 0.8) signals.push("Repeated answer pattern detected. Review may be needed before high-stakes counselling.");

  if (!signals.length) signals.push("No major response-integrity concern detected.");
  return signals;
}

function olqDataFromDimensions(dimensionScores: DimensionScore[]) {
  const base: Partial<Record<(typeof olqKeys)[number], number>> = {};
  for (const key of olqKeys) base[key] = 55;

  for (const dimensionScore of dimensionScores) {
    const keys = olqDimensionMap[dimensionScore.dimension as keyof typeof dimensionLabels] ?? [];
    for (const key of keys) {
      base[key] = Math.max(base[key] ?? 55, Math.max(40, Math.min(95, dimensionScore.score)));
    }
  }

  return base as Record<(typeof olqKeys)[number], number>;
}

function meaningForScore(score: number) {
  if (score >= 85) return "The student shows a strong readiness signal. The priority is now consistency, pressure practice, and leadership exposure.";
  if (score >= 70) return "The student shows developing officer potential with clear strengths and trainable improvement areas.";
  if (score >= 50) return "The student is at foundation stage. The result gives a practical starting point for habit, confidence, and focus building.";
  return "The student needs guided support. This result is useful because it identifies where NIDUS should begin intervention.";
}

function percentileContext(score: number) {
  if (score >= 90) return "Top readiness band: comparable to a highly prepared aspirant profile inside the NIDUS benchmark model.";
  if (score >= 80) return "High readiness band: stronger than the typical foundation-stage aspirant profile.";
  if (score >= 65) return "Developing band: shows useful readiness signals, but consistency and pressure practice decide progress.";
  if (score >= 50) return "Foundation band: the profile is trainable and needs a structured routine before high-pressure evaluation.";
  return "Support band: the student should begin with guided habits, confidence building, and mentor review.";
}

function reportConfidence(scoring: ScoringResult) {
  if (scoring.completionScore >= 90 && scoring.answered >= 30 && scoring.qualityScore >= 70) {
    return "High confidence: enough responses were captured for dependable counselling and training guidance.";
  }
  if (scoring.completionScore >= 70 && scoring.answered >= 20) {
    return "Moderate confidence: the report is useful, but one more assessment or mentor review will sharpen the profile.";
  }
  return "Early confidence: use this as a starting signal and improve accuracy by completing more responses.";
}

function executiveSummaryFor(attemptTitle: string, scoring: ScoringResult, strongest: DimensionScore[], weakest: DimensionScore[]) {
  const strongestText = strongest.length ? strongest.map((item) => item.label).join(", ") : "not enough completed signals";
  const weakestText = weakest.length ? weakest.map((item) => item.label).join(", ") : "not enough completed signals";
  return `${attemptTitle} produced a ${scoring.readinessBand.toLowerCase()} with ${scoring.score}/100 overall readiness. Strongest visible signals: ${strongestText}. Main development focus: ${weakestText}. This is an educational guidance report for training, counselling, and pathway planning.`;
}

function dimensionInsights(scores: DimensionScore[]) {
  return scores.map((item) => ({
    dimension: item.dimension,
    label: item.label,
    score: item.score,
    interpretation: item.score >= 80
      ? `${item.label} is a strong signal. The student should protect this through harder practice and leadership exposure.`
      : item.score >= 65
        ? `${item.label} is developing well. The next requirement is consistent repetition under time and pressure.`
        : item.score >= 50
          ? `${item.label} is at foundation level. This needs simple routines, feedback, and weekly review.`
          : `${item.label} needs guided intervention before this becomes a dependable readiness signal.`,
    action: item.score >= 75
      ? `Use ${item.label.toLowerCase()} in group tasks, interviews, and daily accountability.`
      : `Train ${item.label.toLowerCase()} through one measurable daily mission and mentor feedback.`
  }));
}

function planFromFocus(guruQuest: string, nextTest: string, development?: DimensionScore) {
  const focus = development?.label ?? "readiness";
  return {
    thirtyDayPlan: [
      `Week 1: Start ${guruQuest} and set one daily habit connected to ${focus}.`,
      "Week 2: Add timed study, physical discipline, and one communication task every alternate day.",
      `Week 3: Take practice situations linked to ${nextTest} and review weak responses with a mentor.`,
      "Week 4: Repeat the assessment or complete the next recommended test to compare improvement."
    ],
    ninetyDayPlan: [
      "Month 1: Build routine stability, distraction control, and basic confidence through daily missions.",
      "Month 2: Add pressure practice, group discussion exposure, interview speaking, and fitness consistency.",
      "Month 3: Review trend reports, complete the recommended assessment chain, and prepare a pathway counselling plan."
    ]
  };
}

function riskReviewFor(scoring: ScoringResult, integritySignals: string[]) {
  const review = [
    scoring.riskIndicators.length
      ? `Low-score dimensions requiring review: ${scoring.riskIndicators.join(", ")}.`
      : "No critical low-score dimension was detected from the answered items.",
    scoring.completionScore < 80
      ? "Completion is below the ideal benchmark, so conclusions should be treated as provisional."
      : "Completion level supports a useful training interpretation.",
    integritySignals.some((signal) => !signal.toLowerCase().includes("no major"))
      ? "Response integrity needs mentor review before using this report for high-stakes counselling."
      : "Response integrity does not show a major concern."
  ];
  return review;
}

function parentGuidanceFor(scoring: ScoringResult, development?: DimensionScore) {
  const focus = development?.label ?? "discipline, confidence, and focus";
  return [
    `Discuss ${focus} calmly with the student and convert it into one weekly routine target.`,
    "Avoid comparing the score with other students; compare only with the student's next retake trend.",
    "Encourage sleep, study rhythm, physical activity, and distraction control before expecting major score jumps."
  ];
}

function dimensionScoresFromSnapshot(snapshot?: { scoring: Prisma.JsonValue; report: Prisma.JsonValue } | null): DimensionScore[] {
  const scoring = snapshot?.scoring as { dimensionScores?: DimensionScore[] } | undefined;
  const report = snapshot?.report as { dimensionScores?: DimensionScore[] } | undefined;
  const dimensions = Array.isArray(scoring?.dimensionScores) ? scoring.dimensionScores : Array.isArray(report?.dimensionScores) ? report.dimensionScores : [];
  return dimensions
    .filter((item) => item && typeof item.dimension === "string" && typeof item.label === "string" && typeof item.score === "number")
    .map((item) => ({
      dimension: item.dimension,
      label: item.label,
      score: Math.round(item.score),
      answered: Number(item.answered ?? 0),
      total: Number(item.total ?? 0)
    }));
}

function buildStructuredReport(attempt: { startedAt?: Date; completedAt?: Date | null; test: { title: string; type: string; duration?: number }; answers: Array<{ answerText?: string | null; selectedOption?: string | null; question: { questionText: string; id: string; testId: string } }> }, scoring: ScoringResult, recommendations: string[]) {
  const strongest = scoring.strongestDimensions;
  const weakest = scoring.weakestDimensions;
  const dominant = strongest[0] ?? scoring.dimensionScores.find((item) => item.score > 0) ?? scoring.dimensionScores[0];
  const development = weakest[0] ?? dominant;
  const nextTest = dominant ? nextTestByDimension[dominant.dimension] ?? "Officer Readiness Test" : "Officer Readiness Test";
  const guruQuest = development ? guruQuestByDimension[development.dimension] ?? "Life OS" : "Life OS";
  const longRangePlan = planFromFocus(guruQuest, nextTest, development);
  const integritySignals = attempt.startedAt && typeof attempt.test.duration === "number"
    ? integritySignalsForAttempt({ startedAt: attempt.startedAt, completedAt: attempt.completedAt, answers: attempt.answers, test: { duration: attempt.test.duration } }, scoring)
    : ["Response integrity review is available after final submission."];
  const answerSignals = attempt.answers
    .filter((answer) => answer.answerText || answer.selectedOption)
    .map((answer) => {
      const dimension = dimensionFromQuestion(answer.question);
      const selectedAnswer = answer.selectedOption ?? answer.answerText ?? "";
      const matchedDimension = scoring.dimensionScores.find((item) => item.dimension === dimension);
      return {
        question: answer.question.questionText,
        answer: selectedAnswer,
        dimension,
        dimensionLabel: matchedDimension?.label ?? dimension,
        score: matchedDimension?.score ?? 0,
        interpretation: matchedDimension && matchedDimension.score >= 75
          ? `Strong signal in ${matchedDimension.label}. This response supports readiness.`
          : matchedDimension && matchedDimension.score < 55
            ? `Development signal in ${matchedDimension.label}. This should be trained through guided missions.`
            : `Balanced signal in ${matchedDimension?.label ?? dimension}. NIDUS AI will refine this through more responses.`
      };
    });

  return {
    reportVersion: "2.0-international",
    score: scoring.score,
    level: scoring.readinessBand,
    executiveSummary: executiveSummaryFor(attempt.test.title, scoring, strongest, weakest),
    simpleMeaning: meaningForScore(scoring.score),
    percentileContext: percentileContext(scoring.score),
    reportConfidence: reportConfidence(scoring),
    dimensionScores: scoring.dimensionScores,
    dimensionInsights: dimensionInsights(scoring.dimensionScores),
    strengths: [
      strongest.length ? `Strongest dimensions: ${strongest.map((item) => `${item.label} ${item.score}/100`).join(", ")}.` : "More responses are needed to identify strong dimensions.",
      recommendations[0] ?? "Continue structured practice.",
      `Quality score ${scoring.qualityScore}/100 with ${scoring.completionScore}% completion.`
    ],
    improvementAreas: [
      weakest.length ? `Development dimensions: ${weakest.map((item) => `${item.label} ${item.score}/100`).join(", ")}.` : "Complete more responses to identify improvement areas.",
      scoring.riskIndicators.length ? `Risk indicators: ${scoring.riskIndicators.join(", ")}.` : "No major low-score risk indicator was detected from answered items.",
      "Complete related assessments to improve report accuracy."
    ],
    behaviourPattern: `NIDUS AI evaluated ${scoring.answered}/${scoring.totalQuestions} responses across ${scoring.dimensionScores.length} dimensions in ${attempt.test.title}.`,
    officerReadinessSignal: scoring.score >= 70 ? "Positive officer-readiness signal with scope for structured sharpening." : "Officer-readiness is developing and needs guided routine, confidence, focus, and pressure practice.",
    parentSummary: `The student completed ${scoring.answered}/${scoring.totalQuestions} responses in ${attempt.test.title}. The score is ${scoring.score}/100, classified as ${scoring.readinessBand.toLowerCase()}. Recommended next step: ${nextTest} and ${guruQuest}.`,
    counsellorSummary: `Review ${development?.label ?? "the weakest dimension"} first, then connect the student to ${guruQuest} and follow up through ${nextTest}.`,
    recommendedNextTest: nextTest,
    recommendedGuruQuest: guruQuest,
    counsellingAction: scoring.score >= 70 ? "Book a review to convert this strength into a defence pathway plan." : "Book counselling to identify the first improvement mission and assessment path.",
    integritySignals,
    riskReview: riskReviewFor(scoring, integritySignals),
    parentGuidance: parentGuidanceFor(scoring, development),
    sevenDayActionPlan: [
      `Day 1: Review the ${attempt.test.title} report and note the strongest dimension.`,
      `Day 2: Start the ${guruQuest} mission for one focused action.`,
      "Day 3: Practice one timed study or response block without distraction.",
      "Day 4: Complete one physical or discipline task even if motivation is low.",
      `Day 5: Take or schedule ${nextTest}.`,
      "Day 6: Discuss the parent/counsellor summary with a mentor.",
      "Day 7: Update the digital profile and choose the next mission."
    ],
    thirtyDayPlan: longRangePlan.thirtyDayPlan,
    ninetyDayPlan: longRangePlan.ninetyDayPlan,
    mentorReviewChecklist: [
      "Confirm whether the response integrity signals are clean enough for high-confidence counselling.",
      "Discuss the top two strengths and the lowest development dimension with the student.",
      `Assign one mission from ${guruQuest} and schedule a follow-up after seven days.`,
      `Recommend ${nextTest} only after the student completes the first action cycle.`
    ],
    mentorNotes: [
      `Primary training focus: ${development?.label ?? "readiness consistency"}.`,
      `Recommended sequence: ${guruQuest} first, then ${nextTest}.`,
      "Use trend, effort, and behaviour change as the main success indicators, not one score alone."
    ],
    disclaimer: "This report is an educational and training-guidance interpretation. It is not a medical, clinical, psychiatric, or final SSB selection diagnosis. Results should be reviewed with qualified mentors or counsellors before high-stakes decisions.",
    answerSignals
  };
}

function safeFilename(value: string) {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return cleaned || "psychometric-report";
}

function collectPdf(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

const PDF = {
  margin: 44,
  width: 507,
  bottom: 770,
  navy: "#071d36",
  gold: "#b9913f",
  goldSoft: "#fff7de",
  ink: "#111827",
  muted: "#4b5563",
  border: "#d8d2c3",
  panel: "#fffdf8"
};

function ensurePdfSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > PDF.bottom) {
    doc.addPage();
    doc.y = PDF.margin;
  }
}

function addPdfHeading(doc: PDFKit.PDFDocument, eyebrow: string, title: string) {
  ensurePdfSpace(doc, 52);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF.gold).text(eyebrow.toUpperCase(), PDF.margin, doc.y, { width: PDF.width, characterSpacing: 1.2 });
  doc.moveDown(0.25);
  doc.font("Helvetica-Bold").fontSize(16).fillColor(PDF.ink).text(title, PDF.margin, doc.y, { width: PDF.width, lineGap: 2 });
  doc.moveDown(0.55);
}

function addPdfSection(doc: PDFKit.PDFDocument, title: string, body: string | string[], options: { eyebrow?: string; boxed?: boolean } = {}) {
  const lines = (Array.isArray(body) ? body : [body]).filter(Boolean);
  if (!lines.length) return;
  addPdfHeading(doc, options.eyebrow ?? "Report Section", title);
  for (const line of lines) {
    const text = Array.isArray(body) ? `• ${line}` : line;
    const estimatedHeight = doc.heightOfString(text, { width: PDF.width - (options.boxed ? 28 : 0), lineGap: 4 }) + (options.boxed ? 26 : 8);
    ensurePdfSpace(doc, Math.max(estimatedHeight, 36));
    if (options.boxed) {
      const y = doc.y;
      doc.roundedRect(PDF.margin, y, PDF.width, estimatedHeight, 12).fillAndStroke(PDF.panel, PDF.border);
      doc.font("Helvetica").fontSize(10).fillColor(PDF.muted).text(text, PDF.margin + 14, y + 13, { width: PDF.width - 28, lineGap: 4 });
      doc.y = y + estimatedHeight + 8;
    } else {
      doc.font("Helvetica").fontSize(10.5).fillColor(PDF.muted).text(text, PDF.margin, doc.y, { width: PDF.width, lineGap: 4 });
      doc.moveDown(0.4);
    }
  }
}

function drawScoreCard(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number) {
  doc.roundedRect(x, y, width, 70, 12).fillAndStroke("#ffffff", PDF.border);
  doc.fillColor(PDF.gold).fontSize(7.5).font("Helvetica-Bold").text(label.toUpperCase(), x + 14, y + 13, { width: width - 28, characterSpacing: 0.8 });
  doc.fillColor(PDF.ink).fontSize(18).font("Helvetica-Bold").text(value, x + 14, y + 34, { width: width - 28 });
}

function addPdfBand(doc: PDFKit.PDFDocument, label: string, value: string, color: string) {
  ensurePdfSpace(doc, 38);
  const y = doc.y;
  doc.roundedRect(PDF.margin, y, PDF.width, 34, 10).fillAndStroke("#ffffff", PDF.border);
  doc.circle(PDF.margin + 18, y + 17, 5).fill(color);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF.ink).text(label, PDF.margin + 34, y + 11, { width: 180 });
  doc.font("Helvetica-Bold").fontSize(9).fillColor(color).text(value, PDF.margin + 220, y + 11, { width: PDF.width - 230, align: "right" });
  doc.y = y + 44;
}

function scoreColor(score: number) {
  if (score >= 90) return "#b9913f";
  if (score >= 75) return "#059669";
  if (score >= 60) return "#ca8a04";
  if (score >= 45) return "#ea580c";
  return "#dc2626";
}

function writeAssessmentPdf(result: { attempt: { test: { title: string } }; report: StructuredReport; scoring: PublicScoring; recommendations: string[] }) {
  const doc = new PDFDocument({ size: "A4", margin: PDF.margin, bufferPages: true });
  const buffer = collectPdf(doc);
  const { attempt, report, scoring, recommendations } = result;
  const generatedAt = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  doc.rect(0, 0, doc.page.width, 164).fill(PDF.navy);
  doc.fillColor(PDF.gold).fontSize(9).font("Helvetica-Bold").text("NIDUS DEFENCE ASSESSMENT REPORT", PDF.margin, 34, { width: PDF.width, characterSpacing: 1.4 });
  doc.fillColor("#ffffff").fontSize(24).font("Helvetica-Bold").text(`${attempt.test.title}`, PDF.margin, 56, { width: 330, lineGap: 2 });
  doc.fillColor("#d1d5db").fontSize(10).font("Helvetica").text(`Generated on ${generatedAt}`, PDF.margin, 116, { width: 260 });
  doc.roundedRect(392, 42, 146, 86, 16).fillAndStroke("#fffdf8", "#e7c873");
  doc.fillColor(PDF.navy).fontSize(32).font("Helvetica-Bold").text(`${report.score}`, 412, 58, { width: 65, align: "center" });
  doc.fillColor(PDF.gold).fontSize(9).font("Helvetica-Bold").text("/ 100", 478, 72, { width: 40 });
  doc.fillColor(PDF.navy).fontSize(9).font("Helvetica-Bold").text(report.level, 410, 101, { width: 108, align: "center" });

  doc.y = 190;
  const cardY = doc.y;
  drawScoreCard(doc, "Overall score", `${scoring.score}/100`, PDF.margin, cardY, 155);
  drawScoreCard(doc, "Response quality", `${scoring.qualityScore}/100`, PDF.margin + 176, cardY, 155);
  drawScoreCard(doc, "Completion", `${scoring.answered}/${scoring.totalQuestions}`, PDF.margin + 352, cardY, 155);
  doc.y = cardY + 95;

  addPdfSection(doc, "Executive Summary", report.executiveSummary ?? report.simpleMeaning, { eyebrow: "Consulting Summary", boxed: true });
  addPdfSection(doc, "What This Means", [report.simpleMeaning, report.behaviourPattern], { eyebrow: "Interpretation", boxed: true });

  addPdfHeading(doc, "Visual Projection", "Dimension score dashboard");
  for (const dimension of report.dimensionScores) {
    ensurePdfSpace(doc, 34);
    const x = PDF.margin;
    const y = doc.y;
    const labelWidth = 165;
    const barWidth = 250;
    const color = scoreColor(dimension.score);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF.ink).text(dimension.label, x, y, { width: labelWidth });
    doc.roundedRect(x + labelWidth + 12, y + 4, barWidth, 8, 4).fill("#edf0f4");
    doc.roundedRect(x + labelWidth + 12, y + 4, Math.max(4, Math.round((dimension.score / 100) * barWidth)), 8, 4).fill(color);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(color).text(`${dimension.score}/100`, x + labelWidth + barWidth + 24, y - 1, { width: 54, align: "right" });
    doc.y = y + 27;
  }
  doc.moveDown(0.4);

  if (report.dimensionInsights?.length) {
    addPdfSection(
      doc,
      "Trait Diagnosis",
      report.dimensionInsights.slice(0, 10).map((dimension) => `${dimension.label} (${dimension.score}/100): ${dimension.interpretation} Action: ${dimension.action}`),
      { eyebrow: "Expert Interpretation", boxed: true }
    );
  }

  addPdfSection(doc, "Strength Pattern", report.strengths, { eyebrow: "Strengths", boxed: true });
  addPdfSection(doc, "Development Priorities", report.improvementAreas, { eyebrow: "Training Needs", boxed: true });
  addPdfSection(doc, "Officer Readiness Signal", report.officerReadinessSignal, { eyebrow: "Defence Interpretation", boxed: true });
  addPdfSection(doc, "Risk Review", report.riskReview ?? [], { eyebrow: "Intervention", boxed: true });
  addPdfSection(doc, "Response Integrity", report.integritySignals, { eyebrow: "Validity", boxed: true });

  addPdfSection(doc, "Parent Summary", report.parentSummary, { eyebrow: "Family Guidance", boxed: true });
  addPdfSection(doc, "Parent Guidance", report.parentGuidance ?? [], { eyebrow: "Family Action", boxed: true });
  addPdfSection(doc, "Mentor / Academic Head Summary", report.counsellorSummary, { eyebrow: "Mentor View", boxed: true });
  addPdfSection(doc, "Mentor Review Checklist", report.mentorReviewChecklist ?? [], { eyebrow: "Mentor Action", boxed: true });

  addPdfHeading(doc, "Action Plan", "Next steps recommended by NIDUS");
  addPdfBand(doc, "Recommended next assessment", report.recommendedNextTest, PDF.gold);
  addPdfBand(doc, "Recommended NIDUS Guru quest", report.recommendedGuruQuest, "#059669");
  addPdfBand(doc, "Counselling action", report.counsellingAction, "#2563eb");
  addPdfSection(doc, "7-Day Action Plan", report.sevenDayActionPlan, { eyebrow: "Immediate Execution", boxed: true });
  addPdfSection(doc, "30-Day Training Plan", report.thirtyDayPlan ?? [], { eyebrow: "Growth Plan", boxed: true });
  addPdfSection(doc, "90-Day Roadmap", report.ninetyDayPlan ?? [], { eyebrow: "Transformation Plan", boxed: true });
  addPdfSection(doc, "NIDUS AI Recommendations", recommendations, { eyebrow: "AI Guidance", boxed: true });

  if (report.answerSignals?.length) {
    addPdfSection(
      doc,
      "Answer-Level Evidence",
      report.answerSignals.slice(0, 12).map((signal) => `${signal.dimensionLabel}: ${signal.interpretation}`),
      { eyebrow: "Evidence", boxed: true }
    );
  }

  addPdfSection(doc, "Educational Disclaimer", report.disclaimer ?? "This report is for educational guidance only and is not a clinical diagnosis.", { eyebrow: "Disclaimer", boxed: true });

  const pages = doc.bufferedPageRange();
  for (let index = 0; index < pages.count; index += 1) {
    doc.switchToPage(index);
    doc.fillColor("#9ca3af").fontSize(8).font("Helvetica").text(`NIDUS Defence Assessment Report | Page ${index + 1} of ${pages.count}`, PDF.margin, 806, {
      width: PDF.width,
      align: "center"
    });
  }

  doc.end();
  return buffer;
}

function publicScoring(scoring: ScoringResult) {
  return {
    score: scoring.score,
    qualityScore: scoring.qualityScore,
    completionScore: scoring.completionScore,
    answered: scoring.answered,
    totalQuestions: scoring.totalQuestions,
    readinessBand: scoring.readinessBand,
    dimensionScores: scoring.dimensionScores,
    riskIndicators: scoring.riskIndicators,
    strongestDimensions: scoring.strongestDimensions,
    weakestDimensions: scoring.weakestDimensions
  };
}

function jsonValue<T>(value: T) {
  return value as Prisma.InputJsonValue;
}

async function saveReportSnapshot(input: {
  attemptId: string;
  userId: string;
  testId: string;
  scoring: PublicScoring;
  report: ReturnType<typeof buildStructuredReport>;
  recommendations: string[];
}) {
  return prisma.psychometricReport.upsert({
    where: { attemptId: input.attemptId },
    create: {
      attemptId: input.attemptId,
      userId: input.userId,
      testId: input.testId,
      score: input.scoring.score,
      readinessBand: input.scoring.readinessBand,
      report: jsonValue(input.report),
      scoring: jsonValue(input.scoring),
      recommendations: jsonValue(input.recommendations),
      integritySignals: jsonValue(input.report.integritySignals)
    },
    update: {
      score: input.scoring.score,
      readinessBand: input.scoring.readinessBand,
      report: jsonValue(input.report),
      scoring: jsonValue(input.scoring),
      recommendations: jsonValue(input.recommendations),
      integritySignals: jsonValue(input.report.integritySignals)
    }
  });
}

function compactReportSummary(
  attempts: Array<{
    id: string;
    testId: string;
    score: number;
    completedAt: Date | null;
    overallRemark: string | null;
    aiAnalysis: string | null;
    test: { id: string; title: string; type: string; description: string };
    answers: Array<{ score: number }>;
  }>,
  totalAssessments: number
) {
  const latestByTest = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    if (!latestByTest.has(attempt.testId)) latestByTest.set(attempt.testId, attempt);
  }

  const reports = Array.from(latestByTest.values());
  const averageScore = reports.length ? Math.round(reports.reduce((sum, item) => sum + item.score, 0) / reports.length) : 0;
  const strongestReport = [...reports].sort((a, b) => b.score - a.score)[0] ?? null;
  const latestReport = reports[0] ?? null;

  return {
    summary: {
      totalAssessments,
      completedCount: reports.length,
      reportReadyCount: reports.length,
      profileAccuracy: totalAssessments ? Math.round((reports.length / totalAssessments) * 100) : 0,
      averageScore,
      readinessBand: readinessBand(averageScore),
      strongestReport: strongestReport
        ? { attemptId: strongestReport.id, title: strongestReport.test.title, score: Math.round(strongestReport.score), readinessBand: readinessBand(strongestReport.score) }
        : null,
      latestReport: latestReport
        ? { attemptId: latestReport.id, title: latestReport.test.title, score: Math.round(latestReport.score), completedAt: latestReport.completedAt?.toISOString() ?? "" }
        : null
    },
    reports: reports.map((attempt) => ({
      attemptId: attempt.id,
      testId: attempt.test.id,
      title: attempt.test.title,
      type: attempt.test.type,
      description: attempt.test.description,
      score: Math.round(attempt.score),
      readinessBand: readinessBand(attempt.score),
      completedAt: attempt.completedAt?.toISOString() ?? "",
      answerCount: attempt.answers.length,
      reportHref: `/psychometric/results/${attempt.id}`,
      pdfHref: `/psychometric/results/${attempt.id}/pdf`,
      aiAnalysis: attempt.aiAnalysis,
      overallRemark: attempt.overallRemark
    }))
  };
}

export const psychometricService = {
  async listTests() {
    let tests = await prisma.psychometricTest.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } }
    });
    if (!tests.length) {
      await ensureSeededPsychometricCatalog();
      tests = await prisma.psychometricTest.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { questions: true } } }
      });
    }
    return tests;
  },

  async getTest(id: string) {
    let test = await prisma.psychometricTest.findUnique({ where: { id }, include: includeQuestions });
    if (!test) {
      await ensureSeededPsychometricCatalog();
      test = await prisma.psychometricTest.findUnique({ where: { id }, include: includeQuestions });
    }
    if (!test) throw new Error("Psychometric test not found");
    if (!test.isActive) throw new Error("Assessment is currently inactive");
    return { ...test, access: accessForTest(test.id, test.access) };
  },

  async adminTests() {
    return prisma.psychometricTest.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: { questions: { orderBy: { order: "asc" } }, _count: { select: { questions: true, attempts: true } } }
    });
  },

  async updateTest(id: string, input: Partial<{ title: string; description: string; duration: number; instructions: string; access: string; category: string; isActive: boolean }>) {
    let access: AssessmentAccess | undefined;
    if (input.access) {
      const normalizedAccess = normalizeAccess(input.access);
      if (!normalizedAccess) throw new Error("Invalid assessment access tier");
      access = normalizedAccess;
    }
    return prisma.psychometricTest.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        duration: input.duration,
        instructions: input.instructions,
        access,
        category: input.category,
        isActive: input.isActive
      },
      include: { questions: { orderBy: { order: "asc" } }, _count: { select: { questions: true, attempts: true } } }
    });
  },

  async updateQuestion(id: string, input: Partial<{ questionText: string; questionType: string; options: string[]; order: number }>) {
    return prisma.psychometricQuestion.update({
      where: { id },
      data: {
        questionText: input.questionText,
        questionType: input.questionType,
        options: input.options,
        order: input.order
      }
    });
  },

  async start(userId: string, testId: string, role?: Role) {
    const test = await this.getTest(testId);
    assertAssessmentAccess(role, test);

    const existingAttempt = await prisma.psychometricAttempt.findFirst({
      where: { userId, testId, completedAt: null },
      orderBy: { startedAt: "desc" },
      include: { test: { include: includeQuestions } }
    });
    if (existingAttempt && !isAttemptExpired(existingAttempt)) return { ...existingAttempt, test: { ...existingAttempt.test, access: accessForTest(existingAttempt.test.id, existingAttempt.test.access) } };

    await assertStartRateLimit(userId);
    const attempt = await prisma.psychometricAttempt.create({
      data: { userId, testId },
      include: { test: { include: includeQuestions } }
    });
    return { ...attempt, test };
  },

  async activeAttempt(userId: string, attemptId: string) {
    const attempt = await prisma.psychometricAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { test: { include: includeQuestions } }
    });
    if (!attempt) throw new Error("Psychometric attempt not found");
    if (attempt.completedAt) throw new Error("Assessment already submitted. Open the result report instead.");
    if (isAttemptExpired(attempt)) throw new Error("Assessment attempt expired. Please start a fresh attempt.");
    return { ...attempt, test: { ...attempt.test, access: accessForTest(attempt.test.id, attempt.test.access) } };
  },

  async submit(userId: string, attemptId: string, answers: SubmitAnswer[]) {
    const attempt = await prisma.psychometricAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { test: { include: includeQuestions } }
    });
    if (!attempt) throw new Error("Psychometric attempt not found");
    if (attempt.completedAt) throw new Error("Attempt already completed");
    if (isAttemptExpired(attempt)) throw new Error("Assessment attempt expired. Please start a fresh attempt.");

    const scoring = buildScoring(answers, attempt.test.questions);
    const answerRows = answers.map((answer) => {
      const question = attempt.test.questions.find((item) => item.id === answer.questionId);
      const score = scoreAnswer(answer, question);
      return {
      attemptId,
      questionId: answer.questionId,
      answerText: answer.answerText,
      selectedOption: answer.selectedOption,
        score
      };
    });

    await prisma.psychometricAnswer.createMany({ data: answerRows, skipDuplicates: true });
    const savedAnswers = await prisma.psychometricAnswer.findMany({ where: { attemptId } });
    const aiAnalysis = psychometricAiService.analyzePersonality(savedAnswers, scoring.dimensionScores);
    const strongest = scoring.strongestDimensions.map((item) => `${item.label} ${item.score}`).join(", ") || "Awaiting more responses";
    const weakest = scoring.weakestDimensions.map((item) => `${item.label} ${item.score}`).join(", ") || "Awaiting more responses";
    const risks = scoring.riskIndicators.length ? ` Risk indicators: ${scoring.riskIndicators.join(", ")}.` : "";
    const overallRemark = `${scoring.readinessBand}. Strongest: ${strongest}. Development focus: ${weakest}.${risks}`;

    if (attempt.test.type === "OLQ") {
      const olqData = olqDataFromDimensions(scoring.dimensionScores);
      await prisma.oLQScore.upsert({
        where: { userId },
        create: { userId, ...olqData },
        update: olqData
      });
    }

    const updatedAttempt = await prisma.psychometricAttempt.update({
      where: { id: attemptId },
      data: { score: scoring.score, aiAnalysis, overallRemark, completedAt: new Date() },
      include: { test: true, answers: { include: { question: true } } }
    });

    const weakAreas = scoring.weakestDimensions.map((item) => item.label);
    const recommendations = psychometricAiService.generateRecommendations(updatedAttempt.test.type, weakAreas);
    const report = buildStructuredReport(updatedAttempt, scoring, recommendations);
    await saveReportSnapshot({
      attemptId: updatedAttempt.id,
      userId: updatedAttempt.userId,
      testId: updatedAttempt.testId,
      scoring: publicScoring(scoring),
      report,
      recommendations
    });

    return updatedAttempt;
  },

  async result(userId: string, attemptId: string, role?: Role) {
    const attempt = await prisma.psychometricAttempt.findFirst({
      where: { id: attemptId, ...(role && staffResultRoles.includes(role) ? {} : { userId }) },
      include: { test: { include: includeQuestions }, answers: { include: { question: true } }, reportSnapshot: true }
    });
    if (!attempt) throw new Error("Psychometric result not found");
    const scoring = buildScoring(
      attempt.answers.map((answer) => ({ questionId: answer.questionId, answerText: answer.answerText ?? undefined, selectedOption: answer.selectedOption ?? undefined })),
      attempt.test.questions
    );
    const weakAreas = scoring.weakestDimensions.map((item) => item.label);
    const recommendations = psychometricAiService.generateRecommendations(attempt.test.type, weakAreas);
    const report = buildStructuredReport(attempt, scoring, recommendations);
    if (attempt.reportSnapshot) {
      const snapshotReport = attempt.reportSnapshot.report as unknown as StructuredReport;
      const snapshotScoring = attempt.reportSnapshot.scoring as unknown as PublicScoring;
      const snapshotRecommendations = attempt.reportSnapshot.recommendations as unknown as string[];
      return {
        attempt,
        recommendations: snapshotRecommendations,
        report: snapshotReport,
        scoring: snapshotScoring
      };
    }
    return {
      attempt,
      recommendations,
      report,
      scoring: publicScoring(scoring)
    };
  },

  async resultPdf(userId: string, attemptId: string, role?: Role) {
    const result = await this.result(userId, attemptId, role);
    const buffer = await writeAssessmentPdf(result);
    return {
      buffer,
      filename: `nidus-${safeFilename(result.attempt.test.title)}-${result.attempt.id}.pdf`
    };
  },

  async reports(userId: string) {
    const [totalAssessments, attempts] = await Promise.all([
      prisma.psychometricTest.count(),
      prisma.psychometricAttempt.findMany({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        include: {
          test: { select: { id: true, title: true, type: true, description: true } },
          answers: { select: { score: true } }
        }
      })
    ]);

    return compactReportSummary(attempts, totalAssessments || 15);
  },

  async history(userId: string, testId: string) {
    const attempts = await prisma.psychometricAttempt.findMany({
      where: { userId, testId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      include: {
        test: { select: { id: true, title: true, type: true } },
        reportSnapshot: true,
        answers: { select: { id: true } }
      }
    });
    const oldestFirst = [...attempts].reverse();
    const firstScore = oldestFirst[0]?.score ?? 0;
    const latestScore = attempts[0]?.score ?? 0;

    return {
      testId,
      attempts: attempts.length,
      latestScore: Math.round(latestScore),
      bestScore: attempts.length ? Math.round(Math.max(...attempts.map((attempt) => attempt.score))) : 0,
      improvement: attempts.length > 1 ? Math.round(latestScore - firstScore) : 0,
      trend: oldestFirst.map((attempt, index) => ({
        attemptId: attempt.id,
        attemptNumber: index + 1,
        score: Math.round(attempt.score),
        readinessBand: attempt.reportSnapshot?.readinessBand ?? readinessBand(attempt.score),
        completedAt: attempt.completedAt?.toISOString() ?? "",
        reportHref: `/psychometric/results/${attempt.id}`,
        pdfHref: `/psychometric/results/${attempt.id}/pdf`,
        answerCount: attempt.answers.length,
        snapshotReady: Boolean(attempt.reportSnapshot)
      }))
    };
  },

  async adminOverview() {
    const [totalAssessments, totalStudents, completedAttempts, allAttempts] = await Promise.all([
      prisma.psychometricTest.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.psychometricAttempt.findMany({
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 60,
        include: {
          test: { select: { id: true, title: true, type: true } },
          user: { select: { id: true, name: true, email: true, role: true } },
          answers: { select: { id: true } }
        }
      }),
      prisma.psychometricAttempt.count()
    ]);
    const completedCount = completedAttempts.length;
    const averageScore = completedCount ? Math.round(completedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / completedCount) : 0;
    const lowScoreCount = completedAttempts.filter((attempt) => attempt.score < 55).length;
    const activeStudentIds = new Set(completedAttempts.map((attempt) => attempt.userId));
    const testMap = new Map<string, { title: string; type: string; attempts: number; averageScore: number; totalScore: number }>();

    for (const attempt of completedAttempts) {
      const current = testMap.get(attempt.testId) ?? { title: attempt.test.title, type: attempt.test.type, attempts: 0, averageScore: 0, totalScore: 0 };
      current.attempts += 1;
      current.totalScore += attempt.score;
      current.averageScore = Math.round(current.totalScore / current.attempts);
      testMap.set(attempt.testId, current);
    }

    return {
      summary: {
        totalAssessments: totalAssessments || 15,
        totalStudents,
        totalAttempts: allAttempts,
        completedReports: completedCount,
        activeStudents: activeStudentIds.size,
        adoptionRate: percentage(activeStudentIds.size, totalStudents),
        completionRate: percentage(completedCount, Math.max(allAttempts, 1)),
        averageScore,
        readinessBand: readinessBand(averageScore),
        lowScoreCount
      },
      topAssessments: Array.from(testMap.entries())
        .map(([testId, value]) => ({ testId, title: value.title, type: value.type, attempts: value.attempts, averageScore: value.averageScore }))
        .sort((a, b) => b.attempts - a.attempts)
        .slice(0, 8),
      recentReports: completedAttempts.slice(0, 12).map((attempt) => ({
        attemptId: attempt.id,
        studentId: attempt.user.id,
        studentName: attempt.user.name,
        studentEmail: attempt.user.email,
        testId: attempt.test.id,
        title: attempt.test.title,
        type: attempt.test.type,
        score: Math.round(attempt.score),
        readinessBand: readinessBand(attempt.score),
        completedAt: attempt.completedAt?.toISOString() ?? "",
        answerCount: attempt.answers.length,
        reportHref: `/psychometric/results/${attempt.id}`,
        pdfHref: `/psychometric/results/${attempt.id}/pdf`
      }))
    };
  },

  async adminReadiness() {
    const [tests, completedAttempts, reportSnapshots, totalAttempts] = await Promise.all([
      prisma.psychometricTest.findMany({
        orderBy: { title: "asc" },
        include: { _count: { select: { questions: true, attempts: true } } }
      }),
      prisma.psychometricAttempt.count({ where: { completedAt: { not: null } } }),
      prisma.psychometricReport.count(),
      prisma.psychometricAttempt.count()
    ]);

    const minimumQuestions = 30;
    const expectedAssessments = 15;
    const activeTests = tests.filter((test) => test.isActive);
    const questionReadyTests = tests.filter((test) => test._count.questions >= minimumQuestions);
    const accessMix = tests.reduce<Record<AssessmentAccess, number>>((acc, test) => {
      const access = accessForTest(test.id, test.access);
      acc[access] += 1;
      return acc;
    }, { FREE: 0, CORE: 0, PREMIUM: 0 });
    const categoryMix = tests.reduce<Record<string, number>>((acc, test) => {
      acc[test.category] = (acc[test.category] ?? 0) + 1;
      return acc;
    }, {});
    const issues = [
      tests.length < expectedAssessments ? `Assessment catalog has ${tests.length}/${expectedAssessments} expected assessments.` : "",
      activeTests.length < tests.length ? `${tests.length - activeTests.length} assessment(s) are inactive.` : "",
      questionReadyTests.length < tests.length ? `${tests.length - questionReadyTests.length} assessment(s) have fewer than ${minimumQuestions} questions.` : "",
      reportSnapshots < completedAttempts ? `${completedAttempts - reportSnapshots} completed attempt(s) do not yet have durable report snapshots.` : "",
      accessMix.FREE < 5 ? "Free lead-generation assessment mix is below the recommended minimum of 5." : "",
      accessMix.PREMIUM < 1 ? "No premium assessment is configured." : ""
    ].filter(Boolean);
    const readinessScore = Math.round((
      percentage(tests.length, expectedAssessments) * 0.2 +
      percentage(activeTests.length, Math.max(tests.length, 1)) * 0.2 +
      percentage(questionReadyTests.length, Math.max(tests.length, 1)) * 0.25 +
      percentage(reportSnapshots, Math.max(completedAttempts, 1)) * 0.25 +
      (accessMix.FREE >= 5 && accessMix.PREMIUM >= 1 ? 100 : 70) * 0.1
    ));

    return {
      generatedAt: new Date().toISOString(),
      status: readinessScore >= 90 && !issues.length ? "READY" : readinessScore >= 75 ? "WATCH" : "NEEDS_FIX",
      minimumQuestions,
      expectedAssessments,
      readinessScore,
      summary: {
        totalAssessments: tests.length,
        activeAssessments: activeTests.length,
        questionReadyAssessments: questionReadyTests.length,
        totalAttempts,
        completedAttempts,
        reportSnapshots,
        reportSnapshotCoverage: percentage(reportSnapshots, Math.max(completedAttempts, 1)),
        accessMix,
        categoryMix
      },
      issues,
      checks: tests.map((test) => ({
        id: test.id,
        title: test.title,
        access: accessForTest(test.id, test.access),
        category: test.category,
        isActive: test.isActive,
        questionCount: test._count.questions,
        attemptCount: test._count.attempts,
        questionReady: test._count.questions >= minimumQuestions,
        productionReady: test.isActive && test._count.questions >= minimumQuestions
      }))
    };
  },

  async adminAnalytics() {
    const [attempts, totalAttempts, completedAttempts] = await Promise.all([
      prisma.psychometricAttempt.findMany({
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 250,
        include: {
          test: { select: { id: true, title: true, type: true, access: true, category: true } },
          user: { select: { id: true, name: true, email: true } },
          answers: { select: { id: true } },
          reportSnapshot: true
        }
      }),
      prisma.psychometricAttempt.count(),
      prisma.psychometricAttempt.count({ where: { completedAt: { not: null } } })
    ]);

    const bandMap = new Map<string, number>();
    const accessMap = new Map<string, { attempts: number; scoreTotal: number }>();
    const categoryMap = new Map<string, { attempts: number; scoreTotal: number }>();
    const dimensionMap = new Map<string, { label: string; attempts: number; scoreTotal: number }>();
    const dailyMap = new Map<string, { attempts: number; scoreTotal: number }>();

    for (const attempt of attempts) {
      const band = attempt.reportSnapshot?.readinessBand ?? readinessBand(attempt.score);
      bandMap.set(band, (bandMap.get(band) ?? 0) + 1);

      const access = accessForTest(attempt.test.id, attempt.test.access);
      const accessCurrent = accessMap.get(access) ?? { attempts: 0, scoreTotal: 0 };
      accessCurrent.attempts += 1;
      accessCurrent.scoreTotal += attempt.score;
      accessMap.set(access, accessCurrent);

      const category = attempt.test.category || "GENERAL";
      const categoryCurrent = categoryMap.get(category) ?? { attempts: 0, scoreTotal: 0 };
      categoryCurrent.attempts += 1;
      categoryCurrent.scoreTotal += attempt.score;
      categoryMap.set(category, categoryCurrent);

      const dayKey = attempt.completedAt?.toISOString().slice(0, 10) ?? "pending";
      const dailyCurrent = dailyMap.get(dayKey) ?? { attempts: 0, scoreTotal: 0 };
      dailyCurrent.attempts += 1;
      dailyCurrent.scoreTotal += attempt.score;
      dailyMap.set(dayKey, dailyCurrent);

      for (const dimension of dimensionScoresFromSnapshot(attempt.reportSnapshot)) {
        const current = dimensionMap.get(dimension.dimension) ?? { label: dimension.label, attempts: 0, scoreTotal: 0 };
        current.attempts += 1;
        current.scoreTotal += dimension.score;
        dimensionMap.set(dimension.dimension, current);
      }
    }

    const mapToPerformance = (entries: Map<string, { attempts: number; scoreTotal: number }>) =>
      Array.from(entries.entries())
        .map(([key, value]) => ({
          key,
          attempts: value.attempts,
          averageScore: value.attempts ? Math.round(value.scoreTotal / value.attempts) : 0
        }))
        .sort((a, b) => b.attempts - a.attempts);

    return {
      generatedAt: new Date().toISOString(),
      sampleSize: attempts.length,
      summary: {
        totalAttempts,
        completedAttempts,
        completionRate: percentage(completedAttempts, Math.max(totalAttempts, 1)),
        lowScoreReports: attempts.filter((attempt) => attempt.score < 55).length,
        highReadinessReports: attempts.filter((attempt) => attempt.score >= 80).length
      },
      readinessBands: Array.from(bandMap.entries()).map(([band, count]) => ({ band, count })).sort((a, b) => b.count - a.count),
      accessPerformance: mapToPerformance(accessMap),
      categoryPerformance: mapToPerformance(categoryMap),
      dimensionAverages: Array.from(dimensionMap.entries())
        .map(([dimension, value]) => ({
          dimension,
          label: value.label,
          attempts: value.attempts,
          averageScore: value.attempts ? Math.round(value.scoreTotal / value.attempts) : 0
        }))
        .sort((a, b) => a.averageScore - b.averageScore),
      dailyTrend: Array.from(dailyMap.entries())
        .map(([date, value]) => ({
          date,
          attempts: value.attempts,
          averageScore: value.attempts ? Math.round(value.scoreTotal / value.attempts) : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-21),
      counsellingPriority: attempts
        .filter((attempt) => attempt.score < 60)
        .slice(0, 12)
        .map((attempt) => ({
          attemptId: attempt.id,
          studentId: attempt.user.id,
          studentName: attempt.user.name,
          studentEmail: attempt.user.email,
          testTitle: attempt.test.title,
          score: Math.round(attempt.score),
          readinessBand: attempt.reportSnapshot?.readinessBand ?? readinessBand(attempt.score),
          completedAt: attempt.completedAt?.toISOString() ?? "",
          answerCount: attempt.answers.length,
          reportHref: `/psychometric/results/${attempt.id}`
        }))
    };
  },

  async olqReport(userId: string) {
    const score =
      (await prisma.oLQScore.findUnique({ where: { userId } })) ??
      (await prisma.oLQScore.create({ data: { userId } }));
    const values = Object.fromEntries(olqKeys.map((key) => [key, score[key]]));
    const insights = psychometricAiService.generateOLQInsights(values);
    return { score, insights };
  },

  async intelligence(userId: string) {
    const [attempts, olq] = await Promise.all([
      prisma.psychometricAttempt.findMany({ where: { userId }, include: { test: true, answers: { include: { question: true } } }, orderBy: { startedAt: "desc" }, take: 20 }),
      prisma.oLQScore.findUnique({ where: { userId } })
    ]);
    const averageScore = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length) : 0;
    const frameworks = ["TAT", "WAT", "SRT", "SD", "OLQ"];
    return {
      averageScore,
      attempts: attempts.length,
      olq,
      personalityAnalytics: {
        dominantSignals: olq ? Object.entries(Object.fromEntries(olqKeys.map((key) => [key, olq[key]]))).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 5) : [],
        developmentSignals: olq ? Object.entries(Object.fromEntries(olqKeys.map((key) => [key, olq[key]]))).sort((a, b) => Number(a[1]) - Number(b[1])).slice(0, 5) : []
      },
      officerReadiness: Math.min(100, Math.round((averageScore + (olq?.selfConfidence ?? 60) + (olq?.senseOfResponsibility ?? 60)) / 3)),
      trendAnalytics: attempts.map((attempt) => ({ type: attempt.test.type, score: attempt.score, date: attempt.startedAt })),
      aiPersonalityInsight: "Psychometric intelligence shell ready for TAT, WAT, SRT, SD and OLQ guided interpretation.",
      interviewReadiness: frameworks.map((framework) => ({ framework, status: attempts.some((attempt) => attempt.test.type === framework) ? "OBSERVED" : "PENDING_DATA" }))
    };
  }
};
