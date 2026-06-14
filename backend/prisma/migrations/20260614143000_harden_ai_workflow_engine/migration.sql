ALTER TABLE "ai_workflow_requests"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT;

ALTER TABLE "ai_workflow_context"
  ADD COLUMN IF NOT EXISTS "actorUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "actorName" TEXT,
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ai_workflow_context_sources"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ai_workflow_drafts"
  ADD COLUMN IF NOT EXISTS "actorUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "actorName" TEXT,
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT;

ALTER TABLE "ai_workflow_draft_versions"
  ADD COLUMN IF NOT EXISTS "actorName" TEXT,
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ai_workflow_reviews"
  ADD COLUMN IF NOT EXISTS "actorUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "actorName" TEXT,
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT;

ALTER TABLE "ai_workflow_approvals"
  ADD COLUMN IF NOT EXISTS "actorUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "actorName" TEXT,
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ai_workflow_feedback"
  ADD COLUMN IF NOT EXISTS "actorUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "actorName" TEXT,
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ai_workflow_publications"
  ADD COLUMN IF NOT EXISTS "actorUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "actorName" TEXT,
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT;

ALTER TABLE "ai_workflow_audit_events"
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ai_workflow_publications" WHERE "draftId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot harden ai_workflow_publications: existing publications without draftId must be remediated first';
  END IF;
END $$;

ALTER TABLE "ai_workflow_publications"
  ALTER COLUMN "draftId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ai_workflow_context_actorUserId_idx') THEN
    CREATE INDEX "ai_workflow_context_actorUserId_idx" ON "ai_workflow_context"("actorUserId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ai_workflow_drafts_actorUserId_idx') THEN
    CREATE INDEX "ai_workflow_drafts_actorUserId_idx" ON "ai_workflow_drafts"("actorUserId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ai_workflow_reviews_actorUserId_idx') THEN
    CREATE INDEX "ai_workflow_reviews_actorUserId_idx" ON "ai_workflow_reviews"("actorUserId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ai_workflow_approvals_actorUserId_idx') THEN
    CREATE INDEX "ai_workflow_approvals_actorUserId_idx" ON "ai_workflow_approvals"("actorUserId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ai_workflow_feedback_actorUserId_idx') THEN
    CREATE INDEX "ai_workflow_feedback_actorUserId_idx" ON "ai_workflow_feedback"("actorUserId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ai_workflow_publications_actorUserId_idx') THEN
    CREATE INDEX "ai_workflow_publications_actorUserId_idx" ON "ai_workflow_publications"("actorUserId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ai_workflow_publications_approvalId_key') THEN
    CREATE UNIQUE INDEX "ai_workflow_publications_approvalId_key" ON "ai_workflow_publications"("approvalId");
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_publications_draftId_fkey') THEN
    ALTER TABLE "ai_workflow_publications" DROP CONSTRAINT "ai_workflow_publications_draftId_fkey";
  END IF;

  ALTER TABLE "ai_workflow_publications"
    ADD CONSTRAINT "ai_workflow_publications_draftId_fkey"
    FOREIGN KEY ("draftId") REFERENCES "ai_workflow_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_approvals_publicationId_fkey') THEN
    ALTER TABLE "ai_workflow_approvals"
      ADD CONSTRAINT "ai_workflow_approvals_publicationId_fkey"
      FOREIGN KEY ("publicationId") REFERENCES "ai_workflow_publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_publications_approvalId_fkey') THEN
    ALTER TABLE "ai_workflow_publications"
      ADD CONSTRAINT "ai_workflow_publications_approvalId_fkey"
      FOREIGN KEY ("approvalId") REFERENCES "ai_workflow_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
