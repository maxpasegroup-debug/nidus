ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'WARDEN';

CREATE TYPE "HostelType" AS ENUM ('BOYS', 'GIRLS');
CREATE TYPE "InOutType" AS ENUM ('IN', 'OUT');

CREATE TABLE "Hostel" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "HostelType" NOT NULL,
  "totalRooms" INTEGER NOT NULL,
  "wardenName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Room" (
  "id" TEXT NOT NULL,
  "hostelId" TEXT NOT NULL,
  "roomNumber" TEXT NOT NULL,
  "floor" INTEGER NOT NULL,
  "capacity" INTEGER NOT NULL,
  "occupiedCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HostelAllocation" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "hostelId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "HostelAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InOutEntry" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "type" "InOutType" NOT NULL,
  "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "remarks" TEXT,
  CONSTRAINT "InOutEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HostelLeave" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "fromDate" TIMESTAMP(3) NOT NULL,
  "toDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedBy" TEXT,
  CONSTRAINT "HostelLeave_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessMenu" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "breakfast" TEXT NOT NULL,
  "lunch" TEXT NOT NULL,
  "snacks" TEXT NOT NULL,
  "dinner" TEXT NOT NULL,
  CONSTRAINT "MessMenu_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DisciplineRecord" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "actionTaken" TEXT NOT NULL,
  "recordedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisciplineRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParadePerformance" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "attendance" INTEGER NOT NULL,
  "discipline" INTEGER NOT NULL,
  "leadership" INTEGER NOT NULL,
  "fitness" INTEGER NOT NULL,
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParadePerformance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Room_hostelId_roomNumber_key" ON "Room"("hostelId", "roomNumber");
CREATE UNIQUE INDEX "MessMenu_date_key" ON "MessMenu"("date");
CREATE INDEX "Room_hostelId_idx" ON "Room"("hostelId");
CREATE INDEX "HostelAllocation_studentId_idx" ON "HostelAllocation"("studentId");
CREATE INDEX "HostelAllocation_hostelId_idx" ON "HostelAllocation"("hostelId");
CREATE INDEX "HostelAllocation_roomId_idx" ON "HostelAllocation"("roomId");
CREATE INDEX "InOutEntry_studentId_idx" ON "InOutEntry"("studentId");
CREATE INDEX "InOutEntry_entryTime_idx" ON "InOutEntry"("entryTime");
CREATE INDEX "HostelLeave_studentId_idx" ON "HostelLeave"("studentId");
CREATE INDEX "HostelLeave_status_idx" ON "HostelLeave"("status");
CREATE INDEX "DisciplineRecord_studentId_idx" ON "DisciplineRecord"("studentId");
CREATE INDEX "DisciplineRecord_severity_idx" ON "DisciplineRecord"("severity");
CREATE INDEX "ParadePerformance_studentId_idx" ON "ParadePerformance"("studentId");
CREATE INDEX "ParadePerformance_createdAt_idx" ON "ParadePerformance"("createdAt");

ALTER TABLE "Room" ADD CONSTRAINT "Room_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InOutEntry" ADD CONSTRAINT "InOutEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostelLeave" ADD CONSTRAINT "HostelLeave_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostelLeave" ADD CONSTRAINT "HostelLeave_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DisciplineRecord" ADD CONSTRAINT "DisciplineRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DisciplineRecord" ADD CONSTRAINT "DisciplineRecord_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParadePerformance" ADD CONSTRAINT "ParadePerformance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
