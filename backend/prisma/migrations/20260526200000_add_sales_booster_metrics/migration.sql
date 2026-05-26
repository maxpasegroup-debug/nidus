CREATE TABLE "SalesBoosterMetricSnapshot" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "reach" INTEGER NOT NULL DEFAULT 0,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "leads" INTEGER NOT NULL DEFAULT 0,
  "admissions" INTEGER NOT NULL DEFAULT 0,
  "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SalesBoosterMetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SalesBoosterMetricSnapshot_campaignId_idx" ON "SalesBoosterMetricSnapshot"("campaignId");
CREATE INDEX "SalesBoosterMetricSnapshot_platform_idx" ON "SalesBoosterMetricSnapshot"("platform");
CREATE INDEX "SalesBoosterMetricSnapshot_capturedAt_idx" ON "SalesBoosterMetricSnapshot"("capturedAt");

ALTER TABLE "SalesBoosterMetricSnapshot"
  ADD CONSTRAINT "SalesBoosterMetricSnapshot_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "SalesBoosterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
