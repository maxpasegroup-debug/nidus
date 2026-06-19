import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { assessmentArenaController } from "./assessment-arena.controller.js";

export const assessmentArenaRouter = Router();

const adminRoles = [Role.ADMIN, Role.DIRECTOR];
const optionalString = body().optional().isString();

assessmentArenaRouter.use(protect, allowRoles(...adminRoles));

assessmentArenaRouter.get("/admin/assessments", assessmentArenaController.listAssessments);
assessmentArenaRouter.get("/admin/assessments/:id", assessmentArenaController.getAssessment);
assessmentArenaRouter.post(
  "/admin/assessments",
  [
    body("name").isString().notEmpty(),
    body("slug").isString().notEmpty(),
    body("level").isString().notEmpty(),
    body("purpose").isString().notEmpty()
  ],
  assessmentArenaController.createAssessment
);
assessmentArenaRouter.patch(
  "/admin/assessments/:id",
  [
    body("name").optional().isString(),
    body("slug").optional().isString(),
    body("level").optional().isString(),
    body("purpose").optional().isString(),
    body("description").optional().isString(),
    body("status").optional().isIn(["DRAFT", "REVIEW", "PILOT", "APPROVED", "PUBLISHED", "DEPRECATED", "RETIRED"])
  ],
  assessmentArenaController.updateAssessment
);

assessmentArenaRouter.get("/admin/traits", assessmentArenaController.listTraits);
assessmentArenaRouter.post(
  "/admin/traits",
  [body("assessmentId").isString().notEmpty(), body("name").isString().notEmpty()],
  assessmentArenaController.createTrait
);
assessmentArenaRouter.patch("/admin/traits/:id", [body("name").optional().isString()], assessmentArenaController.updateTrait);

assessmentArenaRouter.get("/admin/dimensions", assessmentArenaController.listDimensions);
assessmentArenaRouter.post(
  "/admin/dimensions",
  [body("assessmentId").isString().notEmpty(), body("traitId").isString().notEmpty(), body("name").isString().notEmpty()],
  assessmentArenaController.createDimension
);
assessmentArenaRouter.patch("/admin/dimensions/:id", [body("name").optional().isString()], assessmentArenaController.updateDimension);

assessmentArenaRouter.get("/admin/questions", assessmentArenaController.listQuestions);
assessmentArenaRouter.post(
  "/admin/questions",
  [
    body("assessmentId").isString().notEmpty(),
    body("traitId").isString().notEmpty(),
    body("dimensionId").isString().notEmpty(),
    body("questionText").isString().notEmpty(),
    body("questionType").isIn(["BEHAVIOURAL", "SITUATIONAL", "DECISION", "PRESSURE", "LEADERSHIP", "GROUP_DYNAMICS", "DISCIPLINE", "EXAM", "FITNESS", "SSB", "RANK_PREDICTION"])
  ],
  assessmentArenaController.createQuestion
);
assessmentArenaRouter.patch("/admin/questions/:id", [body("questionText").optional().isString()], assessmentArenaController.updateQuestion);
assessmentArenaRouter.post(
  "/admin/question-options",
  [body("questionId").isString().notEmpty(), body("optionText").isString().notEmpty()],
  assessmentArenaController.createQuestionOption
);
assessmentArenaRouter.post(
  "/admin/question-versions",
  [body("questionId").isString().notEmpty(), body("questionText").isString().notEmpty()],
  assessmentArenaController.createQuestionVersion
);

assessmentArenaRouter.get("/admin/reviews", assessmentArenaController.listReviews);
assessmentArenaRouter.post(
  "/admin/reviews",
  [body("assessmentId").isString().notEmpty(), body("questionId").isString().notEmpty(), body("reviewerRole").isString().notEmpty()],
  assessmentArenaController.createReview
);
assessmentArenaRouter.patch(
  "/admin/reviews/:id",
  [body("status").optional().isIn(["PENDING", "APPROVED", "REJECTED", "REVISION_REQUIRED"]), body("comments").optional().isString()],
  assessmentArenaController.updateReview
);

assessmentArenaRouter.get("/admin/review-boards", assessmentArenaController.listReviewBoards);
assessmentArenaRouter.post(
  "/admin/review-boards",
  [body("name").isString().notEmpty(), body("boardType").isString().notEmpty()],
  assessmentArenaController.createReviewBoard
);

assessmentArenaRouter.get("/admin/pilots", assessmentArenaController.listPilots);
assessmentArenaRouter.post(
  "/admin/pilots",
  [body("assessmentId").isString().notEmpty(), body("name").isString().notEmpty()],
  assessmentArenaController.createPilot
);
assessmentArenaRouter.patch("/admin/pilots/:id", [body("status").optional().isString()], assessmentArenaController.updatePilot);
assessmentArenaRouter.post(
  "/admin/pilot-responses",
  [body("pilotRunId").isString().notEmpty(), body("response").exists()],
  assessmentArenaController.createPilotResponse
);

