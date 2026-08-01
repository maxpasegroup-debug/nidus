import { createHash } from "node:crypto";
import { env } from "../../../config/env.js";
import type { NdieAssessmentDiagnostics, NdieAssessmentDocument, NdieAssessmentOption, NdieAssessmentRegionType, NdieAssessmentRelationship, NdieNormalizedQuestion, NdieQuestionType } from "../contracts/assessment-result.js";
import type { NdieLayoutBox } from "../contracts/layout-result.js";
import type { QuestionProvider } from "../contracts/providers.js";

type QuestionInput = Parameters<QuestionProvider["detect"]>[0];
type SourceElement = QuestionInput["elements"][number];

const questionStart = /^\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,4})(?:[\).:\-]|\s+)(.+)/i;
const childQuestionStart = /^\s*(?:\(([ivxlcdm]+|[a-z])\)|([a-z])[\).])\s+(.+)/i;
const optionPattern = /(?:^|\s)(?:\(([A-E])\)|([A-E])[\).])\s*([^()]+?)(?=\s*(?:\([A-E]\)|[A-E][\).])\s+|$)/gi;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asBox(raw: unknown, page: number): NdieLayoutBox {
  const source = record(raw);
  const normalized = record(source.normalized);
  const x = Number(source.x ?? normalized.x ?? 0.05);
  const y = Number(source.y ?? normalized.y ?? 0.05);
  const width = Number(source.width ?? normalized.width ?? 0.9);
  const height = Number(source.height ?? normalized.height ?? 0.05);
  const rotation = Number(source.rotation ?? 0);
  const polygon = Array.isArray(source.polygon) ? source.polygon as Array<{ x: number; y: number }> : [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height }
  ];
  return { page, x, y, width, height, rotation, normalized: { x, y, width, height }, polygon };
}

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function elementText(element: SourceElement) {
  return String(element.text ?? "").trim();
}

function structureType(text: string, elementType: string): NdieAssessmentRegionType | null {
  if (/cover page|candidate name|roll number|exam code/i.test(text)) return "COVER_PAGE";
  if (/instructions?|directions?|read carefully|general instructions/i.test(text) || elementType === "INSTRUCTION_AREA") return "INSTRUCTIONS";
  if (/^section\s+[a-z0-9]+/i.test(text)) return "SECTION";
  if (/^subsection|^part\s+[a-z0-9]+/i.test(text)) return "SUBSECTION";
  if (/passage|read the following|case study/i.test(text)) return /case study/i.test(text) ? "PASSAGE" : "PASSAGE";
  if (/answer key|answers?\s*:/i.test(text)) return "ANSWER_KEY_SECTION";
  if (/solutions?|explanations?/i.test(text)) return "SOLUTION_SECTION";
  if (/appendix/i.test(text)) return "APPENDIX";
  if (/references?|source:/i.test(text)) return "REFERENCE";
  if (elementType === "DIAGRAM" || elementType === "IMAGE") return "SHARED_DIAGRAM";
  if (elementType === "GRAPH") return "SHARED_GRAPH";
  if (elementType === "TABLE") return "SHARED_TABLE";
  return null;
}

function detectQuestionType(text: string, elements: SourceElement[]): NdieQuestionType {
  const lower = text.toLowerCase();
  const hasVisual = elements.some((element) => ["DIAGRAM", "IMAGE"].includes(element.elementType));
  const hasGraph = elements.some((element) => element.elementType === "GRAPH");
  const hasTable = elements.some((element) => element.elementType === "TABLE");
  if (/assertion|reason/.test(lower)) return "ASSERTION_REASON";
  if (/match\s+the\s+following|column\s+i|column\s+ii/.test(lower)) return "MATCH_THE_FOLLOWING";
  if (/case study/.test(lower)) return "CASE_STUDY";
  if (/passage|read the following/.test(lower)) return "PASSAGE_BASED";
  if (/true\s*\/\s*false|true or false/.test(lower)) return "TRUE_FALSE";
  if (/fill in the blank|____|blank/.test(lower)) return "FILL_BLANK";
  if (/integer type|nearest integer/.test(lower)) return "INTEGER_TYPE";
  if (/numerical|answer in digits|decimal/.test(lower)) return "NUMERICAL_ANSWER";
  if (/program|code|algorithm/.test(lower)) return "PROGRAMMING";
  if (/upload/.test(lower)) return "FILE_UPLOAD";
  if (/draw|sketch/.test(lower)) return "DRAWING";
  if (/voice|speak/.test(lower)) return "VOICE_RESPONSE";
  if (/\bgraph|chart|plot|x-axis|y-axis|coordinate plane\b/.test(lower)) return "GRAPH_BASED";
  if (/\btable|tabular|column\s+i|column\s+ii\b/.test(lower)) return "TABLE_BASED";
  if (hasGraph) return "GRAPH_BASED";
  if (hasTable) return "TABLE_BASED";
  if (hasVisual) return "DIAGRAM_BASED";
  const options = [...text.matchAll(optionPattern)];
  if (options.length >= 2 && /more than one|multiple correct|choose all/.test(lower)) return "MULTIPLE_CORRECT_MCQ";
  if (options.length >= 2) return "SINGLE_CORRECT_MCQ";
  return "DESCRIPTIVE";
}

