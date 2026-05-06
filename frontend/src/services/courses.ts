import { apiGet } from "@/services/api";
import type { Course } from "@/types/course";

export function getCourses() {
  return apiGet<Course[]>("/courses");
}

