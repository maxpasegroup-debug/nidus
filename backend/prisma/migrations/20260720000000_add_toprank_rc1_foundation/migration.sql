CREATE TYPE "TopRankRole" AS ENUM ('TOPRANK_STUDENT', 'TOPRANK_MENTOR', 'TOPRANK_ADMIN', 'TOPRANK_SUPER_ADMIN');

CREATE TABLE "TopRankUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "TopRankRole" NOT NULL DEFAULT 'TOPRANK_STUDENT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TopRankUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankGateway" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMING_SOON',
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TopRankGateway_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankProgram" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" TEXT,
    "feeLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TopRankProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankBatch" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "metadata" JSONB,
    "mentorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TopRankBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_TopRankBatchStudents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "TopRankUser_email_key" ON "TopRankUser"("email");
CREATE UNIQUE INDEX "TopRankUser_phone_key" ON "TopRankUser"("phone");
CREATE INDEX "TopRankUser_role_idx" ON "TopRankUser"("role");
CREATE INDEX "TopRankUser_status_idx" ON "TopRankUser"("status");
CREATE INDEX "TopRankUser_phone_idx" ON "TopRankUser"("phone");
CREATE UNIQUE INDEX "TopRankGateway_slug_key" ON "TopRankGateway"("slug");
CREATE INDEX "TopRankGateway_status_idx" ON "TopRankGateway"("status");
CREATE UNIQUE INDEX "TopRankProgram_slug_key" ON "TopRankProgram"("slug");
CREATE INDEX "TopRankProgram_gatewayId_idx" ON "TopRankProgram"("gatewayId");
CREATE INDEX "TopRankProgram_status_idx" ON "TopRankProgram"("status");
CREATE INDEX "TopRankBatch_programId_idx" ON "TopRankBatch"("programId");
CREATE INDEX "TopRankBatch_mentorId_idx" ON "TopRankBatch"("mentorId");
CREATE INDEX "TopRankBatch_status_idx" ON "TopRankBatch"("status");
CREATE INDEX "TopRankBatch_startDate_idx" ON "TopRankBatch"("startDate");
CREATE UNIQUE INDEX "_TopRankBatchStudents_AB_unique" ON "_TopRankBatchStudents"("A", "B");
CREATE INDEX "_TopRankBatchStudents_B_index" ON "_TopRankBatchStudents"("B");

ALTER TABLE "TopRankProgram" ADD CONSTRAINT "TopRankProgram_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "TopRankGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankBatch" ADD CONSTRAINT "TopRankBatch_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TopRankProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankBatch" ADD CONSTRAINT "TopRankBatch_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "TopRankUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_TopRankBatchStudents" ADD CONSTRAINT "_TopRankBatchStudents_A_fkey" FOREIGN KEY ("A") REFERENCES "TopRankBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_TopRankBatchStudents" ADD CONSTRAINT "_TopRankBatchStudents_B_fkey" FOREIGN KEY ("B") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
