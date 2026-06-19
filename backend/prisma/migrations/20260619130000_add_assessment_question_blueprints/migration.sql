-- CreateTable
CREATE TABLE "AssessmentQuestionBlueprint" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "targetQuestionsPerAttempt" INTEGER NOT NULL,
    "minimumBankSize" INTEGER NOT NULL,
    "recommendedBankSize" INTEGER NOT NULL,
    "idealBankSize" INTEGER NOT NULL,
    "difficultyDistribution" JSONB NOT NULL,
    "integrityQuestionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contradictionQuestionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reverseScoringPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskDetectionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "questionTypeDistribution" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestionBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentTraitBlueprint" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionBlueprintId" TEXT NOT NULL,
    "traitMappingId" TEXT NOT NULL,
    "targetQuestionCount" INTEGER NOT NULL,
    "weightPercent" DOUBLE PRECISION NOT NULL,
    "difficultyDistribution" JSONB NOT NULL,
    "integrityQuestionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskDetectionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentTraitBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentDimensionBlueprint" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionBlueprintId" TEXT NOT NULL,
    "traitBlueprintId" TEXT NOT NULL,
    "dimensionMappingId" TEXT NOT NULL,
    "targetQuestionCount" INTEGER NOT NULL,
    "questionTypes" JSONB NOT NULL,
    "difficultyDistribution" JSONB NOT NULL,
    "integrityQuestionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskDetectionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentDimensionBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestionBlueprint_assessmentId_key" ON "AssessmentQuestionBlueprint"("assessmentId");
CREATE INDEX "AssessmentQuestionBlueprint_status_idx" ON "AssessmentQuestionBlueprint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentTraitBlueprint_questionBlueprintId_traitMappingId_key" ON "AssessmentTraitBlueprint"("questionBlueprintId", "traitMappingId");
CREATE INDEX "AssessmentTraitBlueprint_assessmentId_idx" ON "AssessmentTraitBlueprint"("assessmentId");
CREATE INDEX "AssessmentTraitBlueprint_questionBlueprintId_idx" ON "AssessmentTraitBlueprint"("questionBlueprintId");
CREATE INDEX "AssessmentTraitBlueprint_traitMappingId_idx" ON "AssessmentTraitBlueprint"("traitMappingId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentDimensionBlueprint_questionBlueprintId_dimensionMappingId_key" ON "AssessmentDimensionBlueprint"("questionBlueprintId", "dimensionMappingId");
CREATE INDEX "AssessmentDimensionBlueprint_assessmentId_idx" ON "AssessmentDimensionBlueprint"("assessmentId");
CREATE INDEX "AssessmentDimensionBlueprint_questionBlueprintId_idx" ON "AssessmentDimensionBlueprint"("questionBlueprintId");
CREATE INDEX "AssessmentDimensionBlueprint_traitBlueprintId_idx" ON "AssessmentDimensionBlueprint"("traitBlueprintId");
CREATE INDEX "AssessmentDimensionBlueprint_dimensionMappingId_idx" ON "AssessmentDimensionBlueprint"("dimensionMappingId");

-- AddForeignKey
ALTER TABLE "AssessmentQuestionBlueprint" ADD CONSTRAINT "AssessmentQuestionBlueprint_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentTraitBlueprint" ADD CONSTRAINT "AssessmentTraitBlueprint_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentTraitBlueprint" ADD CONSTRAINT "AssessmentTraitBlueprint_questionBlueprintId_fkey" FOREIGN KEY ("questionBlueprintId") REFERENCES "AssessmentQuestionBlueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentTraitBlueprint" ADD CONSTRAINT "AssessmentTraitBlueprint_traitMappingId_fkey" FOREIGN KEY ("traitMappingId") REFERENCES "AssessmentTraitMapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentDimensionBlueprint" ADD CONSTRAINT "AssessmentDimensionBlueprint_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentDimensionBlueprint" ADD CONSTRAINT "AssessmentDimensionBlueprint_questionBlueprintId_fkey" FOREIGN KEY ("questionBlueprintId") REFERENCES "AssessmentQuestionBlueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentDimensionBlueprint" ADD CONSTRAINT "AssessmentDimensionBlueprint_traitBlueprintId_fkey" FOREIGN KEY ("traitBlueprintId") REFERENCES "AssessmentTraitBlueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentDimensionBlueprint" ADD CONSTRAINT "AssessmentDimensionBlueprint_dimensionMappingId_fkey" FOREIGN KEY ("dimensionMappingId") REFERENCES "AssessmentDimensionMapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
