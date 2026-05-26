CREATE TABLE "SalesBoosterCampaign" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "track" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "creativeName" TEXT,
  "creativeType" TEXT,
  "channels" JSONB NOT NULL,
  "aiDraft" JSONB NOT NULL,
  "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
  "runStatus" TEXT NOT NULL DEFAULT 'API_NOT_CONNECTED',
  "reviewNote" TEXT,
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "queuedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SalesBoosterCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SalesBoosterCampaign_track_idx" ON "SalesBoosterCampaign"("track");
CREATE INDEX "SalesBoosterCampaign_approvalStatus_idx" ON "SalesBoosterCampaign"("approvalStatus");
CREATE INDEX "SalesBoosterCampaign_runStatus_idx" ON "SalesBoosterCampaign"("runStatus");
CREATE INDEX "SalesBoosterCampaign_createdById_idx" ON "SalesBoosterCampaign"("createdById");
CREATE INDEX "SalesBoosterCampaign_createdAt_idx" ON "SalesBoosterCampaign"("createdAt");

ALTER TABLE "SalesBoosterCampaign"
  ADD CONSTRAINT "SalesBoosterCampaign_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SalesBoosterCampaign"
  ADD CONSTRAINT "SalesBoosterCampaign_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
