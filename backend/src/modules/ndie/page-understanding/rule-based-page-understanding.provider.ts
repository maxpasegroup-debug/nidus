import { createHash } from "node:crypto";
import type {
  DocumentUnderstandingProvider,
  NdiePageSubjectSignal,
  NdiePageUnderstandingBox,
  NdiePageUnderstandingInput,
  NdiePageUnderstandingPage,
  NdiePageUnderstandingRegion,
  NdiePageUnderstandingRelationship,
  NdiePageUnderstandingResult,
  NdiePageUnderstandingRisk,
  NdiePageUnderstandingType
} from "../contracts/page-understanding-result.js";

const formulaPattern = /\\frac|\\sqrt|\\int|\\sum|\\lim|matrix|determinant|dy\/dx|\^\d|\\u221a|\\u222b|\\u2211|lim\\b|vector|sin|cos|tan/i;
const physicsPattern = /force|velocity|acceleration|current|voltage|resistor|circuit|lens|mirror|work|energy|momentum|thermodynamic|magnetic|electric field|unit|m\/s|newton|joule/i;
const chemistryPattern = /benzene|organic|reaction|equation|molecule|compound|ionic|redox|oxidation|coordination|NaCl|H2O|H_2|CO2|->|\\u2192|charge|cation|anion|\(aq\)|\(s\)|\(g\)/i;
const biologyPattern = /cell|organ|tissue|genetics|plant|animal|biology|neuron|digestive|respiratory/i;
const questionPattern = /(?:^|\n|\s)(?:q\.?\s*)?\d{1,3}[).:-]|which of the following|calculate|find the|prove that|explain/i;
const answerKeyPattern = /answer key|solutions? key|(?:^|\n)\s*(?:q\.?\s*)?\d{1,3}\s*(?:-|:|\)|\.)?\s*[A-E](?:\s|$)/i;
const solutionPattern = /solution|explanation|therefore|hence|step\s*\d|working/i;
const instructionPattern = /instructions?|maximum marks|duration|attempt all|section\s+[a-z]|general instructions/i;
const graphPattern = /graph|axis|axes|curve|plot|coordinate plane|histogram|slope|origin/i;
const tablePattern = /table|row|column|tabular|following data|\|.+\|/i;
const diagramPattern = /diagram|figure|fig\.|shown below|circuit|triangle|circle|structure|map|flow chart/i;
const optionPattern = /(?:^|\n|\s)[(]?[A-E][).]\s+|\boption\s+[A-E]\b/i;

function stableHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 10000) / 10000));
}

function defaultBox(page: number, index = 0): NdiePageUnderstandingBox {
  const y = Math.min(0.88, 0.08 + index * 0.12);
  return {
    page,
    x: 0.06,
    y,
    width: 0.88,
    height: 0.1,
    rotation: 0,
    normalized: { x: 0.06, y, width: 0.88, height: 0.1 },
    polygon: [
      { x: 0.06, y },
      { x: 0.94, y },
      { x: 0.94, y: y + 0.1 },
      { x: 0.06, y: y + 0.1 }
    ]
  };
}

function boxFrom(value: unknown, page: number, index = 0): NdiePageUnderstandingBox {
  const source = record(value);
  const normalized = record(source.normalized);
  const fallback = defaultBox(page, index);
  const x = Number(source.x ?? normalized.x ?? fallback.x);
  const y = Number(source.y ?? normalized.y ?? fallback.y);
  const width = Number(source.width ?? normalized.width ?? fallback.width);
  const height = Number(source.height ?? normalized.height ?? fallback.height);
  const rotation = Number(source.rotation ?? fallback.rotation);
  const polygon = toArray(source.polygon).map((point) => record(point)).filter((point) => Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y))).map((point) => ({ x: Number(point.x), y: Number(point.y) }));
  return {
    page,
    x,
    y,
    width,
    height,
    rotation,
    normalized: { x, y, width, height },
    polygon: polygon.length >= 4 ? polygon : [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ]
  };
}

