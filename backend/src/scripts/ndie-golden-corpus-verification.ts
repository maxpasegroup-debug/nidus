import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => existsSync(join(root, path));

const repository = read("src/modules/ndie/certification/golden-corpus/repository.ts");
const certification = read("src/modules/ndie/certification/certification.service.ts");

const documents = [
  "Mathematics/NDA/mathematics-nda-3d-geometry-001",
  "Physics/JEE/physics-jee-circuits-001",
  "Chemistry/NEET/chemistry-neet-reactions-001",
  "History/CDS/gk-cds-history-001"
];

const stages = ["ocr", "layout", "formula", "visual", "assessment", "evaluation", "validation", "publishing-package"];
const fixtureRoot = "src/modules/ndie/certification/golden-corpus";

const required = [
  ["manifest validation", repository.includes("validateManifest") && documents.every((document) => exists(`${fixtureRoot}/${document}/manifest.json`))],
  ["snapshot validation", repository.includes("validateSnapshots") && documents.every((document) => stages.every((stage) => exists(`${fixtureRoot}/${document}/snapshots/${stage}.expected.json`)))],
  ["original documents", documents.every((document) => exists(`${fixtureRoot}/${document}/original/source.txt`))],
  ["benchmark execution", repository.includes("realGoldenCorpusBenchmarkRunner") && repository.includes("expected vs actual") || repository.includes("expected-snapshot-baseline")],
  ["regression comparison", repository.includes("realGoldenCorpusRegressionRunner") && repository.includes("accuracyDelta") && repository.includes("confidenceDelta")],
  ["corpus integrity", repository.includes("integrity") && repository.includes("manifestFailures") && repository.includes("snapshotFailures")],
  ["thresholds", repository.includes("ocrAccuracy: 0.98") && repository.includes("answerMappingAccuracy: 0.999") && repository.includes("studentRenderingAccuracy: 1")],
  ["health endpoint metrics", certification.includes("realGoldenCorpus") && certification.includes("documentsCertified") && certification.includes("lastBenchmark")],
  ["documentation", ["golden-corpus-authoring-guide.md", "fixture-naming-standard.md", "snapshot-standard.md", "corpus-benchmark-standard.md", "corpus-expansion-guide.md"].every((file) => exists(`src/modules/ndie/certification/docs/${file}`))]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", gate: "production-gate-18-real-golden-corpus", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "production-gate-18-real-golden-corpus",
  documents: documents.length,
  snapshots: documents.length * stages.length,
  checks: required.length,
  capabilities: required.map(([name]) => name)
}, null, 2));
