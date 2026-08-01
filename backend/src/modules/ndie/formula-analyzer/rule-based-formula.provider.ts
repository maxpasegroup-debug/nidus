import type { FormulaProvider } from "../contracts/providers.js";

const formulaSignal = /\\frac|\\sqrt|\\sum|\\int|\\lim|\^|_[{(]?\w|[∫√ΣπθλμΩαβγΔ≈≠≤≥∞]|\b(sin|cos|tan|log|ln|det|matrix|vector)\b|[a-zA-Z]\s*=\s*[-+*/^()0-9a-zA-Z]+/i;
const chemistrySignal = /\b(H2O|CO2|NaCl|HCl|H2SO4|NH3|CH4|O2|N2)\b|[A-Z][a-z]?\d+\s*[+→=]/;

function sourceCoordinates(raw: unknown, pageNumber: number) {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return { page: pageNumber, x: 0.06, y: 0.08, width: 0.88, height: 0.05, rotation: 0 };
}

export class RuleBasedFormulaProvider implements FormulaProvider {
  readonly id = "formula.rule-based";
  readonly kind = "FORMULA" as const;
  readonly displayName = "NDIE Rule-Based Formula Detector";

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
    pageNumber: number;
    layoutElements: Array<{
      id: string;
      elementType: string;
      text?: string | null;
      coordinates: unknown;
      readingOrder?: number | null;
    }>;
  }) {
    const detected = input.layoutElements
      .filter((element) => element.text && (formulaSignal.test(element.text) || chemistrySignal.test(element.text)))
      .map((element) => {
        const isChemistry = Boolean(element.text && chemistrySignal.test(element.text));
        return {
          elementType: isChemistry ? "CHEMICAL_EQUATION" as const : "FORMULA" as const,
          text: String(element.text),
          normalizedText: String(element.text).replace(/\s+/g, " ").trim(),
          coordinates: sourceCoordinates(element.coordinates, input.pageNumber),
          readingOrder: element.readingOrder ?? undefined,
          confidence: isChemistry ? 0.68 : 0.7,
          metadata: {
            provider: this.id,
            sourceElementId: element.id,
            requiresTeacherFormulaReview: true
          }
        };
      });

    return {
      elements: detected,
      confidence: detected.length ? 0.7 : null
    };
  }
}
