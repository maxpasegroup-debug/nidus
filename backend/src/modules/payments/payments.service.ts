import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";
import { razorpayService } from "./razorpay.service.js";

const userSelect = { id: true, name: true, email: true, mobile: true, role: true } as const;
const paymentInclude = { user: { select: userSelect }, course: true } as const;

function scopedUser(requester: { id: string; role: Role }, provided?: string) {
  return requester.role === "ADMIN" ? provided : requester.id;
}

export const paymentsService = {
  async createOrder(requester: { id: string; role: Role }, input: { userId?: string; courseId?: string; amount: number; currency?: string; paymentMethod?: string }) {
    const userId = scopedUser(requester, input.userId) ?? requester.id;
    const currency = input.currency ?? "INR";
    const localReceipt = `nidus_${Date.now()}`;
    const order = await razorpayService.createOrder({ amount: input.amount, currency, receipt: localReceipt });
    const payment = await prisma.payment.create({
      data: {
        userId,
        courseId: input.courseId || undefined,
        amount: input.amount,
        currency,
        razorpayOrderId: order.id,
        paymentStatus: "CREATED",
        paymentMethod: input.paymentMethod ?? "RAZORPAY"
      },
      include: paymentInclude
    });
    return { payment, order, keyId: razorpayService.keyId() };
  },
  async verify(input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; paymentMethod?: string }) {
    const verified = razorpayService.verifySignature(input);
    const payment = await prisma.payment.update({
      where: { razorpayOrderId: input.razorpayOrderId },
      data: {
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        paymentStatus: verified ? "SUCCESS" : "FAILED",
        paymentMethod: input.paymentMethod ?? "RAZORPAY"
      },
      include: paymentInclude
    });
    return { verified, payment };
  },
  history(requester: { id: string; role: Role }) {
    return prisma.payment.findMany({
      where: requester.role === "ADMIN" ? undefined : { userId: requester.id },
      orderBy: { createdAt: "desc" },
      include: paymentInclude
    });
  },
  subscriptions(requester: { id: string; role: Role }) {
    return prisma.subscription.findMany({
      where: requester.role === "ADMIN" ? undefined : { userId: requester.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: userSelect } }
    });
  },
  createSubscription(requester: { id: string; role: Role }, input: { userId?: string; planName: string; startDate: string; endDate: string; status: string; amount: number }) {
    const userId = scopedUser(requester, input.userId) ?? requester.id;
    return prisma.subscription.create({
      data: { userId, planName: input.planName, startDate: new Date(input.startDate), endDate: new Date(input.endDate), status: input.status, amount: input.amount },
      include: { user: { select: userSelect } }
    });
  },
  fees(requester: { id: string; role: Role }) {
    return prisma.feeInstallment.findMany({
      where: requester.role === "ADMIN" ? undefined : { studentId: requester.id },
      orderBy: { dueDate: "asc" },
      include: { student: { select: userSelect } }
    });
  },
  createInstallment(input: { studentId: string; title: string; amount: number; dueDate: string; paidStatus?: string }) {
    return prisma.feeInstallment.create({
      data: { ...input, dueDate: new Date(input.dueDate), paidStatus: input.paidStatus ?? "PENDING" },
      include: { student: { select: userSelect } }
    });
  },
  payInstallment(id: string) {
    return prisma.feeInstallment.update({
      where: { id },
      data: { paidStatus: "PAID", paidAt: new Date() },
      include: { student: { select: userSelect } }
    });
  },
  invoices(requester: { id: string; role: Role }) {
    return prisma.invoice.findMany({
      where: requester.role === "ADMIN" ? undefined : { studentId: requester.id },
      orderBy: { generatedAt: "desc" },
      include: { student: { select: userSelect } }
    });
  },
  generateInvoice(input: { studentId: string; amount: number; status?: string }) {
    return prisma.invoice.create({
      data: {
        studentId: input.studentId,
        amount: input.amount,
        status: input.status ?? "GENERATED",
        invoiceNumber: `NIDUS-${Date.now()}`
      },
      include: { student: { select: userSelect } }
    });
  }
};
