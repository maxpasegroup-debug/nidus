ALTER TABLE "Admission" ADD COLUMN "leadId" TEXT;
ALTER TABLE "Admission" ADD COLUMN "instituteId" TEXT;
ALTER TABLE "Admission" ADD COLUMN "branchId" TEXT;
ALTER TABLE "Admission" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE "Admission" ADD COLUMN "admissionMode" TEXT NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "Admission" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Admission" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "Admission" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Admission" ADD COLUMN "onboardingStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Admission" ADD COLUMN "totalFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Admission" ADD COLUMN "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Admission" ADD COLUMN "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Admission" ADD COLUMN "remarks" TEXT;
ALTER TABLE "Admission" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Payment" ADD COLUMN "admissionId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "feeInstallmentId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "invoiceId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "branchId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "collectorId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "verifiedBy" TEXT;
ALTER TABLE "Payment" ADD COLUMN "paymentMode" TEXT NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "Payment" ADD COLUMN "transactionRef" TEXT;
ALTER TABLE "Payment" ADD COLUMN "receiptNumber" TEXT;
ALTER TABLE "Payment" ADD COLUMN "receiptUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "receiptUploadUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "remarks" TEXT;
ALTER TABLE "Payment" ADD COLUMN "failureReason" TEXT;
ALTER TABLE "Payment" ADD COLUMN "refundStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "Payment" ADD COLUMN "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "reconciledAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "FeeInstallment" ADD COLUMN "feePlanId" TEXT;
ALTER TABLE "FeeInstallment" ADD COLUMN "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FeeInstallment" ADD COLUMN "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FeeInstallment" ADD COLUMN "overdueAt" TIMESTAMP(3);
ALTER TABLE "FeeInstallment" ADD COLUMN "reminderStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "FeeInstallment" ADD COLUMN "sequence" INTEGER NOT NULL DEFAULT 1;
UPDATE "FeeInstallment" SET "dueAmount" = "amount" WHERE "dueAmount" = 0 AND "paidStatus" <> 'PAID';
UPDATE "FeeInstallment" SET "paidAmount" = "amount", "dueAmount" = 0 WHERE "paidStatus" = 'PAID';

ALTER TABLE "Invoice" ADD COLUMN "admissionId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "feePlanId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "receiptUrl" TEXT;
UPDATE "Invoice" SET "dueAmount" = "amount" WHERE "dueAmount" = 0;

CREATE TABLE "FeePlan" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "admissionId" TEXT,
  "courseId" TEXT,
  "instituteId" TEXT,
  "branchId" TEXT,
  "title" TEXT NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "scholarshipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netAmount" DOUBLE PRECISION NOT NULL,
  "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dueAmount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeePlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentTransactionLog" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "actorId" TEXT,
  "event" TEXT NOT NULL,
  "statusFrom" TEXT,
  "statusTo" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentTransactionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalRequest" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requesterId" TEXT,
  "reviewerId" TEXT,
  "admissionId" TEXT,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "amount" DOUBLE PRECISION,
  "reason" TEXT,
  "remarks" TEXT,
  "metadata" JSONB,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScholarshipDiscount" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "admissionId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requestedBy" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScholarshipDiscount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinanceDocument" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "documentNumber" TEXT,
  "fileUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "metadata" JSONB,
  "generatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinanceDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");
CREATE INDEX "Admission_leadId_idx" ON "Admission"("leadId");
CREATE INDEX "Admission_instituteId_idx" ON "Admission"("instituteId");
CREATE INDEX "Admission_branchId_idx" ON "Admission"("branchId");
CREATE INDEX "Admission_status_idx" ON "Admission"("status");
CREATE INDEX "Admission_approvalStatus_idx" ON "Admission"("approvalStatus");
CREATE INDEX "Payment_admissionId_idx" ON "Payment"("admissionId");
CREATE INDEX "Payment_feeInstallmentId_idx" ON "Payment"("feeInstallmentId");
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "Payment_branchId_idx" ON "Payment"("branchId");
CREATE INDEX "Payment_collectorId_idx" ON "Payment"("collectorId");
CREATE INDEX "Payment_paymentMethod_idx" ON "Payment"("paymentMethod");
CREATE INDEX "Payment_paymentMode_idx" ON "Payment"("paymentMode");
CREATE INDEX "FeeInstallment_feePlanId_idx" ON "FeeInstallment"("feePlanId");
CREATE INDEX "FeeInstallment_reminderStatus_idx" ON "FeeInstallment"("reminderStatus");
CREATE INDEX "Invoice_admissionId_idx" ON "Invoice"("admissionId");
CREATE INDEX "Invoice_feePlanId_idx" ON "Invoice"("feePlanId");
CREATE INDEX "FeePlan_studentId_idx" ON "FeePlan"("studentId");
CREATE INDEX "FeePlan_admissionId_idx" ON "FeePlan"("admissionId");
CREATE INDEX "FeePlan_courseId_idx" ON "FeePlan"("courseId");
CREATE INDEX "FeePlan_instituteId_idx" ON "FeePlan"("instituteId");
CREATE INDEX "FeePlan_branchId_idx" ON "FeePlan"("branchId");
CREATE INDEX "FeePlan_status_idx" ON "FeePlan"("status");
CREATE INDEX "PaymentTransactionLog_paymentId_idx" ON "PaymentTransactionLog"("paymentId");
CREATE INDEX "PaymentTransactionLog_actorId_idx" ON "PaymentTransactionLog"("actorId");
CREATE INDEX "PaymentTransactionLog_event_idx" ON "PaymentTransactionLog"("event");
CREATE INDEX "PaymentTransactionLog_createdAt_idx" ON "PaymentTransactionLog"("createdAt");
CREATE INDEX "ApprovalRequest_type_idx" ON "ApprovalRequest"("type");
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");
CREATE INDEX "ApprovalRequest_reviewerId_idx" ON "ApprovalRequest"("reviewerId");
CREATE INDEX "ApprovalRequest_admissionId_idx" ON "ApprovalRequest"("admissionId");
CREATE INDEX "ApprovalRequest_targetType_targetId_idx" ON "ApprovalRequest"("targetType", "targetId");
CREATE INDEX "ScholarshipDiscount_studentId_idx" ON "ScholarshipDiscount"("studentId");
CREATE INDEX "ScholarshipDiscount_admissionId_idx" ON "ScholarshipDiscount"("admissionId");
CREATE INDEX "ScholarshipDiscount_type_idx" ON "ScholarshipDiscount"("type");
CREATE INDEX "ScholarshipDiscount_status_idx" ON "ScholarshipDiscount"("status");
CREATE INDEX "FinanceDocument_ownerId_idx" ON "FinanceDocument"("ownerId");
CREATE INDEX "FinanceDocument_documentType_idx" ON "FinanceDocument"("documentType");
CREATE INDEX "FinanceDocument_targetType_targetId_idx" ON "FinanceDocument"("targetType", "targetId");
CREATE INDEX "FinanceDocument_status_idx" ON "FinanceDocument"("status");

ALTER TABLE "Admission" ADD CONSTRAINT "Admission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeInstallmentId_fkey" FOREIGN KEY ("feeInstallmentId") REFERENCES "FeeInstallment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeeInstallment" ADD CONSTRAINT "FeeInstallment_feePlanId_fkey" FOREIGN KEY ("feePlanId") REFERENCES "FeePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentTransactionLog" ADD CONSTRAINT "PaymentTransactionLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScholarshipDiscount" ADD CONSTRAINT "ScholarshipDiscount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScholarshipDiscount" ADD CONSTRAINT "ScholarshipDiscount_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
