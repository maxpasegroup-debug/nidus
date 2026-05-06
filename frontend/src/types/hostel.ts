export type Hostel = {
  id: string;
  name: string;
  type: "BOYS" | "GIRLS";
  totalRooms: number;
  wardenName: string;
  createdAt: string;
  rooms?: Room[];
};

export type Room = {
  id: string;
  hostelId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  occupiedCount: number;
  status: string;
  hostel?: Hostel;
};

export type StudentSummary = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export type HostelAllocation = {
  id: string;
  studentId: string;
  hostelId: string;
  roomId: string;
  allocatedAt: string;
  status: string;
  student?: StudentSummary;
  hostel?: Hostel;
  room?: Room;
};

export type InOutEntry = {
  id: string;
  studentId: string;
  type: "IN" | "OUT";
  entryTime: string;
  remarks?: string;
  student?: StudentSummary;
};

export type HostelLeave = {
  id: string;
  studentId: string;
  reason: string;
  fromDate: string;
  toDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  approvedBy?: string;
  student?: StudentSummary;
  approver?: StudentSummary;
};

export type MessMenu = {
  id: string;
  date: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
};

export type DisciplineRecord = {
  id: string;
  studentId: string;
  category: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  actionTaken: string;
  recordedBy: string;
  createdAt: string;
  student?: StudentSummary;
};

export type ParadePerformance = {
  id: string;
  studentId: string;
  attendance: number;
  discipline: number;
  leadership: number;
  fitness: number;
  remarks?: string;
  createdAt: string;
  student?: StudentSummary;
};
