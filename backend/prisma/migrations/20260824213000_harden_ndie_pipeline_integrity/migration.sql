-- Additive idempotency guards for NDIE reconstruction and stage execution.
ALTER TABLE "NdieQuestionCandidate" ADD COLUMN "sourceFingerprint" TEXT;
ALTER TABLE "NdieQueueJob" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "NdieAnswerKeyCandidate" ADD COLUMN "questionCandidateId" TEXT;

CREATE UNIQUE INDEX "NdieQuestionCandidate_importJobId_sourceFingerprint_key"
  ON "NdieQuestionCandidate"("importJobId", "sourceFingerprint");
CREATE UNIQUE INDEX "NdieQueueJob_idempotencyKey_key"
  ON "NdieQueueJob"("idempotencyKey");
CREATE UNIQUE INDEX "NdieAnswerKeyCandidate_questionCandidateId_key"
  ON "NdieAnswerKeyCandidate"("questionCandidateId");
CREATE INDEX "NdieAnswerKeyCandidate_questionCandidateId_idx"
  ON "NdieAnswerKeyCandidate"("questionCandidateId");
