CREATE TABLE IF NOT EXISTS "PsychometricReport" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "readinessBand" TEXT NOT NULL,
  "report" JSONB NOT NULL,
  "scoring" JSONB NOT NULL,
  "recommendations" JSONB NOT NULL,
  "integritySignals" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PsychometricReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PsychometricReport_attemptId_key" ON "PsychometricReport"("attemptId");
CREATE INDEX IF NOT EXISTS "PsychometricReport_userId_idx" ON "PsychometricReport"("userId");
CREATE INDEX IF NOT EXISTS "PsychometricReport_testId_idx" ON "PsychometricReport"("testId");
CREATE INDEX IF NOT EXISTS "PsychometricReport_createdAt_idx" ON "PsychometricReport"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PsychometricReport_attemptId_fkey'
  ) THEN
    ALTER TABLE "PsychometricReport"
      ADD CONSTRAINT "PsychometricReport_attemptId_fkey"
      FOREIGN KEY ("attemptId") REFERENCES "PsychometricAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
