import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { assessmentArenaService } from "./assessment-arena.service.js";
import { assessmentAnalyticsService } from "./assessment-analytics.service.js";
import { assessmentAttemptService } from "./assessment-attempt.service.js";
import { assessmentConfidenceService } from "./assessment-confidence.service.js";
import { assessmentGrowthService } from "./assessment-growth.service.js";
import { assessmentIntegrityService } from "./assessment-integrity.service.js";
import { assessmentPublicationService } from "./assessment-publication.service.js";
import { assessmentQuestionManagementService } from "./assessment-question.service.js";
import { assessmentReportPdfService } from "./assessment-report-pdf.service.js";
import { assessmentReportRendererService } from "./assessment-report-renderer.service.js";
import { assessmentReportService } from "./assessment-report.service.js";
import { assessmentReportVersionService } from "./assessment-report-version.service.js";
import { assessmentRiskService } from "./assessment-risk.service.js";
import { assessmentReviewWorkflowService } from "./assessment-review.service.js";
import { assessmentTraitLibraryService } from "./assessment-trait-library.service.js";
import { ssbIntelligenceService } from "./ssb-intelligence.service.js";
import { topRankIntelligenceService } from "./toprank-intelligence.service.js";
import { assessmentScoringFixture } from "./assessment-scoring.fixtures.js";
import { assessmentScoringService } from "./assessment-scoring.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid ${key}`);
  return value;
}

function queryText(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Authenticated user is required");
  return { id: req.user.id, role: req.user.role };
}

function topRankScope(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Authenticated user is required");
  const queryUserId = queryText(req, "userId");
  const bodyUserId = typeof req.body?.userId === "string" ? req.body.userId.trim() : undefined;
  const queryBatchId = queryText(req, "batchId");
  const bodyBatchId = typeof req.body?.batchId === "string" ? req.body.batchId.trim() : undefined;
  return {
    userId: bodyUserId || queryUserId || req.user.id,
    batchId: bodyBatchId || queryBatchId
  };
}

