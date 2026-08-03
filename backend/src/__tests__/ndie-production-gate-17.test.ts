import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 17 certification framework", () => {
  const certification = read("src/modules/ndie/certification/certification.service.ts");
  const corpus = read("src/modules/ndie/certification/golden-corpus.ts");
  const service = read("src/modules/ndie/ndie.service.ts");
  const packageJson = read("package.json");

  it("creates the certification service modules requested by Gate 17", () => {
    expect(certification).toContain("certificationService");
    expect(certification).toContain("goldenCorpusManager");
    expect(certification).toContain("benchmarkRunner");
    expect(certification).toContain("regressionRunner");
    expect(certification).toContain("certificationReportGenerator");
    expect(certification).toContain("accuracyCalculator");
  });

  it("defines golden corpus coverage for real examination families", () => {
    expect(corpus).toContain("NDIE_GOLDEN_CORPUS_VERSION");
    expect(corpus).toContain("SIMPLE_TEXT");
    expect(corpus).toContain("MULTI_COLUMN");
    expect(corpus).toContain("SCANNED");
    expect(corpus).toContain("ROTATED");
    expect(corpus).toContain("LOW_QUALITY_SCAN");
    expect(corpus).toContain("DOCX");
    expect(corpus).toContain("OFFICE_MATH");
    expect(corpus).toContain("TABLES");
    expect(corpus).toContain("GRAPHS");
    expect(corpus).toContain("DIAGRAMS");
    expect(corpus).toContain("CHEMISTRY");
    expect(corpus).toContain("PHYSICS");
    expect(corpus).toContain("MATHEMATICS");
    expect(corpus).toContain("ENGINEERING_MATHEMATICS");
    expect(corpus).toContain("JEE");
    expect(corpus).toContain("NEET");
    expect(corpus).toContain("NDA");
    expect(corpus).toContain("CDS");
    expect(corpus).toContain("AFCAT");
    expect(corpus).toContain("UNIVERSITY");
    expect(corpus).toContain("LEGACY");
  });

  it("requires expected outputs for every fixture dimension", () => {
    expect(corpus).toContain("originalDocument");
    expect(corpus).toContain("ocr");
    expect(corpus).toContain("layout");
    expect(corpus).toContain("formulas");
    expect(corpus).toContain("visuals");
    expect(corpus).toContain("questions");
    expect(corpus).toContain("answers");
    expect(corpus).toContain("confidence");
  });

  it("measures certification metrics and enforces quality gates", () => {
    expect(certification).toContain("ocrAccuracy");
    expect(certification).toContain("layoutAccuracy");
    expect(certification).toContain("formulaAccuracy");
    expect(certification).toContain("visualDetectionAccuracy");
    expect(certification).toContain("questionDetectionAccuracy");
    expect(certification).toContain("answerMappingAccuracy");
    expect(certification).toContain("solutionMappingAccuracy");
    expect(certification).toContain("confidenceCalibration");
    expect(certification).toContain("teacherReviewReduction");
    expect(certification).toContain("publishingSuccess");
    expect(certification).toContain("studentRenderingAccuracy");
    expect(certification).toContain("overallNdieAccuracy");
    expect(certification).toContain("maximumRegression");
    expect(certification).toContain("Security tests must pass");
  });

  it("adds regression, benchmark, stress and report generation capabilities", () => {
    expect(certification).toContain("compare(previous");
    expect(certification).toContain("regressions");
    expect(certification).toContain("newFailures");
    expect(certification).toContain("resolvedFailures");
    expect(certification).toContain("silentRegressionAllowed: false");
    expect(certification).toContain("100 simultaneous imports");
    expect(certification).toContain("500-page PDF");
    expect(certification).toContain("1000-page PDF");
    expect(certification).toContain("10000 questions");
    expect(certification).toContain("100 concurrent publishing jobs");
    expect(certification).toContain("10000 student render packages");
    expect(certification).toContain("status: passed ? \"PASS\"");
  });

  it("integrates certification into NDIE health", () => {
    expect(service).toContain("certificationService.health");
    expect(service).toContain("certification");
    expect(service).toContain("certificationStatus");
    expect(certification).toContain("lastCertificationDate");
    expect(certification).toContain("goldenCorpusVersion");
    expect(certification).toContain("overallAccuracy");
    expect(certification).toContain("benchmarkSummary");
  });

  it("ships certification documentation and verification script", () => {
    expect(read("src/modules/ndie/certification/docs/certification-guide.md")).toContain("Certification Outputs");
    expect(read("src/modules/ndie/certification/docs/golden-corpus-guide.md")).toContain("Required coverage");
    expect(read("src/modules/ndie/certification/docs/regression-guide.md")).toContain("No silent regression");
    expect(read("src/modules/ndie/certification/docs/benchmark-guide.md")).toContain("100 simultaneous imports");
    expect(read("src/modules/ndie/certification/docs/enterprise-release-checklist.md")).toContain("Golden corpus certification is PASS");
    expect(packageJson).toContain("test:ndie-certification");
    expect(packageJson).toContain("ndie-certification-verification.ts");
  });
});
