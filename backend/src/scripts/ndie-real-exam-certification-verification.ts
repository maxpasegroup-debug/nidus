import {
  REAL_EXAM_CERTIFICATION_LIBRARY,
  realExamCertificationService
} from "../modules/ndie/certification/real-exam-certification.service.js";

const requiredSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "English"];
const requiredExams = ["NDA", "CDS", "AFCAT", "JEE", "NEET", "University", "School"];
const requiredFormats = ["PDF", "DOCX", "SCANNED_PDF", "MOBILE_PHOTO", "IMAGE", "TEXT"];
const requiredSourceTypes = ["QUESTION_PAPER", "ANSWER_KEY", "SOLUTION_BOOK", "MIXED_PAPER"];

const report = realExamCertificationService.run();

const subjectCoverage = requiredSubjects.every((subject) => report.subjectReports.some((row) => row.subject === subject));
const examCoverage = requiredExams.every((exam) => REAL_EXAM_CERTIFICATION_LIBRARY.some((document) => document.exam === exam));
const formatCoverage = requiredFormats.every((format) => REAL_EXAM_CERTIFICATION_LIBRARY.some((document) => document.format === format));
const sourceCoverage = requiredSourceTypes.every((sourceType) => REAL_EXAM_CERTIFICATION_LIBRARY.some((document) => document.sourceType === sourceType));
const metricCoverage = report.documentReports.every((document) => (
  "uploadSuccess" in document.metrics &&
  "classificationAccuracy" in document.metrics &&
  "questionCountAccuracy" in document.metrics &&
  "questionReconstructionAccuracy" in document.metrics &&
  "formulaPreservation" in document.metrics &&
  "diagramPreservation" in document.metrics &&
  "tablePreservation" in document.metrics &&
  "graphPreservation" in document.metrics &&
  "answerMapping" in document.metrics &&
  "solutionMapping" in document.metrics &&
  "questionOrder" in document.metrics &&
  "pageMapping" in document.metrics &&
  "reviewFindings" in document.metrics &&
  "publishSuccess" in document.metrics &&
  "studentRenderingSuccess" in document.metrics
));
const stopRuleApplied = report.documentReports.every((document) => (
  document.productionCertified === (document.overallScore >= report.dashboard.stopRuleThreshold && document.failedMetrics.length === 0)
));
const subjectReportsComplete = requiredSubjects.every((subject) => {
  const subjectReport = report.subjectReports.find((row) => row.subject === subject);
  return Boolean(subjectReport && subjectReport.papersTested > 0 && subjectReport.averageAccuracy >= 95);
});
const dashboardComplete = report.dashboard.totalPapersTested === REAL_EXAM_CERTIFICATION_LIBRARY.length &&
  report.dashboard.passRate >= 95 &&
  report.dashboard.averageAccuracy >= 95;

const checks = [
  ["subject coverage", subjectCoverage],
  ["exam coverage", examCoverage],
  ["format coverage", formatCoverage],
  ["question/answer/solution source coverage", sourceCoverage],
  ["metric coverage", metricCoverage],
  ["95 percent stop rule", stopRuleApplied],
  ["subject reports", subjectReportsComplete],
  ["dashboard", dashboardComplete],
  ["failed paper reports", Array.isArray(report.failedPaperReports)],
  ["launch recommendation", report.launchRecommendation.length > 0]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

if (failures.length) {
  console.error(JSON.stringify({
    status: "FAIL",
    milestone: "production-launch-milestone-10-real-exam-certification",
    failures,
    dashboard: report.dashboard
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  milestone: "production-launch-milestone-10-real-exam-certification",
  certificationStatus: report.productionCertificationStatus,
  overallAccuracy: report.overallAccuracy,
  dashboard: report.dashboard,
  subjects: report.subjectReports.map((subject) => ({
    subject: subject.subject,
    papersTested: subject.papersTested,
    averageAccuracy: subject.averageAccuracy,
    passRate: subject.passRate
  })),
  failedPapers: report.failedPaperReports
}, null, 2));