assessmentArenaRouter.get("/admin/attempts", assessmentArenaController.listAttempts);
assessmentArenaRouter.get("/admin/attempts/:id", assessmentArenaController.getAttempt);

assessmentArenaRouter.get("/admin/scoring-fixture", assessmentArenaController.scoreFixture);
assessmentArenaRouter.post(
  "/score",
  [body("traits").isArray()],
  assessmentArenaController.score
);
assessmentArenaRouter.post(
  "/integrity",
  [body("answers").isArray()],
  assessmentArenaController.integrity
);
assessmentArenaRouter.post(
  "/risk",
  [body("traits").isArray()],
  assessmentArenaController.risk
);
assessmentArenaRouter.post(
  "/confidence",
  [
    body("totalQuestions").isNumeric(),
    body("answeredQuestions").isNumeric(),
    body("expectedTraits").isNumeric(),
    body("coveredTraits").isNumeric(),
    body("expectedDimensions").isNumeric(),
    body("coveredDimensions").isNumeric(),
    body("integrityScore").isNumeric()
  ],
  assessmentArenaController.confidence
);
assessmentArenaRouter.post(
  "/growth",
  [
    body("baselineScore").isNumeric(),
    body("currentScore").isNumeric(),
    body("dayLabel").isString().notEmpty(),
    body("persist").optional().isBoolean(),
    body("userId").if(body("persist").equals("true")).isString().notEmpty()
  ],
  assessmentArenaController.growth
);

assessmentArenaRouter.post("/admin/score", [body("traits").isArray()], assessmentArenaController.score);
assessmentArenaRouter.post("/admin/integrity", [body("answers").isArray()], assessmentArenaController.integrity);
assessmentArenaRouter.post("/admin/risk", [body("traits").isArray()], assessmentArenaController.risk);
assessmentArenaRouter.post(
  "/admin/confidence",
  [
    body("totalQuestions").isNumeric(),
    body("answeredQuestions").isNumeric(),
    body("expectedTraits").isNumeric(),
    body("coveredTraits").isNumeric(),
    body("expectedDimensions").isNumeric(),
    body("coveredDimensions").isNumeric(),
    body("integrityScore").isNumeric()
  ],
  assessmentArenaController.confidence
);
assessmentArenaRouter.post(
  "/admin/growth",
  [
    body("baselineScore").isNumeric(),
    body("currentScore").isNumeric(),
    body("dayLabel").isString().notEmpty(),
    body("persist").optional().isBoolean(),
    body("userId").if(body("persist").equals("true")).isString().notEmpty()
  ],
  assessmentArenaController.growth
);

assessmentArenaRouter.post(
  "/attempt/start",
  [
    body("assessmentId").isString().notEmpty(),
    body("userId").optional().isString(),
    body("questionCount").optional().isInt({ min: 1 }),
    body("repeatWindowDays").optional().isInt({ min: 0 }),
    body("allowRepeat").optional().isBoolean()
  ],
  assessmentArenaController.startAttempt
);
assessmentArenaRouter.post(
  "/attempt/submit",
  [
    body("attemptId").isString().notEmpty(),
    body("answers").isArray(),
    body("answers.*.questionId").isString().notEmpty(),
    body("answers.*.attemptQuestionId").optional().isString(),
    body("answers.*.optionId").optional().isString(),
    body("answers.*.answerText").optional().isString(),
    body("answers.*.rawScore").optional().isNumeric()
  ],
  assessmentArenaController.submitAttempt
);
assessmentArenaRouter.get("/attempt/:id", assessmentArenaController.getAttemptV2);
assessmentArenaRouter.get("/attempt/:id/questions", assessmentArenaController.getAttemptQuestions);
assessmentArenaRouter.get("/attempt/:id/status", assessmentArenaController.getAttemptStatus);

