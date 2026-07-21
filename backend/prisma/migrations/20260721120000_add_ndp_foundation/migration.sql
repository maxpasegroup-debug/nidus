CREATE TABLE "NdpReview" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "batchId" TEXT NOT NULL,
  "batchName" TEXT,
  "reviewPeriod" TEXT NOT NULL,
  "reviewType" TEXT NOT NULL DEFAULT 'MONTHLY',
  "academicYear" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "teacherId" TEXT,
  "teacherName" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "reviewedByName" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "scores" JSONB,
  "sections" JSONB,
  "finalReview" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NdpReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdpManualEntry" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "teacherId" TEXT,
  "category" TEXT NOT NULL,
  "item" TEXT NOT NULL,
  "subject" TEXT NOT NULL DEFAULT '',
  "term1" TEXT,
  "term2" TEXT,
  "term3" TEXT,
  "rating" TEXT,
  "score" INTEGER,
  "remarks" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NdpManualEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NdpReview_studentId_batchId_reviewPeriod_key" ON "NdpReview"("studentId", "batchId", "reviewPeriod");
CREATE INDEX "NdpReview_studentId_idx" ON "NdpReview"("studentId");
CREATE INDEX "NdpReview_batchId_idx" ON "NdpReview"("batchId");
CREATE INDEX "NdpReview_teacherId_idx" ON "NdpReview"("teacherId");
CREATE INDEX "NdpReview_status_idx" ON "NdpReview"("status");
CREATE INDEX "NdpReview_reviewPeriod_idx" ON "NdpReview"("reviewPeriod");

CREATE UNIQUE INDEX "NdpManualEntry_reviewId_category_item_subject_key" ON "NdpManualEntry"("reviewId", "category", "item", "subject");
CREATE INDEX "NdpManualEntry_reviewId_idx" ON "NdpManualEntry"("reviewId");
CREATE INDEX "NdpManualEntry_studentId_idx" ON "NdpManualEntry"("studentId");
CREATE INDEX "NdpManualEntry_batchId_idx" ON "NdpManualEntry"("batchId");
CREATE INDEX "NdpManualEntry_teacherId_idx" ON "NdpManualEntry"("teacherId");
CREATE INDEX "NdpManualEntry_category_idx" ON "NdpManualEntry"("category");
CREATE INDEX "NdpManualEntry_status_idx" ON "NdpManualEntry"("status");

ALTER TABLE "NdpManualEntry" ADD CONSTRAINT "NdpManualEntry_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "NdpReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