function optionsFor(text: string, elements: SourceElement[]): NdieAssessmentOption[] {
  const found = new Map<string, string>();
  for (const match of text.matchAll(optionPattern)) {
    const key = String(match[1] || match[2] || "").toUpperCase();
    const optionText = normalize(String(match[3] || ""));
    if (key && optionText && !found.has(key)) found.set(key, optionText);
  }
  return [...found.entries()].map(([key, optionText]) => {
    const linkedFormulaIds = elements.filter((element) => ["FORMULA", "CHEMICAL_EQUATION"].includes(element.elementType) && optionText.includes(String(element.text ?? ""))).map((element) => element.id);
    const linkedVisualIds = elements.filter((element) => ["TABLE", "GRAPH", "DIAGRAM", "IMAGE"].includes(element.elementType) && optionText.includes(String(element.text ?? ""))).map((element) => element.id);
    return {
      key,
      text: optionText,
      blocks: [{
        type: linkedFormulaIds.length ? "FormulaBlock" : linkedVisualIds.length ? "ImageBlock" : "ParagraphBlock",
        text: optionText,
        sourceElementIds: elements.map((element) => element.id)
      }],
      confidence: 0.76,
      nestedOptions: [],
      visualLinks: linkedVisualIds,
      formulaLinks: linkedFormulaIds,
      tableLinks: elements.filter((element) => element.elementType === "TABLE").map((element) => element.id)
    };
  });
}

function nearby(question: SourceElement[], candidates: SourceElement[]) {
  const qBoxes = question.map((element) => asBox(element.coordinates, element.pageNumber));
  return candidates.filter((candidate) => {
    const box = asBox(candidate.coordinates, candidate.pageNumber);
    return qBoxes.some((qBox) => qBox.page === box.page && Math.abs((qBox.y + qBox.height / 2) - (box.y + box.height / 2)) < 0.3);
  });
}

function diagnosticsFor(input: { number: string; text: string; options: NdieAssessmentOption[]; type: NdieQuestionType; elements: SourceElement[]; expectedNext?: number; confidence: number; visualLinks: string[]; formulaLinks: string[] }): NdieAssessmentDiagnostics {
  const mcq = ["SINGLE_CORRECT_MCQ", "MULTIPLE_CORRECT_MCQ"].includes(input.type);
  const duplicateNumbering = false;
  const brokenNumbering = typeof input.expectedNext === "number" && Number(input.number) !== input.expectedNext;
  const diagnostics: NdieAssessmentDiagnostics = {
    missingOptions: mcq && input.options.length < 2,
    duplicateNumbering,
    brokenNumbering,
    sharedDiagramAmbiguity: input.visualLinks.length > 2,
    questionSplitAcrossPages: new Set(input.elements.map((element) => element.pageNumber)).size > 1,
    lowConfidence: input.confidence < 0.7,
    orphanVisuals: false,
    orphanFormulas: false,
    missingMarks: !/\[\s*\d+\s*(marks?|m)\s*\]|\(\s*\d+\s*(marks?|m)\s*\)/i.test(input.text),
    unsupportedStructures: false,
    issues: []
  };
  if (diagnostics.missingOptions) diagnostics.issues.push("MISSING_OPTIONS");
  if (diagnostics.duplicateNumbering) diagnostics.issues.push("DUPLICATE_NUMBERING");
  if (diagnostics.brokenNumbering) diagnostics.issues.push("BROKEN_NUMBERING");
  if (diagnostics.sharedDiagramAmbiguity) diagnostics.issues.push("SHARED_DIAGRAM_AMBIGUITY");
  if (diagnostics.questionSplitAcrossPages) diagnostics.issues.push("QUESTION_SPLIT_ACROSS_PAGES");
  if (diagnostics.lowConfidence) diagnostics.issues.push("LOW_CONFIDENCE");
  if (diagnostics.missingMarks) diagnostics.issues.push("MISSING_MARKS");
  if (diagnostics.unsupportedStructures) diagnostics.issues.push("UNSUPPORTED_STRUCTURE");
  return diagnostics;
}