export const assessmentArenaController = {
  async listAssessments(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ assessments: await assessmentArenaService.assessments.list() });
    } catch (error) {
      next(error);
    }
  },

  async getAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const assessment = await assessmentArenaService.assessments.get(param(req, "id"));
      if (!assessment) throw new Error("Assessment Arena assessment not found");
      res.json({ assessment });
    } catch (error) {
      next(error);
    }
  },

  async createAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ assessment: await assessmentArenaService.assessments.create(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async updateAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ assessment: await assessmentArenaService.assessments.update(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async listTraits(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ traits: await assessmentArenaService.traits.list(queryText(req, "assessmentId")) });
    } catch (error) {
      next(error);
    }
  },

  async createTrait(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ trait: await assessmentArenaService.traits.create(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async updateTrait(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ trait: await assessmentArenaService.traits.update(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async listDimensions(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        dimensions: await assessmentArenaService.dimensions.list({
          assessmentId: queryText(req, "assessmentId"),
          traitId: queryText(req, "traitId")
        })
      });
    } catch (error) {
      next(error);
    }
  },

  async createDimension(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ dimension: await assessmentArenaService.dimensions.create(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async updateDimension(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ dimension: await assessmentArenaService.dimensions.update(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async listQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        questions: await assessmentArenaService.questions.list({
          assessmentId: queryText(req, "assessmentId"),
          traitId: queryText(req, "traitId"),
          dimensionId: queryText(req, "dimensionId"),
          status: queryText(req, "status")
        })
      });
    } catch (error) {
      next(error);
    }
  },

  async createQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ question: await assessmentArenaService.questions.create(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async updateQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ question: await assessmentArenaService.questions.update(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async createQuestionOption(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ option: await assessmentArenaService.questions.createOption(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async createQuestionVersion(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ version: await assessmentArenaService.questions.createVersion(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async listReviews(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        reviews: await assessmentArenaService.reviews.list({
          assessmentId: queryText(req, "assessmentId"),
          questionId: queryText(req, "questionId"),
          status: queryText(req, "status")
        })
      });
    } catch (error) {
      next(error);
    }
  },

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ review: await assessmentArenaService.reviews.create(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ review: await assessmentArenaService.reviews.update(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async listReviewBoards(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ boards: await assessmentArenaService.reviews.listBoards() });
    } catch (error) {
      next(error);
    }
  },

  async createReviewBoard(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ board: await assessmentArenaService.reviews.createBoard(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async listPilots(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ pilots: await assessmentArenaService.pilots.list(queryText(req, "assessmentId")) });
    } catch (error) {
      next(error);
    }
  },

  async createPilot(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ pilot: await assessmentArenaService.pilots.create(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async updatePilot(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ pilot: await assessmentArenaService.pilots.update(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async createPilotResponse(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ response: await assessmentArenaService.pilots.createResponse(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async listAttempts(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ attempts: await assessmentArenaService.attempts.list(queryText(req, "assessmentId")) });
    } catch (error) {
      next(error);
    }
  },

  async getAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const attempt = await assessmentArenaService.attempts.get(param(req, "id"));
      if (!attempt) throw new Error("Assessment Arena attempt not found");
      res.json({ attempt });
    } catch (error) {
      next(error);
    }
  },

  async score(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ scoring: await assessmentScoringService.calculateAndMaybePersist(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async scoreFixture(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ fixture: assessmentScoringFixture, scoring: assessmentScoringService.calculate(assessmentScoringFixture) });
    } catch (error) {
      next(error);
    }
  },

  async integrity(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ integrity: assessmentIntegrityService.evaluate(req.body.answers) });
    } catch (error) {
      next(error);
    }
  },

  async risk(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ risk: assessmentRiskService.evaluate(req.body.traits) });
    } catch (error) {
      next(error);
    }
  },

  async confidence(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ confidence: assessmentConfidenceService.calculate(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async growth(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const growth = req.body.persist ? await assessmentGrowthService.store(req.body) : assessmentGrowthService.calculate(req.body);
      res.json({ growth });
    } catch (error) {
      next(error);
    }
  },

  async startAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ attempt: await assessmentAttemptService.start({ ...req.body, actor: actor(req) }) });
    } catch (error) {
      next(error);
    }
  },

  async submitAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ attempt: await assessmentAttemptService.submit({ ...req.body, actor: actor(req) }) });
    } catch (error) {
      next(error);
    }
  },

  async getAttemptV2(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ attempt: await assessmentAttemptService.get(param(req, "id"), actor(req)) });
    } catch (error) {
      next(error);
    }
  },

  async getAttemptQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ questions: await assessmentAttemptService.questions(param(req, "id"), actor(req)) });
    } catch (error) {
      next(error);
    }
  },

  async getAttemptStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ status: await assessmentAttemptService.status(param(req, "id"), actor(req)) });
    } catch (error) {
      next(error);
    }
  },

  async questionBankList(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        questions: await assessmentQuestionManagementService.list({
          assessmentId: queryText(req, "assessmentId"),
          traitId: queryText(req, "traitId"),
          dimensionId: queryText(req, "dimensionId"),
          status: queryText(req, "status"),
          q: queryText(req, "q")
        })
      });
    } catch (error) {
      next(error);
    }
  },

  async questionBankGet(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await assessmentQuestionManagementService.get(param(req, "id"));
      if (!question) throw new Error("Question not found");
      res.json({ question });
    } catch (error) {
      next(error);
    }
  },

  async questionBankCreate(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ question: await assessmentQuestionManagementService.create(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async questionBankUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ question: await assessmentQuestionManagementService.update(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async questionBankClone(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json({ question: await assessmentQuestionManagementService.clone(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async questionBankReview(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ review: await assessmentReviewWorkflowService.submit({ ...req.body, questionId: param(req, "id") }) });
    } catch (error) {
      next(error);
    }
  },

  async questionBankPublish(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ question: await assessmentPublicationService.publish(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async questionBankRetire(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ question: await assessmentPublicationService.retire(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async questionBankArchive(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ question: await assessmentPublicationService.archive(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async questionBankRestore(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ question: await assessmentPublicationService.restore(param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async questionAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        analytics: await assessmentAnalyticsService.dashboard({ assessmentId: queryText(req, "assessmentId") }),
        questions: await assessmentAnalyticsService.questionHealth({ assessmentId: queryText(req, "assessmentId") })
      });
    } catch (error) {
      next(error);
    }
  },

  async questionExposure(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ health: await assessmentAnalyticsService.questionHealth({ questionId: param(req, "id") }) });
    } catch (error) {
      next(error);
    }
  },

  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const report = await assessmentReportService.generate(req.body);
      res.status(201).json({ report });
    } catch (error) {
      next(error);
    }
  },

  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await assessmentReportService.get(param(req, "id"));
      if (!report) throw new Error("Assessment report not found");
      res.json({ report, rendered: assessmentReportRendererService.render(report) });
    } catch (error) {
      next(error);
    }
  },

  async getReportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await assessmentReportService.get(param(req, "id"));
      if (!report) throw new Error("Assessment report not found");
      const pdf = await assessmentReportPdfService.generate(report);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=\"nidus-assessment-report-${report.id}.pdf\"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  },

  async getReportVersions(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ versions: await assessmentReportVersionService.versions(param(req, "id")) });
    } catch (error) {
      next(error);
    }
  },

  async seedTraitLibrary(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ seeded: await assessmentTraitLibraryService.seed(), counts: await assessmentTraitLibraryService.counts() });
    } catch (error) {
      next(error);
    }
  },

  async listTraitLibrary(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ traits: await assessmentTraitLibraryService.listTraits() });
    } catch (error) {
      next(error);
    }
  },

  async getTraitLibraryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const trait = await assessmentTraitLibraryService.getTrait(param(req, "slug"));
      if (!trait) throw new Error("Trait library item not found");
      res.json({ trait });
    } catch (error) {
      next(error);
    }
  },

  async listDimensionLibrary(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ dimensions: await assessmentTraitLibraryService.listDimensions(queryText(req, "traitSlug")) });
    } catch (error) {
      next(error);
    }
  },

  async listTraitInterpretations(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ interpretations: await assessmentTraitLibraryService.interpretations() });
    } catch (error) {
      next(error);
    }
  },

  async traitLibraryCounts(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ counts: await assessmentTraitLibraryService.counts() });
    } catch (error) {
      next(error);
    }
  },

  async seedSsbIntelligence(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ seeded: await ssbIntelligenceService.seed(), counts: await ssbIntelligenceService.counts() });
    } catch (error) {
      next(error);
    }
  },

  async listSsbOlqs(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ olqs: await ssbIntelligenceService.olqs() });
    } catch (error) {
      next(error);
    }
  },

  async getSsbReadiness(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ readiness: ssbIntelligenceService.calculate({ olqScores: Array.isArray(req.body?.olqScores) ? req.body.olqScores : [] }) });
    } catch (error) {
      next(error);
    }
  },

  async calculateSsb(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ result: ssbIntelligenceService.calculate(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async getSsbInterpretableProfile(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ profile: ssbIntelligenceService.interpretableProfile({ olqScores: Array.isArray(req.body?.olqScores) ? req.body.olqScores : [] }) });
    } catch (error) {
      next(error);
    }
  },

  async getTopRankReadiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await topRankIntelligenceService.readiness(topRankScope(req)));
    } catch (error) {
      next(error);
    }
  },

  async getTopRankPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await topRankIntelligenceService.performance(topRankScope(req)));
    } catch (error) {
      next(error);
    }
  },

  async getTopRankGrowth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dayLabel = queryText(req, "dayLabel") || "DAY_30";
      res.json(await topRankIntelligenceService.growth(topRankScope(req), dayLabel));
    } catch (error) {
      next(error);
    }
  },

  async getTopRankRisks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await topRankIntelligenceService.risks(topRankScope(req)));
    } catch (error) {
      next(error);
    }
  },

  async calculateTopRank(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dayLabel = typeof req.body?.dayLabel === "string" ? req.body.dayLabel.trim() : "DAY_30";
      res.status(201).json(await topRankIntelligenceService.calculate(topRankScope(req), dayLabel));
    } catch (error) {
      next(error);
    }
  }
};
