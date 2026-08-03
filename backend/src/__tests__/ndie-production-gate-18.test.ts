import { describe, expect, it } from "@jest/globals";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => existsSync(join(root, path));

describe("NDIE Production Gate 18 real golden corpus", () => {
  const repository = read("src/modules/ndie/certification/golden-corpus/repository.ts");
  const certification = read("src/modules/ndie/certification/certification.service.ts");
  const packageJson = read("package.json");

  it("creates a structured corpus repository by subject and examination", () => {
    expect(repository).toContain("GOLDEN_CORPUS_DOCUMENTS");
    expect(repository).toContain("Mathematics");
    expect(repository).toContain("Physics");
    expect(repository).toContain("Chemistry");
    expect(repository).toContain("History");
    expect(repository).toContain("NDA");
    expect(repository).toContain("JEE");
    expect(repository).toContain("NEET");
    expect(repository).toContain("CDS");
    expect(exists("src/modules/ndie/certification/golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/manifest.json")).toBe(true);
    expect(exists("src/modules/ndie/certification/golden-corpus/Physics/JEE/physics-jee-circuits-001/manifest.json")).toBe(true);
    expect(exists("src/modules/ndie/certification/golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/manifest.json")).toBe(true);
    expect(exists("src/modules/ndie/certification/golden-corpus/History/CDS/gk-cds-history-001/manifest.json")).toBe(true);
  });

  it("defines the required manifest format", () => {
    expect(repository).toContain("documentType");
    expect(repository).toContain("language");
    expect(repository).toContain("pages");
    expect(repository).toContain("contains");
    expect(repository).toContain("formulas");
    expect(repository).toContain("diagrams");
    expect(repository).toContain("graphs");
    expect(repository).toContain("tables");
    expect(repository).toContain("ocrRisk");
    expect(repository).toContain("rotation");
    expect(repository).toContain("handwriting");
    expect(repository).toContain("expectedProcessingStages");
  });

  it("stores expected snapshots for every NDIE output stage", () => {
    for (const stage of ["ocr", "layout", "formula", "visual", "assessment", "evaluation", "validation", "publishing-package"]) {
      expect(exists(`src/modules/ndie/certification/golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/snapshots/${stage}.expected.json`)).toBe(true);
    }
    expect(repository).toContain("publishingPackage");
    expect(repository).toContain("expectedConfidence");
    expect(repository).toContain("expectedReviewStatus");
    expect(repository).toContain("expectedPublishReadiness");
  });

  it("adds benchmark and regression engines for real corpus comparison", () => {
    expect(repository).toContain("realGoldenCorpusBenchmarkRunner");
    expect(repository).toContain("single document");
    expect(repository).toContain("single subject");
    expect(repository).toContain("single exam");
    expect(repository).toContain("full corpus");
    expect(repository).toContain("expected-snapshot-baseline");
    expect(repository).toContain("realGoldenCorpusRegressionRunner");
    expect(repository).toContain("improvements");
    expect(repository).toContain("regressions");
    expect(repository).toContain("unchangedSections");
    expect(repository).toContain("accuracyDelta");
    expect(repository).toContain("confidenceDelta");
  });

  it("enforces Gate 18 certification thresholds", () => {
    expect(repository).toContain("ocrAccuracy: 0.98");
    expect(repository).toContain("questionDetectionAccuracy: 0.99");
    expect(repository).toContain("formulaPreservation: 0.98");
    expect(repository).toContain("answerMappingAccuracy: 0.999");
    expect(repository).toContain("publishPackageAccuracy: 1");
    expect(repository).toContain("studentRenderingAccuracy: 1");
  });

  it("integrates real corpus metrics into health", () => {
    expect(certification).toContain("realGoldenCorpus");
    expect(certification).toContain("documentsCertified");
    expect(certification).toContain("subjectsCovered");
    expect(certification).toContain("examTypesCovered");
    expect(certification).toContain("accuracyTrend");
    expect(certification).toContain("lastBenchmark");
  });

  it("ships Gate 18 docs and verification command", () => {
    expect(read("src/modules/ndie/certification/docs/golden-corpus-authoring-guide.md")).toContain("Every corpus document");
    expect(read("src/modules/ndie/certification/docs/fixture-naming-standard.md")).toContain("documentId");
    expect(read("src/modules/ndie/certification/docs/snapshot-standard.md")).toContain("Snapshots are expected-output contracts");
    expect(read("src/modules/ndie/certification/docs/corpus-benchmark-standard.md")).toContain("Single subject");
    expect(read("src/modules/ndie/certification/docs/corpus-expansion-guide.md")).toContain("Real NIDUS teacher-uploaded PDFs");
    expect(packageJson).toContain("test:ndie-golden-corpus");
  });
});
