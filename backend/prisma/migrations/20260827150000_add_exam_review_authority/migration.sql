ALTER TABLE "Test"
  ADD COLUMN "expectedQuestionCount" INTEGER,
  ADD COLUMN "authoritativeQuestionCount" INTEGER,
  ADD COLUMN "expectedTotalMarks" DOUBLE PRECISION;

ALTER TABLE "Question"
  ADD COLUMN "reviewIssues" JSONB;

UPDATE "Test" t
SET "expectedQuestionCount" = counts.actual_count,
    "authoritativeQuestionCount" = counts.actual_count,
    "expectedTotalMarks" = t."totalMarks"
FROM (
  SELECT "testId", COUNT(*)::INTEGER AS actual_count
  FROM "Question"
  GROUP BY "testId"
) counts
WHERE counts."testId" = t."id";
