import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE production provider integration", () => {
  it("registers routed providers without replacing existing deterministic providers", () => {
    const container = read("src/modules/ndie/ndie.container.ts");
    expect(container).toContain("ProductionOcrProvider");
    expect(container).toContain("ProductionLayoutProvider");
    expect(container).toContain("ProductionFormulaProvider");
    expect(container).toContain("ProductionAiProvider");
    expect(container).toContain("TesseractOcrProvider");
    expect(container).toContain("RuleBasedLayoutProvider");
    expect(container).toContain("RuleBasedFormulaProvider");
  });

  it("uses specialist providers only when configured and retains deterministic fallback", () => {
    const providers = read("src/modules/ndie/provider-orchestrator/production-providers.ts");
    expect(providers).toContain("mathpixConfigured");
    expect(providers).toContain("azureDocumentIntelligenceConfigured");
    expect(providers).toContain("fallbackFrom");
    expect(providers).toContain("reviewRequired: true");
    expect(providers).toContain("MATHPIX_STEM_OCR_MODE");
  });

  it("never lets multimodal verification raise deterministic confidence", () => {
    const openai = read("src/modules/ndie/ai-validator/openai-ai.provider.ts");
    expect(openai).toContain("Math.min(validation.confidence");
    expect(openai).toContain("Never invent or repair academic content");
    expect(openai).toContain("confidence-can-only-decrease-with-verification");
  });

  it("ships credential-safe verification and real-paper evidence commands", () => {
    const packageJson = read("package.json");
    expect(packageJson).toContain("test:ndie-production-providers");
    expect(packageJson).toContain("ndie:providers:verify");
    expect(packageJson).toContain("ndie:real-paper:verify");
    expect(read("src/scripts/ndie-real-paper-verification.ts")).toContain("certificationClaim: false");
  });
});
