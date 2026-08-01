CREATE TABLE "NdieQueueJob" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "replayRunId" TEXT,
  "jobType" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'QUEUED',
  "provider" TEXT NOT NULL DEFAULT 'database',
  "workerId" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "currentStage" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "retryDelayMs" INTEGER NOT NULL DEFAULT 30000,
  "backoffStrategy" TEXT NOT NULL DEFAULT 'EXPONENTIAL',
  "retryHistory" JSONB,
  "diagnostics" JSONB,
  "payload" JSONB,
  "result" JSONB,
  "errorCategory" TEXT,
  "errorMessage" TEXT,
  "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "nextRunAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NdieQueueJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NdieQueueJob_importJobId_idx" ON "NdieQueueJob"("importJobId");
CREATE INDEX "NdieQueueJob_replayRunId_idx" ON "NdieQueueJob"("replayRunId");
CREATE INDEX "NdieQueueJob_jobType_idx" ON "NdieQueueJob"("jobType");
CREATE INDEX "NdieQueueJob_stage_idx" ON "NdieQueueJob"("stage");
CREATE INDEX "NdieQueueJob_state_idx" ON "NdieQueueJob"("state");
CREATE INDEX "NdieQueueJob_provider_idx" ON "NdieQueueJob"("provider");
CREATE INDEX "NdieQueueJob_workerId_idx" ON "NdieQueueJob"("workerId");
CREATE INDEX "NdieQueueJob_nextRunAt_idx" ON "NdieQueueJob"("nextRunAt");
CREATE INDEX "NdieQueueJob_queuedAt_idx" ON "NdieQueueJob"("queuedAt");

ALTER TABLE "NdieQueueJob"
  ADD CONSTRAINT "NdieQueueJob_importJobId_fkey"
  FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
