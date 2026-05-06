import { apiClient } from "@/services/api";
import type { FeeInstallment, Invoice, Payment, RazorpayOrderResponse, Subscription } from "@/types/payments";

export async function createPaymentOrder(payload: { userId?: string; courseId?: string; amount: number; currency?: string; paymentMethod?: string }) {
  return (await apiClient.post<RazorpayOrderResponse>("/payments/create-order", payload)).data;
}
export async function verifyPayment(payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; paymentMethod?: string }) {
  return (await apiClient.post<{ verified: boolean; payment: Payment }>("/payments/verify", payload)).data;
}
export async function getPaymentHistory() { return (await apiClient.get<{ payments: Payment[] }>("/payments/history")).data.payments; }
export async function getSubscriptions() { return (await apiClient.get<{ subscriptions: Subscription[] }>("/subscriptions")).data.subscriptions; }
export async function createSubscription(payload: Omit<Subscription, "id" | "createdAt" | "user">) { return (await apiClient.post<{ subscription: Subscription }>("/subscriptions", payload)).data.subscription; }
export async function getFees() { return (await apiClient.get<{ fees: FeeInstallment[] }>("/fees")).data.fees; }
export async function createFeeInstallment(payload: Omit<FeeInstallment, "id" | "paidAt" | "student">) { return (await apiClient.post<{ fee: FeeInstallment }>("/fees/installment", payload)).data.fee; }
export async function payFeeInstallment(id: string) { return (await apiClient.put<{ fee: FeeInstallment }>(`/fees/pay/${id}`)).data.fee; }
export async function getInvoices() { return (await apiClient.get<{ invoices: Invoice[] }>("/invoices")).data.invoices; }
export async function generateInvoice(payload: { studentId: string; amount: number; status?: string }) { return (await apiClient.post<{ invoice: Invoice }>("/invoices/generate", payload)).data.invoice; }
