-- Additive Phase A foundation. Legacy A-D columns remain intact so existing
-- single-choice exams continue to work during the staged migration.
ALTER TABLE "Question"
ADD COLUMN "displayOrder" INTEGER,
ADD COLUMN "questionType" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
ADD COLUMN "questionStructure" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "sectionId" TEXT,
ADD COLUMN "groupId" TEXT,
ADD COLUMN "parentQuestionId" TEXT,
ADD COLUMN "sourceQuestionNumber" TEXT,
ADD COLUMN "responseSpec" JSONB,
ADD COLUMN "evaluationSpec" JSONB,
ADD COLUMN "sourceEvidence" JSONB,
ADD COLUMN "extractionConfidence" JSONB;

-- Preserve the exact order users previously observed (id ordering) while
-- making future imports independent of generated database identifiers.
WITH ordered_questions AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "testId" ORDER BY "id")::INTEGER AS position
  FROM "Question"
)
UPDATE "Question" q
SET "displayOrder" = ordered_questions.position
FROM ordered_questions
WHERE q."id" = ordered_questions."id";

UPDATE "Question"
SET "sourceQuestionNumber" = "contentJson"->'metadata'->>'sourceQuestionNumber'
WHERE "sourceQuestionNumber" IS NULL
  AND jsonb_typeof("contentJson"->'metadata'->'sourceQuestionNumber') IN ('number', 'string');

ALTER TABLE "Question" ALTER COLUMN "displayOrder" SET NOT NULL;
ALTER TABLE "Question" ALTER COLUMN "displayOrder" SET DEFAULT 0;

ALTER TABLE "QuestionVersion"
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "questionType" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
ADD COLUMN "questionStructure" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "sectionId" TEXT,
ADD COLUMN "groupId" TEXT,
ADD COLUMN "parentQuestionId" TEXT,
ADD COLUMN "sourceQuestionNumber" TEXT,
ADD COLUMN "responseSpec" JSONB,
ADD COLUMN "evaluationSpec" JSONB,
ADD COLUMN "sourceEvidence" JSONB,
ADD COLUMN "extractionConfidence" JSONB;

UPDATE "QuestionVersion" qv
SET
  "displayOrder" = q."displayOrder",
  "questionType" = q."questionType",
  "questionStructure" = q."questionStructure",
  "sectionId" = q."sectionId",
  "groupId" = q."groupId",
  "parentQuestionId" = q."parentQuestionId",
  "sourceQuestionNumber" = q."sourceQuestionNumber",
  "responseSpec" = q."responseSpec",
  "evaluationSpec" = q."evaluationSpec",
  "sourceEvidence" = q."sourceEvidence",
  "extractionConfidence" = q."extractionConfidence"
FROM "Question" q
WHERE qv."questionId" = q."id";

CREATE INDEX "Question_testId_displayOrder_idx" ON "Question"("testId", "displayOrder");
CREATE INDEX "Question_parentQuestionId_idx" ON "Question"("parentQuestionId");
CREATE INDEX "Question_sectionId_idx" ON "Question"("sectionId");
CREATE INDEX "Question_groupId_idx" ON "Question"("groupId");
CREATE INDEX "Question_questionType_idx" ON "Question"("questionType");

ALTER TABLE "Question"
ADD CONSTRAINT "Question_parentQuestionId_fkey"
FOREIGN KEY ("parentQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;
