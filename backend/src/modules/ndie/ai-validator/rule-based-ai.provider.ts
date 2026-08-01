import { createHash } from "node:crypto";
import { env } from "../../../config/env.js";
import type { NdieEvaluationDocument } from "../contracts/evaluation-result.js";
import type { AiProvider } from "../contracts/providers.js";
import type {
  NdieConfidenceItem,
  NdiePublishReadiness,
  NdieValidationDocument,
  NdieValidationIssue,
  NdieValidationRisk,
  NdieValidationTargetType
} from "../contracts/validation-result.js";

type CandidateInput = {
  id: string;
  questionNumber?: string | null;
  questionType: string;
  candidateJson: unknown;
  confidence?: number | null;
};

type ValidationInput = Parameters<AiProvider["validate"]>[0];

function checksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function average(values: Array<number | null | undefined>) {
  const clean = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!clean.length) return null;
  return Math.max(0, Math.min(1, clean.reduce((sum, value) => sum + value, 0) / clean.length));
}

function riskFromConfidence(confidence: number | null): NdieValidationRisk {
  if (confidence === null) return "HIGH";
  if (confidence < 0.4) return "CRITICAL";
  if (confidence < 0.62) return "HIGH";
  if (confidence < 0.8) return "MEDIUM";
  return "LOW";
}

function issue(input: {
  targetType: NdieValidationTargetType;
  targetId?: string | null;
  issueType: NdieValidationIssue["issueType"];
  severity: NdieValidationRisk;
  reason: string;
  recommendedAction: string;
  impact?: number;
}) {
  return {
    issueId: checksum(input).slice(0, 18),
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    issueType: input.issueType,
    severity: input.severity,
    reason: input.reason,
    recommendedAction: input.recommendedAction,
    reviewRequired: input.severity !== "LOW",
    confidenceImpact: input.impact ?? (input.severity === "CRITICAL" ? 0.3 : input.severity === "HIGH" ? 0.2 : input.severity === "MEDIUM" ? 0.1 : 0.03)
  };
}

function confidenceItem(targetType: NdieValidationTargetType, targetId: string | null, confidence: number | null, reasons: string[]): NdieConfidenceItem {
  return {
    targetType,
    targetId,
    confidence,
    risk: riskFromConfidence(confidence),
    reasons
  };
}

function questionRecord(candidate: CandidateInput) {
  return asRecord(asRecord(candidate.candidateJson).assessment ?? candidate.candidateJson);
}

function optionsFrom(candidate: CandidateInput) {
  const question = questionRecord(candidate);
  const options = question.options;
  if (Array.isArray(options)) return options;
  const blocks = asArray(asRecord(candidate.candidateJson).blocks);
  return blocks.filter((block) => asRecord(block).type === "OptionBlock");
}

function reviewStatus(confidence: number, issues: NdieValidationIssue[]) {
  if (issues.some((item) => ["HIGH", "CRITICAL"].includes(item.severity)) || confidence < 0.45) return "MANUAL_CORRECTION_REQUIRED" as const;
  if (issues.length || confidence < 0.82) return "NEEDS_REVIEW" as const;
  return "AUTO_APPROVED" as const;
}

function issueDistribution(issues: NdieValidationIssue[]) {
  return issues.reduce<Record<string, number>>((counts, item) => {
    counts[item.issueType] = (counts[item.issueType] ?? 0) + 1;
    return counts;
  }, {});
}

function riskDistribution(issues: NdieValidationIssue[]) {
  return issues.reduce<Record<NdieValidationRisk, number>>((counts, item) => {
    counts[item.severity] += 1;
    return counts;
  }, { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 });
}

function readiness(issues: NdieValidationIssue[], confidence: number | null): { status: NdiePublishReadiness; reasons: string[] } {
  const critical = issues.filter((item) => item.severity === "CRITICAL");
  const high = issues.filter((item) => item.severity === "HIGH");
  if (critical.length || high.length >= 3 || (confidence ?? 0) < 0.45) {
    return {
      status: "BLOCKED",
      reasons: [...critical, ...high].slice(0, 8).map((item) => item.reason)
    };
  }
  if (issues.length || (confidence ?? 0) < 0.82) {
    return {
      status: "READY_WITH_REVIEW",
      reasons: issues.slice(0, 8).map((item) => item.reason)
    };
  }
  return { status: "READY", reasons: ["All validation signals are above publish threshold."] };
}

