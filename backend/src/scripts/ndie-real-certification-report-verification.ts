import { realCertificationReportService } from "../modules/ndie/certification/real-certification-report.service.js";
import { REAL_FILE_BASELINE_STAGES } from "../modules/ndie/certification/real-file-baseline.service.js";

const report = realCertificationReportService.run();

const stageCoverage = REAL_FILE_BASELINE_STAGES.every((stage) => report.stages.some((row) => row.stage === stage));
const subjectCoverage = ["Mathematics", "Physics", "Chemistry"].every((subject) => report.subjects.some((row) => row.subject === subject));
const featureCoverage = ["Mathematical formulas", "Chemistry structures", "Diagrams", "Graphs", "Tables", "Answer keys", "Solutions"]
  .every((feature) => report.features.some((row) => row.feature === feature));
const noFalseGo = report.decision === "NO_GO" || report.productionReadinessScore >= 95;
const p0WhenMissingFiles = report.baseline.filesPresent === report.baseline.requiredDocuments ||
  report.blockers.some((blocker) => blocker.priority === "P0" && blocker.area === "Real source files");
const scoresAreBounded = [
  report.productionReadinessScore,
  report.mathematicsReadinessScore,
  report.physicsReadinessScore,
  report.chemistryReadinessScore,
  report.internationalCompetitivenessScore
].every((score) => score >= 0 && score <= 100);

const checks = [
  ["stage coverage", stageCoverage],
  ["subject coverage", subjectCoverage],
  ["feature coverage", featureCoverage],
  ["no false GO", noFalseGo],
  ["P0 blocker when files missing", p0WhenMissingFiles],
  ["scores bounded", scoresAreBounded]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

if (failures.length) {
  console.error(JSON.stringify({
    status: "FAIL",
    phase: "phase-6-real-certification-report",
    failures,
    decision: report.decision,
    productionReadinessScore: report.productionReadinessScore
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  phase: "phase-6-real-certification-report",
  decision: report.decision,
  scores: {
    productionReadiness: report.productionReadinessScore,
    mathematicsReadiness: report.mathematicsReadinessScore,
    physicsReadiness: report.physicsReadinessScore,
    chemistryReadiness: report.chemistryReadinessScore,
    internationalCompetitiveness: report.internationalCompetitivenessScore
  },
  baseline: report.baseline,
  intake: report.intake,
  blockers: report.blockers,
  launchRecommendation: report.launchRecommendation
}, null, 2));
