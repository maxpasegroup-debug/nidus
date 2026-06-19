import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { assessmentTraitLibraryService } from "./assessment-trait-library.service.js";
import { assessmentMappingSeeds } from "./assessment-mapping.data.js";

type IdRow = { id: string };

function difficultyRelevance(index: number) {
  if (index === 0) return "LEVEL_1_TO_5_CORE";
  if (index === 1) return "LEVEL_2_TO_5_PRESSURE";
  if (index === 2) return "LEVEL_2_TO_4_VALIDATION";
  return "LEVEL_1_TO_3_SUPPORTING";
}

function priority(index: number, isCritical: boolean) {
  if (isCritical && index < 2) return "HIGH";
  if (index < 2) return "MEDIUM";
  return "NORMAL";
}

export const assessmentMappingService = {
  async seed() {
    await assessmentTraitLibraryService.seed();

    let traitMappings = 0;
    let dimensionMappings = 0;
    const missing: string[] = [];

    for (const seed of assessmentMappingSeeds) {
      const assessment = await prisma.assessmentArenaAssessment.findUnique({ where: { name: seed.assessmentName } });
      if (!assessment) {
        missing.push(`Assessment not found: ${seed.assessmentName}`);
        continue;
      }

      for (const [traitIndex, traitSeed] of seed.traits.entries()) {
        const trait = await prisma.assessmentTraitLibraryItem.findUnique({
          where: { slug: traitSeed.traitSlug },
          include: { dimensions: { orderBy: { name: "asc" } } }
        });
        if (!trait) {
          missing.push(`Trait not found: ${traitSeed.traitSlug}`);
          continue;
        }

        const mappingRows = await prisma.$queryRaw<IdRow[]>`
          INSERT INTO "AssessmentTraitMapping"
          ("id", "assessmentId", "traitId", "weight", "isCritical", "isReadinessTrait", "isRiskTrait", "displayOrder", "rationale", "createdAt", "updatedAt")
          VALUES (${randomUUID()}, ${assessment.id}, ${trait.id}, ${traitSeed.weight}, ${Boolean(traitSeed.isCritical)}, ${traitSeed.isReadinessTrait ?? true}, ${Boolean(traitSeed.isRiskTrait)}, ${traitIndex + 1}, ${traitSeed.rationale}, ${new Date()}, ${new Date()})
          ON CONFLICT ("assessmentId", "traitId")
          DO UPDATE SET
            "weight" = EXCLUDED."weight",
            "isCritical" = EXCLUDED."isCritical",
            "isReadinessTrait" = EXCLUDED."isReadinessTrait",
            "isRiskTrait" = EXCLUDED."isRiskTrait",
            "displayOrder" = EXCLUDED."displayOrder",
            "rationale" = EXCLUDED."rationale",
            "updatedAt" = EXCLUDED."updatedAt"
          RETURNING "id"
        `;
        const mappingId = mappingRows[0]?.id;
        if (!mappingId) {
          missing.push(`Trait mapping failed: ${seed.assessmentName} -> ${traitSeed.traitSlug}`);
          continue;
        }
        traitMappings += 1;

        const dimensionWeight = trait.dimensions.length ? Number((100 / trait.dimensions.length).toFixed(2)) : 0;
        for (const [dimensionIndex, dimension] of trait.dimensions.entries()) {
          await prisma.$executeRaw`
            INSERT INTO "AssessmentDimensionMapping"
            ("id", "assessmentId", "traitMappingId", "dimensionId", "weight", "priority", "difficultyRelevance", "minimumQuestions", "recommendedQuestions", "idealQuestions", "createdAt", "updatedAt")
            VALUES (${randomUUID()}, ${assessment.id}, ${mappingId}, ${dimension.id}, ${dimensionWeight}, ${priority(dimensionIndex, Boolean(traitSeed.isCritical))}, ${difficultyRelevance(dimensionIndex)}, ${3}, ${6}, ${10}, ${new Date()}, ${new Date()})
            ON CONFLICT ("assessmentId", "traitMappingId", "dimensionId")
            DO UPDATE SET
              "weight" = EXCLUDED."weight",
              "priority" = EXCLUDED."priority",
              "difficultyRelevance" = EXCLUDED."difficultyRelevance",
              "minimumQuestions" = EXCLUDED."minimumQuestions",
              "recommendedQuestions" = EXCLUDED."recommendedQuestions",
              "idealQuestions" = EXCLUDED."idealQuestions",
              "updatedAt" = EXCLUDED."updatedAt"
          `;
          dimensionMappings += 1;
        }
      }
    }

    return { traitMappings, dimensionMappings, missing };
  },

  assessments() {
    return prisma.$queryRaw`
      SELECT
        a."id",
        a."name",
        a."slug",
        a."level",
        a."status",
        COUNT(DISTINCT tm."id")::int AS "traitCount",
        COUNT(DISTINCT dm."id")::int AS "dimensionCount",
        COUNT(DISTINCT q."id")::int AS "questionCount"
      FROM "AssessmentArenaAssessment" a
      LEFT JOIN "AssessmentTraitMapping" tm ON tm."assessmentId" = a."id"
      LEFT JOIN "AssessmentDimensionMapping" dm ON dm."assessmentId" = a."id"
      LEFT JOIN "AssessmentQuestion" q ON q."assessmentId" = a."id"
      GROUP BY a."id"
      ORDER BY a."level" ASC, a."name" ASC
    `;
  },

  traits(assessmentId?: string) {
    if (assessmentId) {
      return prisma.$queryRaw`
        SELECT tm.*, a."name" AS "assessmentName", a."slug" AS "assessmentSlug", t."slug" AS "traitSlug", t."name" AS "traitName", t."definition"
        FROM "AssessmentTraitMapping" tm
        JOIN "AssessmentArenaAssessment" a ON a."id" = tm."assessmentId"
        JOIN "AssessmentTraitLibraryItem" t ON t."id" = tm."traitId"
        WHERE tm."assessmentId" = ${assessmentId}
        ORDER BY tm."displayOrder" ASC
      `;
    }
    return prisma.$queryRaw`
      SELECT tm.*, a."name" AS "assessmentName", a."slug" AS "assessmentSlug", t."slug" AS "traitSlug", t."name" AS "traitName", t."definition"
      FROM "AssessmentTraitMapping" tm
      JOIN "AssessmentArenaAssessment" a ON a."id" = tm."assessmentId"
      JOIN "AssessmentTraitLibraryItem" t ON t."id" = tm."traitId"
      ORDER BY a."name" ASC, tm."displayOrder" ASC
    `;
  },

  dimensions(assessmentId?: string) {
    if (assessmentId) {
      return prisma.$queryRaw`
        SELECT dm.*, a."name" AS "assessmentName", t."name" AS "traitName", d."name" AS "dimensionName", d."description"
        FROM "AssessmentDimensionMapping" dm
        JOIN "AssessmentArenaAssessment" a ON a."id" = dm."assessmentId"
        JOIN "AssessmentTraitMapping" tm ON tm."id" = dm."traitMappingId"
        JOIN "AssessmentTraitLibraryItem" t ON t."id" = tm."traitId"
        JOIN "AssessmentDimensionLibraryItem" d ON d."id" = dm."dimensionId"
        WHERE dm."assessmentId" = ${assessmentId}
        ORDER BY tm."displayOrder" ASC, dm."priority" ASC, d."name" ASC
      `;
    }
    return prisma.$queryRaw`
      SELECT dm.*, a."name" AS "assessmentName", t."name" AS "traitName", d."name" AS "dimensionName", d."description"
      FROM "AssessmentDimensionMapping" dm
      JOIN "AssessmentArenaAssessment" a ON a."id" = dm."assessmentId"
      JOIN "AssessmentTraitMapping" tm ON tm."id" = dm."traitMappingId"
      JOIN "AssessmentTraitLibraryItem" t ON t."id" = tm."traitId"
      JOIN "AssessmentDimensionLibraryItem" d ON d."id" = dm."dimensionId"
      ORDER BY a."name" ASC, tm."displayOrder" ASC, dm."priority" ASC, d."name" ASC
    `;
  },

  coverage() {
    return prisma.$queryRaw`
      SELECT
        a."id" AS "assessmentId",
        a."name",
        a."slug",
        a."level",
        a."status",
        COUNT(DISTINCT tm."id")::int AS "traitCount",
        COUNT(DISTINCT dm."id")::int AS "dimensionCount",
        COUNT(DISTINCT CASE WHEN tm."isCritical" THEN tm."id" END)::int AS "criticalTraitCount",
        COUNT(DISTINCT CASE WHEN tm."isReadinessTrait" THEN tm."id" END)::int AS "readinessTraitCount",
        COUNT(DISTINCT CASE WHEN tm."isRiskTrait" THEN tm."id" END)::int AS "riskTraitCount",
        CASE
          WHEN COUNT(DISTINCT tm."id") >= 5
            AND COUNT(DISTINCT dm."id") >= 15
            AND COUNT(DISTINCT CASE WHEN tm."isCritical" THEN tm."id" END) > 0
            AND COUNT(DISTINCT CASE WHEN tm."isRiskTrait" THEN tm."id" END) > 0
          THEN 'PASS'
          ELSE 'FAIL'
        END AS "coverageStatus"
      FROM "AssessmentArenaAssessment" a
      LEFT JOIN "AssessmentTraitMapping" tm ON tm."assessmentId" = a."id"
      LEFT JOIN "AssessmentDimensionMapping" dm ON dm."assessmentId" = a."id"
      GROUP BY a."id"
      ORDER BY a."level" ASC, a."name" ASC
    `;
  }
};
