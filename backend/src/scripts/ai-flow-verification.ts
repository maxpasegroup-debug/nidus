import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const schema = read("prisma/schema.prisma");
const learningService = read("src/modules/learning-stability/learning-stability.service.ts");
const learningRoutes = read("src/modules/learning-stability/learning-stability.routes.ts");
const testsService = read("src/modules/tests/tests.service.ts");
const psychometricService = read("src/modules/psychometric/psychometric.service.ts");
const openaiService = read("src/modules/ai-engine/openai.service.ts");

for (const model of ["AITutorFeedback", "AIResponseCache", "LearningTopicInsight", "RevisionQueueItem", "CBTIntelligenceReport", "ContentIngestionJob", "GeneratedContentAsset"]) {
  assert.match(schema, new RegExp(`model ${model}`), `${model} model must exist`);
}

assert.match(openaiService, /aIResponseCache/, "AI response caching must be implemented");
assert.match(openaiService, /tokenUsage/, "AI token tracking must be retained");
assert.match(learningService, /sanitizePrompt/, "prompt sanitization must exist");
assert.match(learningService, /supportedExams/, "defence exam tutor support list must exist");
assert.match(learningService, /tutorFeedback/, "AI tutor feedback loop must exist");
assert.match(learningService, /adaptiveLearning/, "adaptive learning endpoint logic must exist");
assert.match(learningService, /dailyIssueDraft[\s\S]*callOpenAIJson/, "Daily Intelligence generation must call AI generation service");
assert.match(learningService, /createIngestionJob/, "content ingestion architecture must exist");
assert.match(learningService, /aiGovernance/, "AI governance analytics must exist");
assert.match(learningRoutes, /\/adaptive/, "adaptive learning route must exist");
assert.match(learningRoutes, /\/content\/generate/, "AI content generation route must exist");
assert.match(learningRoutes, /\/ingestion\/jobs/, "content ingestion routes must exist");
assert.match(learningRoutes, /\/ai-governance/, "AI governance route must exist");
assert.match(testsService, /intelligenceReport/, "CBT intelligence report must exist");
assert.match(testsService, /rankPrediction/, "CBT rank prediction shell must exist");
assert.match(psychometricService, /interviewReadiness/, "psychometric interview readiness shell must exist");
assert.match(psychometricService, /TAT.*WAT.*SRT.*SD.*OLQ/, "psychometric frameworks must be represented");

console.log("AI and content intelligence verification checks passed.");