function marksFrom(text: string) {
  const match = text.match(/\[\s*(\d+)\s*(marks?|m)\s*\]|\(\s*(\d+)\s*(marks?|m)\s*\)/i);
  return match ? Number(match[1] || match[3]) : null;
}

function bloom(text: string): NdieNormalizedQuestion["bloomLevel"] {
  if (/\bdefine|list|identify|state\b/i.test(text)) return "REMEMBER";
  if (/\bexplain|describe|summarize\b/i.test(text)) return "UNDERSTAND";
  if (/\bsolve|calculate|find|apply\b/i.test(text)) return "APPLY";
  if (/\banalyze|compare|differentiate\b/i.test(text)) return "ANALYZE";
  if (/\bevaluate|justify|critique\b/i.test(text)) return "EVALUATE";
  if (/\bdesign|create|draw|construct\b/i.test(text)) return "CREATE";
  return "UNKNOWN";
}

export class RuleBasedQuestionProvider implements QuestionProvider {
  readonly id = "question.rule-based";
  readonly kind = "QUESTION" as const;
  readonly displayName = "NDIE Rule-Based Assessment Intelligence";
  readonly version = "1.0-gate8";

  isEnabled() {
    return true;
  }

  health() {
    return { id: this.id, kind: this.kind, enabled: true, configured: true, status: "READY" as const };
  }

