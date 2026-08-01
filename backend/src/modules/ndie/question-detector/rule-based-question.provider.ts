import type { QuestionProvider } from "../contracts/providers.js";

const questionStart = /^\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,4})[\).:\-\s]+(.+)/i;
const hardBoundary = /^\s*(?:Q(?:uestion)?\.?\s*)?\d{1,4}[\).:\-\s]+/i;

function normalizeQuestionText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function firstCoordinate(elements: Array<{ coordinates: unknown }>) {
  const coordinate = elements.find((element) => element.coordinates && typeof element.coordinates === "object")?.coordinates;
  return coordinate && typeof coordinate === "object" ? coordinate as Record<string, unknown> : {};
}

export class RuleBasedQuestionProvider implements QuestionProvider {
  readonly id = "question.rule-based";
  readonly kind = "QUESTION" as const;
  readonly displayName = "NDIE Rule-Based Question Detector";

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

  async detect(input: {
    elements: Array<{
      id: string;
      pageNumber: number;
      elementType: string;
      text?: string | null;
      coordinates: unknown;
      readingOrder?: number | null;
    }>;
  }) {
    const textElements = input.elements
      .filter((element) => ["TEXT_LINE", "FORMULA", "CHEMICAL_EQUATION", "TABLE", "DIAGRAM", "GRAPH"].includes(element.elementType))
      .filter((element) => element.text?.trim())
      .sort((a, b) => a.pageNumber - b.pageNumber || (a.readingOrder ?? 0) - (b.readingOrder ?? 0));

    const groups: Array<{ questionNumber: string; elements: typeof textElements }> = [];
    let active: { questionNumber: string; elements: typeof textElements } | null = null;

    for (const element of textElements) {
      const text = String(element.text || "");
      const match = text.match(questionStart);
      if (match && hardBoundary.test(text)) {
        active = { questionNumber: match[1], elements: [element] };
        groups.push(active);
        continue;
      }
      if (active) active.elements.push(element);
    }

    const fallbackGroups = groups.length ? groups : textElements.length ? [{ questionNumber: "1", elements: textElements }] : [];
    const questions = fallbackGroups.map((group) => {
      const text = normalizeQuestionText(group.elements.map((element) => String(element.text || "")).join(" "));
      const hasVisual = group.elements.some((element) => ["TABLE", "DIAGRAM", "GRAPH"].includes(element.elementType));
      const hasFormula = group.elements.some((element) => ["FORMULA", "CHEMICAL_EQUATION"].includes(element.elementType));
      return {
        questionNumber: group.questionNumber,
        questionType: hasVisual ? "DIAGRAM_BASED" : hasFormula ? "NUMERICAL" : "MCQ",
        text,
        sourceElementIds: group.elements.map((element) => element.id),
        sourceMap: {
          firstPage: group.elements[0]?.pageNumber ?? 1,
          lastPage: group.elements.at(-1)?.pageNumber ?? group.elements[0]?.pageNumber ?? 1,
          coordinates: firstCoordinate(group.elements)
        },
        confidence: groups.length ? 0.72 : 0.28
      };
    });

    return {
      questions,
      confidence: questions.length ? Math.min(...questions.map((question) => question.confidence)) : null
    };
  }
}
