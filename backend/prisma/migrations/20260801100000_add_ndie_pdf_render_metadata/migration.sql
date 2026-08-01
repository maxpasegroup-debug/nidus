ALTER TABLE "NdiePage"
  ADD COLUMN "dpi" INTEGER,
  ADD COLUMN "aspectRatio" DOUBLE PRECISION,
  ADD COLUMN "imageSizeBytes" INTEGER,
  ADD COLUMN "checksum" TEXT,
  ADD COLUMN "storageProvider" TEXT,
  ADD COLUMN "storageLocation" TEXT,
  ADD COLUMN "pipelineVersion" TEXT,
  ADD COLUMN "providerVersion" TEXT,
  ADD COLUMN "renderDurationMs" INTEGER,
  ADD COLUMN "renderedAt" TIMESTAMP(3),
  ADD COLUMN "diagnostics" JSONB;

CREATE INDEX "NdiePage_checksum_idx" ON "NdiePage"("checksum");
CREATE INDEX "NdiePage_renderedAt_idx" ON "NdiePage"("renderedAt");