assessmentArenaRouter.get("/questions/analytics", assessmentArenaController.questionAnalytics);
assessmentArenaRouter.get("/questions", assessmentArenaController.questionBankList);
assessmentArenaRouter.post(
  "/questions",
  [
    body("assessmentId").isString().notEmpty(),
    body("traitId").isString().notEmpty(),
    body("dimensionId").isString().notEmpty(),
    body("questionText").isString().notEmpty(),
    body("questionType").isIn(["BEHAVIOURAL", "SITUATIONAL", "DECISION", "PRESSURE", "LEADERSHIP", "GROUP_DYNAMICS", "DISCIPLINE", "EXAM", "FITNESS", "SSB", "RANK_PREDICTION"]),
    body("options").optional().isArray()
  ],
  assessmentArenaController.questionBankCreate
);
assessmentArenaRouter.put(
  "/questions/:id",
  [
    body("assessmentId").optional().isString(),
    body("traitId").optional().isString(),
    body("dimensionId").optional().isString(),
    body("questionText").optional().isString(),
    body("questionType").optional().isIn(["BEHAVIOURAL", "SITUATIONAL", "DECISION", "PRESSURE", "LEADERSHIP", "GROUP_DYNAMICS", "DISCIPLINE", "EXAM", "FITNESS", "SSB", "RANK_PREDICTION"]),
    body("status").optional().isString()
  ],
  assessmentArenaController.questionBankUpdate
);
assessmentArenaRouter.post("/questions/:id/clone", assessmentArenaController.questionBankClone);
assessmentArenaRouter.post(
  "/questions/:id/review",
  [
    body("assessmentId").isString().notEmpty(),
    body("reviewerRole").isString().notEmpty(),
    body("status").optional().isIn(["PENDING", "APPROVED", "REJECTED", "REVISION_REQUIRED"]),
    body("comments").optional().isString(),
    body("reviewNotes").optional().isString()
  ],
  assessmentArenaController.questionBankReview
);
assessmentArenaRouter.post("/questions/:id/publish", assessmentArenaController.questionBankPublish);
assessmentArenaRouter.post("/questions/:id/retire", assessmentArenaController.questionBankRetire);
assessmentArenaRouter.post("/questions/:id/archive", assessmentArenaController.questionBankArchive);
assessmentArenaRouter.post("/questions/:id/restore", assessmentArenaController.questionBankRestore);
assessmentArenaRouter.get("/questions/:id/exposure", assessmentArenaController.questionExposure);
assessmentArenaRouter.get("/questions/:id", assessmentArenaController.questionBankGet);

assessmentArenaRouter.post(
  "/reports/generate",
  [
    body("attemptId").isString().notEmpty(),
    body("audience").optional().isIn(["STUDENT", "PARENT", "TEACHER", "ACADEMIC_HEAD", "DIRECTOR"]),
    body("scoringVersion").optional().isString()
  ],
  assessmentArenaController.generateReport
);
assessmentArenaRouter.get("/reports/:id/pdf", assessmentArenaController.getReportPdf);
assessmentArenaRouter.get("/reports/:id/version", assessmentArenaController.getReportVersions);
assessmentArenaRouter.get("/reports/:id", assessmentArenaController.getReport);

assessmentArenaRouter.post("/trait-library/seed", assessmentArenaController.seedTraitLibrary);
assessmentArenaRouter.get("/trait-library/counts", assessmentArenaController.traitLibraryCounts);
assessmentArenaRouter.get("/trait-library/traits", assessmentArenaController.listTraitLibrary);
assessmentArenaRouter.get("/trait-library/traits/:slug", assessmentArenaController.getTraitLibraryItem);
assessmentArenaRouter.get("/trait-library/dimensions", assessmentArenaController.listDimensionLibrary);
assessmentArenaRouter.get("/trait-library/interpretations", assessmentArenaController.listTraitInterpretations);

assessmentArenaRouter.get("/mappings/assessments", assessmentArenaController.listMappingAssessments);
assessmentArenaRouter.get("/mappings/traits", assessmentArenaController.listMappingTraits);
assessmentArenaRouter.get("/mappings/dimensions", assessmentArenaController.listMappingDimensions);
assessmentArenaRouter.get("/mappings/coverage", assessmentArenaController.mappingCoverage);

assessmentArenaRouter.get("/blueprints", assessmentArenaController.listBlueprints);
assessmentArenaRouter.get("/blueprints/coverage", assessmentArenaController.blueprintCoverage);
assessmentArenaRouter.get("/blueprints/:assessmentId", assessmentArenaController.getBlueprint);

assessmentArenaRouter.post("/ssb/seed", assessmentArenaController.seedSsbIntelligence);
assessmentArenaRouter.get("/ssb/olqs", assessmentArenaController.listSsbOlqs);
assessmentArenaRouter.get("/ssb/readiness", assessmentArenaController.getSsbReadiness);
assessmentArenaRouter.post(
  "/ssb/calculate",
  [body("olqScores").isArray(), body("olqScores.*.name").isString().notEmpty(), body("olqScores.*.score").isNumeric()],
  assessmentArenaController.calculateSsb
);
assessmentArenaRouter.get("/ssb/interpretable-profile", assessmentArenaController.getSsbInterpretableProfile);

assessmentArenaRouter.get("/toprank/readiness", assessmentArenaController.getTopRankReadiness);
assessmentArenaRouter.get("/toprank/performance", assessmentArenaController.getTopRankPerformance);
assessmentArenaRouter.get("/toprank/growth", assessmentArenaController.getTopRankGrowth);
assessmentArenaRouter.get("/toprank/risks", assessmentArenaController.getTopRankRisks);
assessmentArenaRouter.post(
  "/toprank/calculate",
  [
    body("userId").optional().isString(),
    body("batchId").optional().isString(),
    body("dayLabel").optional().isString()
  ],
  assessmentArenaController.calculateTopRank
);
