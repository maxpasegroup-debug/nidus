ALTER TABLE "User" DROP COLUMN IF EXISTS "tokenVersion";

CREATE TABLE IF NOT EXISTS "SessionToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SessionToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PasswordReset" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SessionToken_sessionId_key" ON "SessionToken"("sessionId");
CREATE INDEX IF NOT EXISTS "SessionToken_userId_idx" ON "SessionToken"("userId");
CREATE INDEX IF NOT EXISTS "SessionToken_expiresAt_idx" ON "SessionToken"("expiresAt");
CREATE INDEX IF NOT EXISTS "SessionToken_sessionId_idx" ON "SessionToken"("sessionId");

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordReset_token_key" ON "PasswordReset"("token");
CREATE INDEX IF NOT EXISTS "PasswordReset_userId_idx" ON "PasswordReset"("userId");
CREATE INDEX IF NOT EXISTS "PasswordReset_token_idx" ON "PasswordReset"("token");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SessionToken_userId_fkey'
  ) THEN
    ALTER TABLE "SessionToken" ADD CONSTRAINT "SessionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PasswordReset_userId_fkey'
  ) THEN
    ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DROP TABLE IF EXISTS "RefreshToken";
DROP TABLE IF EXISTS "TokenBlacklist";
DROP TABLE IF EXISTS "AuthSession";
DROP TABLE IF EXISTS "PasswordResetToken";
DROP TABLE IF EXISTS "AuthVerificationToken";
