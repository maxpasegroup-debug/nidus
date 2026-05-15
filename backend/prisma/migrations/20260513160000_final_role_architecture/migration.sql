-- Phase 6A final production role architecture.
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GUEST', 'STUDENT', 'PARENT', 'TEACHER', 'DIRECTOR', 'TELECALLER', 'MARKETING_COORDINATOR');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING (
  CASE "role"::text
    WHEN 'FACULTY' THEN 'TEACHER'
    WHEN 'TRAINER' THEN 'TEACHER'
    WHEN 'COUNSELLOR' THEN 'TELECALLER'
    WHEN 'STAFF' THEN 'TELECALLER'
    WHEN 'WARDEN' THEN 'DIRECTOR'
    ELSE "role"::text
  END
)::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
DROP TYPE "Role_old";

CREATE TABLE "Institute" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "city" TEXT,
  "state" TEXT,
  "contactEmail" TEXT,
  "contactNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Institute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Institute_code_key" ON "Institute"("code");
CREATE INDEX "Institute_status_idx" ON "Institute"("status");
CREATE INDEX "Institute_createdAt_idx" ON "Institute"("createdAt");

ALTER TABLE "Branch" ADD COLUMN "instituteId" TEXT;
ALTER TABLE "User" ADD COLUMN "instituteId" TEXT;
ALTER TABLE "User" ADD COLUMN "branchId" TEXT;
ALTER TABLE "User" ADD COLUMN "roleMetadata" JSONB;
ALTER TABLE "User" ADD COLUMN "roleOnboardingStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN "roleActivatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastRoleActivityAt" TIMESTAMP(3);

ALTER TABLE "ParentStudentLink" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "ParentStudentLink" ADD COLUMN "monitoringPermissions" JSONB;
ALTER TABLE "ParentStudentLink" ADD COLUMN "lastViewedAt" TIMESTAMP(3);

ALTER TABLE "UserRole" ADD COLUMN "instituteId" TEXT;
ALTER TABLE "UserRole" ADD COLUMN "branchId" TEXT;
ALTER TABLE "UserRole" ADD COLUMN "metadata" JSONB;
ALTER TABLE "UserRole" ADD COLUMN "onboardingStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "UserRole" ADD COLUMN "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "UserRole" ADD COLUMN "lastActiveAt" TIMESTAMP(3);

CREATE TABLE "RoleActivity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "activity" TEXT NOT NULL,
  "metadata" JSONB,
  "instituteId" TEXT,
  "branchId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoleActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_instituteId_idx" ON "User"("instituteId");
CREATE INDEX "User_branchId_idx" ON "User"("branchId");
CREATE INDEX "User_roleOnboardingStatus_idx" ON "User"("roleOnboardingStatus");
CREATE INDEX "ParentStudentLink_status_idx" ON "ParentStudentLink"("status");
CREATE INDEX "UserRole_instituteId_idx" ON "UserRole"("instituteId");
CREATE INDEX "UserRole_branchId_idx" ON "UserRole"("branchId");
CREATE INDEX "UserRole_onboardingStatus_idx" ON "UserRole"("onboardingStatus");
CREATE INDEX "RoleActivity_userId_idx" ON "RoleActivity"("userId");
CREATE INDEX "RoleActivity_role_idx" ON "RoleActivity"("role");
CREATE INDEX "RoleActivity_instituteId_idx" ON "RoleActivity"("instituteId");
CREATE INDEX "RoleActivity_branchId_idx" ON "RoleActivity"("branchId");
CREATE INDEX "RoleActivity_createdAt_idx" ON "RoleActivity"("createdAt");
CREATE INDEX "Branch_instituteId_idx" ON "Branch"("instituteId");

ALTER TABLE "Branch" ADD CONSTRAINT "Branch_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoleActivity" ADD CONSTRAINT "RoleActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleActivity" ADD CONSTRAINT "RoleActivity_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoleActivity" ADD CONSTRAINT "RoleActivity_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
