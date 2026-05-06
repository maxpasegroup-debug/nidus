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
  studentId: string;
  courseId: string;
  admissionDate: string;
  paymentStatus: string;
  batch: string;
  createdAt: string;
  student?: CRMUser;
  course?: { id: string; title: string; price: number; examType?: string };
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
