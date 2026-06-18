CREATE TABLE IF NOT EXISTS "AssessmentTraitLibraryItem" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "definition" TEXT NOT NULL,
  "defenceRelevance" TEXT NOT NULL,
  "ssbRelevance" TEXT NOT NULL,
  "topRankRelevance" TEXT NOT NULL,
  "riskRelevance" TEXT NOT NULL,
  "assessmentRelevance" JSONB NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentTraitLibraryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentDimensionLibraryItem" (
  "id" TEXT NOT NULL,
  "traitId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "importance" TEXT NOT NULL,
  "riskImpact" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentDimensionLibraryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentTraitBandInterpretation" (
  "id" TEXT NOT NULL,
  "traitId" TEXT NOT NULL,
  "band" TEXT NOT NULL,
  "minScore" INTEGER NOT NULL,
  "maxScore" INTEGER NOT NULL,
  "interpretation" TEXT NOT NULL,
  "recommendation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentTraitBandInterpretation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentRiskInterpretation" (
  "id" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "interpretation" TEXT NOT NULL,
  "actionGuidance" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentRiskInterpretation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentReadinessInterpretation" (
  "id" TEXT NOT NULL,
  "band" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "minScore" INTEGER NOT NULL,
  "maxScore" INTEGER NOT NULL,
  "interpretation" TEXT NOT NULL,
  "actionGuidance" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentReadinessInterpretation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentTraitLibraryItem_slug_key" ON "AssessmentTraitLibraryItem"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentTraitLibraryItem_name_key" ON "AssessmentTraitLibraryItem"("name");
CREATE INDEX IF NOT EXISTS "AssessmentTraitLibraryItem_slug_idx" ON "AssessmentTraitLibraryItem"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentDimensionLibraryItem_traitId_slug_key" ON "AssessmentDimensionLibraryItem"("traitId", "slug");
CREATE INDEX IF NOT EXISTS "AssessmentDimensionLibraryItem_traitId_idx" ON "AssessmentDimensionLibraryItem"("traitId");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentTraitBandInterpretation_traitId_band_key" ON "AssessmentTraitBandInterpretation"("traitId", "band");
CREATE INDEX IF NOT EXISTS "AssessmentTraitBandInterpretation_traitId_idx" ON "AssessmentTraitBandInterpretation"("traitId");
CREATE INDEX IF NOT EXISTS "AssessmentTraitBandInterpretation_band_idx" ON "AssessmentTraitBandInterpretation"("band");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentRiskInterpretation_riskLevel_key" ON "AssessmentRiskInterpretation"("riskLevel");
CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentReadinessInterpretation_band_key" ON "AssessmentReadinessInterpretation"("band");

ALTER TABLE "AssessmentDimensionLibraryItem"
ADD CONSTRAINT "AssessmentDimensionLibraryItem_traitId_fkey"
FOREIGN KEY ("traitId") REFERENCES "AssessmentTraitLibraryItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentTraitBandInterpretation"
ADD CONSTRAINT "AssessmentTraitBandInterpretation_traitId_fkey"
FOREIGN KEY ("traitId") REFERENCES "AssessmentTraitLibraryItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
