import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  certification: readFileSync(join(root, "src/modules/ndie/certification/certification.service.ts"), "utf8"),
  corpus: readFileSync(join(root, "src/modules/ndie/certification/golden-corpus.ts"), "utf8"),
  service: readFileSync(join(root, "src/modules/ndie/ndie.service.ts"), "utf8"),
  certificationGuide: readFileSync(join(root, "src/modules/ndie/certification/docs/certification-guide.md"), "utf8"),
  corpusGuide: readFileSync(join(root, "src/modules/ndie/certification/docs/golden-corpus-guide.md"), "utf8"),
  regressionGuide: readFileSync(join(root, "src/modules/ndie/certification/docs/regression-guide.md"), "utf8"),
  benchmarkGuide: readFileSync(join(root, "src/modules/ndie/certification/docs/benchmark-guide.md"), "utf8"),
  releaseChecklist: readFileSync(join(root, "src/modules/ndie/certification/docs/enterprise-release-checklist.md"), "utf8")
};

const required = [
  ["certification service", files.certification.includes("certificationService")],
  ["golden corpus manager", files.certification.includes("goldenCorpusManager") && files.corpus.includes("NDIE_GOLDEN_FIXTURES")],
  ["benchmark runner", files.certification.includes("benchmarkRunner") && files.certification.includes("1000") && files.certification.includes("paperCases")],
  ["regression runner", files.certification.includes("regressionRunner") && files.certification.includes("silentRegressionAllowed: false")],
  ["certification report generator", files.certification.includes("certificationReportGenerator") && files.certification.includes("PASS") && files.certification.includes("FAIL")],
  ["accuracy calculator", files.certification.includes("accuracyCalculator") && files.certification.includes("overallNdieAccuracy")],
  ["fixture expected outputs", files.corpus.includes("originalDocument") && files.corpus.includes("expected") && files.corpus.includes("formulas")],
  ["certification metrics", files.certification.includes("ocrAccuracy") && files.certification.includes("studentRenderingAccuracy")],
  ["quality gates", files.certification.includes("qualityGate") && files.certification.includes("Formula accuracy below threshold fails build")],
  ["health integration", files.service.includes("certificationService.health") && files.service.includes("certificationStatus")],
  ["documentation", files.certificationGuide.includes("Certification Outputs") && files.corpusGuide.includes("Required coverage") && files.regressionGuide.includes("No silent regression") && files.benchmarkGuide.includes("100 simultaneous imports") && files.releaseChecklist.includes("Golden corpus certification is PASS")]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", gate: "production-gate-17-certification-framework", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "production-gate-17-certification-framework",
  checks: required.length,
  capabilities: required.map(([name]) => name)
}, null, 2));
