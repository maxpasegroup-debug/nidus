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

export type BatchFilters = {
  programSlug?: string;
  batchType?: string;
  status?: string;
};

export async function getAcademyBatches(filters: BatchFilters = {}) {
  const response = await apiClient.get<{ batches: AcademyBatch[] }>("/academy/batches", { params: filters });
  return response.data.batches;
}
