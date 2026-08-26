import type { Prisma } from "../../../generated/prisma/client.js";

const KNOWN_TYPES = new Set([
  "MCQ", "SINGLE_CORRECT_MCQ", "MULTIPLE_CORRECT_MCQ", "TRUE_FALSE", "FILL_BLANK",
  "NUMERICAL_ANSWER", "INTEGER_TYPE", "MATCH_THE_FOLLOWING", "ASSERTION_REASON",
  "PASSAGE_BASED", "CASE_STUDY", "DIAGRAM_BASED", "GRAPH_BASED", "TABLE_BASED",
  "DESCRIPTIVE", "PROGRAMMING", "FILE_UPLOAD", "DRAWING", "VOICE_RESPONSE"
]);
const OPTION_TYPES = new Set(["MCQ", "SINGLE_CORRECT_MCQ", "MULTIPLE_CORRECT_MCQ", "ASSERTION_REASON"]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function answerValue(value: unknown) {
  const answer = record(value);
  const values = Array.isArray(answer.correctOptions) ? answer.correctOptions : [];
  return String(answer.correctOption ?? answer.correctAnswer ?? answer.answer ?? values[0] ?? "").trim().toUpperCase();
}

function optionRows(candidateJson: unknown) {
  const root = record(candidateJson);
  const assessment = record(root.assessment ?? root);
  const assessmentOptions = Array.isArray(assessment.options) ? assessment.options.map(record) : [];
  if (assessmentOptions.length) return assessmentOptions.map((option) => ({ key: String(option.key ?? "").toUpperCase(), text: String(option.text ?? "").trim() }));
  const blocks = Array.isArray(root.blocks) ? root.blocks.map(record) : [];
  return blocks.filter((block) => block.type === "OptionBlock").map((block) => {
    const nested = Array.isArray(block.blocks) ? block.blocks.map(record) : [];
    return { key: String(block.key ?? "").toUpperCase(), text: nested.map((item) => String(item.text ?? "")).join(" ").trim() };
  });
}

function questionText(candidateJson: unknown) {
  const root = record(candidateJson);
  const assessment = record(root.assessment ?? root);
  if (String(assessment.text ?? "").trim()) return String(assessment.text).trim();
  const blocks = Array.isArray(root.blocks) ? root.blocks.map(record) : [];
  return blocks.filter((block) => block.type === "ParagraphBlock").map((block) => String(block.text ?? "")).join("\n").trim();
}

function validFormulaBlocks(candidateJson: unknown) {
  const root = record(candidateJson);
  const blocks = Array.isArray(root.blocks) ? root.blocks.map(record) : [];
  return blocks.filter((block) => block.type === "FormulaBlock").every((block) => {
    const latex = String(block.latex ?? "");
    const braces = [...latex].reduce((count, char) => count + (char === "{" ? 1 : char === "}" ? -1 : 0), 0);
    return Boolean(latex.trim() || String(block.mathMl ?? "").trim() || String(block.formulaImageUrl ?? "").trim()) && braces === 0;
  });
}

export type CandidateIntegrityInput = {
  questionType: string;
  candidateJson: Prisma.JsonValue | Prisma.InputJsonValue | unknown;
  sourceMap: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined;
  answerJson?: Prisma.JsonValue | Prisma.InputJsonValue | null;
  availableAssetIds?: Set<string>;
};

export function validateCandidateIntegrity(input: CandidateIntegrityInput) {
  const errors: string[] = [];
  const type = String(input.questionType ?? "").toUpperCase();
  const root = record(input.candidateJson);
  const assessment = record(root.assessment ?? root);
  const metadata = record(root.metadata);
  const options = optionRows(input.candidateJson);
  const optionKeys = options.map((option) => option.key);
  const optionTexts = options.map((option) => option.text.toLowerCase());
  const answer = answerValue(input.answerJson ?? root.answer);
  const marks = Number(assessment.marks ?? metadata.marks);
  const source = record(input.sourceMap);

  if (!questionText(input.candidateJson)) errors.push("Question text is empty.");
  if (!KNOWN_TYPES.has(type)) errors.push(`Question type ${type || "UNKNOWN"} is not recognized.`);
  if (!Number.isFinite(marks) || marks <= 0) errors.push("Question marks must be a positive number.");
  if (!Object.keys(source).length) errors.push("Original source page evidence is missing.");

  if (OPTION_TYPES.has(type)) {
    if (options.length !== 4 || !["A", "B", "C", "D"].every((key) => optionKeys.includes(key))) errors.push("Four labelled options (A-D) are required.");
    if (options.some((option) => !option.text)) errors.push("An answer option is empty.");
    if (new Set(optionTexts).size !== optionTexts.length) errors.push("Duplicate answer options are not allowed.");
    if (!answer) errors.push("A teacher-verified answer is required.");
    if (answer && !optionKeys.includes(answer)) errors.push("The selected answer is not one of the available options.");
  } else if (!answer) {
    errors.push("A teacher-verified answer or marking response is required.");
  }

  if (!validFormulaBlocks(input.candidateJson)) errors.push("A formula block is incomplete or malformed.");

  const visualLinks = [
    ...(Array.isArray(metadata.visualLinks) ? metadata.visualLinks : []),
    ...(Array.isArray(root.visualLinks) ? root.visualLinks : [])
  ].map(String);
  if (input.availableAssetIds && visualLinks.some((id) => !input.availableAssetIds?.has(id))) errors.push("A linked visual asset is missing.");

  const aiValidation = record(source.aiValidation);
  const unresolved = Array.isArray(aiValidation.issues) ? aiValidation.issues.map(record).filter((issue) => issue.blockPublish === true || String(issue.severity ?? "").toUpperCase() === "CRITICAL") : [];
  if (unresolved.length) errors.push("A critical document finding still needs resolution.");

  return { valid: errors.length === 0, errors, answer, marks, optionCount: options.length };
}

export function assertCandidateIntegrity(input: CandidateIntegrityInput) {
  const result = validateCandidateIntegrity(input);
  if (!result.valid) throw Object.assign(new Error(`Question cannot be approved. ${result.errors.join(" ")}`), { statusCode: 400, validation: result });
  return result;
}