function collectLayoutRegions(page: NdiePageUnderstandingInput["pages"][number]): NdiePageUnderstandingRegion[] {
  const layout = record(page.layoutJson);
  const candidates = [layout.regions, layout.elements, layout.lines, layout.paragraphs].flatMap(toArray);
  return candidates.slice(0, 120).map((item, index) => {
    const element = record(item);
    const text = typeof element.text === "string" ? element.text : typeof element.normalizedText === "string" ? element.normalizedText : null;
    const elementType = String(element.elementType ?? element.type ?? "UNKNOWN").toUpperCase();
    const role = elementType.includes("QUESTION") ? "QUESTION"
      : elementType.includes("OPTION") ? "OPTION"
      : elementType.includes("ANSWER") ? "ANSWER"
      : elementType.includes("SOLUTION") ? "SOLUTION"
      : elementType.includes("TABLE") ? "TABLE"
      : elementType.includes("GRAPH") ? "GRAPH"
      : elementType.includes("DIAGRAM") || elementType.includes("FIGURE") || elementType.includes("IMAGE") ? "VISUAL"
      : questionPattern.test(text ?? "") ? "QUESTION"
      : optionPattern.test(text ?? "") ? "OPTION"
      : formulaPattern.test(text ?? "") ? "FORMULA"
      : answerKeyPattern.test(text ?? "") ? "ANSWER"
      : solutionPattern.test(text ?? "") ? "SOLUTION"
      : instructionPattern.test(text ?? "") ? "INSTRUCTION"
      : "UNKNOWN";
    return {
      id: String(element.id ?? `layout-${page.pageNumber}-${index + 1}`),
      page: page.pageNumber,
      role,
      text,
      box: boxFrom(element.coordinates ?? element.box ?? element.boundingBox, page.pageNumber, index),
      sourceIds: [String(element.id ?? `layout-${page.pageNumber}-${index + 1}`)],
      readingOrder: Number(element.readingOrder ?? index + 1),
      confidence: clamp01(Number(element.confidence ?? 0.68))
    };
  });
}

function collectFormulaRegions(page: NdiePageUnderstandingInput["pages"][number], offset: number): NdiePageUnderstandingRegion[] {
  const formulas = toArray(record(page.formulaJson).formulas ?? record(page.formulaJson).elements);
  return formulas.slice(0, 80).map((item, index) => {
    const formula = record(item);
    const id = String(formula.formulaId ?? formula.id ?? `formula-${page.pageNumber}-${index + 1}`);
    return {
      id,
      page: page.pageNumber,
      role: "FORMULA",
      text: String(formula.latex ?? formula.plainText ?? formula.text ?? "Formula"),
      box: boxFrom(formula.coordinates ?? formula.box ?? formula.boundingBox, page.pageNumber, offset + index),
      sourceIds: [id],
      readingOrder: Number(formula.readingOrder ?? offset + index + 1),
      confidence: clamp01(Number(formula.confidence ?? 0.72))
    };
  });
}

function collectVisualRegions(page: NdiePageUnderstandingInput["pages"][number], offset: number): NdiePageUnderstandingRegion[] {
  const visuals = toArray(record(page.visualJson).visuals ?? record(page.visualJson).elements);
  return visuals.slice(0, 80).map((item, index) => {
    const visual = record(item);
    const type = String(visual.visualType ?? visual.elementType ?? visual.type ?? "VISUAL").toUpperCase();
    const role = type.includes("TABLE") ? "TABLE" : type.includes("GRAPH") || type.includes("CHART") ? "GRAPH" : "VISUAL";
    const id = String(visual.visualId ?? visual.id ?? `visual-${page.pageNumber}-${index + 1}`);
    return {
      id,
      page: page.pageNumber,
      role,
      text: typeof visual.caption === "string" ? visual.caption : typeof visual.text === "string" ? visual.text : type,
      box: boxFrom(visual.coordinates ?? visual.box ?? visual.boundingBox, page.pageNumber, offset + index),
      sourceIds: [id],
      readingOrder: Number(visual.readingOrder ?? offset + index + 1),
      confidence: clamp01(Number(visual.confidence ?? 0.7))
    };
  });
}

