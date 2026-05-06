import { apiClient } from "@/services/api";
import type { Course, Enrollment } from "@/types/course";

export type CourseFilters = {
  search?: string;
  category?: string;
  examType?: string;
};

export async function getCourses(filters: CourseFilters = {}) {
  const response = await apiClient.get<{ courses: Course[] }>("/courses", {
    params: filters
  });
  return response.data.courses;
}

export async function getCourseDetails(slug: string) {
  const response = await apiClient.get<{ course: Course }>(`/courses/${slug}`);
  return response.data.course;
}

export async function enrollCourse(courseId: string) {
  const response = await apiClient.post<{ enrollment: Enrollment }>("/courses/enroll", {
    courseId
  });
  return response.data.enrollment;
}

export async function getMyCourses() {
  const response = await apiClient.get<{ enrollments: Enrollment[] }>("/my-courses");
  return response.data.enrollments;
}
