CREATE TABLE "QueueJobLog" (
  "id" TEXT NOT NULL,
  "queueName" TEXT NOT NULL,
  "jobName" TEXT NOT NULL,
  "jobId" TEXT,
  "status" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QueueJobLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIRequestLog" (
  "id" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "promptChars" INTEGER NOT NULL DEFAULT 0,
  "outputChars" INTEGER NOT NULL DEFAULT 0,
  "tokenUsage" JSONB,
  "error" TEXT,
  "durationMs" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRequestLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QueueJobLog_queueName_idx" ON "QueueJobLog"("queueName");
CREATE INDEX "QueueJobLog_status_idx" ON "QueueJobLog"("status");
CREATE INDEX "QueueJobLog_createdAt_idx" ON "QueueJobLog"("createdAt");
CREATE INDEX "AIRequestLog_feature_idx" ON "AIRequestLog"("feature");
CREATE INDEX "AIRequestLog_status_idx" ON "AIRequestLog"("status");
CREATE INDEX "AIRequestLog_createdAt_idx" ON "AIRequestLog"("createdAt");
