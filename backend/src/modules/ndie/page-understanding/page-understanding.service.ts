import { RuleBasedPageUnderstandingProvider } from "./rule-based-page-understanding.provider.js";
import type { NdiePageUnderstandingInput } from "../contracts/page-understanding-result.js";

const provider = new RuleBasedPageUnderstandingProvider();

export const ndiePageUnderstandingService = {
  providerId: provider.id,
  providerVersion: provider.version,

  understand(input: NdiePageUnderstandingInput) {
    return provider.understand(input);
  },

  health() {
    return {
      status: provider.isEnabled() ? "ready" : "disabled",
      provider: provider.id,
      providerVersion: provider.version,
      consumes: ["rendered page images", "OCR JSON", "Layout JSON", "Formula JSON", "Visual JSON", "Assessment JSON", "Evaluation JSON", "Validation JSON"],
      sourceOfTruth: "Rendered page images plus normalized NDIE outputs. The service never reads raw PDFs.",
      supports: ["page type detection", "subject signals", "region roles", "formula/visual/table/graph risk preservation", "source relationships", "review-required diagnostics"]
    };
  }
};

export type NdiePageUnderstandingService = typeof ndiePageUnderstandingService;
