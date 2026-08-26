import type { AnswerKeyProvider } from "../contracts/providers.js";

const answerPattern = /(?:^|\s)(?:Q?\.?\s*)?(\d{1,4})\s*[\-:.)]\s*([A-D])\b/gi;

export class RuleBasedAnswerKeyProvider implements AnswerKeyProvider {
  readonly id = "answer-key.rule-based";
  readonly kind = "ANSWER_KEY" as const;
  readonly displayName = "NDIE Rule-Based Answer Key Mapper";

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

  async map(input: { sourceKind: string; elements: Array<{ text?: string | null; pageNumber: number; coordinates: unknown }> }) {
    const answers: Array<{
      questionNumber: string;
      answerJson: { type: string; correctOption: string; source: string };
      confidence: number;
    }> = [];
    const sourceLooksLikeKey = /ANSWER|KEY|SOLUTION/i.test(input.sourceKind);
    if (!sourceLooksLikeKey) {
      return { answers, confidence: null };
    }
    for (const element of input.elements) {
      const text = String(element.text || "");
      for (const match of text.matchAll(answerPattern)) {
        answers.push({
          questionNumber: match[1],
          answerJson: {
            type: "SINGLE_CHOICE",
            correctOption: String(match[2]).toUpperCase(),
            source: "ANSWER_KEY_DOCUMENT"
          },
          confidence: 0.78
        });
      }
    }
    return {
      answers,
      confidence: answers.length ? Math.min(...answers.map((answer) => answer.confidence)) : null
    };
  }
}
