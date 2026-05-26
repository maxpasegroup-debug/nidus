import { apiClient } from "@/services/api";
import type { FeeInstallment, FeePlan, Invoice, Payment, PaymentAnalytics, RazorpayOrderResponse, Subscription } from "@/types/payments";

export async function createPaymentOrder(payload: { userId?: string; courseId?: string; amount: number; currency?: string; paymentMethod?: string; product?: string; examSlug?: string }) {
  return (await apiClient.post<RazorpayOrderResponse>("/payments/create-order", payload)).data;
}
export async function verifyPayment(payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; paymentMethod?: string }) {
  return (await apiClient.post<{ verified: boolean; payment: Payment }>("/payments/verify", payload)).data;
}
export async function createManualPayment(payload: { userId: string; courseId?: string; admissionId?: string; feeInstallmentId?: string; invoiceId?: string; branchId?: string; amount: number; currency?: string; paymentMethod: string; transactionRef?: string; receiptUploadUrl?: string; remarks?: string }) {
  return (await apiClient.post<{ payment: Payment }>("/payments/manual", payload)).data.payment;
}
export async function requestRefund(payload: { paymentId: string; amount: number; reason?: string }) {
  return (await apiClient.post<{ payment: Payment }>(`/payments/${payload.paymentId}/refund`, { amount: payload.amount, reason: payload.reason })).data.payment;
}
export async function getPaymentHistory() { return (await apiClient.get<{ payments: Payment[] }>("/payments/history")).data.payments; }
export async function getPaymentAnalytics() { return (await apiClient.get<{ analytics: PaymentAnalytics }>("/payments/analytics")).data.analytics; }
export async function getSubscriptions() { return (await apiClient.get<{ subscriptions: Subscription[] }>("/subscriptions")).data.subscriptions; }
export async function createSubscription(payload: Omit<Subscription, "id" | "createdAt" | "user">) { return (await apiClient.post<{ subscription: Subscription }>("/subscriptions", payload)).data.subscription; }
export async function getFees() { return (await apiClient.get<{ fees: FeeInstallment[] }>("/fees")).data.fees; }
export async function createFeeInstallment(payload: Omit<FeeInstallment, "id" | "paidAt" | "student">) { return (await apiClient.post<{ fee: FeeInstallment }>("/fees/installment", payload)).data.fee; }
export async function createFeePlan(payload: { studentId: string; admissionId?: string; courseId?: string; instituteId?: string; branchId?: string; title: string; totalAmount: number; discountAmount?: number; scholarshipAmount?: number; installments: Array<{ title: string; amount: number; dueDate: string }> }) {
  return (await apiClient.post<{ feePlan: FeePlan }>("/fees/plans", payload)).data.feePlan;
}
export async function payFeeInstallment(id: string) { return (await apiClient.put<{ fee: FeeInstallment }>(`/fees/pay/${id}`)).data.fee; }
export async function getInvoices() { return (await apiClient.get<{ invoices: Invoice[] }>("/invoices")).data.invoices; }
export async function generateInvoice(payload: { studentId: string; amount: number; status?: string }) { return (await apiClient.post<{ invoice: Invoice }>("/invoices/generate", payload)).data.invoice; }
