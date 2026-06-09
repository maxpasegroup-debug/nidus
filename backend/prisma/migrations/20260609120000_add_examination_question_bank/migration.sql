CREATE TABLE "QuestionBankItem" (
  "id" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "questionType" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
  "optionA" TEXT NOT NULL,
  "optionB" TEXT NOT NULL,
  "optionC" TEXT NOT NULL,
  "optionD" TEXT NOT NULL,
  "correctAnswer" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Defence',
  "subCategory" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "subTopic" TEXT,
  "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
  "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "QuestionBankItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuestionBankItem_category_idx" ON "QuestionBankItem"("category");
CREATE INDEX "QuestionBankItem_subCategory_idx" ON "QuestionBankItem"("subCategory");
CREATE INDEX "QuestionBankItem_topic_idx" ON "QuestionBankItem"("topic");
CREATE INDEX "QuestionBankItem_difficulty_idx" ON "QuestionBankItem"("difficulty");
CREATE INDEX "QuestionBankItem_status_idx" ON "QuestionBankItem"("status");
CREATE INDEX "QuestionBankItem_createdById_idx" ON "QuestionBankItem"("createdById");

ALTER TABLE "QuestionBankItem"
ADD CONSTRAINT "QuestionBankItem_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
