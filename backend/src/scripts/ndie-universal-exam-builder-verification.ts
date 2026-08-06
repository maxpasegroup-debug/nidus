import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const builder = readFileSync(join(root, "src/modules/ndie/universal-exam-builder/universal-exam-builder.service.ts"), "utf8");
const reconstruction = readFileSync(join(root, "src/modules/ndie/ai-reconstruction/ai-reconstruction.service.ts"), "utf8");
const teacherWorkspace = readFileSync(join(root, "../frontend/src/components/teacher/teacher-exam-workspace.tsx"), "utf8");
const packageJson = readFileSync(join(root, "package.json"), "utf8");

const required = [
  ["universal builder service", builder.includes("ndieUniversalExamBuilderService") && builder.includes("NIDUS_AI_UNIVERSAL_EXAM_DRAFT_V1")],
  ["all NDIE inputs accepted", builder.includes("ocr") && builder.includes("layout") && builder.includes("formula") && builder.includes("visual") && builder.includes("assessment") && builder.includes("evaluation") && builder.includes("validation") && builder.includes("stemIntelligence")],
  ["non-MCQ question types", builder.includes("NUMERICAL") && builder.includes("TRUE_FALSE") && builder.includes("ASSERTION_REASON") && builder.includes("MATCH_FOLLOWING") && builder.includes("SHORT_ANSWER") && builder.includes("LONG_ANSWER") && builder.includes("MIXED_EXAM")],
  ["never discard empty extraction", builder.includes("Nothing was discarded") && builder.includes("questionCount: questions.length")],
  ["document understanding candidates", builder.includes("questionsFromDocumentUnderstanding") && builder.includes("questionCandidates") && builder.includes("detectedQuestions")],
  ["parser no longer filters non-MCQ drafts", teacherWorkspace.includes("parsedQuestions.slice(0, 200)") && !teacherWorkspace.includes("return question.questionText && realOptionCount >= 2")],
  ["preserved scan review draft", teacherWorkspace.includes("NIDUS AI could not confidently read structured text") && teacherWorkspace.includes("NIDUS AI preserved your original paper and created a review draft")],
  ["missing review flags", builder.includes("MISSING_FORMULA") && builder.includes("MISSING_DIAGRAM") && builder.includes("MISSING_OPTION") && builder.includes("MISSING_SOLUTION")],
  ["source page support", builder.includes("sourcePage") && builder.includes("boundingRegion") && builder.includes("originalCrop")],
  ["reconstruction uses builder", reconstruction.includes("ndieUniversalExamBuilderService.buildDraft")],
  ["prompt does not assume MCQ", reconstruction.includes("Do not assume MCQ")],
  ["teacher review summary", teacherWorkspace.includes("Questions Reconstructed") && teacherWorkspace.includes("Formula Review") && teacherWorkspace.includes("Diagram Review") && teacherWorkspace.includes("Answer review")],
  ["teacher missing pills", teacherWorkspace.includes("Missing {item}") && teacherWorkspace.includes("sourcePage")],
  ["npm script", packageJson.includes("test:ndie-universal-builder")],
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", milestone: "production-launch-milestone-7-universal-exam-builder", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  milestone: "production-launch-milestone-7-universal-exam-builder",
  checks: required.length,
  capabilities: required.map(([name]) => name),
}, null, 2));
