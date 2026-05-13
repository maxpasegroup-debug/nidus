export type FinanceUser = {
  id: string;
  name: string;
  email: string;
  mobile?: string;
};

export type FinanceCourse = {
  id: string;
  title: string;
  price: number;
  examType?: string;
};

export type Payment = {
  id: string;
  userId: string;
  courseId?: string;
  admissionId?: string;
  feeInstallmentId?: string;
  invoiceId?: string;
  branchId?: string;
  collectorId?: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentMode?: string;
  transactionRef?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  receiptUploadUrl?: string;
  remarks?: string;
  failureReason?: string;
  refundStatus?: string;
  refundedAmount?: number;
  createdAt: string;
  user?: FinanceUser;
  course?: FinanceCourse;
};

export type RazorpayOrderResponse = {
  payment: Payment;
  keyId: string;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt?: string;
  };
};

export type Subscription = {
  id: string;
  userId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  amount: number;
  createdAt: string;
  user?: FinanceUser;
};

export type FeeInstallment = {
  id: string;
  studentId: string;
  feePlanId?: string;
  title: string;
  amount: number;
  paidAmount?: number;
  dueAmount?: number;
  dueDate: string;
  paidStatus: string;
  paidAt?: string;
  student?: FinanceUser;
};

export type Invoice = {
  id: string;
  studentId: string;
  admissionId?: string;
  feePlanId?: string;
  invoiceNumber: string;
  amount: number;
  paidAmount?: number;
  dueAmount?: number;
  pdfUrl?: string;
  receiptUrl?: string;
  generatedAt: string;
  status: string;
  student?: FinanceUser;
};

export type PaymentAnalytics = {
  dailyRevenue: number;
  monthlyRevenue: number;
  pendingDues: number;
  paymentMethodAnalytics: Record<string, number>;
  totalTransactions: number;
  successfulTransactions: number;
};

export type FeePlan = {
  id: string;
  studentId: string;
  title: string;
  totalAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  installments?: FeeInstallment[];
};
