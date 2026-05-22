ALTER TABLE "PsychometricTest"
  ADD COLUMN IF NOT EXISTS "access" TEXT NOT NULL DEFAULT 'CORE',
  ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "PsychometricTest"
SET "access" = CASE
  WHEN "id" IN ('officer-readiness', 'defence-career-fit', 'discipline-index', 'focus-strength', 'leadership-dna', 'dream-addiction-index') THEN 'FREE'
  WHEN "id" = 'ssb-psychology-simulator' THEN 'PREMIUM'
  ELSE 'CORE'
END,
"category" = CASE
  WHEN "id" IN ('officer-readiness', 'olq-analyzer', 'defence-mindset-scan', 'ssb-psychology-simulator') THEN 'OFFICER_READINESS'
  WHEN "id" IN ('defence-career-fit', 'future-readiness') THEN 'CAREER_FIT'
  WHEN "id" IN ('leadership-dna', 'confidence-index', 'command-communication', 'teamwork-group-dynamics') THEN 'LEADERSHIP_PERSONALITY'
  ELSE 'DISCIPLINE_FOCUS'
END
WHERE "id" IN (
  'officer-readiness', 'defence-career-fit', 'discipline-index', 'focus-strength', 'leadership-dna', 'dream-addiction-index',
  'olq-analyzer', 'confidence-index', 'defence-mindset-scan', 'emotional-stability', 'command-communication', 'teamwork-group-dynamics',
  'future-readiness', 'warrior-fitness-mindset', 'ssb-psychology-simulator'
);

CREATE INDEX IF NOT EXISTS "PsychometricTest_access_idx" ON "PsychometricTest"("access");
CREATE INDEX IF NOT EXISTS "PsychometricTest_category_idx" ON "PsychometricTest"("category");
CREATE INDEX IF NOT EXISTS "PsychometricTest_isActive_idx" ON "PsychometricTest"("isActive");
