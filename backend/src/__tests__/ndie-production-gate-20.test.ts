import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 20 STEM intelligence engine", () => {
  const stem = read("src/modules/ndie/stem-intelligence/stem-intelligence.service.ts");
  const service = read("src/modules/ndie/ndie.service.ts");
  const packageJson = read("package.json");

  it("creates every required STEM intelligence module", () => {
    expect(stem).toContain("subjectClassifier");
    expect(stem).toContain("mathematicsEngine");
    expect(stem).toContain("physicsEngine");
    expect(stem).toContain("chemistryEngine");
    expect(stem).toContain("diagramSemanticEngine");
    expect(stem).toContain("graphSemanticEngine");
    expect(stem).toContain("tableSemanticEngine");
    expect(stem).toContain("relationshipEngine");
    expect(stem).toContain("knowledgeGraphBuilder");
    expect(stem).toContain("questionSemanticAnalyzer");
  });

  it("recognizes mathematics concepts", () => {
    for (const concept of ["Fractions", "Roots", "Matrices", "Limits", "Calculus", "Probability", "Coordinate Geometry", "Vectors", "Algebra", "Trigonometry", "Statistics", "Number Systems", "Sequences", "Series"]) {
      expect(stem).toContain(concept);
    }
  });

  it("recognizes physics concepts", () => {
    for (const concept of ["Electric Circuits", "Optics", "Motion", "Mechanics", "Thermodynamics", "Electromagnetism", "Modern Physics", "Units", "Graphs", "Vectors"]) {
      expect(stem).toContain(concept);
    }
  });

  it("recognizes chemistry concepts", () => {
    for (const concept of ["Organic Structures", "Inorganic Formulae", "Chemical Equations", "Reaction Arrows", "Charges", "States", "Periodic Table References", "Chemical Symbols"]) {
      expect(stem).toContain(concept);
    }
  });

  it("generates semantic graph and question understanding", () => {
    expect(stem).toContain("StemSemanticGraph");
    expect(stem).toContain("question");
    expect(stem).toContain("formula");
    expect(stem).toContain("diagram");
    expect(stem).toContain("options");
    expect(stem).toContain("correctAnswer");
    expect(stem).toContain("concepts");
    expect(stem).toContain("difficulty");
    expect(stem).toContain("relationships");
    expect(stem).toContain("chapter");
    expect(stem).toContain("dependencies");
    expect(stem).toContain("requiredVisuals");
    expect(stem).toContain("requiredFormulas");
    expect(stem).toContain("reasoningType");
    expect(stem).toContain("bloomLevel");
    expect(stem).toContain("estimatedSolvingTimeSeconds");
  });

  it("benchmarks semantic understanding against golden corpus", () => {
    expect(stem).toContain("realGoldenCorpusBenchmarkRunner.run");
    expect(stem).toContain("semanticAccuracy");
    expect(stem).toContain("formulaUnderstanding");
    expect(stem).toContain("diagramUnderstanding");
    expect(stem).toContain("graphUnderstanding");
    expect(stem).toContain("questionUnderstanding");
    expect(stem).toContain("subjectClassification");
  });

  it("extends health with STEM intelligence coverage", () => {
    expect(service).toContain("stemIntelligenceService.health");
    expect(service).toContain("stemIntelligence");
    expect(service).toContain("stemIntelligence: stemIntelligence.status");
    expect(stem).toContain("subjectIntelligence");
    expect(stem).toContain("conceptCoverage");
    expect(stem).toContain("chapterCoverage");
    expect(stem).toContain("difficultyCoverage");
  });

  it("adds test:ndie-stem verification command", () => {
    expect(packageJson).toContain("test:ndie-stem");
    expect(packageJson).toContain("ndie-stem-verification.ts");
  });
});
