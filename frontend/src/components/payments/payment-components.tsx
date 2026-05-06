"use client";

import { motion } from "framer-motion";
import { Download, Receipt, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { FeeInstallment, Invoice, Payment, Subscription } from "@/types/payments";

export function FinanceEmptyState({ title, note }: { title: string; note: string }) {
  return <Card className="p-6 text-center text-sm text-muted"><p className="text-base font-bold text-ink">{title}</p><p className="mt-2">{note}</p></Card>;
}

export function FinanceSkeleton() {
  return <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-lg border border-white/10 bg-white/8" />)}</div>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const tone = ["SUCCESS", "PAID", "ACTIVE", "GENERATED"].includes(status) ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100" : ["FAILED", "EXPIRED", "CANCELLED"].includes(status) ? "border-red-400/40 bg-red-400/15 text-red-100" : "border-gold/35 bg-gold/15 text-gold-soft";
  return <span className={`rounded border px-2 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

export function PaymentCard({ payment }: { payment: Payment }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{payment.course?.title ?? "NIDUS Payment"}</h3><p className="text-sm text-muted">{new Date(payment.createdAt).toLocaleString()}</p></div><PaymentStatusBadge status={payment.paymentStatus} /></div>
        <p className="mt-4 text-2xl font-black text-gold">{payment.currency} {payment.amount.toLocaleString()}</p>
        <p className="mt-2 text-xs text-muted">Order: {payment.razorpayOrderId}</p>
        <button className="mt-4 inline-flex items-center gap-2 rounded border border-white/12 px-3 py-2 text-sm text-ink"><Download className="h-4 w-4" />Download receipt</button>
      </Card>
    </motion.div>
  );
}

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  return <Card className="p-5"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-white">{subscription.planName}</h3><p className="text-sm text-muted">{new Date(subscription.startDate).toLocaleDateString()} to {new Date(subscription.endDate).toLocaleDateString()}</p></div><ShieldCheck className="h-5 w-5 text-gold" /></div><p className="mt-4 text-2xl font-black text-gold">Rs {subscription.amount.toLocaleString()}</p><PaymentStatusBadge status={subscription.status} /></Card>;
}

export function FeeInstallmentCard({ fee, onPay }: { fee: FeeInstallment; onPay?: () => void }) {
  return <Card className="p-5"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-white">{fee.title}</h3><p className="text-sm text-muted">Due {new Date(fee.dueDate).toLocaleDateString()}</p></div><PaymentStatusBadge status={fee.paidStatus} /></div><p className="mt-4 text-2xl font-black text-gold">Rs {fee.amount.toLocaleString()}</p>{onPay && fee.paidStatus !== "PAID" ? <button onClick={onPay} className="mt-4 rounded border border-gold/35 px-3 py-2 text-sm text-gold">Mark paid</button> : null}</Card>;
}

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{invoice.invoiceNumber}</h3><p className="text-sm text-muted">{invoice.student?.name ?? invoice.studentId}</p></div><Receipt className="h-5 w-5 text-gold" /></div><p className="mt-4 text-2xl font-black text-gold">Rs {invoice.amount.toLocaleString()}</p><div className="mt-3 flex items-center justify-between gap-3"><PaymentStatusBadge status={invoice.status} /><button className="text-sm text-gold">PDF placeholder</button></div></Card>;
}

export function RevenueChart({ data, title }: { data: Array<Record<string, string | number>>; title: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <Card className="p-5">
      <h3 className="mb-4 font-bold text-white">{title}</h3>
      <div className="h-56">
        {mounted ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#9fb0c7" /><YAxis stroke="#9fb0c7" /><Tooltip /><Bar dataKey="value" fill="#c9a646" /></BarChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}
      </div>
    </Card>
  );
}
