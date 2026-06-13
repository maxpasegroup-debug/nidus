CREATE TABLE IF NOT EXISTS "DirectorExpenseRecord" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Office',
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdBy" TEXT,
  "archivedBy" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectorExpenseRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DirectorExpenseRecord_category_idx" ON "DirectorExpenseRecord"("category");
CREATE INDEX IF NOT EXISTS "DirectorExpenseRecord_status_idx" ON "DirectorExpenseRecord"("status");
CREATE INDEX IF NOT EXISTS "DirectorExpenseRecord_createdAt_idx" ON "DirectorExpenseRecord"("createdAt");
