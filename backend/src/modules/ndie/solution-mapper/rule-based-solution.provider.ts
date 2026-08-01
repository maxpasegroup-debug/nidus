import type { SolutionProvider } from "../contracts/providers.js";

const solutionStart = /(?:^|\s)(?:solution|explanation|sol\.?)\s*(?:for)?\s*(?:Q?\.?\s*)?(\d{1,4})\s*[:.)-]\s*(.+)/i;

export class RuleBasedSolutionProvider implements SolutionProvider {
  readonly id = "solution.rule-based";
  readonly kind = "SOLUTION" as const;
  readonly displayName = "NDIE Rule-Based Solution Mapper";

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

  async map(input: { elements: Array<{ text?: string | null; pageNumber: number; coordinates: unknown }> }) {
    const solutions = input.elements
      .map((element) => {
        const match = String(element.text || "").match(solutionStart);
        if (!match) return null;
        return {
          questionNumber: match[1],
          solutionJson: {
            type: "EXPLANATION",
            text: match[2].trim(),
            pageNumber: element.pageNumber,
            coordinates: element.coordinates
          },
          confidence: 0.64
        };
      })
      .filter((solution): solution is NonNullable<typeof solution> => Boolean(solution));

    return {
      solutions,
      confidence: solutions.length ? Math.min(...solutions.map((solution) => solution.confidence)) : null
    };
  }
}
