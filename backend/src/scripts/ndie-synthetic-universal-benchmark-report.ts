import { generateSyntheticUniversalBenchmark } from "../modules/ndie/certification/synthetic-universal-benchmark/generator.js";
import { summarizeSyntheticUniversalBenchmark } from "../modules/ndie/certification/synthetic-universal-benchmark/report.js";
import { validateSyntheticUniversalBenchmark } from "../modules/ndie/certification/synthetic-universal-benchmark/validator.js";

const validation = validateSyntheticUniversalBenchmark(generateSyntheticUniversalBenchmark());
console.log(JSON.stringify({
  benchmark: summarizeSyntheticUniversalBenchmark(validation.parsedCases, validation.coverageGaps),
  validation: { valid: validation.valid, issueCount: validation.issues.length, issues: validation.issues.slice(0, 100) },
  warning: "SYNTHETIC DEVELOPMENT EVIDENCE ONLY. This report does not contribute to Phase 1 real-world certification."
}, null, 2));
if (!validation.valid) process.exitCode = 1;

