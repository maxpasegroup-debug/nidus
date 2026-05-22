import PDFDocument from "pdfkit";
import { prisma } from "../../config/prisma.js";
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

const includeQuestions = {
  questions: { orderBy: { order: "asc" as const } }
};

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

function buildStructuredReport(attempt: { test: { title: string; type: string }; answers: Array<{ answerText?: string | null; selectedOption?: string | null; question: { questionText: string; id: string; testId: string } }> }, scoring: ScoringResult, recommendations: string[]) {
  const strongest = scoring.strongestDimensions;
  const weakest = scoring.weakestDimensions;
  const dominant = strongest[0] ?? scoring.dimensionScores.find((item) => item.score > 0) ?? scoring.dimensionScores[0];
  const development = weakest[0] ?? dominant;
  const nextTest = dominant ? nextTestByDimension[dominant.dimension] ?? "Officer Readiness Test" : "Officer Readiness Test";
  const guruQuest = development ? guruQuestByDimension[development.dimension] ?? "Life OS" : "Life OS";
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
    score: scoring.score,
    level: scoring.readinessBand,
    simpleMeaning: meaningForScore(scoring.score),
    dimensionScores: scoring.dimensionScores,
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
    sevenDayActionPlan: [
      `Day 1: Review the ${attempt.test.title} report and note the strongest dimension.`,
      `Day 2: Start the ${guruQuest} mission for one focused action.`,
      "Day 3: Practice one timed study or response block without distraction.",
      "Day 4: Complete one physical or discipline task even if motivation is low.",
      `Day 5: Take or schedule ${nextTest}.`,
      "Day 6: Discuss the parent/counsellor summary with a mentor.",
      "Day 7: Update the digital profile and choose the next mission."
    ],
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

function addPdfSection(doc: PDFKit.PDFDocument, title: string, body: string | string[]) {
  doc.moveDown(0.8);
  doc.fontSize(13).fillColor("#111827").font("Helvetica-Bold").text(title);
  doc.moveDown(0.35);
  doc.fontSize(10).fillColor("#374151").font("Helvetica");
  const lines = Array.isArray(body) ? body : [body];
  for (const line of lines) {
    doc.text(Array.isArray(body) ? `- ${line}` : line, { lineGap: 3 });
  }
}

function drawScoreCard(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number) {
  doc.roundedRect(x, y, width, 64, 10).fillAndStroke("#f8fafc", "#e5e7eb");
  doc.fillColor("#6b7280").fontSize(8).font("Helvetica-Bold").text(label.toUpperCase(), x + 14, y + 13, { width: width - 28 });
  doc.fillColor("#111827").fontSize(17).font("Helvetica-Bold").text(value, x + 14, y + 30, { width: width - 28 });
}

function writeAssessmentPdf(result: Awaited<ReturnType<typeof psychometricService.result>>) {
  const doc = new PDFDocument({ size: "A4", margin: 44, bufferPages: true });
  const buffer = collectPdf(doc);
  const { attempt, report, scoring, recommendations } = result;
  const generatedAt = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  doc.rect(0, 0, doc.page.width, 118).fill("#07111f");
  doc.fillColor("#c9a646").fontSize(10).font("Helvetica-Bold").text("NIDUS ACADEMY", 44, 34, { characterSpacing: 1.4 });
  doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold").text(`${attempt.test.title} Report`, 44, 52, { width: 370 });
  doc.fillColor("#d1d5db").fontSize(10).font("Helvetica").text(`Generated on ${generatedAt}`, 44, 82);
  doc.fillColor("#f8fafc").fontSize(28).font("Helvetica-Bold").text(`${report.score}/100`, 442, 40, { width: 90, align: "right" });
  doc.fillColor("#c9a646").fontSize(9).font("Helvetica-Bold").text(report.level, 342, 76, { width: 190, align: "right" });

  const cardY = 146;
  drawScoreCard(doc, "Overall score", `${scoring.score}/100`, 44, cardY, 150);
  drawScoreCard(doc, "Response quality", `${scoring.qualityScore}/100`, 216, cardY, 150);
  drawScoreCard(doc, "Completion", `${scoring.answered}/${scoring.totalQuestions}`, 388, cardY, 150);
  doc.y = cardY + 80;

  addPdfSection(doc, "Simple interpretation", report.simpleMeaning);
  addPdfSection(doc, "Strengths", report.strengths);
  addPdfSection(doc, "Improvement areas", report.improvementAreas);

  doc.moveDown(0.8);
  doc.fontSize(13).fillColor("#111827").font("Helvetica-Bold").text("Dimension scores");
  doc.moveDown(0.35);
  for (const dimension of report.dimensionScores) {
    const x = 44;
    const y = doc.y + 3;
    const barWidth = 270;
    const scoreWidth = Math.max(3, Math.round((dimension.score / 100) * barWidth));
    doc.fillColor("#374151").fontSize(9).font("Helvetica").text(dimension.label, x, y, { width: 160 });
    doc.roundedRect(x + 174, y + 2, barWidth, 8, 4).fill("#e5e7eb");
    doc.roundedRect(x + 174, y + 2, scoreWidth, 8, 4).fill(dimension.score >= 70 ? "#1f7a4d" : dimension.score >= 50 ? "#c9a646" : "#b91c1c");
    doc.fillColor("#111827").fontSize(9).font("Helvetica-Bold").text(`${dimension.score}`, x + 454, y - 1, { width: 42, align: "right" });
    doc.moveDown(0.65);
    if (doc.y > 720) doc.addPage();
  }

  addPdfSection(doc, "Behaviour pattern", report.behaviourPattern);
  addPdfSection(doc, "Officer readiness signal", report.officerReadinessSignal);
  addPdfSection(doc, "Parent summary", report.parentSummary);
  addPdfSection(doc, "Counsellor summary", report.counsellorSummary);
  addPdfSection(doc, "Recommended next test", report.recommendedNextTest);
  addPdfSection(doc, "Recommended NIDUS Guru quest", report.recommendedGuruQuest);
  addPdfSection(doc, "Counselling action", report.counsellingAction);
  addPdfSection(doc, "Seven day action plan", report.sevenDayActionPlan);
  addPdfSection(doc, "NIDUS AI recommendations", recommendations);

  if (report.answerSignals.length) {
    addPdfSection(
      doc,
      "Response signals",
      report.answerSignals.slice(0, 12).map((signal) => `${signal.dimensionLabel}: ${signal.interpretation}`)
    );
  }

  const pages = doc.bufferedPageRange();
  for (let index = 0; index < pages.count; index += 1) {
    doc.switchToPage(index);
    doc.fillColor("#9ca3af").fontSize(8).font("Helvetica").text(`NIDUS Psychometric Report | Page ${index + 1} of ${pages.count}`, 44, 806, {
      width: 494,
      align: "center"
    });
  }

  doc.end();
  return buffer;
}

export const psychometricService = {
  async listTests() {
    return prisma.psychometricTest.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } }
    });
  },

  async getTest(id: string) {
    const test = await prisma.psychometricTest.findUnique({ where: { id }, include: includeQuestions });
    if (!test) throw new Error("Psychometric test not found");
    return test;
  },

  async start(userId: string, testId: string) {
    await this.getTest(testId);
    return prisma.psychometricAttempt.create({
      data: { userId, testId },
      include: { test: { include: includeQuestions } }
    });
  },

  async submit(userId: string, attemptId: string, answers: SubmitAnswer[]) {
    const attempt = await prisma.psychometricAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { test: { include: includeQuestions } }
    });
    if (!attempt) throw new Error("Psychometric attempt not found");
    if (attempt.completedAt) throw new Error("Attempt already completed");

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

    return prisma.psychometricAttempt.update({
      where: { id: attemptId },
      data: { score: scoring.score, aiAnalysis, overallRemark, completedAt: new Date() },
      include: { test: true, answers: { include: { question: true } } }
    });
  },

  async result(userId: string, attemptId: string) {
    const attempt = await prisma.psychometricAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { test: { include: includeQuestions }, answers: { include: { question: true } } }
    });
    if (!attempt) throw new Error("Psychometric result not found");
    const scoring = buildScoring(
      attempt.answers.map((answer) => ({ questionId: answer.questionId, answerText: answer.answerText ?? undefined, selectedOption: answer.selectedOption ?? undefined })),
      attempt.test.questions
    );
    const weakAreas = scoring.weakestDimensions.map((item) => item.label);
    const recommendations = psychometricAiService.generateRecommendations(attempt.test.type, weakAreas);
    const report = buildStructuredReport(attempt, scoring, recommendations);
    return {
      attempt,
      recommendations,
      report,
      scoring: {
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
      }
    };
  },

  async resultPdf(userId: string, attemptId: string) {
    const result = await this.result(userId, attemptId);
    const buffer = await writeAssessmentPdf(result);
    return {
      buffer,
      filename: `nidus-${safeFilename(result.attempt.test.title)}-${result.attempt.id}.pdf`
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
