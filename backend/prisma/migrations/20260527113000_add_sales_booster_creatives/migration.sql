ALTER TABLE "SalesBoosterCampaign"
ADD COLUMN "creativeUrl" TEXT,
ADD COLUMN "creativeMediaId" TEXT,
ADD COLUMN "creativeSize" INTEGER,
ADD COLUMN "creativeUploadedAt" TIMESTAMP(3);

CREATE INDEX "SalesBoosterCampaign_creativeMediaId_idx" ON "SalesBoosterCampaign"("creativeMediaId");