function validationFromEvaluation(input: ValidationInput) {
  const providerRuns = asArray(asRecord(input.evaluation).rawProviderOutput);
  return {
    supported: false,
    score: null,
    providers: providerRuns.map((provider) => String(asRecord(provider).providerId)).filter(Boolean),
    notes: ["Provider voting is supported by the contract and will be activated when multiple AI providers are enabled."]
  };
}

export class RuleBasedAiValidatorProvider implements AiProvider {
  readonly id = "ai.rule-based";
  readonly kind = "AI" as const;
  readonly displayName = "NDIE Rule-Based AI Validation and Confidence Engine";
  readonly version = "1.0-gate10";

  isEnabled() {
    return true;
  }

  health() {
    return {
      id: this.id,
      kind: this.kind,
      enabled: true,
      configured: true,
      status: "READY" as const
    };
  }

  async validate(input: ValidationInput) {
    const startedAt = Date.now();
    const issues: NdieValidationIssue[] = [];
    const warnings: NdieValidationIssue[] = [];

    const ocrConfidences = (input.ocrPages ?? []).map((page) => Number(asRecord(page).confidence ?? asRecord(asRecord(page).normalized).confidence)).filter((value) => Number.isFinite(value));
    const pageConfidence = average(ocrConfidences);
    if ((input.ocrPages?.length ?? 0) === 0) {
      warnings.push(issue({ targetType: "OCR", issueType: "LOW_OCR_CONFIDENCE", severity: "MEDIUM", reason: "No normalized OCR pages were available for validation.", recommendedAction: "Run OCR before final teacher review.", impact: 0.1 }));
    } else if (pageConfidence !== null && pageConfidence < 0.72) {
      issues.push(issue({ targetType: "OCR", issueType: "LOW_OCR_CONFIDENCE", severity: "HIGH", reason: `Average OCR confidence is ${pageConfidence.toFixed(2)}.`, recommendedAction: "Review low-confidence pages or rerun OCR with a stronger provider." }));
    }

    const layoutPages = input.layoutPages ?? [];
    if (!layoutPages.length) warnings.push(issue({ targetType: "LAYOUT", issueType: "BROKEN_LAYOUT", severity: "MEDIUM", reason: "No normalized layout pages were available.", recommendedAction: "Run layout analysis before relying on question order." }));

    const formulaElements = input.formulaElements ?? [];
    for (const formula of formulaElements) {
      const record = asRecord(formula);
      const text = String(record.text ?? "");
      const confidence = typeof record.confidence === "number" ? record.confidence : null;
      if (confidence !== null && confidence < 0.65) {
        issues.push(issue({ targetType: "FORMULA", targetId: String(record.id ?? ""), issueType: "BROKEN_LATEX", severity: "HIGH", reason: "Formula confidence is below validation threshold.", recommendedAction: "Teacher should compare formula crop against rendered formula." }));
      }
      if (text.includes("\\frac") && !/[{}]/.test(text)) {
        issues.push(issue({ targetType: "FORMULA", targetId: String(record.id ?? ""), issueType: "BROKEN_LATEX", severity: "HIGH", reason: "Formula appears to contain an incomplete fraction.", recommendedAction: "Open formula editor and correct LaTeX." }));
      }
    }

    const visualElements = input.visualElements ?? [];
    for (const visual of visualElements) {
      const record = asRecord(visual);
      const confidence = typeof record.confidence === "number" ? record.confidence : null;
      if (confidence !== null && confidence < 0.62) {
        issues.push(issue({ targetType: "VISUAL", targetId: String(record.id ?? ""), issueType: "DIAGRAM_MISMATCH", severity: "HIGH", reason: "Visual object confidence is below validation threshold.", recommendedAction: "Review the linked crop and caption in teacher review." }));
      }
    }

    const questionNumbers = input.candidates.map((candidate) => candidate.questionNumber).filter(Boolean) as string[];
    const duplicateQuestions = questionNumbers.filter((questionNumber, index) => questionNumbers.indexOf(questionNumber) !== index);
    for (const questionNumber of new Set(duplicateQuestions)) {
      issues.push(issue({ targetType: "QUESTION", targetId: questionNumber, issueType: "DUPLICATE_QUESTION", severity: "CRITICAL", reason: `Question number ${questionNumber} appears more than once.`, recommendedAction: "Merge or renumber duplicate question candidates." }));
    }

    const answerSet = new Set(input.answerKeys.map((answer) => answer.questionNumber).filter(Boolean));
    const solutionSet = new Set(input.solutions.map((solution) => solution.questionNumber).filter(Boolean));
    const evaluation = input.evaluation as NdieEvaluationDocument | null | undefined;
    if (evaluation?.diagnostics?.duplicateAnswer) {
      issues.push(issue({ targetType: "ANSWER", issueType: "ANSWER_MISMATCH", severity: "HIGH", reason: "Evaluation intelligence found duplicate answer candidates.", recommendedAction: "Teacher should resolve the conflicting answer key rows." }));
    }

    const candidateValidations = input.candidates.map((candidate) => {
      const localIssues: NdieValidationIssue[] = [];
      const options = optionsFrom(candidate);
      const question = questionRecord(candidate);
      const questionDiagnostics = asRecord(question.diagnostics);
      if (candidate.confidence !== null && candidate.confidence !== undefined && candidate.confidence < 0.62) {
        localIssues.push(issue({ targetType: "QUESTION", targetId: candidate.id, issueType: "LOW_OCR_CONFIDENCE", severity: "MEDIUM", reason: `Question ${candidate.questionNumber ?? candidate.id} has low extraction confidence.`, recommendedAction: "Teacher should inspect the original question crop." }));
      }
      if (/MCQ/.test(candidate.questionType) && options.length < 2) {
        localIssues.push(issue({ targetType: "QUESTION", targetId: candidate.id, issueType: "MISSING_OPTIONS", severity: "HIGH", reason: `Question ${candidate.questionNumber ?? candidate.id} has incomplete options.`, recommendedAction: "Add missing options before publishing." }));
      }
      if (questionDiagnostics.missingOptions === true) {
        localIssues.push(issue({ targetType: "QUESTION", targetId: candidate.id, issueType: "MISSING_OPTIONS", severity: "HIGH", reason: `Assessment diagnostics flagged missing options for question ${candidate.questionNumber ?? candidate.id}.`, recommendedAction: "Review option extraction." }));
      }
      if (!answerSet.has(candidate.questionNumber || "")) {
        localIssues.push(issue({ targetType: "ANSWER", targetId: candidate.questionNumber ?? candidate.id, issueType: "MISSING_ANSWER", severity: "HIGH", reason: `No mapped answer for question ${candidate.questionNumber ?? candidate.id}.`, recommendedAction: "Upload or correct the answer key before teacher approval." }));
      }
      if (!solutionSet.has(candidate.questionNumber || "")) {
        warnings.push(issue({ targetType: "SOLUTION", targetId: candidate.questionNumber ?? candidate.id, issueType: "SOLUTION_MISMATCH", severity: "MEDIUM", reason: `No mapped solution for question ${candidate.questionNumber ?? candidate.id}.`, recommendedAction: "Add explanation if this exam requires worked solutions.", impact: 0.06 }));
      }
      issues.push(...localIssues);
      const baseConfidence = candidate.confidence ?? 0.45;
      const penalty = localIssues.reduce((sum, item) => sum + item.confidenceImpact, 0);
      const confidence = Math.max(0.05, Math.min(0.98, Number((baseConfidence - penalty).toFixed(4))));
      return {
        candidateId: candidate.id,
        confidence,
        reviewStatus: reviewStatus(confidence, localIssues),
        issues: localIssues.map((item) => item.reason),
        notes: warnings.filter((item) => item.targetId === (candidate.questionNumber ?? candidate.id)).map((item) => item.reason)
      };
    });

    const questionConfidence = input.candidates.map((candidate) => confidenceItem("QUESTION", candidate.id, candidateValidations.find((validation) => validation.candidateId === candidate.id)?.confidence ?? candidate.confidence ?? null, []));
    const answerConfidence = input.answerKeys.map((answer) => confidenceItem("ANSWER", answer.questionNumber ?? null, answer.confidence ?? null, answer.confidence === null || answer.confidence === undefined ? ["Answer confidence unavailable."] : ["Answer confidence imported from evaluation intelligence."]));
    const solutionConfidence = input.solutions.map((solution) => confidenceItem("SOLUTION", solution.questionNumber ?? null, solution.confidence ?? null, solution.confidence === null || solution.confidence === undefined ? ["Solution confidence unavailable."] : ["Solution confidence imported from evaluation intelligence."]));
    const formulaConfidence = formulaElements.map((formula) => confidenceItem("FORMULA", String(asRecord(formula).id ?? null), typeof asRecord(formula).confidence === "number" ? asRecord(formula).confidence as number : null, ["Formula confidence imported from formula engine."]));
    const visualConfidence = visualElements.map((visual) => confidenceItem("VISUAL", String(asRecord(visual).id ?? null), typeof asRecord(visual).confidence === "number" ? asRecord(visual).confidence as number : null, ["Visual confidence imported from visual engine."]));
    const regionConfidence = layoutPages.map((page, index) => confidenceItem("REGION", String(asRecord(page).pageId ?? `layout-page-${index + 1}`), typeof asRecord(page).confidence === "number" ? asRecord(page).confidence as number : null, ["Layout confidence imported from layout engine."]));
    const pageConfidenceItems = (input.ocrPages ?? []).map((page, index) => confidenceItem("PAGE", String(asRecord(page).pageId ?? `ocr-page-${index + 1}`), typeof asRecord(page).confidence === "number" ? asRecord(page).confidence as number : null, ["OCR confidence imported from OCR engine."]));
    const relationshipConfidence = (input.assessment?.relationships ?? []).map((relationship, index) => confidenceItem("RELATIONSHIP", String(asRecord(relationship).targetId ?? `relationship-${index + 1}`), typeof asRecord(relationship).confidence === "number" ? asRecord(relationship).confidence as number : null, [String(asRecord(relationship).reason ?? "Relationship confidence imported from assessment intelligence.")]));

    const allConfidenceValues = [
      ...candidateValidations.map((validation) => validation.confidence),
      ...answerConfidence.map((item) => item.confidence),
      ...solutionConfidence.map((item) => item.confidence),
      ...formulaConfidence.map((item) => item.confidence),
      ...visualConfidence.map((item) => item.confidence),
      pageConfidence
    ];
    const overallConfidence = average(allConfidenceValues);
    const publishReadiness = readiness([...issues, ...warnings], overallConfidence);
    const recommendations = [...new Set([...issues, ...warnings].map((item) => item.recommendedAction))];

    const validationDocument: NdieValidationDocument = {
      schemaVersion: "ndie-validation-v1",
      validationId: `validation-${input.importJobId}`,
      importJobId: input.importJobId,
      providerId: this.id,
      providerVersion: this.version,
      pipelineVersion: env.NDIE_PIPELINE_VERSION,
      confidence: {
        import: confidenceItem("IMPORT", input.importJobId, overallConfidence, publishReadiness.reasons),
        pages: pageConfidenceItems,
        regions: regionConfidence,
        formulas: formulaConfidence,
        visuals: visualConfidence,
        questions: questionConfidence,
        answers: answerConfidence,
        solutions: solutionConfidence,
        relationships: relationshipConfidence,
        overallExam: confidenceItem("IMPORT", input.importJobId, overallConfidence, recommendations)
      },
      issues,
      warnings,
      recommendations,
      publishReadiness,
      metrics: {
        averageConfidence: overallConfidence,
        issueDistribution: issueDistribution([...issues, ...warnings]),
        riskDistribution: riskDistribution([...issues, ...warnings]),
        publishReadiness: publishReadiness.status,
        providerAgreement: null,
        validationFailures: issues.filter((item) => ["HIGH", "CRITICAL"].includes(item.severity)).length,
        validationDurationMs: Date.now() - startedAt
      },
      providerAgreement: validationFromEvaluation(input),
      rawProviderOutput: {
        provider: this.id,
        strategy: "DETERMINISTIC_LAYER_VALIDATION",
        inputs: {
          ocrPages: input.ocrPages?.length ?? 0,
          layoutPages: input.layoutPages?.length ?? 0,
          formulas: input.formulaElements?.length ?? 0,
          visuals: input.visualElements?.length ?? 0,
          questions: input.candidates.length,
          answers: input.answerKeys.length,
          solutions: input.solutions.length
        }
      },
      checksum: "",
      createdAt: new Date().toISOString()
    };
    validationDocument.checksum = checksum(validationDocument);

    return {
      validation: validationDocument,
      validations: candidateValidations,
      confidence: overallConfidence,
      raw: validationDocument.rawProviderOutput
    };
  }
}
