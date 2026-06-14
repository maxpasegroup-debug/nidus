CREATE TABLE IF NOT EXISTS "ai_workflow_requests" (
  "id" TEXT NOT NULL,
  "agentType" TEXT NOT NULL,
  "requestType" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "actorUserId" TEXT,
  "actorName" TEXT,
  "actorRole" TEXT,
  "actingMode" TEXT,
  "instituteId" TEXT,
  "branchId" TEXT,
  "tenantId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "inputJson" JSONB NOT NULL,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_workflow_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_workflow_context" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "programCode" TEXT,
  "batchId" TEXT,
  "studentId" TEXT,
  "teacherId" TEXT,
  "contextJson" JSONB NOT NULL,
  "summaryText" TEXT,
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "sensitivityLevel" TEXT NOT NULL DEFAULT 'INTERNAL',
  "expiresAt" TIMESTAMP(3),
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_workflow_context_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_workflow_context_sources" (
  "id" TEXT NOT NULL,
  "contextId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "sourceLabel" TEXT,
  "sourceJson" JSONB,
  "sensitivityLevel" TEXT NOT NULL DEFAULT 'INTERNAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_workflow_context_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_workflow_drafts" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "draftType" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "title" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "draftJson" JSONB NOT NULL,
  "validationJson" JSONB,
  "sourceReferencesJson" JSONB,
  "approvedVersionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_workflow_drafts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_workflow_draft_versions" (
  "id" TEXT NOT NULL,
  "draftId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "revisionRequest" TEXT,
  "draftJson" JSONB NOT NULL,
  "changeSummary" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_workflow_draft_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_workflow_reviews" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "draftId" TEXT,
  "reviewerUserId" TEXT,
  "reviewerName" TEXT,
  "reviewType" TEXT NOT NULL DEFAULT 'TEACHER_REVIEW',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "correctionJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_workflow_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_workflow_approvals" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "draftId" TEXT,
  "publicationId" TEXT,
  "approvalType" TEXT NOT NULL DEFAULT 'HUMAN_APPROVAL',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedByUserId" TEXT,
  "approvedByName" TEXT,
  "notes" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_workflow_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_workflow_feedback" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "draftId" TEXT,
  "userId" TEXT,
  "userName" TEXT,
  "feedbackType" TEXT NOT NULL DEFAULT 'QUALITY',
  "rating" INTEGER,
  "feedbackText" TEXT,
  "correctionJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_workflow_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_workflow_publications" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "draftId" TEXT,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
  "publishPayloadJson" JSONB NOT NULL,
  "approvalId" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_workflow_publications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_workflow_audit_events" (
  "id" TEXT NOT NULL,
  "requestId" TEXT,
  "eventType" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorName" TEXT,
  "eventJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_workflow_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_workflow_requests_agentType_status_createdAt_idx" ON "ai_workflow_requests"("agentType", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_workflow_requests_requestType_status_idx" ON "ai_workflow_requests"("requestType", "status");
CREATE INDEX IF NOT EXISTS "ai_workflow_requests_actorUserId_createdAt_idx" ON "ai_workflow_requests"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_workflow_requests_tenantId_createdAt_idx" ON "ai_workflow_requests"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_workflow_requests_targetType_targetId_idx" ON "ai_workflow_requests"("targetType", "targetId");

CREATE INDEX IF NOT EXISTS "ai_workflow_context_requestId_idx" ON "ai_workflow_context"("requestId");
CREATE INDEX IF NOT EXISTS "ai_workflow_context_scope_idx" ON "ai_workflow_context"("scope");
CREATE INDEX IF NOT EXISTS "ai_workflow_context_programCode_idx" ON "ai_workflow_context"("programCode");
CREATE INDEX IF NOT EXISTS "ai_workflow_context_batchId_idx" ON "ai_workflow_context"("batchId");
CREATE INDEX IF NOT EXISTS "ai_workflow_context_teacherId_idx" ON "ai_workflow_context"("teacherId");
CREATE INDEX IF NOT EXISTS "ai_workflow_context_createdAt_idx" ON "ai_workflow_context"("createdAt");

CREATE INDEX IF NOT EXISTS "ai_workflow_context_sources_contextId_idx" ON "ai_workflow_context_sources"("contextId");
CREATE INDEX IF NOT EXISTS "ai_workflow_context_sources_sourceType_sourceId_idx" ON "ai_workflow_context_sources"("sourceType", "sourceId");

CREATE INDEX IF NOT EXISTS "ai_workflow_drafts_requestId_idx" ON "ai_workflow_drafts"("requestId");
CREATE INDEX IF NOT EXISTS "ai_workflow_drafts_draftType_status_idx" ON "ai_workflow_drafts"("draftType", "status");
CREATE INDEX IF NOT EXISTS "ai_workflow_drafts_targetType_targetId_idx" ON "ai_workflow_drafts"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "ai_workflow_drafts_createdAt_idx" ON "ai_workflow_drafts"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "ai_workflow_draft_versions_draftId_version_key" ON "ai_workflow_draft_versions"("draftId", "version");
CREATE INDEX IF NOT EXISTS "ai_workflow_draft_versions_draftId_idx" ON "ai_workflow_draft_versions"("draftId");
CREATE INDEX IF NOT EXISTS "ai_workflow_draft_versions_createdByUserId_idx" ON "ai_workflow_draft_versions"("createdByUserId");

CREATE INDEX IF NOT EXISTS "ai_workflow_reviews_requestId_idx" ON "ai_workflow_reviews"("requestId");
CREATE INDEX IF NOT EXISTS "ai_workflow_reviews_draftId_idx" ON "ai_workflow_reviews"("draftId");
CREATE INDEX IF NOT EXISTS "ai_workflow_reviews_reviewerUserId_idx" ON "ai_workflow_reviews"("reviewerUserId");
CREATE INDEX IF NOT EXISTS "ai_workflow_reviews_status_idx" ON "ai_workflow_reviews"("status");

CREATE INDEX IF NOT EXISTS "ai_workflow_approvals_requestId_idx" ON "ai_workflow_approvals"("requestId");
CREATE INDEX IF NOT EXISTS "ai_workflow_approvals_draftId_idx" ON "ai_workflow_approvals"("draftId");
CREATE INDEX IF NOT EXISTS "ai_workflow_approvals_publicationId_idx" ON "ai_workflow_approvals"("publicationId");
CREATE INDEX IF NOT EXISTS "ai_workflow_approvals_approvedByUserId_idx" ON "ai_workflow_approvals"("approvedByUserId");
CREATE INDEX IF NOT EXISTS "ai_workflow_approvals_status_idx" ON "ai_workflow_approvals"("status");

CREATE INDEX IF NOT EXISTS "ai_workflow_feedback_requestId_idx" ON "ai_workflow_feedback"("requestId");
CREATE INDEX IF NOT EXISTS "ai_workflow_feedback_draftId_idx" ON "ai_workflow_feedback"("draftId");
CREATE INDEX IF NOT EXISTS "ai_workflow_feedback_userId_idx" ON "ai_workflow_feedback"("userId");
CREATE INDEX IF NOT EXISTS "ai_workflow_feedback_feedbackType_idx" ON "ai_workflow_feedback"("feedbackType");

CREATE INDEX IF NOT EXISTS "ai_workflow_publications_requestId_idx" ON "ai_workflow_publications"("requestId");
CREATE INDEX IF NOT EXISTS "ai_workflow_publications_draftId_idx" ON "ai_workflow_publications"("draftId");
CREATE INDEX IF NOT EXISTS "ai_workflow_publications_targetType_targetId_idx" ON "ai_workflow_publications"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "ai_workflow_publications_status_idx" ON "ai_workflow_publications"("status");
CREATE INDEX IF NOT EXISTS "ai_workflow_publications_scheduledAt_idx" ON "ai_workflow_publications"("scheduledAt");

CREATE INDEX IF NOT EXISTS "ai_workflow_audit_events_requestId_idx" ON "ai_workflow_audit_events"("requestId");
CREATE INDEX IF NOT EXISTS "ai_workflow_audit_events_eventType_idx" ON "ai_workflow_audit_events"("eventType");
CREATE INDEX IF NOT EXISTS "ai_workflow_audit_events_actorUserId_idx" ON "ai_workflow_audit_events"("actorUserId");
CREATE INDEX IF NOT EXISTS "ai_workflow_audit_events_createdAt_idx" ON "ai_workflow_audit_events"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_context_requestId_fkey') THEN
    ALTER TABLE "ai_workflow_context"
      ADD CONSTRAINT "ai_workflow_context_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "ai_workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_context_sources_contextId_fkey') THEN
    ALTER TABLE "ai_workflow_context_sources"
      ADD CONSTRAINT "ai_workflow_context_sources_contextId_fkey"
      FOREIGN KEY ("contextId") REFERENCES "ai_workflow_context"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_drafts_requestId_fkey') THEN
    ALTER TABLE "ai_workflow_drafts"
      ADD CONSTRAINT "ai_workflow_drafts_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "ai_workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_draft_versions_draftId_fkey') THEN
    ALTER TABLE "ai_workflow_draft_versions"
      ADD CONSTRAINT "ai_workflow_draft_versions_draftId_fkey"
      FOREIGN KEY ("draftId") REFERENCES "ai_workflow_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_reviews_requestId_fkey') THEN
    ALTER TABLE "ai_workflow_reviews"
      ADD CONSTRAINT "ai_workflow_reviews_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "ai_workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_reviews_draftId_fkey') THEN
    ALTER TABLE "ai_workflow_reviews"
      ADD CONSTRAINT "ai_workflow_reviews_draftId_fkey"
      FOREIGN KEY ("draftId") REFERENCES "ai_workflow_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_approvals_requestId_fkey') THEN
    ALTER TABLE "ai_workflow_approvals"
      ADD CONSTRAINT "ai_workflow_approvals_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "ai_workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_approvals_draftId_fkey') THEN
    ALTER TABLE "ai_workflow_approvals"
      ADD CONSTRAINT "ai_workflow_approvals_draftId_fkey"
      FOREIGN KEY ("draftId") REFERENCES "ai_workflow_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_feedback_requestId_fkey') THEN
    ALTER TABLE "ai_workflow_feedback"
      ADD CONSTRAINT "ai_workflow_feedback_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "ai_workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_feedback_draftId_fkey') THEN
    ALTER TABLE "ai_workflow_feedback"
      ADD CONSTRAINT "ai_workflow_feedback_draftId_fkey"
      FOREIGN KEY ("draftId") REFERENCES "ai_workflow_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_publications_requestId_fkey') THEN
    ALTER TABLE "ai_workflow_publications"
      ADD CONSTRAINT "ai_workflow_publications_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "ai_workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_publications_draftId_fkey') THEN
    ALTER TABLE "ai_workflow_publications"
      ADD CONSTRAINT "ai_workflow_publications_draftId_fkey"
      FOREIGN KEY ("draftId") REFERENCES "ai_workflow_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_workflow_audit_events_requestId_fkey') THEN
    ALTER TABLE "ai_workflow_audit_events"
      ADD CONSTRAINT "ai_workflow_audit_events_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "ai_workflow_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
