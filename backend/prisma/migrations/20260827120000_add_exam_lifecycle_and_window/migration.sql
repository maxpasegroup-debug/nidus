-- Preserve existing exam records while adding one authoritative lifecycle and
-- timezone-safe examination-window instants.
ALTER TABLE "Test" ADD COLUMN "lifecycle" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Test" ADD COLUMN "examStartsAt" TIMESTAMP(3);
ALTER TABLE "Test" ADD COLUMN "examEndsAt" TIMESTAMP(3);

-- Legacy status/isLive remain as compatibility fields. Existing records are
-- deterministically mapped without assigning artificial examination dates.
UPDATE "Test"
SET "lifecycle" = CASE
  WHEN "status" = 'ARCHIVED' THEN 'ARCHIVED'
  WHEN "status" = 'CLOSED' THEN 'CLOSED'
  WHEN "status" = 'PUBLISHED' AND "isLive" = true THEN 'LIVE'
  WHEN "status" = 'PUBLISHED' THEN 'SCHEDULED'
  WHEN "status" IN ('APPROVED', 'REVIEW', 'DRAFT_REVIEW') THEN 'IN_REVIEW'
  ELSE 'DRAFT'
END;

CREATE INDEX "Test_lifecycle_idx" ON "Test"("lifecycle");
CREATE INDEX "Test_examStartsAt_idx" ON "Test"("examStartsAt");
CREATE INDEX "Test_examEndsAt_idx" ON "Test"("examEndsAt");
