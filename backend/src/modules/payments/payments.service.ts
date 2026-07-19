import { prisma } from "../../config/prisma.js";
import { Role, type Payment } from "../../generated/prisma/client.js";
import { enqueueNotification } from "../../queues/notification.queue.js";
import { enqueuePDF } from "../../queues/pdf.queue.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";
import { razorpayService } from "./razorpay.service.js";

const userSelect = { id: true, name: true, email: true, mobile: true, role: true, instituteId: true, branchId: true } as const;
const paymentInclude = { user: { select: userSelect }, course: true, installment: true, invoice: true, collector: { select: userSelect } } as const;
const manualMethods = new Set(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OFFICE_COLLECTION"]);
const financeAdminRoles = new Set<Role>([Role.ADMIN, Role.DIRECTOR]);

type Requester = { id: string; role: Role; instituteId?: string | null; branchId?: string | null };

function scopedUser(requester: Requester, provided?: string) {
  return requester.role === Role.ADMIN || requester.role === Role.DIRECTOR ? provided : requester.id;
}

function assertFinanceAdmin(requester: Requester) {
  if (!financeAdminRoles.has(requester.role)) throw new Error("Payment finalization requires admin or director access");
}

function assertDirectorScope(requester: Requester, target?: { instituteId?: string | null; branchId?: string | null }) {
  if (requester.role !== Role.DIRECTOR || !target) return;
  if (requester.instituteId && target.instituteId && requester.instituteId !== target.instituteId) throw new Error("Institute access denied");
  if (requester.branchId && target.branchId && requester.branchId !== target.branchId) throw new Error("Branch access denied");
}

function receiptNumber(prefix = "RCPT") {
  return `NIDUS-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function logPayment(paymentId: string, event: string, actorId?: string, statusFrom?: string | null, statusTo?: string | null, metadata?: unknown) {
  await prisma.paymentTransactionLog.create({
    data: { paymentId, event, actorId, statusFrom: statusFrom ?? undefined, statusTo: statusTo ?? undefined, metadata: metadata as object | undefined }
  }).catch(() => undefined);

  const failed = event.includes("FAILED") || statusTo === "FAILED";
  const received = event.includes("VERIFIED") || event.includes("MANUAL_PAYMENT") || statusTo === "SUCCESS";
  emitDomainEvent({
    category: "FEE",
    eventName: failed ? "PAYMENT_FAILED" : received ? "PAYMENT_RECEIVED" : event === "ORDER_CREATED" ? "PAYMENT_ORDER_CREATED" : event,
    title: failed ? "Payment failed" : received ? "Payment received" : "Payment activity",
    description: `${event}${statusFrom || statusTo ? `: ${statusFrom ?? "NEW"} -> ${statusTo ?? "UNCHANGED"}` : ""}`,
    actor: { id: actorId },
    entityType: "Payment",
    entityId: paymentId,
    severity: failed ? "WARNING" : "INFO",
    source: actorId ? "WEB" : "API",
    metadata: { event, statusFrom, statusTo, metadata }
  });
}

async function queueFinanceDocument(input: { ownerId: string; documentType: string; targetType: string; targetId: string; title: string; lines: string[]; documentNumber?: string }) {
  const document = await prisma.financeDocument.create({
    data: {
      ownerId: input.ownerId,
      documentType: input.documentType,
      targetType: input.targetType,
      targetId: input.targetId,
      documentNumber: input.documentNumber,
      status: "QUEUED"
    }
  });
  await enqueuePDF({ title: input.title, lines: input.lines, storageKey: `${input.documentType.toLowerCase()}/${document.id}.pdf` });
  return document;
}

async function applyPaymentToInstallment(payment: Payment) {
  if (!payment.feeInstallmentId || payment.paymentStatus !== "SUCCESS") return;
  const installment = await prisma.feeInstallment.findUnique({ where: { id: payment.feeInstallmentId } });
  if (!installment) return;
  const paidAmount = Math.min(installment.amount, installment.paidAmount + payment.amount);
  const dueAmount = Math.max(0, installment.amount - paidAmount);
  const paidStatus = dueAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";
  await prisma.feeInstallment.update({
    where: { id: installment.id },
    data: { paidAmount, dueAmount, paidStatus, paidAt: paidStatus === "PAID" ? new Date() : installment.paidAt }
  });
  if (installment.feePlanId) await reconcileFeePlan(installment.feePlanId);
}

async function reconcileFeePlan(feePlanId: string) {
  const installments = await prisma.feeInstallment.findMany({ where: { feePlanId } });
  const paidAmount = installments.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalDue = installments.reduce((sum, item) => sum + item.dueAmount, 0);
  const status = totalDue === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "ACTIVE";
  const plan = await prisma.feePlan.update({ where: { id: feePlanId }, data: { paidAmount, dueAmount: totalDue, status } });
  if (plan.admissionId) {
    await prisma.admission.update({
      where: { id: plan.admissionId },
      data: { paidAmount, dueAmount: totalDue, paymentStatus: totalDue === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING" }
    }).catch(() => undefined);
  }
}

export const paymentsService = {
  async createOrder(requester: Requester, input: { userId?: string; courseId?: string; admissionId?: string; feeInstallmentId?: string; invoiceId?: string; amount: number; currency?: string; paymentMethod?: string; product?: string; examSlug?: string }) {
    const userId = scopedUser(requester, input.userId) ?? requester.id;
    const currency = input.currency ?? "INR";
    const amount = input.amount;
    const localReceipt = `nidus_${Date.now()}`;
    const order = await razorpayService.createOrder({ amount, currency, receipt: localReceipt });
    const payment = await prisma.payment.create({
      data: {
        userId,
        courseId: input.courseId || undefined,
        admissionId: input.admissionId || undefined,
        feeInstallmentId: input.feeInstallmentId || undefined,
        invoiceId: input.invoiceId || undefined,
        amount,
        currency,
        razorpayOrderId: order.id,
        paymentStatus: "CREATED",
        paymentMethod: input.paymentMethod ?? "RAZORPAY",
        paymentMode: "ONLINE"
      },
      include: paymentInclude
    });
    await logPayment(payment.id, "ORDER_CREATED", requester.id, undefined, "CREATED", { razorpayOrderId: order.id });
    return { payment, order, keyId: razorpayService.keyId() };
  },

  async verify(requester: Requester, input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; paymentMethod?: string }) {
    const existing = await prisma.payment.findUnique({ where: { razorpayOrderId: input.razorpayOrderId } });
    if (!existing) throw new Error("Payment not found");
    if (requester.role !== Role.ADMIN && requester.role !== Role.DIRECTOR && existing.userId !== requester.id) throw new Error("Forbidden");
    if (existing.paymentStatus === "SUCCESS") throw new Error("Payment already verified");

    const verified = razorpayService.verifySignature(input);
    const payment = await prisma.payment.update({
      where: { razorpayOrderId: input.razorpayOrderId },
      data: {
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        paymentStatus: verified ? "SUCCESS" : "FAILED",
        paymentMethod: input.paymentMethod ?? "RAZORPAY",
        verifiedBy: verified ? requester.id : undefined,
        verifiedAt: verified ? new Date() : undefined,
        receiptNumber: verified ? receiptNumber("ONLINE") : undefined,
        failureReason: verified ? undefined : "Razorpay signature verification failed"
      },
      include: paymentInclude
    });
    await logPayment(payment.id, verified ? "PAYMENT_VERIFIED" : "PAYMENT_FAILED", requester.id, existing.paymentStatus, payment.paymentStatus);
    if (verified) {
      await applyPaymentToInstallment(payment);
      await queueFinanceDocument({
        ownerId: payment.userId,
        documentType: "PAYMENT_RECEIPT",
        targetType: "Payment",
        targetId: payment.id,
        documentNumber: payment.receiptNumber ?? undefined,
        title: "NIDUS Payment Receipt",
        lines: [`Receipt: ${payment.receiptNumber}`, `Amount: ${payment.currency} ${payment.amount}`, `Mode: Razorpay`]
      });
      await enqueueNotification({ title: "Payment received", body: `Receipt generated for Rs ${payment.amount}`, targetAudience: payment.userId });
    }
    return { verified, payment };
  },

  async webhook(rawBody: Buffer | string, signature: string | undefined, payload: { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string; error_description?: string } } } }) {
    const verified = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!verified) throw new Error("Invalid Razorpay webhook signature");
    const orderId = payload.payload?.payment?.entity?.order_id;
    if (!orderId) return { received: true, ignored: true };
    const existing = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
    if (!existing) return { received: true, ignored: true };
    const status = payload.event === "payment.failed" ? "FAILED" : ["payment.captured", "payment.authorized", "order.paid"].includes(payload.event ?? "") ? "SUCCESS" : existing.paymentStatus;
    const payment = await prisma.payment.update({
      where: { id: existing.id },
      data: {
        paymentStatus: status,
        razorpayPaymentId: payload.payload?.payment?.entity?.id ?? existing.razorpayPaymentId,
        verifiedAt: status === "SUCCESS" ? new Date() : existing.verifiedAt,
        receiptNumber: status === "SUCCESS" && !existing.receiptNumber ? receiptNumber("WEB") : existing.receiptNumber,
        failureReason: status === "FAILED" ? payload.payload?.payment?.entity?.error_description ?? "Razorpay payment failed" : existing.failureReason
      }
    });
    await logPayment(payment.id, "RAZORPAY_WEBHOOK", undefined, existing.paymentStatus, payment.paymentStatus, { event: payload.event });
    await applyPaymentToInstallment(payment);
    return { received: true, paymentId: payment.id, status: payment.paymentStatus };
  },

  async manualPayment(requester: Requester, input: { userId: string; courseId?: string; admissionId?: string; feeInstallmentId?: string; invoiceId?: string; branchId?: string; amount: number; currency?: string; paymentMethod: string; transactionRef?: string; receiptUploadUrl?: string; remarks?: string }) {
    assertFinanceAdmin(requester);
    const method = input.paymentMethod.toUpperCase();
    if (!manualMethods.has(method)) throw new Error("Unsupported manual payment method");
    assertDirectorScope(requester, { branchId: input.branchId });
    const payment = await prisma.payment.create({
      data: {
        userId: input.userId,
        courseId: input.courseId,
        admissionId: input.admissionId,
        feeInstallmentId: input.feeInstallmentId,
        invoiceId: input.invoiceId,
        branchId: input.branchId ?? requester.branchId ?? undefined,
        collectorId: requester.id,
        verifiedBy: requester.id,
        amount: input.amount,
        currency: input.currency ?? "INR",
        razorpayOrderId: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        paymentStatus: "SUCCESS",
        paymentMethod: method,
        paymentMode: "MANUAL",
        transactionRef: input.transactionRef,
        receiptNumber: receiptNumber("MANUAL"),
        receiptUploadUrl: input.receiptUploadUrl,
        remarks: input.remarks,
        reconciledAt: new Date(),
        verifiedAt: new Date()
      },
      include: paymentInclude
    });
    await logPayment(payment.id, "MANUAL_PAYMENT_RECORDED", requester.id, undefined, "SUCCESS", { method });
    await applyPaymentToInstallment(payment);
    await queueFinanceDocument({
      ownerId: payment.userId,
      documentType: "PAYMENT_RECEIPT",
      targetType: "Payment",
      targetId: payment.id,
      documentNumber: payment.receiptNumber ?? undefined,
      title: "NIDUS Manual Payment Receipt",
      lines: [`Receipt: ${payment.receiptNumber}`, `Amount: ${payment.currency} ${payment.amount}`, `Method: ${method}`, `Collector: ${requester.id}`]
    });
    return payment;
  },

  async failPayment(requester: Requester, paymentId: string, reason: string) {
    assertFinanceAdmin(requester);
    const existing = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const payment = await prisma.payment.update({ where: { id: paymentId }, data: { paymentStatus: "FAILED", failureReason: reason }, include: paymentInclude });
    await logPayment(payment.id, "PAYMENT_MARKED_FAILED", requester.id, existing.paymentStatus, "FAILED", { reason });
    return payment;
  },

  async refundShell(requester: Requester, paymentId: string, input: { amount: number; reason?: string }) {
    assertFinanceAdmin(requester);
    const existing = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (existing.paymentStatus !== "SUCCESS") throw new Error("Only successful payments can be marked for refund");
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { refundStatus: "REQUESTED", refundedAmount: input.amount },
      include: paymentInclude
    });
    await logPayment(payment.id, "REFUND_REQUESTED", requester.id, existing.refundStatus, "REQUESTED", input);
    return payment;
  },

  history(requester: Requester) {
    return prisma.payment.findMany({
      where: requester.role === Role.ADMIN ? undefined : requester.role === Role.DIRECTOR ? { branchId: requester.branchId ?? undefined } : { userId: requester.id },
      orderBy: { createdAt: "desc" },
      include: paymentInclude
    });
  },

  analytics(requester: Requester) {
    const scope = requester.role === Role.DIRECTOR ? { branchId: requester.branchId ?? undefined } : {};
    return prisma.payment.findMany({ where: requester.role === Role.ADMIN ? undefined : scope }).then((payments) => {
      const success = payments.filter((payment) => payment.paymentStatus === "SUCCESS");
      const pending = payments.filter((payment) => payment.paymentStatus !== "SUCCESS");
      const byMethod = success.reduce<Record<string, number>>((acc, payment) => {
        const key = payment.paymentMethod ?? "UNKNOWN";
        acc[key] = (acc[key] ?? 0) + payment.amount;
        return acc;
      }, {});
      return {
        dailyRevenue: success.reduce((sum, payment) => sum + (payment.createdAt.toDateString() === new Date().toDateString() ? payment.amount : 0), 0),
        monthlyRevenue: success.reduce((sum, payment) => sum + payment.amount, 0),
        pendingDues: pending.reduce((sum, payment) => sum + payment.amount, 0),
        paymentMethodAnalytics: byMethod,
        totalTransactions: payments.length,
        successfulTransactions: success.length
      };
    });
  },

  subscriptions(requester: Requester) {
    return prisma.subscription.findMany({
      where: requester.role === Role.ADMIN ? undefined : { userId: requester.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: userSelect } }
    });
  },

  createSubscription(requester: Requester, input: { userId?: string; planName: string; startDate: string; endDate: string; status: string; amount: number }) {
    assertFinanceAdmin(requester);
    const userId = input.userId ?? requester.id;
    return prisma.subscription.create({
      data: { userId, planName: input.planName, startDate: new Date(input.startDate), endDate: new Date(input.endDate), status: input.status, amount: input.amount },
      include: { user: { select: userSelect } }
    });
  },

  async createFeePlan(requester: Requester, input: { studentId: string; admissionId?: string; courseId?: string; instituteId?: string; branchId?: string; title: string; totalAmount: number; discountAmount?: number; scholarshipAmount?: number; installments: Array<{ title: string; amount: number; dueDate: string }> }) {
    assertFinanceAdmin(requester);
    assertDirectorScope(requester, { instituteId: input.instituteId, branchId: input.branchId });
    const discountAmount = input.discountAmount ?? 0;
    const scholarshipAmount = input.scholarshipAmount ?? 0;
    const netAmount = Math.max(0, input.totalAmount - discountAmount - scholarshipAmount);
    const plannedTotal = input.installments.reduce((sum, item) => sum + item.amount, 0);
    if (Math.round(plannedTotal) !== Math.round(netAmount)) throw new Error("Installment total must match net fee amount");
    return prisma.feePlan.create({
      data: {
        studentId: input.studentId,
        admissionId: input.admissionId,
        courseId: input.courseId,
        instituteId: input.instituteId,
        branchId: input.branchId,
        title: input.title,
        totalAmount: input.totalAmount,
        discountAmount,
        scholarshipAmount,
        netAmount,
        dueAmount: netAmount,
        createdBy: requester.id,
        installments: {
          create: input.installments.map((item, index) => ({
            studentId: input.studentId,
            title: item.title,
            amount: item.amount,
            dueAmount: item.amount,
            dueDate: new Date(item.dueDate),
            sequence: index + 1
          }))
        }
      },
      include: { installments: true, admission: true }
    });
  },

  fees(requester: Requester) {
    return prisma.feeInstallment.findMany({
      where: requester.role === Role.ADMIN || requester.role === Role.DIRECTOR ? undefined : { studentId: requester.id },
      orderBy: { dueDate: "asc" },
      include: { student: { select: userSelect }, payments: true }
    });
  },

  async createInstallment(requester: Requester, input: { studentId: string; feePlanId?: string; title: string; amount: number; dueDate: string; paidStatus?: string }) {
    assertFinanceAdmin(requester);
    return prisma.feeInstallment.create({
      data: { ...input, dueDate: new Date(input.dueDate), paidStatus: input.paidStatus ?? "PENDING", dueAmount: input.paidStatus === "PAID" ? 0 : input.amount, paidAmount: input.paidStatus === "PAID" ? input.amount : 0 },
      include: { student: { select: userSelect } }
    });
  },

  async payInstallment(requester: Requester, id: string) {
    const fee = await prisma.feeInstallment.findUnique({ where: { id } });
    if (!fee) throw new Error("Fee installment not found");
    if (requester.role !== Role.ADMIN && requester.role !== Role.DIRECTOR && fee.studentId !== requester.id) throw new Error("Forbidden");
    return prisma.feeInstallment.update({
      where: { id },
      data: { paidStatus: "PAID", paidAmount: fee.amount, dueAmount: 0, paidAt: new Date() },
      include: { student: { select: userSelect } }
    });
  },

  async overdueInstallments() {
    const now = new Date();
    return prisma.feeInstallment.updateMany({
      where: { dueDate: { lt: now }, paidStatus: { in: ["PENDING", "PARTIAL"] }, overdueAt: null },
      data: { overdueAt: now, reminderStatus: "DUE" }
    });
  },

  invoices(requester: Requester) {
    return prisma.invoice.findMany({
      where: requester.role === Role.ADMIN || requester.role === Role.DIRECTOR ? undefined : { studentId: requester.id },
      orderBy: { generatedAt: "desc" },
      include: { student: { select: userSelect }, payments: true }
    });
  },

  async generateInvoice(requester: Requester, input: { studentId: string; admissionId?: string; feePlanId?: string; amount: number; status?: string }) {
    assertFinanceAdmin(requester);
    const invoiceNumber = receiptNumber("INV");
    const invoice = await prisma.invoice.create({
      data: {
        studentId: input.studentId,
        admissionId: input.admissionId,
        feePlanId: input.feePlanId,
        amount: input.amount,
        dueAmount: input.amount,
        status: input.status ?? "GENERATED",
        invoiceNumber
      },
      include: { student: { select: userSelect } }
    });
    const document = await queueFinanceDocument({
      ownerId: invoice.studentId,
      documentType: "INVOICE",
      targetType: "Invoice",
      targetId: invoice.id,
      documentNumber: invoice.invoiceNumber,
      title: "NIDUS Fee Invoice",
      lines: [`Invoice: ${invoice.invoiceNumber}`, `Amount: INR ${invoice.amount}`, `Status: ${invoice.status}`]
    });
    return { ...invoice, financeDocument: document };
  }
};
