import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";
import { paymentsController } from "./payments.controller.js";

export const paymentsRouter = Router();
export const subscriptionsRouter = Router();
export const feesRouter = Router();
export const invoicesRouter = Router();

const financeRoles = [protect, allowRoles(Role.STUDENT, Role.PARENT, Role.ADMIN)];
const adminOnly = [protect, allowRoles(Role.ADMIN)];

paymentsRouter.post("/create-order", ...financeRoles, [body("userId").optional().trim(), body("courseId").optional().trim(), body("amount").isFloat({ min: 1 }), body("currency").optional().trim().isLength({ min: 3, max: 3 }), body("paymentMethod").optional().trim()], paymentsController.createOrder);
paymentsRouter.post("/verify", ...financeRoles, [body("razorpayOrderId").notEmpty(), body("razorpayPaymentId").notEmpty(), body("razorpaySignature").notEmpty(), body("paymentMethod").optional().trim()], paymentsController.verify);
paymentsRouter.get("/history", ...financeRoles, paymentsController.history);

subscriptionsRouter.get("/", ...financeRoles, paymentsController.subscriptions);
subscriptionsRouter.post("/", ...financeRoles, [body("userId").optional().trim(), body("planName").trim().notEmpty(), body("startDate").isISO8601(), body("endDate").isISO8601(), body("status").trim().notEmpty(), body("amount").isFloat({ min: 0 })], paymentsController.createSubscription);

feesRouter.get("/", ...financeRoles, paymentsController.fees);
feesRouter.post("/installment", ...adminOnly, [body("studentId").notEmpty(), body("title").trim().notEmpty(), body("amount").isFloat({ min: 1 }), body("dueDate").isISO8601(), body("paidStatus").optional().trim()], paymentsController.createInstallment);
feesRouter.put("/pay/:id", ...financeRoles, paymentsController.payInstallment);

invoicesRouter.get("/", ...financeRoles, paymentsController.invoices);
invoicesRouter.post("/generate", ...adminOnly, [body("studentId").notEmpty(), body("amount").isFloat({ min: 1 }), body("status").optional().trim()], paymentsController.generateInvoice);
