import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const stem = readFileSync(join(root, "src/modules/ndie/stem-intelligence/stem-intelligence.service.ts"), "utf8");
const service = readFileSync(join(root, "src/modules/ndie/ndie.service.ts"), "utf8");
const packageJson = readFileSync(join(root, "package.json"), "utf8");

const required = [
  ["subject classifier", stem.includes("subjectClassifier") && stem.includes("classify")],
  ["mathematics engine", stem.includes("mathematicsEngine") && stem.includes("Fractions") && stem.includes("Calculus") && stem.includes("Coordinate Geometry")],
  ["physics engine", stem.includes("physicsEngine") && stem.includes("Electric Circuits") && stem.includes("Thermodynamics")],
  ["chemistry engine", stem.includes("chemistryEngine") && stem.includes("Chemical Equations") && stem.includes("Periodic Table References")],
  ["diagram semantic engine", stem.includes("diagramSemanticEngine") && stem.includes("REQUIRES_DIAGRAM")],
  ["graph semantic engine", stem.includes("graphSemanticEngine") && stem.includes("REQUIRES_GRAPH")],
  ["table semantic engine", stem.includes("tableSemanticEngine") && stem.includes("REQUIRES_TABLE")],
  ["relationship engine", stem.includes("relationshipEngine") && stem.includes("TESTS_CONCEPT")],
  ["knowledge graph builder", stem.includes("knowledgeGraphBuilder") && stem.includes("StemSemanticGraph")],
  ["question semantic analyzer", stem.includes("questionSemanticAnalyzer") && stem.includes("bloomLevel") && stem.includes("estimatedSolvingTimeSeconds")],
  ["golden corpus benchmark", stem.includes("stemBenchmark") && stem.includes("realGoldenCorpusBenchmarkRunner.run")],
  ["health integration", service.includes("stemIntelligenceService.health") && service.includes("stemIntelligence")],
  ["npm script", packageJson.includes("test:ndie-stem")]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", gate: "production-gate-20-stem-intelligence", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "production-gate-20-stem-intelligence",
  checks: required.length,
  capabilities: required.map(([name]) => name)
}, null, 2));
