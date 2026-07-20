CREATE TABLE "TopRankMission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "missionType" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 3,
  "estimatedMinutes" INTEGER NOT NULL DEFAULT 45,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "weekNumber" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "objectives" JSONB NOT NULL,
  "resources" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankMission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankMissionTask" (
  "id" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "taskType" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL DEFAULT 15,
  "sequence" INTEGER NOT NULL DEFAULT 1,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankMissionTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankMissionCompletion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "checklist" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankMissionCompletion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankMissionCalendar" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "calendarDate" TIMESTAMP(3) NOT NULL,
  "weekNumber" INTEGER NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "schedule" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankMissionCalendar_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TopRankMission_userId_idx" ON "TopRankMission"("userId");
CREATE INDEX "TopRankMission_missionType_idx" ON "TopRankMission"("missionType");
CREATE INDEX "TopRankMission_status_idx" ON "TopRankMission"("status");
CREATE INDEX "TopRankMission_dueDate_idx" ON "TopRankMission"("dueDate");
CREATE INDEX "TopRankMission_weekNumber_idx" ON "TopRankMission"("weekNumber");
CREATE INDEX "TopRankMission_dayNumber_idx" ON "TopRankMission"("dayNumber");
CREATE INDEX "TopRankMissionTask_missionId_idx" ON "TopRankMissionTask"("missionId");
CREATE INDEX "TopRankMissionTask_taskType_idx" ON "TopRankMissionTask"("taskType");
CREATE INDEX "TopRankMissionTask_completed_idx" ON "TopRankMissionTask"("completed");
CREATE UNIQUE INDEX "TopRankMissionCompletion_userId_missionId_key" ON "TopRankMissionCompletion"("userId", "missionId");
CREATE INDEX "TopRankMissionCompletion_missionId_idx" ON "TopRankMissionCompletion"("missionId");
CREATE INDEX "TopRankMissionCompletion_status_idx" ON "TopRankMissionCompletion"("status");
CREATE INDEX "TopRankMissionCompletion_completedAt_idx" ON "TopRankMissionCompletion"("completedAt");
CREATE UNIQUE INDEX "TopRankMissionCalendar_userId_missionId_key" ON "TopRankMissionCalendar"("userId", "missionId");
CREATE INDEX "TopRankMissionCalendar_userId_idx" ON "TopRankMissionCalendar"("userId");
CREATE INDEX "TopRankMissionCalendar_calendarDate_idx" ON "TopRankMissionCalendar"("calendarDate");
CREATE INDEX "TopRankMissionCalendar_weekNumber_idx" ON "TopRankMissionCalendar"("weekNumber");
CREATE INDEX "TopRankMissionCalendar_status_idx" ON "TopRankMissionCalendar"("status");

ALTER TABLE "TopRankMission" ADD CONSTRAINT "TopRankMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankMissionTask" ADD CONSTRAINT "TopRankMissionTask_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "TopRankMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankMissionCompletion" ADD CONSTRAINT "TopRankMissionCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankMissionCompletion" ADD CONSTRAINT "TopRankMissionCompletion_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "TopRankMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankMissionCalendar" ADD CONSTRAINT "TopRankMissionCalendar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankMissionCalendar" ADD CONSTRAINT "TopRankMissionCalendar_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "TopRankMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
