CREATE TABLE "SalesBoosterAudienceContact" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "segment" TEXT NOT NULL DEFAULT 'General',
  "source" TEXT NOT NULL DEFAULT 'Manual',
  "interest" TEXT,
  "optIn" BOOLEAN NOT NULL DEFAULT true,
  "whatsappStatus" TEXT NOT NULL DEFAULT 'READY',
  "lastContactedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SalesBoosterAudienceContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalesBoosterAudienceContact_phone_segment_key" ON "SalesBoosterAudienceContact"("phone", "segment");
CREATE INDEX "SalesBoosterAudienceContact_segment_idx" ON "SalesBoosterAudienceContact"("segment");
CREATE INDEX "SalesBoosterAudienceContact_source_idx" ON "SalesBoosterAudienceContact"("source");
CREATE INDEX "SalesBoosterAudienceContact_optIn_idx" ON "SalesBoosterAudienceContact"("optIn");
CREATE INDEX "SalesBoosterAudienceContact_whatsappStatus_idx" ON "SalesBoosterAudienceContact"("whatsappStatus");

ALTER TABLE "SalesBoosterAudienceContact"
  ADD CONSTRAINT "SalesBoosterAudienceContact_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