  async detect(input: QuestionInput) {
    const startedAt = Date.now();
    const elements = input.elements
      .filter((element) => elementText(element))
      .sort((a, b) => a.pageNumber - b.pageNumber || (a.readingOrder ?? 0) - (b.readingOrder ?? 0));
    const structures = elements
      .map((element, index) => ({ element, type: structureType(elementText(element), element.elementType), index }))
      .filter((entry): entry is { element: SourceElement; type: NdieAssessmentRegionType; index: number } => Boolean(entry.type))
      .map((entry, index) => ({
        id: `assessment-${entry.type.toLowerCase()}-${index + 1}`,
        type: entry.type,
        title: normalize(elementText(entry.element)).slice(0, 160),
        pageNumber: entry.element.pageNumber,
        sourceElementIds: [entry.element.id],
        coordinates: asBox(entry.element.coordinates, entry.element.pageNumber),
        readingOrder: entry.element.readingOrder ?? entry.index + 1,
        confidence: Number(entry.element.confidence ?? 0.7)
      }));

    const textElements = elements.filter((element) => !["ANSWER_KEY_SECTION", "SOLUTION_SECTION"].includes(structureType(elementText(element), element.elementType) ?? ""));
    const groups: Array<{ number: string; elements: SourceElement[]; parent?: string | null }> = [];
    let active: { number: string; elements: SourceElement[]; parent?: string | null } | null = null;
    for (const element of textElements) {
      const text = elementText(element);
      const match = text.match(questionStart);
      const childMatch = text.match(childQuestionStart);
      if (match) {
        active = { number: match[1], elements: [element], parent: null };
        groups.push(active);
      } else if (childMatch && active) {
        active.elements.push(element);
      } else if (active && !structureType(text, element.elementType)) {
        active.elements.push(element);
      }
    }
    const fallbackGroups = groups.length ? groups : textElements.length ? [{ number: "1", elements: textElements, parent: null }] : [];
    const visualElements = elements.filter((element) => ["TABLE", "GRAPH", "DIAGRAM", "IMAGE"].includes(element.elementType));
    const formulaElements = elements.filter((element) => ["FORMULA", "CHEMICAL_EQUATION"].includes(element.elementType));

    const normalizedQuestions = fallbackGroups.map((group, index): NdieNormalizedQuestion => {
      const relatedVisuals = nearby(group.elements, visualElements);
      const relatedFormulas = nearby(group.elements, formulaElements);
      const text = normalize(group.elements.map((element) => elementText(element)).join(" "));
      const options = optionsFor(text, [...group.elements, ...relatedVisuals, ...relatedFormulas]);
      const type = detectQuestionType(text, [...group.elements, ...relatedVisuals, ...relatedFormulas]);
      const confidence = Number((0.62 + (questionStart.test(elementText(group.elements[0])) ? 0.16 : 0) + (options.length ? 0.08 : 0) + (relatedVisuals.length || relatedFormulas.length ? 0.04 : 0)).toFixed(4));
      const visualLinks = relatedVisuals.map((element) => element.id);
      const formulaLinks = relatedFormulas.map((element) => element.id);
      const relationships: NdieAssessmentRelationship[] = [
        ...visualLinks.map((id) => ({ relationshipType: visualElements.find((element) => element.id === id)?.elementType === "TABLE" ? "TABLE" as const : visualElements.find((element) => element.id === id)?.elementType === "GRAPH" ? "GRAPH" as const : "DIAGRAM" as const, targetId: id, confidence: 0.7, reason: "Nearby visual region linked by page coordinates." })),
        ...formulaLinks.map((id) => ({ relationshipType: "FORMULA" as const, targetId: id, confidence: 0.72, reason: "Nearby formula region linked by page coordinates." })),
        ...group.elements.map((element) => ({ relationshipType: "LAYOUT" as const, targetId: element.id, confidence: element.confidence ?? 0.7, reason: "Source layout/OCR element used by question group." }))
      ];
      const diagnostics = diagnosticsFor({ number: group.number, text, options, type, elements: group.elements, expectedNext: index + 1, confidence, visualLinks, formulaLinks });
      const questionId = `question-${group.number}-${createHash("sha1").update(`${input.importJobId}:${group.number}:${text}`).digest("hex").slice(0, 10)}`;
      return {
        schemaVersion: "ndie-question-v1",
        questionId,
        questionNumber: group.number,
        questionType: type,
        parentQuestionId: group.parent ?? null,
        childQuestionIds: [],
        linkedQuestionIds: [],
        sectionId: structures.filter((node) => node.type === "SECTION" && node.readingOrder <= (group.elements[0]?.readingOrder ?? 0)).at(-1)?.id ?? null,
        passageId: structures.filter((node) => node.type === "PASSAGE" && node.readingOrder <= (group.elements[0]?.readingOrder ?? 0)).at(-1)?.id ?? null,
        sharedResourceIds: [...visualLinks, ...formulaLinks],
        marks: marksFrom(text),
        difficulty: "UNKNOWN",
        subject: null,
        topic: null,
        bloomLevel: bloom(text),
        text,
        options,
        relationships,
        visualLinks,
        formulaLinks,
        ocrLinks: group.elements.map((element) => element.id),
        layoutLinks: group.elements.map((element) => element.id),
        boundingBoxes: group.elements.map((element) => asBox(element.coordinates, element.pageNumber)),
        readingOrder: group.elements[0]?.readingOrder ?? index + 1,
        confidence,
        diagnostics,
        version: 1,
        pipelineVersion: env.NDIE_PIPELINE_VERSION,
        checksum: createHash("sha256").update(JSON.stringify({ questionId, text, options, relationships })).digest("hex")
      };
    });

    const duplicateNumbers = normalizedQuestions.filter((question, index) => normalizedQuestions.findIndex((other) => other.questionNumber === question.questionNumber) !== index);
    const orphanVisuals = visualElements.filter((visual) => !normalizedQuestions.some((question) => question.visualLinks.includes(visual.id)));
    const orphanFormulas = formulaElements.filter((formula) => !normalizedQuestions.some((question) => question.formulaLinks.includes(formula.id)));
    for (const question of normalizedQuestions) {
      if (duplicateNumbers.some((item) => item.questionNumber === question.questionNumber)) {
        question.diagnostics.duplicateNumbering = true;
        question.diagnostics.issues.push("DUPLICATE_NUMBERING");
      }
      if (orphanVisuals.length) question.diagnostics.orphanVisuals = true;
      if (orphanFormulas.length) question.diagnostics.orphanFormulas = true;
    }

    const allDiagnostics: NdieAssessmentDiagnostics = {
      missingOptions: normalizedQuestions.some((question) => question.diagnostics.missingOptions),
      duplicateNumbering: duplicateNumbers.length > 0,
      brokenNumbering: normalizedQuestions.some((question) => question.diagnostics.brokenNumbering),
      sharedDiagramAmbiguity: normalizedQuestions.some((question) => question.diagnostics.sharedDiagramAmbiguity),
      questionSplitAcrossPages: normalizedQuestions.some((question) => question.diagnostics.questionSplitAcrossPages),
      lowConfidence: normalizedQuestions.some((question) => question.diagnostics.lowConfidence),
      orphanVisuals: orphanVisuals.length > 0,
      orphanFormulas: orphanFormulas.length > 0,
      missingMarks: normalizedQuestions.some((question) => question.diagnostics.missingMarks),
      unsupportedStructures: false,
      issues: Array.from(new Set(normalizedQuestions.flatMap((question) => question.diagnostics.issues)))
    };
    if (allDiagnostics.orphanVisuals) allDiagnostics.issues.push("ORPHAN_VISUALS");
    if (allDiagnostics.orphanFormulas) allDiagnostics.issues.push("ORPHAN_FORMULAS");

    const questionTypeDistribution = normalizedQuestions.reduce<Record<string, number>>((acc, question) => {
      acc[question.questionType] = (acc[question.questionType] ?? 0) + 1;
      return acc;
    }, {});
    const confidence = normalizedQuestions.length ? Number((normalizedQuestions.reduce((sum, question) => sum + Number(question.confidence ?? 0), 0) / normalizedQuestions.length).toFixed(4)) : null;
    const assessment: NdieAssessmentDocument = {
      schemaVersion: "ndie-assessment-v1",
      providerId: this.id,
      providerVersion: this.version,
      pipelineVersion: env.NDIE_PIPELINE_VERSION,
      importJobId: input.importJobId,
      structure: structures,
      questions: normalizedQuestions,
      relationships: normalizedQuestions.flatMap((question) => question.relationships),
      diagnostics: allDiagnostics,
      metrics: {
        questions: normalizedQuestions.length,
        sections: structures.filter((node) => node.type === "SECTION").length,
        groups: structures.filter((node) => node.type === "QUESTION_GROUP").length,
        passages: structures.filter((node) => node.type === "PASSAGE").length,
        options: normalizedQuestions.reduce((sum, question) => sum + question.options.length, 0),
        questionTypes: questionTypeDistribution,
        averageConfidence: confidence,
        reviewRequired: normalizedQuestions.filter((question) => question.diagnostics.issues.length || Number(question.confidence ?? 0) < 0.8).length
      },
      rawProviderOutput: {
        elementCount: elements.length,
        visualElementCount: visualElements.length,
        formulaElementCount: formulaElements.length,
        ocrPages: input.ocrPages?.length ?? 0,
        layoutPages: input.layoutPages?.length ?? 0
      },
      checksum: createHash("sha256").update(JSON.stringify({ structures, normalizedQuestions, questionTypeDistribution })).digest("hex"),
      durationMs: Date.now() - startedAt,
      createdAt: new Date().toISOString()
    };
    return {
      assessment,
      questions: normalizedQuestions.map((question) => ({
        questionNumber: question.questionNumber,
        questionType: question.questionType,
        text: question.text,
        sourceElementIds: question.layoutLinks,
        sourceMap: {
          firstPage: question.boundingBoxes[0]?.page ?? 1,
          lastPage: question.boundingBoxes.at(-1)?.page ?? question.boundingBoxes[0]?.page ?? 1,
          coordinates: question.boundingBoxes[0] ?? null,
          relationships: question.relationships,
          normalizedQuestionId: question.questionId
        },
        confidence: Number(question.confidence ?? 0),
        normalizedQuestion: question
      })),
      confidence,
      raw: assessment.rawProviderOutput
    };
  }
}
