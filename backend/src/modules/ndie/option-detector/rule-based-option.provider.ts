import type { OptionProvider } from "../contracts/providers.js";

const optionPattern = /(?:^|\s)(?:\(([A-D])\)|([A-D])[\).])\s*([^()]+?)(?=\s*(?:\([A-D]\)|[A-D][\).])\s+|$)/gi;

export class RuleBasedOptionProvider implements OptionProvider {
  readonly id = "option.rule-based";
  readonly kind = "OPTION" as const;
  readonly displayName = "NDIE Rule-Based Option Detector";

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

  async detect(input: { questions: Array<{ questionNumber: string; text: string; sourceElementIds: string[]; sourceMap: Record<string, unknown> }> }) {
    const optionsByQuestion = input.questions.map((question) => {
      const found = new Map<string, string>();
      for (const match of question.text.matchAll(optionPattern)) {
        const key = String(match[1] || match[2] || "").toUpperCase();
        const text = String(match[3] || "").replace(/\s+/g, " ").trim();
        if (key && text && !found.has(key)) found.set(key, text);
      }
      const options = ["A", "B", "C", "D"]
        .filter((key) => found.has(key))
        .map((key) => ({ key, text: found.get(key) || "", confidence: 0.7 }));
      return {
        questionNumber: question.questionNumber,
        options,
        confidence: options.length === 4 ? 0.78 : options.length ? 0.45 : 0.18
      };
    });

    return {
      optionsByQuestion,
      confidence: optionsByQuestion.length ? Math.min(...optionsByQuestion.map((item) => item.confidence)) : null
    };
  }
}
