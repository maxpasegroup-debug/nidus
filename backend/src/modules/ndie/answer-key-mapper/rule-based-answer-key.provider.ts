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
    const answers = [];
    const sourceLooksLikeKey = /ANSWER|KEY|SOLUTION/i.test(input.sourceKind);
    for (const element of input.elements) {
      const text = String(element.text || "");
      for (const match of text.matchAll(answerPattern)) {
        answers.push({
          questionNumber: match[1],
          answerJson: {
            type: "SINGLE_CHOICE",
            correctOption: String(match[2]).toUpperCase(),
            source: sourceLooksLikeKey ? "ANSWER_KEY_DOCUMENT" : "QUESTION_DOCUMENT_INLINE"
          },
          confidence: sourceLooksLikeKey ? 0.78 : 0.48
        });
      }
    }
    return {
      answers,
      confidence: answers.length ? Math.min(...answers.map((answer) => answer.confidence)) : null
    };
  }
}
