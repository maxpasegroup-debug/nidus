ALTER TABLE "User"
  ADD COLUMN "isDisabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "disabledAt" TIMESTAMP(3),
  ADD COLUMN "loginFailureCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE TABLE "AuthVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "device" TEXT,
  "browser" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokeReason" TEXT,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParentStudentInvitation" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentStudentInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParentStudentLink" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentStudentLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthVerificationToken_userId_purpose_idx" ON "AuthVerificationToken"("userId", "purpose");
CREATE INDEX "AuthVerificationToken_expiresAt_idx" ON "AuthVerificationToken"("expiresAt");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
CREATE INDEX "ParentStudentInvitation_parentId_studentId_idx" ON "ParentStudentInvitation"("parentId", "studentId");
CREATE INDEX "ParentStudentInvitation_expiresAt_idx" ON "ParentStudentInvitation"("expiresAt");
CREATE UNIQUE INDEX "ParentStudentLink_parentId_studentId_key" ON "ParentStudentLink"("parentId", "studentId");
CREATE INDEX "ParentStudentLink_studentId_idx" ON "ParentStudentLink"("studentId");

ALTER TABLE "AuthVerificationToken" ADD CONSTRAINT "AuthVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParentStudentInvitation" ADD CONSTRAINT "ParentStudentInvitation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParentStudentInvitation" ADD CONSTRAINT "ParentStudentInvitation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