function fallbackRegions(page: NdiePageUnderstandingInput["pages"][number]): NdiePageUnderstandingRegion[] {
  const lines = String(page.ocrText ?? "").split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 60);
  return lines.map((line, index) => ({
    id: `ocr-line-${page.pageNumber}-${index + 1}`,
    page: page.pageNumber,
    role: formulaPattern.test(line) ? "FORMULA" : optionPattern.test(line) ? "OPTION" : questionPattern.test(line) ? "QUESTION" : answerKeyPattern.test(line) ? "ANSWER" : solutionPattern.test(line) ? "SOLUTION" : instructionPattern.test(line) ? "INSTRUCTION" : "UNKNOWN",
    text: line,
    box: defaultBox(page.pageNumber, index),
    sourceIds: [`ocr-line-${page.pageNumber}-${index + 1}`],
    readingOrder: index + 1,
    confidence: 0.52
  }));
}

function subjectSignals(text: string): NdiePageUnderstandingPage["subjectSignals"] {
  const signals = [
    { subject: "MATHEMATICS" as const, confidence: formulaPattern.test(text) ? 0.78 : /math|algebra|calculus|geometry|trigonometry|matrix|probability/i.test(text) ? 0.7 : 0.05, reasons: ["formula and mathematics vocabulary"] },
    { subject: "PHYSICS" as const, confidence: physicsPattern.test(text) ? 0.76 : 0.04, reasons: ["physics units, diagrams and equation vocabulary"] },
    { subject: "CHEMISTRY" as const, confidence: chemistryPattern.test(text) ? 0.76 : 0.04, reasons: ["chemical equations, structures and notation"] },
    { subject: "BIOLOGY" as const, confidence: biologyPattern.test(text) ? 0.7 : 0.03, reasons: ["biology diagram and concept vocabulary"] }
  ].filter((signal) => signal.confidence >= 0.2);
  return signals.length ? signals : [{ subject: "UNKNOWN" as const, confidence: 0.35, reasons: ["insufficient subject evidence"] }];
}

function pageType(text: string, regions: NdiePageUnderstandingRegion[], pageNumber: number): NdiePageUnderstandingType {
  if (pageNumber === 1 && /name|roll no|instructions?|maximum marks|duration/i.test(text) && !questionPattern.test(text)) return "COVER_PAGE";
  if (answerKeyPattern.test(text) || regions.filter((region) => region.role === "ANSWER").length >= 3) return "ANSWER_KEY_PAGE";
  if (solutionPattern.test(text) || regions.filter((region) => region.role === "SOLUTION").length >= 2) return "SOLUTION_PAGE";
  if (instructionPattern.test(text) && regions.filter((region) => region.role === "QUESTION").length === 0) return "INSTRUCTION_PAGE";
  if (regions.some((region) => region.role === "QUESTION") && (regions.some((region) => region.role === "ANSWER") || regions.some((region) => region.role === "SOLUTION"))) return "MIXED_PAGE";
  if (regions.some((region) => region.role === "QUESTION") || questionPattern.test(text)) return "QUESTION_PAGE";
  return "UNKNOWN_PAGE";
}

function risks(page: NdiePageUnderstandingInput["pages"][number], text: string, regions: NdiePageUnderstandingRegion[]): NdiePageUnderstandingRisk[] {
  const output = new Set<NdiePageUnderstandingRisk>();
  const formulaCount = regions.filter((region) => region.role === "FORMULA").length + (text.match(formulaPattern)?.length ?? 0);
  const visualCount = regions.filter((region) => region.role === "VISUAL" || region.role === "GRAPH" || region.role === "TABLE").length;
  if (!page.pageImageUrl) output.add("MISSING_PAGE_IMAGE");
  if (formulaCount > 0) output.add("FORMULA_HEAVY");
  if (visualCount > 0 || diagramPattern.test(text)) output.add("DIAGRAM_HEAVY");
  if (graphPattern.test(text) || regions.some((region) => region.role === "GRAPH")) output.add("GRAPH_HEAVY");
  if (tablePattern.test(text) || regions.some((region) => region.role === "TABLE")) output.add("TABLE_HEAVY");
  if (/benzene|organic structure|lewis|reaction mechanism|skeletal structure/i.test(text)) output.add("CHEMISTRY_STRUCTURE_HEAVY");
  if (/handwritten|camera|blur|faint|low quality/i.test(text)) output.add("HANDWRITING_RISK");
  if (regions.length === 0 || String(page.ocrText ?? "").trim().length < 25) output.add("LOW_TEXT_CONFIDENCE");
  if (/column|two column|three column/i.test(text)) output.add("MULTI_COLUMN_RISK");
  if (/continued|contd|next page/i.test(text)) output.add("QUESTION_SPLIT_RISK");
  return Array.from(output);
}

