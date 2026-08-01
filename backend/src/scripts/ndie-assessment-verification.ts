import { RuleBasedQuestionProvider } from "../modules/ndie/question-detector/rule-based-question.provider.js";

async function main() {
  const provider = new RuleBasedQuestionProvider();
  const result = await provider.detect({
    importJobId: "assessment-verification-import",
    ocrPages: [{ pageNumber: 1 }],
    layoutPages: [{ pageNumber: 1 }],
    formulaElements: [{ id: "formula-1" }],
    visualElements: [{ id: "visual-1" }],
    elements: [
      { id: "cover", pageNumber: 1, elementType: "TEXT_REGION", text: "Cover Page NDA Sample Paper", coordinates: { page: 1, x: 0.08, y: 0.04, width: 0.8, height: 0.05, rotation: 0 }, readingOrder: 1, confidence: 0.9 },
      { id: "instructions", pageNumber: 1, elementType: "INSTRUCTION_AREA", text: "General Instructions: Attempt all questions.", coordinates: { page: 1, x: 0.08, y: 0.12, width: 0.8, height: 0.05, rotation: 0 }, readingOrder: 2, confidence: 0.9 },
      { id: "section-a", pageNumber: 1, elementType: "TEXT_REGION", text: "Section A Mathematics", coordinates: { page: 1, x: 0.08, y: 0.18, width: 0.8, height: 0.05, rotation: 0 }, readingOrder: 3, confidence: 0.9 },
      { id: "passage", pageNumber: 1, elementType: "TEXT_REGION", text: "Passage: Read the following case study about motion.", coordinates: { page: 1, x: 0.08, y: 0.24, width: 0.8, height: 0.06, rotation: 0 }, readingOrder: 4, confidence: 0.88 },
      { id: "q1", pageNumber: 1, elementType: "QUESTION_AREA", text: "Q1. Find the acceleration from the line graph. (A) 1 (B) 2 (C) 3 (D) 4 [1 mark]", coordinates: { page: 1, x: 0.08, y: 0.34, width: 0.72, height: 0.08, rotation: 0 }, readingOrder: 5, confidence: 0.91 },
      { id: "visual-graph", pageNumber: 1, elementType: "GRAPH", text: "Line graph with x-axis y-axis origin", coordinates: { page: 1, x: 0.5, y: 0.35, width: 0.32, height: 0.18, rotation: 0 }, readingOrder: 6, confidence: 0.9 },
      { id: "formula-motion", pageNumber: 1, elementType: "FORMULA", text: "v = u + at", coordinates: { page: 1, x: 0.08, y: 0.45, width: 0.2, height: 0.04, rotation: 0 }, readingOrder: 7, confidence: 0.92 },
      { id: "q2", pageNumber: 1, elementType: "QUESTION_AREA", text: "Q2. Match the following Column I with Column II.", coordinates: { page: 1, x: 0.08, y: 0.58, width: 0.72, height: 0.06, rotation: 0 }, readingOrder: 8, confidence: 0.89 },
      { id: "visual-table", pageNumber: 1, elementType: "TABLE", text: "Column I | Column II | Speed | m/s", coordinates: { page: 1, x: 0.08, y: 0.65, width: 0.48, height: 0.12, rotation: 0 }, readingOrder: 9, confidence: 0.87 },
      { id: "q3", pageNumber: 2, elementType: "QUESTION_AREA", text: "Q3. Assertion: Force changes motion. Reason: F = ma.", coordinates: { page: 2, x: 0.08, y: 0.1, width: 0.72, height: 0.08, rotation: 0 }, readingOrder: 1, confidence: 0.86 },
      { id: "formula-force", pageNumber: 2, elementType: "FORMULA", text: "F = ma", coordinates: { page: 2, x: 0.08, y: 0.19, width: 0.18, height: 0.04, rotation: 0 }, readingOrder: 2, confidence: 0.92 }
    ]
  });

  if (result.assessment.schemaVersion !== "ndie-assessment-v1") throw new Error("Assessment schema missing");
  if (result.assessment.questions.length !== 3) throw new Error(`Expected 3 questions, got ${result.assessment.questions.length}`);
  if (!result.assessment.structure.some((node) => node.type === "INSTRUCTIONS")) throw new Error("Instructions not detected");
  if (!result.assessment.structure.some((node) => node.type === "SECTION")) throw new Error("Section not detected");
  if (!result.assessment.structure.some((node) => node.type === "PASSAGE")) throw new Error("Passage not detected");
  if (!result.assessment.questions.some((question) => question.questionType === "GRAPH_BASED")) throw new Error("Graph-based question not detected");
  if (!result.assessment.questions.some((question) => question.questionType === "MATCH_THE_FOLLOWING")) throw new Error("Match question not detected");
  if (!result.assessment.questions.some((question) => question.questionType === "ASSERTION_REASON")) throw new Error("Assertion reason question not detected");
  if (!result.assessment.questions[0].options.length) throw new Error("Options not detected");
  if (!result.assessment.questions[0].visualLinks.length) throw new Error("Visual relationship missing");
  if (!result.assessment.questions[0].formulaLinks.length) throw new Error("Formula relationship missing");

  console.log(JSON.stringify({
    status: "PASS",
    provider: provider.id,
    schemaVersion: result.assessment.schemaVersion,
    questions: result.assessment.metrics.questions,
    sections: result.assessment.metrics.sections,
    passages: result.assessment.metrics.passages,
    options: result.assessment.metrics.options,
    questionTypes: result.assessment.metrics.questionTypes,
    averageConfidence: result.confidence,
    diagnostics: result.assessment.diagnostics.issues
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "FAIL",
    message: error instanceof Error ? error.message : "Assessment verification failed"
  }));
  process.exit(1);
});
