export type Attendance = { id: string; userId: string; date: string; status: "PRESENT" | "ABSENT" | "LATE"; markedBy: string; createdAt: string; user?: { id: string; name: string; role: string } };
export type Timetable = { id: string; title: string; batch: string; subject: string; instructor: string; startTime: string; endTime: string; classroom: string; createdAt: string };
export type Faculty = { id: string; userId: string; department: string; designation: string; joiningDate: string; salary: number; status: string; user?: { name: string; email: string }; payrolls?: Payroll[] };
export type Payroll = { id: string; facultyId: string; month: string; basicSalary: number; incentives: number; deductions: number; totalSalary: number; paidStatus: string; faculty?: Faculty };
export type Announcement = { id: string; title: string; description: string; targetAudience: string; createdAt: string };
