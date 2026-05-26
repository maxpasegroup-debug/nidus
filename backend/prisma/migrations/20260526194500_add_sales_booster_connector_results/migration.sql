ALTER TABLE "SalesBoosterCampaign"
  ADD COLUMN "connectorResults" JSONB,
  ADD COLUMN "lastRunAt" TIMESTAMP(3);
