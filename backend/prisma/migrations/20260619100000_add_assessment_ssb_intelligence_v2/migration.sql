CREATE TABLE IF NOT EXISTS "AssessmentSsbOlq" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "definition" TEXT NOT NULL,
  "defenceRelevance" TEXT NOT NULL,
  "assessmentRelevance" TEXT NOT NULL,
  "riskRelevance" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentSsbOlq_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentSsbOlqMapping" (
  "id" TEXT NOT NULL,
  "olqId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceId" TEXT,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentSsbOlqMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentSsbOlqInterpretation" (
  "id" TEXT NOT NULL,
  "olqId" TEXT NOT NULL,
  "band" TEXT NOT NULL,
  "minScore" INTEGER NOT NULL,
  "maxScore" INTEGER NOT NULL,
  "interpretation" TEXT NOT NULL,
  "mentorGuidance" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentSsbOlqInterpretation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentSsbOlq_slug_key" ON "AssessmentSsbOlq"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentSsbOlq_name_key" ON "AssessmentSsbOlq"("name");
CREATE INDEX IF NOT EXISTS "AssessmentSsbOlq_slug_idx" ON "AssessmentSsbOlq"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentSsbOlqMapping_olqId_sourceType_sourceName_key"
ON "AssessmentSsbOlqMapping"("olqId", "sourceType", "sourceName");
CREATE INDEX IF NOT EXISTS "AssessmentSsbOlqMapping_olqId_idx" ON "AssessmentSsbOlqMapping"("olqId");
CREATE INDEX IF NOT EXISTS "AssessmentSsbOlqMapping_sourceType_idx" ON "AssessmentSsbOlqMapping"("sourceType");
CREATE INDEX IF NOT EXISTS "AssessmentSsbOlqMapping_sourceName_idx" ON "AssessmentSsbOlqMapping"("sourceName");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentSsbOlqInterpretation_olqId_band_key"
ON "AssessmentSsbOlqInterpretation"("olqId", "band");
CREATE INDEX IF NOT EXISTS "AssessmentSsbOlqInterpretation_olqId_idx" ON "AssessmentSsbOlqInterpretation"("olqId");
CREATE INDEX IF NOT EXISTS "AssessmentSsbOlqInterpretation_band_idx" ON "AssessmentSsbOlqInterpretation"("band");

ALTER TABLE "AssessmentSsbOlqMapping"
ADD CONSTRAINT "AssessmentSsbOlqMapping_olqId_fkey"
FOREIGN KEY ("olqId") REFERENCES "AssessmentSsbOlq"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentSsbOlqInterpretation"
ADD CONSTRAINT "AssessmentSsbOlqInterpretation_olqId_fkey"
FOREIGN KEY ("olqId") REFERENCES "AssessmentSsbOlq"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
