import { describe, expect, it } from "@jest/globals";
import {
  REAL_EXAM_CERTIFICATION_LIBRARY,
  realExamCertificationService
} from "../modules/ndie/certification/real-exam-certification.service.js";

describe("Production Launch Milestone 10 - Real Exam Certification Suite", () => {
  it("covers required real exam subjects, exams, formats and document roles", () => {
    const subjects = Array.from(new Set(REAL_EXAM_CERTIFICATION_LIBRARY.map((document) => document.subject)));
    const exams = Array.from(new Set(REAL_EXAM_CERTIFICATION_LIBRARY.map((document) => document.exam)));
    const formats = Array.from(new Set(REAL_EXAM_CERTIFICATION_LIBRARY.map((document) => document.format)));
    const sourceTypes = Array.from(new Set(REAL_EXAM_CERTIFICATION_LIBRARY.map((document) => document.sourceType)));

    expect(subjects).toEqual(expect.arrayContaining(["Mathematics", "Physics", "Chemistry", "Biology", "History", "English"]));
    expect(exams).toEqual(expect.arrayContaining(["NDA", "CDS", "AFCAT", "JEE", "NEET", "University", "School"]));
    expect(formats).toEqual(expect.arrayContaining(["PDF", "DOCX", "SCANNED_PDF", "MOBILE_PHOTO", "IMAGE", "TEXT"]));
    expect(sourceTypes).toEqual(expect.arrayContaining(["QUESTION_PAPER", "ANSWER_KEY", "SOLUTION_BOOK", "MIXED_PAPER"]));
  });

  it("measures all launch-certification correctness metrics", () => {
    const report = realExamCertificationService.run();
    for (const document of report.documentReports) {
      expect(document.metrics.uploadSuccess).toBeGreaterThanOrEqual(95);
      expect(document.metrics.classificationAccuracy).toBeGreaterThanOrEqual(95);
      expect(document.metrics.questionCountAccuracy).toBeGreaterThanOrEqual(95);
      expect(document.metrics.questionReconstructionAccuracy).toBeGreaterThanOrEqual(95);
      expect(document.metrics.formulaPreservation).toBeGreaterThanOrEqual(95);
      expect(document.metrics.diagramPreservation).toBeGreaterThanOrEqual(95);
      expect(document.metrics.tablePreservation).toBeGreaterThanOrEqual(95);
      expect(document.metrics.graphPreservation).toBeGreaterThanOrEqual(95);
      expect(document.metrics.answerMapping).toBeGreaterThanOrEqual(95);
      expect(document.metrics.solutionMapping).toBeGreaterThanOrEqual(95);
      expect(document.metrics.questionOrder).toBeGreaterThanOrEqual(95);
      expect(document.metrics.pageMapping).toBeGreaterThanOrEqual(95);
      expect(document.metrics.reviewFindings).toBeGreaterThanOrEqual(95);
      expect(document.metrics.publishSuccess).toBeGreaterThanOrEqual(100);
      expect(document.metrics.studentRenderingSuccess).toBeGreaterThanOrEqual(100);
    }
  });

  it("applies the 95 percent stop rule and creates launch dashboard reports", () => {
    const report = realExamCertificationService.run();

    expect(report.dashboard.totalPapersTested).toBe(REAL_EXAM_CERTIFICATION_LIBRARY.length);
    expect(report.dashboard.stopRuleThreshold).toBe(95);
    expect(report.dashboard.averageAccuracy).toBeGreaterThanOrEqual(95);
    expect(report.dashboard.productionCertified).toBe(true);
    expect(report.failedPaperReports).toHaveLength(0);
    expect(report.subjectReports.every((subject) => subject.papersTested > 0)).toBe(true);
    expect(report.productionCertificationStatus).toBe("PRODUCTION_CERTIFIED");
  });
});
