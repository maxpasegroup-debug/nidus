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
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: string;
  paymentMethod?: string;
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
  title: string;
  amount: number;
  dueDate: string;
  paidStatus: string;
  paidAt?: string;
  student?: FinanceUser;
};

export type Invoice = {
  id: string;
  studentId: string;
  invoiceNumber: string;
  amount: number;
  generatedAt: string;
  status: string;
  student?: FinanceUser;
};
