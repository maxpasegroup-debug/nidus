ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COUNSELLOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF';

CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'COUNSELLING', 'ENROLLED', 'LOST');
CREATE TYPE "CounsellingMode" AS ENUM ('ONLINE', 'OFFLINE');

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "targetExam" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "assignedTo" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FollowUp" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "followUpDate" TIMESTAMP(3) NOT NULL,
  "remarks" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Admission" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "admissionDate" TIMESTAMP(3) NOT NULL,
  "paymentStatus" TEXT NOT NULL,
  "batch" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CounsellingBooking" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "counsellorName" TEXT NOT NULL,
  "bookingDate" TIMESTAMP(3) NOT NULL,
  "mode" "CounsellingMode" NOT NULL,
  "status" TEXT NOT NULL,
  CONSTRAINT "CounsellingBooking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Referral" (
  "id" TEXT NOT NULL,
  "referrerUserId" TEXT NOT NULL,
  "referredUserId" TEXT NOT NULL,
  "rewardStatus" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_source_idx" ON "Lead"("source");
CREATE INDEX "Lead_assignedTo_idx" ON "Lead"("assignedTo");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "FollowUp_leadId_idx" ON "FollowUp"("leadId");
CREATE INDEX "FollowUp_followUpDate_idx" ON "FollowUp"("followUpDate");
CREATE INDEX "FollowUp_createdBy_idx" ON "FollowUp"("createdBy");
CREATE INDEX "Admission_studentId_idx" ON "Admission"("studentId");
CREATE INDEX "Admission_courseId_idx" ON "Admission"("courseId");
CREATE INDEX "Admission_admissionDate_idx" ON "Admission"("admissionDate");
CREATE INDEX "Admission_paymentStatus_idx" ON "Admission"("paymentStatus");
CREATE INDEX "CounsellingBooking_leadId_idx" ON "CounsellingBooking"("leadId");
CREATE INDEX "CounsellingBooking_bookingDate_idx" ON "CounsellingBooking"("bookingDate");
CREATE INDEX "CounsellingBooking_status_idx" ON "CounsellingBooking"("status");
CREATE INDEX "Referral_referrerUserId_idx" ON "Referral"("referrerUserId");
CREATE INDEX "Referral_referredUserId_idx" ON "Referral"("referredUserId");
CREATE INDEX "Referral_rewardStatus_idx" ON "Referral"("rewardStatus");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CounsellingBooking" ADD CONSTRAINT "CounsellingBooking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
