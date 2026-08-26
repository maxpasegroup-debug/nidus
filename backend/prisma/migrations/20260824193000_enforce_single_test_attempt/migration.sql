-- A student can have only one attempt for a test. This makes concurrent starts
-- idempotent at the database boundary instead of relying on request timing.
CREATE UNIQUE INDEX "TestAttempt_userId_testId_key" ON "TestAttempt"("userId", "testId");
