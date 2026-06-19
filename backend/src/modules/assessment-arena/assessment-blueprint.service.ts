import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";

type IdRow = { id: string };
type AssessmentRow = {
  id: string;
  name: string;
  slug: string;
  level: string;
  questionsPerAttempt: number;
  minimumQuestionBank: number;
  recommendedQuestionBank: number;
  idealQuestionBank: number;
};
type TraitMappingRow = {
  id: string;
  assessmentId: string;
  weight: number;
  isCritical: boolean;
  isRiskTrait: boolean;
};
type DimensionMappingRow = {
  id: string;
  assessmentId: string;
  traitMappingId: string;
  weight: number;
  priority: string;
  difficultyRelevance: string;
};

const DEFAULT_DIFFICULTY = { level1: 15, level2: 25, level3: 30, level4: 20, level5: 10 };
const SSB_DIFFICULTY = { level1: 10, level2: 20, level3: 30, level4: 25, level5: 15 };
const TOP_RANK_DIFFICULTY = { level1: 15, level2: 20, level3: 30, level4: 25, level5: 10 };

const DEFAULT_TYPES = {
  BEHAVIOURAL: 25,
  SITUATIONAL: 20,
  DECISION: 15,
  PRESSURE: 15,
  DISCIPLINE: 10,
  SERVICE_ORIENTATION: 10,
  RISK_DETECTION: 5
};

function json(value: unknown) {
  return value as object;
}

function assessmentDifficulty(level: string) {
  if (level.includes("SSB")) return SSB_DIFFICULTY;
  if (level.includes("TOP_RANK")) return TOP_RANK_DIFFICULTY;
  return DEFAULT_DIFFICULTY;
}

function questionTypes(level: string, traitPriority: string, dimensionName?: string) {
  const normalized = `${level} ${traitPriority} ${dimensionName ?? ""}`.toLowerCase();
  if (normalized.includes("ssb") || normalized.includes("group") || normalized.includes("leadership")) {
    return { BEHAVIOURAL: 15, SITUATIONAL: 20, LEADERSHIP: 20, GROUP_DYNAMICS: 15, SSB_PSYCHOLOGY: 20, PRESSURE: 10 };
  }
  if (normalized.includes("fitness") || normalized.includes("physical")) {
    return { BEHAVIOURAL: 20, FITNESS_BEHAVIOUR: 30, DISCIPLINE: 20, PRESSURE: 15, SITUATIONAL: 15 };
  }
  if (normalized.includes("top_rank") || normalized.includes("exam")) {
    return { EXAM_BEHAVIOUR: 25, REVISION_BEHAVIOUR: 20, DECISION: 20, PRESSURE: 15, RANK_PREDICTION_INPUT: 10, BEHAVIOURAL: 10 };
  }
  return DEFAULT_TYPES;
}

function integrityDesign(level: string) {
  if (level.includes("SSB")) {
    return { integrity: 18, contradiction: 10, reverse: 12, risk: 18 };
  }
  if (level.includes("TOP_RANK")) {
    return { integrity: 12, contradiction: 8, reverse: 10, risk: 14 };
  }
  return { integrity: 15, contradiction: 8, reverse: 10, risk: 15 };
}

function countByWeight(total: number, weight: number) {
  return Math.max(1, Math.round((total * weight) / 100));
}

