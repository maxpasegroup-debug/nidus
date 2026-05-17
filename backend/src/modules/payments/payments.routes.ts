import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { paymentsController } from "./payments.controller.js";

export const paymentsRouter = Router();
export const subscriptionsRouter = Router();
export const feesRouter = Router();
export const invoicesRouter = Router();

const financeRoles = [protect, allowRoles(Role.STUDENT, Role.PARENT, Role.ADMIN, Role.DIRECTOR)];
const financeManagers = [protect, allowRoles(Role.ADMIN, Role.DIRECTOR)];

paymentsRouter.post("/create-order", ...financeRoles, [body("userId").optional().trim(), body("courseId").optional().trim(), body("amount").isFloat({ min: 1 }), body("currency").optional().trim().isLength({ min: 3, max: 3 }), body("paymentMethod").optional().trim()], paymentsController.createOrder);
paymentsRouter.post("/verify", ...financeRoles, [body("razorpayOrderId").notEmpty(), body("razorpayPaymentId").notEmpty(), body("razorpaySignature").notEmpty(), body("paymentMethod").optional().trim()], paymentsController.verify);
paymentsRouter.post("/webhook", paymentsController.webhook);
paymentsRouter.post("/manual", ...financeManagers, [body("userId").notEmpty(), body("courseId").optional().trim(), body("admissionId").optional().trim(), body("feeInstallmentId").optional().trim(), body("invoiceId").optional().trim(), body("branchId").optional().trim(), body("amount").isFloat({ min: 1 }), body("currency").optional().trim(), body("paymentMethod").isIn(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OFFICE_COLLECTION"]), body("transactionRef").optional().trim(), body("receiptUploadUrl").optional().trim(), body("remarks").optional().trim()], paymentsController.manualPayment);
paymentsRouter.post("/:id/fail", ...financeManagers, [body("reason").trim().notEmpty()], paymentsController.failPayment);
paymentsRouter.post("/:id/refund", ...financeManagers, [body("amount").isFloat({ min: 1 }), body("reason").optional().trim()], paymentsController.refundShell);
paymentsRouter.get("/history", ...financeRoles, paymentsController.history);
paymentsRouter.get("/analytics", ...financeManagers, paymentsController.analytics);

subscriptionsRouter.get("/", ...financeRoles, paymentsController.subscriptions);
subscriptionsRouter.post("/", ...financeManagers, [body("userId").optional().trim(), body("planName").trim().notEmpty(), body("startDate").isISO8601(), body("endDate").isISO8601(), body("status").trim().notEmpty(), body("amount").isFloat({ min: 0 })], paymentsController.createSubscription);

feesRouter.get("/", ...financeRoles, paymentsController.fees);
feesRouter.post("/plans", ...financeManagers, [body("studentId").notEmpty(), body("title").trim().notEmpty(), body("totalAmount").isFloat({ min: 0 }), body("discountAmount").optional().isFloat({ min: 0 }), body("scholarshipAmount").optional().isFloat({ min: 0 }), body("installments").isArray({ min: 1 })], paymentsController.createFeePlan);
feesRouter.post("/installment", ...financeManagers, [body("studentId").notEmpty(), body("feePlanId").optional().trim(), body("title").trim().notEmpty(), body("amount").isFloat({ min: 1 }), body("dueDate").isISO8601(), body("paidStatus").optional().trim()], paymentsController.createInstallment);
feesRouter.put("/pay/:id", ...financeRoles, paymentsController.payInstallment);

invoicesRouter.get("/", ...financeRoles, paymentsController.invoices);
invoicesRouter.post("/generate", ...financeManagers, [body("studentId").notEmpty(), body("admissionId").optional().trim(), body("feePlanId").optional().trim(), body("amount").isFloat({ min: 1 }), body("status").optional().trim()], paymentsController.generateInvoice);
