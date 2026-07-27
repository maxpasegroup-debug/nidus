CREATE TABLE "ExamUpload" (
  "id" TEXT NOT NULL,
  "examId" TEXT,
  "testId" TEXT,
  "batchId" TEXT,
  "subject" TEXT,
  "topic" TEXT,
  "sourceKind" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "cloudinaryUrl" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "extractionStatus" TEXT NOT NULL DEFAULT 'UPLOADED',
  "extractionAudit" JSONB,
  "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  "manualReviewCompleted" BOOLEAN NOT NULL DEFAULT false,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExamUpload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExamUpload_examId_idx" ON "ExamUpload"("examId");
CREATE INDEX "ExamUpload_testId_idx" ON "ExamUpload"("testId");
CREATE INDEX "ExamUpload_batchId_idx" ON "ExamUpload"("batchId");
CREATE INDEX "ExamUpload_uploadedBy_idx" ON "ExamUpload"("uploadedBy");
CREATE INDEX "ExamUpload_sourceKind_idx" ON "ExamUpload"("sourceKind");
CREATE INDEX "ExamUpload_extractionStatus_idx" ON "ExamUpload"("extractionStatus");