export const assessmentBlueprintService = {
  async seed() {
    const assessments = await prisma.$queryRaw<AssessmentRow[]>`
      SELECT "id", "name", "slug", "level", "questionsPerAttempt", "minimumQuestionBank", "recommendedQuestionBank", "idealQuestionBank"
      FROM "AssessmentArenaAssessment"
      ORDER BY "level" ASC, "name" ASC
    `;

    let assessmentBlueprints = 0;
    let traitBlueprints = 0;
    let dimensionBlueprints = 0;

    for (const assessment of assessments) {
      const difficulty = assessmentDifficulty(assessment.level);
      const integrity = integrityDesign(assessment.level);
      const blueprintRows = await prisma.$queryRaw<IdRow[]>`
        INSERT INTO "AssessmentQuestionBlueprint"
        ("id", "assessmentId", "targetQuestionsPerAttempt", "minimumBankSize", "recommendedBankSize", "idealBankSize", "difficultyDistribution", "integrityQuestionPercent", "contradictionQuestionPercent", "reverseScoringPercent", "riskDetectionPercent", "questionTypeDistribution", "status", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, ${assessment.id}, ${assessment.questionsPerAttempt}, ${assessment.minimumQuestionBank}, ${assessment.recommendedQuestionBank}, ${assessment.idealQuestionBank}, ${json(difficulty)}, ${integrity.integrity}, ${integrity.contradiction}, ${integrity.reverse}, ${integrity.risk}, ${json(questionTypes(assessment.level, "ASSESSMENT"))}, ${"ACTIVE"}, ${new Date()}, ${new Date()})
        ON CONFLICT ("assessmentId")
        DO UPDATE SET
          "targetQuestionsPerAttempt" = EXCLUDED."targetQuestionsPerAttempt",
          "minimumBankSize" = EXCLUDED."minimumBankSize",
          "recommendedBankSize" = EXCLUDED."recommendedBankSize",
          "idealBankSize" = EXCLUDED."idealBankSize",
          "difficultyDistribution" = EXCLUDED."difficultyDistribution",
          "integrityQuestionPercent" = EXCLUDED."integrityQuestionPercent",
          "contradictionQuestionPercent" = EXCLUDED."contradictionQuestionPercent",
          "reverseScoringPercent" = EXCLUDED."reverseScoringPercent",
          "riskDetectionPercent" = EXCLUDED."riskDetectionPercent",
          "questionTypeDistribution" = EXCLUDED."questionTypeDistribution",
          "status" = EXCLUDED."status",
          "updatedAt" = EXCLUDED."updatedAt"
        RETURNING "id"
      `;
      const questionBlueprintId = blueprintRows[0]?.id;
      if (!questionBlueprintId) continue;
      assessmentBlueprints += 1;

      const traitMappings = await prisma.$queryRaw<TraitMappingRow[]>`
        SELECT "id", "assessmentId", "weight", "isCritical", "isRiskTrait"
        FROM "AssessmentTraitMapping"
        WHERE "assessmentId" = ${assessment.id}
        ORDER BY "displayOrder" ASC
      `;

      for (const traitMapping of traitMappings) {
        const traitQuestionCount = countByWeight(assessment.questionsPerAttempt, traitMapping.weight);
        const traitIntegrity = traitMapping.isCritical ? integrity.integrity + 2 : integrity.integrity;
        const traitRisk = traitMapping.isRiskTrait ? integrity.risk + 3 : integrity.risk;
        const traitRows = await prisma.$queryRaw<IdRow[]>`
          INSERT INTO "AssessmentTraitBlueprint"
          ("id", "assessmentId", "questionBlueprintId", "traitMappingId", "targetQuestionCount", "weightPercent", "difficultyDistribution", "integrityQuestionPercent", "riskDetectionPercent", "createdAt", "updatedAt")
          VALUES (${randomUUID()}, ${assessment.id}, ${questionBlueprintId}, ${traitMapping.id}, ${traitQuestionCount}, ${traitMapping.weight}, ${json(difficulty)}, ${traitIntegrity}, ${traitRisk}, ${new Date()}, ${new Date()})
          ON CONFLICT ("questionBlueprintId", "traitMappingId")
          DO UPDATE SET
            "targetQuestionCount" = EXCLUDED."targetQuestionCount",
            "weightPercent" = EXCLUDED."weightPercent",
            "difficultyDistribution" = EXCLUDED."difficultyDistribution",
            "integrityQuestionPercent" = EXCLUDED."integrityQuestionPercent",
            "riskDetectionPercent" = EXCLUDED."riskDetectionPercent",
            "updatedAt" = EXCLUDED."updatedAt"
          RETURNING "id"
        `;
        const traitBlueprintId = traitRows[0]?.id;
        if (!traitBlueprintId) continue;
        traitBlueprints += 1;

        const dimensionMappings = await prisma.$queryRaw<DimensionMappingRow[]>`
          SELECT "id", "assessmentId", "traitMappingId", "weight", "priority", "difficultyRelevance"
          FROM "AssessmentDimensionMapping"
          WHERE "assessmentId" = ${assessment.id} AND "traitMappingId" = ${traitMapping.id}
          ORDER BY "priority" ASC, "id" ASC
        `;

        for (const dimensionMapping of dimensionMappings) {
          await prisma.$executeRaw`
            INSERT INTO "AssessmentDimensionBlueprint"
            ("id", "assessmentId", "questionBlueprintId", "traitBlueprintId", "dimensionMappingId", "targetQuestionCount", "questionTypes", "difficultyDistribution", "integrityQuestionPercent", "riskDetectionPercent", "createdAt", "updatedAt")
            VALUES (${randomUUID()}, ${assessment.id}, ${questionBlueprintId}, ${traitBlueprintId}, ${dimensionMapping.id}, ${countByWeight(traitQuestionCount, dimensionMapping.weight)}, ${json(questionTypes(assessment.level, dimensionMapping.priority))}, ${json(difficulty)}, ${traitIntegrity}, ${traitRisk}, ${new Date()}, ${new Date()})
            ON CONFLICT ("questionBlueprintId", "dimensionMappingId")
            DO UPDATE SET
              "targetQuestionCount" = EXCLUDED."targetQuestionCount",
              "questionTypes" = EXCLUDED."questionTypes",
              "difficultyDistribution" = EXCLUDED."difficultyDistribution",
              "integrityQuestionPercent" = EXCLUDED."integrityQuestionPercent",
              "riskDetectionPercent" = EXCLUDED."riskDetectionPercent",
              "updatedAt" = EXCLUDED."updatedAt"
          `;
          dimensionBlueprints += 1;
        }
      }
    }

    return { assessmentBlueprints, traitBlueprints, dimensionBlueprints };
  },

  list() {
    return prisma.$queryRaw`
      SELECT qb.*, a."name" AS "assessmentName", a."slug", a."level"
      FROM "AssessmentQuestionBlueprint" qb
      JOIN "AssessmentArenaAssessment" a ON a."id" = qb."assessmentId"
      ORDER BY a."level" ASC, a."name" ASC
    `;
  },

  get(assessmentId: string) {
    return prisma.$queryRaw`
      SELECT
        qb.*,
        a."name" AS "assessmentName",
        a."slug",
        a."level",
        (
          SELECT json_agg(tb_row)
          FROM (
            SELECT tb.*, tm."weight", t."name" AS "traitName", t."slug" AS "traitSlug"
            FROM "AssessmentTraitBlueprint" tb
            JOIN "AssessmentTraitMapping" tm ON tm."id" = tb."traitMappingId"
            JOIN "AssessmentTraitLibraryItem" t ON t."id" = tm."traitId"
            WHERE tb."questionBlueprintId" = qb."id"
            ORDER BY tm."displayOrder" ASC
          ) tb_row
        ) AS "traitBlueprints",
        (
          SELECT json_agg(db_row)
          FROM (
            SELECT db.*, d."name" AS "dimensionName", t."name" AS "traitName"
            FROM "AssessmentDimensionBlueprint" db
            JOIN "AssessmentDimensionMapping" dm ON dm."id" = db."dimensionMappingId"
            JOIN "AssessmentDimensionLibraryItem" d ON d."id" = dm."dimensionId"
            JOIN "AssessmentTraitMapping" tm ON tm."id" = dm."traitMappingId"
            JOIN "AssessmentTraitLibraryItem" t ON t."id" = tm."traitId"
            WHERE db."questionBlueprintId" = qb."id"
            ORDER BY tm."displayOrder" ASC, d."name" ASC
          ) db_row
        ) AS "dimensionBlueprints"
      FROM "AssessmentQuestionBlueprint" qb
      JOIN "AssessmentArenaAssessment" a ON a."id" = qb."assessmentId"
      WHERE qb."assessmentId" = ${assessmentId}
    `;
  },

  coverage() {
    return prisma.$queryRaw`
      SELECT
        a."id" AS "assessmentId",
        a."name",
        a."slug",
        a."level",
        qb."targetQuestionsPerAttempt" AS "targetQuestions",
        qb."minimumBankSize",
        qb."recommendedBankSize",
        qb."idealBankSize",
        qb."integrityQuestionPercent",
        qb."contradictionQuestionPercent",
        qb."reverseScoringPercent",
        qb."riskDetectionPercent",
        qb."difficultyDistribution",
        COUNT(DISTINCT tb."id")::int AS "traitBlueprintCount",
        COUNT(DISTINCT db."id")::int AS "dimensionBlueprintCount",
        CASE
          WHEN qb."id" IS NOT NULL
            AND COUNT(DISTINCT tb."id") >= 5
            AND COUNT(DISTINCT db."id") >= 15
            AND qb."targetQuestionsPerAttempt" > 0
            AND qb."minimumBankSize" > 0
            AND qb."integrityQuestionPercent" > 0
          THEN 'PASS'
          ELSE 'FAIL'
        END AS "coverageStatus"
      FROM "AssessmentArenaAssessment" a
      LEFT JOIN "AssessmentQuestionBlueprint" qb ON qb."assessmentId" = a."id"
      LEFT JOIN "AssessmentTraitBlueprint" tb ON tb."questionBlueprintId" = qb."id"
      LEFT JOIN "AssessmentDimensionBlueprint" db ON db."questionBlueprintId" = qb."id"
      GROUP BY a."id", qb."id"
      ORDER BY a."level" ASC, a."name" ASC
    `;
  }
};
