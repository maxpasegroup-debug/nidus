import { generateSyntheticUniversalBenchmark, SYNTHETIC_BENCHMARK_TARGET } from "../modules/ndie/certification/synthetic-universal-benchmark/generator.js";
import { summarizeSyntheticUniversalBenchmark } from "../modules/ndie/certification/synthetic-universal-benchmark/report.js";
import { validateSyntheticUniversalBenchmark } from "../modules/ndie/certification/synthetic-universal-benchmark/validator.js";
import { universalExamPhaseOneStatusService } from "../modules/ndie/universal-specification/phase-1-status.service.js";

const cases = generateSyntheticUniversalBenchmark();
const validation = validateSyntheticUniversalBenchmark(cases);
const phaseOne = universalExamPhaseOneStatusService.evaluateOperational();
const valid = validation.valid && cases.length >= SYNTHETIC_BENCHMARK_TARGET && phaseOne.exitGate === "FAIL" && phaseOne.evidence.overall.validRealDocuments === 0;

console.log(JSON.stringify({
  status: valid ? "PASS" : "FAIL",
  verification: "SYNTHETIC_DEVELOPMENT_BENCHMARK_ONLY",
  summary: summarizeSyntheticUniversalBenchmark(validation.parsedCases, validation.coverageGaps),
  validationIssues: validation.issues.slice(0, 50),
  phaseOne: { technicalFoundation: phaseOne.technicalFoundationStatus, realEvidence: phaseOne.realEvidenceStatus, exitGate: phaseOne.exitGate, productionCertified: phaseOne.productionCertified }
}, null, 2));

if (!valid) process.exitCode = 1;

