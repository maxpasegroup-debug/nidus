-- CreateTable
CREATE TABLE "AssessmentTraitMapping" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "traitId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "isReadinessTrait" BOOLEAN NOT NULL DEFAULT true,
    "isRiskTrait" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentTraitMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentDimensionMapping" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "traitMappingId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "difficultyRelevance" TEXT NOT NULL DEFAULT 'LEVEL_1_TO_5',
    "minimumQuestions" INTEGER NOT NULL DEFAULT 0,
    "recommendedQuestions" INTEGER NOT NULL DEFAULT 0,
    "idealQuestions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentDimensionMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentTraitMapping_assessmentId_traitId_key" ON "AssessmentTraitMapping"("assessmentId", "traitId");
CREATE INDEX "AssessmentTraitMapping_assessmentId_idx" ON "AssessmentTraitMapping"("assessmentId");
CREATE INDEX "AssessmentTraitMapping_traitId_idx" ON "AssessmentTraitMapping"("traitId");
CREATE INDEX "AssessmentTraitMapping_isCritical_idx" ON "AssessmentTraitMapping"("isCritical");
CREATE INDEX "AssessmentTraitMapping_isReadinessTrait_idx" ON "AssessmentTraitMapping"("isReadinessTrait");
CREATE INDEX "AssessmentTraitMapping_isRiskTrait_idx" ON "AssessmentTraitMapping"("isRiskTrait");
CREATE INDEX "AssessmentTraitMapping_displayOrder_idx" ON "AssessmentTraitMapping"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentDimensionMapping_assessmentId_traitMappingId_dimensionId_key" ON "AssessmentDimensionMapping"("assessmentId", "traitMappingId", "dimensionId");
CREATE INDEX "AssessmentDimensionMapping_assessmentId_idx" ON "AssessmentDimensionMapping"("assessmentId");
CREATE INDEX "AssessmentDimensionMapping_traitMappingId_idx" ON "AssessmentDimensionMapping"("traitMappingId");
CREATE INDEX "AssessmentDimensionMapping_dimensionId_idx" ON "AssessmentDimensionMapping"("dimensionId");
CREATE INDEX "AssessmentDimensionMapping_priority_idx" ON "AssessmentDimensionMapping"("priority");
CREATE INDEX "AssessmentDimensionMapping_difficultyRelevance_idx" ON "AssessmentDimensionMapping"("difficultyRelevance");

-- AddForeignKey
ALTER TABLE "AssessmentTraitMapping" ADD CONSTRAINT "AssessmentTraitMapping_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentTraitMapping" ADD CONSTRAINT "AssessmentTraitMapping_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "AssessmentTraitLibraryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssessmentDimensionMapping" ADD CONSTRAINT "AssessmentDimensionMapping_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentDimensionMapping" ADD CONSTRAINT "AssessmentDimensionMapping_traitMappingId_fkey" FOREIGN KEY ("traitMappingId") REFERENCES "AssessmentTraitMapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentDimensionMapping" ADD CONSTRAINT "AssessmentDimensionMapping_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "AssessmentDimensionLibraryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
