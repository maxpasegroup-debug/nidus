CREATE TABLE "PYQCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "examType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PYQCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PYQQuestion" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "subject" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "optionA" TEXT NOT NULL,
  "optionB" TEXT NOT NULL,
  "optionC" TEXT NOT NULL,
  "optionD" TEXT NOT NULL,
  "correctAnswer" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "difficultyLevel" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PYQQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurrentAffair" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "imageUrl" TEXT,
  "publishedDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurrentAffair_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurrentAffairQuiz" (
  "id" TEXT NOT NULL,
  "currentAffairId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "optionA" TEXT NOT NULL,
  "optionB" TEXT NOT NULL,
  "optionC" TEXT NOT NULL,
  "optionD" TEXT NOT NULL,
  "correctAnswer" TEXT NOT NULL,
  CONSTRAINT "CurrentAffairQuiz_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizBattle" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizBattle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizBattleParticipant" (
  "id" TEXT NOT NULL,
  "battleId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "rank" INTEGER,
  "timeTaken" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "QuizBattleParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Leaderboard" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "streak" INTEGER NOT NULL DEFAULT 0,
  "rank" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PYQCategory_name_examType_key" ON "PYQCategory"("name", "examType");
CREATE INDEX "PYQCategory_examType_idx" ON "PYQCategory"("examType");
CREATE INDEX "PYQQuestion_categoryId_idx" ON "PYQQuestion"("categoryId");
CREATE INDEX "PYQQuestion_year_idx" ON "PYQQuestion"("year");
CREATE INDEX "PYQQuestion_subject_idx" ON "PYQQuestion"("subject");
CREATE INDEX "PYQQuestion_topic_idx" ON "PYQQuestion"("topic");
CREATE INDEX "CurrentAffair_category_idx" ON "CurrentAffair"("category");
CREATE INDEX "CurrentAffair_publishedDate_idx" ON "CurrentAffair"("publishedDate");
CREATE INDEX "CurrentAffairQuiz_currentAffairId_idx" ON "CurrentAffairQuiz"("currentAffairId");
CREATE INDEX "QuizBattle_category_idx" ON "QuizBattle"("category");
CREATE INDEX "QuizBattle_startTime_idx" ON "QuizBattle"("startTime");
CREATE UNIQUE INDEX "QuizBattleParticipant_battleId_userId_key" ON "QuizBattleParticipant"("battleId", "userId");
CREATE INDEX "QuizBattleParticipant_userId_idx" ON "QuizBattleParticipant"("userId");
CREATE UNIQUE INDEX "Leaderboard_userId_key" ON "Leaderboard"("userId");
CREATE INDEX "Leaderboard_points_idx" ON "Leaderboard"("points");
CREATE INDEX "Leaderboard_rank_idx" ON "Leaderboard"("rank");

ALTER TABLE "PYQQuestion" ADD CONSTRAINT "PYQQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PYQCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurrentAffairQuiz" ADD CONSTRAINT "CurrentAffairQuiz_currentAffairId_fkey" FOREIGN KEY ("currentAffairId") REFERENCES "CurrentAffair"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizBattleParticipant" ADD CONSTRAINT "QuizBattleParticipant_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "QuizBattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizBattleParticipant" ADD CONSTRAINT "QuizBattleParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
