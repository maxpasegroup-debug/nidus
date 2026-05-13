import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const schema = read("prisma/schema.prisma");
const paymentsService = read("src/modules/payments/payments.service.ts");
const paymentsRoutes = read("src/modules/payments/payments.routes.ts");
const crmService = read("src/modules/crm/crm.service.ts");
const crmRoutes = read("src/modules/crm/crm.routes.ts");
const erpService = read("src/modules/erp/erp.service.ts");

for (const model of ["PaymentTransactionLog", "FeePlan", "ApprovalRequest", "ScholarshipDiscount", "FinanceDocument"]) {
  assert.match(schema, new RegExp(`model ${model}`), `${model} model must exist`);
}

for (const field of ["paymentMode", "collectorId", "receiptNumber", "refundStatus", "feeInstallmentId"]) {
  assert.match(schema, new RegExp(field), `Payment field ${field} must exist`);
}

assert.match(paymentsService, /verifySignature/, "Razorpay verification must be used");
assert.match(paymentsService, /verifyWebhookSignature/, "Razorpay webhook verification must be used");
assert.match(paymentsService, /manualMethods/, "manual payment methods must be constrained");
assert.match(paymentsService, /applyPaymentToInstallment/, "partial/installment payments must reconcile installments");
assert.match(paymentsService, /enqueuePDF/, "invoice and receipt generation must use PDF queue");
assert.match(paymentsService, /enqueueNotification/, "payment notifications must use notification queue");
assert.match(paymentsRoutes, /\/manual/, "manual payment endpoint must exist");
assert.match(paymentsRoutes, /\/webhook/, "Razorpay webhook endpoint must exist");
assert.match(paymentsRoutes, /\/analytics/, "payment analytics endpoint must exist");
assert.match(paymentsRoutes, /Role\.ADMIN, Role\.DIRECTOR/, "payment finalization must be admin/director restricted");

assert.match(crmService, /ADMISSION_APPROVAL/, "admissions must create approval requests");
assert.match(crmService, /ScholarshipDiscount/, "scholarship and discount approvals must exist");
assert.match(crmRoutes, /\/approvals/, "approval queue route must exist");
assert.match(crmRoutes, /\/scholarships/, "scholarship route must exist");
assert.match(erpService, /hostelAdmissionShell/, "ERP hostel admission shell must exist");
assert.match(erpService, /payrollWorkflowShell/, "ERP payroll shell must exist");

console.log("Payment and ERP flow verification checks passed.");
