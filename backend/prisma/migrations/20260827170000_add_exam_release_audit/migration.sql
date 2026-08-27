ALTER TABLE "Test"
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "releasedById" TEXT;

UPDATE "Test"
SET "publishedAt" = COALESCE("publishAt", "createdAt")
WHERE "lifecycle" = 'LIVE';
