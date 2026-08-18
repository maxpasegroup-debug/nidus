import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RuleBasedPageUnderstandingProvider } from "../modules/ndie/page-understanding/rule-based-page-understanding.provider.js";
import { ndiePageUnderstandingService } from "../modules/ndie/page-understanding/page-understanding.service.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Phase 2 multimodal page understanding", () => {
  it("adds provider-independent contracts without raw PDF inputs", () => {
    const contract = read("src/modules/ndie/contracts/page-understanding-result.ts");
    expect(contract).toContain("NdiePageUnderstandingInput");
    expect(contract).toContain("pageImageUrl");
    expect(contract).toContain("ocrJson");
    expect(contract).toContain("layoutJson");
    expect(contract).toContain("formulaJson");
    expect(contract).toContain("visualJson");
    expect(contract).toContain("neverReadsRawPdf: true");
    expect(contract).not.toContain("rawPdf");
    expect(contract).not.toContain("pdfBuffer");
  });

  it("registers document understanding in NDIE providers and health", () => {
    const providers = read("src/modules/ndie/contracts/providers.ts");
    const container = read("src/modules/ndie/ndie.container.ts");
    const service = read("src/modules/ndie/ndie.service.ts");
    const orchestrator = read("src/modules/ndie/provider-orchestrator/provider-orchestrator.service.ts");
    expect(providers).toContain("DOCUMENT_UNDERSTANDING");
    expect(container).toContain("RuleBasedPageUnderstandingProvider");
    expect(container).toContain("document-understanding.openai");
    expect(service).toContain("ndiePageUnderstandingService.health");
    expect(orchestrator).toContain("DOCUMENT_UNDERSTANDING");
    expect(orchestrator).toContain("document-understanding.rule-based");
  });

  it("classifies formula-heavy mathematics pages and preserves uncertainty", async () => {
    const provider = new RuleBasedPageUnderstandingProvider();
    const result = await provider.understand({
      importJobId: "math-paper",
      pages: [
        {
          pageId: "p1",
          pageNumber: 1,
          pageImageUrl: "https://assets.nidus.test/p1.png",
          ocrText: "1. Find \\int x^2 dx from the graph shown below. (A) x^3/3 (B) x^2",
          layoutJson: { regions: [{ id: "q1", elementType: "QUESTION_AREA", text: "1. Find \\int x^2 dx from the graph shown below.", confidence: 0.84, readingOrder: 1 }] },
          formulaJson: { formulas: [{ formulaId: "f1", latex: "\\int x^2 dx", confidence: 0.88, readingOrder: 1 }] },
          visualJson: { visuals: [{ visualId: "g1", visualType: "GRAPH", caption: "graph shown below", confidence: 0.74, readingOrder: 2 }] }
        }
      ]
    });

    expect(result.summary.dominantSubject).toBe("MATHEMATICS");
    expect(result.summary.questionPages).toBe(1);
    expect(result.summary.formulaHeavyPages).toBe(1);
    expect(result.summary.visualHeavyPages).toBe(1);
    expect(result.diagnostics.risks).toContain("FORMULA_HEAVY");
    expect(result.diagnostics.risks).toContain("GRAPH_HEAVY");
    expect(result.pages[0]?.relationships.some((relationship) => relationship.type === "USES_FORMULA")).toBe(true);
    expect(result.pages[0]?.diagnostics.reviewRequired).toBe(true);
  });

  it("classifies chemistry structure risk for chemistry papers", async () => {
    const result = await ndiePageUnderstandingService.understand({
      importJobId: "chem-paper",
      pages: [
        {
          pageId: "p1",
          pageNumber: 1,
          pageImageUrl: "https://assets.nidus.test/chem.png",
          ocrText: "2. Identify the organic structure of benzene and the reaction mechanism CH3COOH -> product.",
          visualJson: { visuals: [{ visualId: "c1", visualType: "CHEMISTRY_STRUCTURE", caption: "benzene organic structure", confidence: 0.7 }] }
        }
      ]
    });

    expect(result.summary.dominantSubject).toBe("CHEMISTRY");
    expect(result.summary.chemistryStructurePages).toBe(1);
    expect(result.diagnostics.risks).toContain("CHEMISTRY_STRUCTURE_HEAVY");
    expect(result.pages[0]?.source.consumesVisual).toBe(true);
  });

  it("detects answer key pages without assuming MCQ-only exams", async () => {
    const result = await ndiePageUnderstandingService.understand({
      importJobId: "answer-key",
      pages: [{ pageId: "ak1", pageNumber: 1, pageImageUrl: "https://assets.nidus.test/ak.png", ocrText: "Official Answer Key\n1 A\n2 C\n3 numerical 42\n4 Assertion Reason B" }]
    });
    expect(result.pages[0]?.pageType).toBe("ANSWER_KEY_PAGE");
    expect(result.summary.answerKeyPages).toBe(1);
  });

  it("adds test:ndie-page-understanding verification command", () => {
    const packageJson = read("package.json");
    expect(packageJson).toContain("test:ndie-page-understanding");
    expect(packageJson).toContain("ndie-page-understanding-verification.ts");
  });
});
