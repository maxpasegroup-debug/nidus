ALTER TABLE "SalesBoosterCampaign"
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "scheduleStatus" TEXT NOT NULL DEFAULT 'NOT_SCHEDULED',
  ADD COLUMN "scheduleNote" TEXT;

CREATE INDEX "SalesBoosterCampaign_scheduleStatus_idx" ON "SalesBoosterCampaign"("scheduleStatus");
CREATE INDEX "SalesBoosterCampaign_scheduledAt_idx" ON "SalesBoosterCampaign"("scheduledAt");
