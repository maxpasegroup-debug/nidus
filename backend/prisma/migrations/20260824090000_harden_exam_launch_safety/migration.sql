-- New exams and questions must enter explicit teacher review. Existing records
-- are intentionally unchanged so this migration is non-destructive.
ALTER TABLE "Test" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "Question" ALTER COLUMN "reviewStatus" SET DEFAULT 'DRAFT';
ALTER TABLE "QuestionVersion" ALTER COLUMN "reviewStatus" SET DEFAULT 'DRAFT';