function relationships(regions: NdiePageUnderstandingRegion[]): NdiePageUnderstandingRelationship[] {
  const questions = regions.filter((region) => region.role === "QUESTION");
  const dependents = regions.filter((region) => ["FORMULA", "VISUAL", "TABLE", "GRAPH", "OPTION", "ANSWER"].includes(region.role));
  return questions.flatMap((question) => dependents
    .filter((item) => Math.abs(item.readingOrder - question.readingOrder) <= 6 || (item.box.y >= question.box.y && item.box.y <= question.box.y + 0.35))
    .slice(0, 12)
    .map((item) => ({
      from: question.id,
      to: item.id,
      type: item.role === "FORMULA" ? "USES_FORMULA" as const : item.role === "OPTION" ? "HAS_OPTION" as const : item.role === "ANSWER" ? "HAS_ANSWER" as const : "USES_VISUAL" as const,
      confidence: clamp01((question.confidence + item.confidence) / 2),
      reason: "same page reading order and spatial proximity"
    })));
}

function dominantSubject(pages: NdiePageUnderstandingPage[]): NdiePageSubjectSignal {
  const scores = new Map<NdiePageSubjectSignal, number>();
  for (const page of pages) {
    for (const signal of page.subjectSignals) scores.set(signal.subject, (scores.get(signal.subject) ?? 0) + signal.confidence);
  }
  return Array.from(scores.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "UNKNOWN";
}

export class RuleBasedPageUnderstandingProvider implements DocumentUnderstandingProvider {
  readonly id = "document-understanding.rule-based";
  readonly kind = "DOCUMENT_UNDERSTANDING" as const;
  readonly displayName = "NDIE Rule-Based Multimodal Page Understanding";
  readonly version = "2.0-phase2";

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

  async understand(input: NdiePageUnderstandingInput): Promise<NdiePageUnderstandingResult> {
    const startedAt = Date.now();
    const pages = input.pages.map((page): NdiePageUnderstandingPage => {
      const pageStartedAt = Date.now();
      const layoutRegions = collectLayoutRegions(page);
      const formulaRegions = collectFormulaRegions(page, layoutRegions.length);
      const visualRegions = collectVisualRegions(page, layoutRegions.length + formulaRegions.length);
      const regions = [...layoutRegions, ...formulaRegions, ...visualRegions];
      const finalRegions = regions.length ? regions : fallbackRegions(page);
      const text = [page.ocrText, ...finalRegions.map((region) => region.text)].filter(Boolean).join("\n");
      const pageRisks = risks(page, text, finalRegions);
      const warnings = [
        ...(pageRisks.includes("MISSING_PAGE_IMAGE") ? ["Rendered page image is required for zero-error STEM reconstruction."] : []),
        ...(pageRisks.includes("FORMULA_HEAVY") ? ["Formula-heavy page must preserve formula crops and editable formula metadata."] : []),
        ...(pageRisks.includes("CHEMISTRY_STRUCTURE_HEAVY") ? ["Chemistry structures require visual preservation before automatic publishing."] : []),
        ...(pageRisks.includes("LOW_TEXT_CONFIDENCE") ? ["Text signal is weak; preserve source crop for review."] : [])
      ];
      const confidence = clamp01(0.42 + (page.pageImageUrl ? 0.12 : 0) + (layoutRegions.length ? 0.12 : 0) + (formulaRegions.length ? 0.08 : 0) + (visualRegions.length ? 0.08 : 0) + Math.min(0.12, finalRegions.length / 100) - warnings.length * 0.03);
      const result = {
        schemaVersion: "ndie-page-understanding-v1" as const,
        pageId: page.pageId,
        pageNumber: page.pageNumber,
        pageType: pageType(text, finalRegions, page.pageNumber),
        subjectSignals: subjectSignals(text),
        regions: finalRegions,
        relationships: relationships(finalRegions),
        diagnostics: {
          risks: pageRisks,
          warnings,
          reviewRequired: pageRisks.length > 0 || confidence < 0.82,
          reasons: pageRisks.length ? pageRisks.map((risk) => `Detected ${risk.toLowerCase().replace(/_/g, " ")}.`) : ["Page has enough structured evidence for draft reconstruction."]
        },
        source: {
          consumesRenderedPageImage: Boolean(page.pageImageUrl),
          consumesOcr: Boolean(page.ocrText || page.ocrJson),
          consumesLayout: Boolean(page.layoutJson),
          consumesFormula: Boolean(page.formulaJson),
          consumesVisual: Boolean(page.visualJson),
          consumesAssessment: Boolean(page.assessmentJson),
          consumesEvaluation: Boolean(page.evaluationJson),
          consumesValidation: Boolean(page.validationJson),
          neverReadsRawPdf: true as const
        },
        confidence,
        providerId: this.id,
        providerVersion: this.version,
        pipelineVersion: process.env.NDIE_PIPELINE_VERSION ?? "ndie-pipeline-v1",
        checksum: stableHash({ pageId: page.pageId, finalRegions, pageRisks, confidence }),
        durationMs: Date.now() - pageStartedAt,
        createdAt: new Date().toISOString()
      };
      return result;
    });
    const allRisks = Array.from(new Set(pages.flatMap((page) => page.diagnostics.risks)));
    const averageConfidence = clamp01(pages.reduce((sum, page) => sum + page.confidence, 0) / Math.max(1, pages.length));
    const result = {
      schemaVersion: "ndie-page-understanding-document-v1" as const,
      importJobId: input.importJobId,
      providerId: this.id,
      providerVersion: this.version,
      pipelineVersion: process.env.NDIE_PIPELINE_VERSION ?? "ndie-pipeline-v1",
      pages,
      summary: {
        pageCount: pages.length,
        questionPages: pages.filter((page) => page.pageType === "QUESTION_PAGE" || page.pageType === "MIXED_PAGE").length,
        answerKeyPages: pages.filter((page) => page.pageType === "ANSWER_KEY_PAGE" || page.pageType === "MIXED_PAGE").length,
        solutionPages: pages.filter((page) => page.pageType === "SOLUTION_PAGE").length,
        formulaHeavyPages: pages.filter((page) => page.diagnostics.risks.includes("FORMULA_HEAVY")).length,
        visualHeavyPages: pages.filter((page) => page.diagnostics.risks.some((risk) => ["DIAGRAM_HEAVY", "GRAPH_HEAVY", "TABLE_HEAVY"].includes(risk))).length,
        chemistryStructurePages: pages.filter((page) => page.diagnostics.risks.includes("CHEMISTRY_STRUCTURE_HEAVY")).length,
        reviewRequiredPages: pages.filter((page) => page.diagnostics.reviewRequired).length,
        averageConfidence,
        dominantSubject: dominantSubject(pages)
      },
      diagnostics: {
        reviewRequired: pages.some((page) => page.diagnostics.reviewRequired),
        risks: allRisks,
        warnings: Array.from(new Set(pages.flatMap((page) => page.diagnostics.warnings)))
      },
      checksum: stableHash({ importJobId: input.importJobId, pages: pages.map((page) => page.checksum) }),
      durationMs: Date.now() - startedAt,
      createdAt: new Date().toISOString()
    };
    return result;
  }
}




