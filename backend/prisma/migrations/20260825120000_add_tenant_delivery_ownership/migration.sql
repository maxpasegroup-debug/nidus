ALTER TABLE "Notification" ADD COLUMN "instituteId" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "instituteId" TEXT;
ALTER TABLE "PushNotification" ADD COLUMN "instituteId" TEXT;

CREATE INDEX "Notification_instituteId_idx" ON "Notification"("instituteId");
CREATE INDEX "EmailLog_instituteId_idx" ON "EmailLog"("instituteId");
CREATE INDEX "PushNotification_instituteId_idx" ON "PushNotification"("instituteId");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PushNotification" ADD CONSTRAINT "PushNotification_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
