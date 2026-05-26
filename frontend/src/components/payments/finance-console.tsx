"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, FileText, Landmark, Repeat } from "lucide-react";
import { useMemo, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { FeeInstallmentCard, FinanceEmptyState, InvoiceCard, PaymentCard, PaymentStatusBadge, RevenueChart, SubscriptionCard } from "@/components/payments/payment-components";
import { useFees, useInvoices, usePayments, useSubscriptions } from "@/hooks/use-payments";
import { openRazorpayCheckout } from "@/services/razorpay";

type FinanceView = "payments" | "subscriptions" | "fees" | "invoices";

const links = [
  ["/payments", "Payments", CreditCard],
  ["/subscriptions", "Subscriptions", Repeat],
  ["/fees", "Fees", Landmark],
  ["/invoices", "Invoices", FileText]
] as const;

function value(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function FinanceConsole({ view }: { view: FinanceView }) {
  const { user } = useAuth();
  const payments = usePayments();
  const subscriptions = useSubscriptions();
  const fees = useFees();
  const invoices = useInvoices();
  const paymentData = useMemo(() => payments.data ?? [], [payments.data]);
  const subscriptionData = useMemo(() => subscriptions.data ?? [], [subscriptions.data]);
  const feeData = useMemo(() => fees.data ?? [], [fees.data]);
  const invoiceData = useMemo(() => invoices.data ?? [], [invoices.data]);
  const analytics = payments.analytics.data;
  const revenue = paymentData.filter((item) => item.paymentStatus === "SUCCESS").reduce((sum, item) => sum + item.amount, 0);
  const feePaid = feeData.filter((item) => item.paidStatus === "PAID").reduce((sum, item) => sum + item.amount, 0);
  const feePending = feeData.filter((item) => item.paidStatus !== "PAID").reduce((sum, item) => sum + item.amount, 0);
  const monthlyRevenue = useMemo(() => paymentData.map((item) => ({ label: new Date(item.createdAt).toLocaleDateString(undefined, { month: "short" }), value: item.paymentStatus === "SUCCESS" ? item.amount : 0 })), [paymentData]);
  const courseRevenue = useMemo(() => paymentData.map((item) => ({ label: item.course?.title ?? "Course", value: item.amount })), [paymentData]);

  async function checkout(form: HTMLFormElement) {
    const orderResponse = await payments.createOrder.mutateAsync({
      userId: value(form, "userId") || undefined,
      courseId: value(form, "courseId") || undefined,
      amount: Number(value(form, "amount")),
      currency: value(form, "currency") || "INR",
      paymentMethod: "RAZORPAY"
    });
    await openRazorpayCheckout(orderResponse, { name: user?.name, email: user?.email, mobile: user?.mobile }, (response) => {
      payments.verify.mutate({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        paymentMethod: "RAZORPAY"
      });
    }, () => undefined);
  }

  return (
    <motion.div className="space-y-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">NIDUS Finance Command</p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">Fees, Payments & Finance</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Simple academy finance for fee collection, pending dues, Razorpay, manual payments, subscriptions, invoices, receipts and revenue reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">{links.map(([href, label, Icon]) => <Link key={href} href={href} className="inline-flex h-10 items-center gap-2 rounded border border-white/10 px-3 text-sm text-ink transition hover:border-gold/50 hover:text-gold"><Icon className="h-4 w-4" />{label}</Link>)}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><p className="text-sm text-muted">Successful Revenue</p><b className="mt-2 block text-3xl text-white">Rs {revenue.toLocaleString()}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Active Plans</p><b className="mt-2 block text-3xl text-white">{subscriptionData.filter((item) => item.status === "ACTIVE").length}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Fees Paid</p><b className="mt-2 block text-3xl text-white">Rs {feePaid.toLocaleString()}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Pending Dues</p><b className="mt-2 block text-3xl text-white">Rs {feePending.toLocaleString()}</b></Card>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><p className="text-sm text-muted">Daily Revenue</p><b className="mt-2 block text-2xl text-white">Rs {(analytics?.dailyRevenue ?? 0).toLocaleString()}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Monthly Revenue</p><b className="mt-2 block text-2xl text-white">Rs {(analytics?.monthlyRevenue ?? revenue).toLocaleString()}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Transactions</p><b className="mt-2 block text-2xl text-white">{analytics?.successfulTransactions ?? 0}/{analytics?.totalTransactions ?? 0}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Method Mix</p><b className="mt-2 block text-2xl text-white">{Object.keys(analytics?.paymentMethodAnalytics ?? {}).length}</b></Card>
      </section>

      {view === "payments" ? (
        <section className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Razorpay Checkout</h2>
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void checkout(event.currentTarget); }}>
              <Grid><Input name="userId" label="User ID" defaultValue={user?.id} /><Input name="courseId" label="Course ID" /><Input name="amount" label="Amount" type="number" required /><Input name="currency" label="Currency" defaultValue="INR" /></Grid>
              <div className="mt-4"><Button size="sm" disabled={payments.createOrder.isPending}>{payments.createOrder.isPending ? "Creating..." : "Pay with Razorpay"}</Button></div>
            </form>
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Manual / Offline Payment</h2>
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; payments.manual.mutate({ userId: value(form, "userId"), courseId: value(form, "courseId") || undefined, admissionId: value(form, "admissionId") || undefined, feeInstallmentId: value(form, "feeInstallmentId") || undefined, invoiceId: value(form, "invoiceId") || undefined, branchId: value(form, "branchId") || undefined, amount: Number(value(form, "amount")), currency: value(form, "currency") || "INR", paymentMethod: value(form, "paymentMethod"), transactionRef: value(form, "transactionRef") || undefined, receiptUploadUrl: value(form, "receiptUploadUrl") || undefined, remarks: value(form, "remarks") || undefined }); }}>
              <Grid><Input name="userId" label="Student/User ID" required /><Input name="feeInstallmentId" label="Installment ID" /><Input name="invoiceId" label="Invoice ID" /><Input name="amount" label="Amount" type="number" required /><Input name="currency" label="Currency" defaultValue="INR" /><Input name="paymentMethod" label="Method" defaultValue="UPI" /><Input name="transactionRef" label="Transaction Ref" /><Input name="branchId" label="Branch ID" /></Grid>
              <div className="mt-3 grid gap-3 md:grid-cols-2"><Input name="receiptUploadUrl" label="Receipt Upload URL" /><Input name="remarks" label="Remarks" /></div>
              <p className="mt-3 text-xs text-muted">Supported methods: CASH, UPI, BANK_TRANSFER, CHEQUE, OFFICE_COLLECTION.</p>
              <div className="mt-4"><Button size="sm" disabled={payments.manual.isPending}>Record Manual Payment</Button></div>
            </form>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{paymentData.length ? paymentData.map((item) => <PaymentCard key={item.id} payment={item} />) : <FinanceEmptyState title="No payments yet" note="Completed and attempted payments will appear here." />}</div>
        </section>
      ) : null}

      {view === "subscriptions" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Create Subscription</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; subscriptions.create.mutate({ userId: value(form, "userId") || user?.id || "", planName: value(form, "planName"), startDate: value(form, "startDate"), endDate: value(form, "endDate"), status: value(form, "status"), amount: Number(value(form, "amount")) }); }}><Grid><Input name="userId" label="User ID" defaultValue={user?.id} /><Input name="planName" label="Plan Name" required /><Input name="startDate" label="Start Date" type="date" required /><Input name="endDate" label="End Date" type="date" required /><Input name="status" label="Status" defaultValue="ACTIVE" required /><Input name="amount" label="Amount" type="number" required /></Grid><div className="mt-4"><Button size="sm">Save Plan</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{subscriptionData.map((item) => <SubscriptionCard key={item.id} subscription={item} />)}</div>
          {!subscriptionData.length ? <FinanceEmptyState title="No subscriptions yet" note="Saved subscription plans will appear here." /> : null}
        </section>
      ) : null}

      {view === "fees" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Installment Plan Engine</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; fees.createPlan.mutate({ studentId: value(form, "studentId"), admissionId: value(form, "admissionId") || undefined, courseId: value(form, "courseId") || undefined, title: value(form, "title"), totalAmount: Number(value(form, "totalAmount")), discountAmount: Number(value(form, "discountAmount") || 0), scholarshipAmount: Number(value(form, "scholarshipAmount") || 0), installments: [{ title: "Installment 1", amount: Number(value(form, "firstAmount")), dueDate: value(form, "firstDueDate") }, { title: "Installment 2", amount: Number(value(form, "secondAmount")), dueDate: value(form, "secondDueDate") }] }); }}><Grid><Input name="studentId" label="Student ID" required /><Input name="admissionId" label="Admission ID" /><Input name="courseId" label="Course ID" /><Input name="title" label="Plan Title" required /><Input name="totalAmount" label="Total Fee" type="number" required /><Input name="discountAmount" label="Discount" type="number" defaultValue="0" /><Input name="scholarshipAmount" label="Scholarship" type="number" defaultValue="0" /><Input name="firstAmount" label="Installment 1 Amount" type="number" required /><Input name="firstDueDate" label="Installment 1 Due" type="date" required /><Input name="secondAmount" label="Installment 2 Amount" type="number" required /><Input name="secondDueDate" label="Installment 2 Due" type="date" required /></Grid><div className="mt-4"><Button size="sm">Create Fee Plan</Button></div></form></Card>
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Create Installment</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; fees.create.mutate({ studentId: value(form, "studentId"), title: value(form, "title"), amount: Number(value(form, "amount")), dueDate: value(form, "dueDate"), paidStatus: value(form, "paidStatus") }); }}><Grid><Input name="studentId" label="Student ID" required /><Input name="title" label="Title" required /><Input name="amount" label="Amount" type="number" required /><Input name="dueDate" label="Due Date" type="date" required /><Input name="paidStatus" label="Paid Status" defaultValue="PENDING" /></Grid><div className="mt-4"><Button size="sm">Create Installment</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{feeData.map((item) => <FeeInstallmentCard key={item.id} fee={item} onPay={() => fees.pay.mutate(item.id)} />)}</div>
        </section>
      ) : null}

      {view === "invoices" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Generate Invoice</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; invoices.generate.mutate({ studentId: value(form, "studentId"), amount: Number(value(form, "amount")), status: value(form, "status") }); }}><Grid><Input name="studentId" label="Student ID" required /><Input name="amount" label="Amount" type="number" required /><Input name="status" label="Status" defaultValue="GENERATED" /></Grid><div className="mt-4"><Button size="sm">Generate Invoice</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{invoiceData.map((item) => <InvoiceCard key={item.id} invoice={item} />)}</div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <RevenueChart title="Monthly Revenue" data={monthlyRevenue} />
        <RevenueChart title="Course-wise Revenue" data={courseRevenue} />
        <RevenueChart title="Paid vs Pending Fees" data={[{ label: "Paid", value: feePaid }, { label: "Pending", value: feePending }]} />
      </section>
      <div className="flex flex-wrap gap-2 text-sm text-muted"><PaymentStatusBadge status="SUCCESS" /><PaymentStatusBadge status="CREATED" /><PaymentStatusBadge status="FAILED" /></div>
    </motion.div>
  );
}
