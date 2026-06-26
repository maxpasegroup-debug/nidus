export type CRMUser = {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
};

export type LeadStatus = "NEW" | "CONTACTED" | "COUNSELLING" | "ENROLLED" | "LOST";

export type Lead = {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  targetExam: string;
  source: string;
  status: LeadStatus;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  assignee?: CRMUser;
  followUps?: FollowUp[];
};

export type GuestApplicantResult = {
  user: CRMUser;
  lead: Lead;
  reusedExistingUser: boolean;
  temporaryPasswordIssued: boolean;
  loginIdentity: string;
  mustChangePassword: boolean;
};

export type BulkLeadInput = {
  fullName: string;
  mobile: string;
  email?: string;
  targetExam: string;
  source: string;
  notes?: string;
};

export type BulkLeadResult = {
  created: number;
  skipped: number;
  invalid: number;
  results: Array<{ mobile: string; email?: string; status: "CREATED" | "SKIPPED"; reason?: string; lead?: Lead }>;
};

export type FollowUp = {
  id: string;
  leadId: string;
  followUpDate: string;
  remarks: string;
  status: string;
  createdBy: string;
  lead?: Lead;
  creator?: CRMUser;
};

export type Admission = {
  id: string;
  leadId?: string;
  studentId: string;
  courseId: string;
  instituteId?: string;
  branchId?: string;
  admissionDate: string;
  paymentStatus: string;
  status?: string;
  admissionMode?: "ONLINE" | "MANUAL";
  approvalStatus?: string;
  onboardingStatus?: string;
  totalFee?: number;
  paidAmount?: number;
  dueAmount?: number;
  remarks?: string;
  batch: string;
  createdAt: string;
  student?: CRMUser;
  course?: { id: string; title: string; price: number; examType?: string };
};

export type ApprovalRequest = {
  id: string;
  type: string;
  status: string;
  targetType: string;
  targetId?: string;
  amount?: number;
  reason?: string;
  remarks?: string;
  requestedAt: string;
  reviewedAt?: string;
  admission?: Admission;
  requester?: CRMUser;
  reviewer?: CRMUser;
};

export type ScholarshipDiscount = {
  id: string;
  studentId: string;
  admissionId?: string;
  type: "SCHOLARSHIP" | "DISCOUNT" | "FEE_WAIVER";
  title: string;
  amount: number;
  status: string;
  reason?: string;
  student?: CRMUser;
};

export type CounsellingBooking = {
  id: string;
  leadId: string;
  counsellorName: string;
  bookingDate: string;
  mode: "ONLINE" | "OFFLINE";
  status: string;
  lead?: Lead;
};

export type Referral = {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  rewardStatus: string;
  createdAt: string;
  referrer?: CRMUser;
  referred?: CRMUser;
};
