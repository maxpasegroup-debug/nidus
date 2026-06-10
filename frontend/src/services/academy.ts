import { apiClient } from "@/services/api";

export type AcademyBatch = {
  id: string;
  name: string;
  batchType: string;
  programSlug: string;
  courseId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  course?: {
    id: string;
    title: string;
    slug: string;
    examType: string;
    category: string;
  } | null;
  students?: Array<{
    id: string;
    status: string;
    remarks?: string | null;
    student: {
      id: string;
      name: string;
      email: string;
      mobile: string;
      role: string;
    };
  }>;
  teachers?: Array<{
    id: string;
    subject: string;
    role: string;
    status: string;
    teacher: {
      id: string;
      name: string;
      email: string;
      mobile: string;
      role: string;
    };
  }>;
  _count?: {
    students?: number;
    teachers?: number;
    tests?: number;
  };
};

export type AcademyTeacher = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  roleMetadata?: Record<string, unknown> | null;
};

export type AcademicCalendarItem = {
  id: string;
  batchId?: string | null;
  batchName: string;
  programSlug?: string | null;
  subject: string;
  topic: string;
  plannedDate: string;
  startTime?: string | null;
  endTime?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  status: string;
  completionStatus: string;
  teacherLog?: string | null;
  nextAction?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BatchFilters = {
  programSlug?: string;
  batchType?: string;
  status?: string;
};

export async function getAcademyBatches(filters: BatchFilters = {}) {
  const response = await apiClient.get<{ batches: AcademyBatch[] }>("/academy/batches", { params: filters });
  return response.data.batches;
}

export async function getAcademyTeachers() {
  const response = await apiClient.get<{ teachers: AcademyTeacher[] }>("/academy/teachers");
  return response.data.teachers;
}

export async function createAcademyBatch(payload: {
  name: string;
  batchType: string;
  programSlug: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.post<{ batch: AcademyBatch }>("/academy/batches", payload);
  return response.data.batch;
}

export async function updateAcademyBatch(batchId: string, payload: Partial<{
  name: string;
  batchType: string;
  programSlug: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  status: string;
}>) {
  const response = await apiClient.patch<{ batch: AcademyBatch }>(`/academy/batches/${batchId}`, payload);
  return response.data.batch;
}

export async function assignTeacherToBatch(batchId: string, payload: { teacherId: string; subject: string; role?: string; status?: string }) {
  const response = await apiClient.post(`/academy/batches/${batchId}/teachers`, payload);
  return response.data;
}

export async function getAcademicCalendar(filters: { batchId?: string; status?: string } = {}) {
  const response = await apiClient.get<{ items: AcademicCalendarItem[] }>("/academy/academic-calendar", { params: filters });
  return response.data.items;
}

export async function createAcademicCalendarItem(payload: {
  batchId?: string;
  subject: string;
  topic: string;
  plannedDate: string;
  startTime?: string;
  endTime?: string;
  teacherId?: string;
  status?: string;
  completionStatus?: string;
  teacherLog?: string;
  nextAction?: string;
}) {
  const response = await apiClient.post<{ item: AcademicCalendarItem }>("/academy/academic-calendar", payload);
  return response.data.item;
}

export async function updateAcademicCalendarItem(id: string, payload: Partial<Pick<AcademicCalendarItem, "status" | "completionStatus" | "teacherLog" | "nextAction">>) {
  const response = await apiClient.patch<{ item: AcademicCalendarItem }>(`/academy/academic-calendar/${id}`, payload);
  return response.data.item;
}
