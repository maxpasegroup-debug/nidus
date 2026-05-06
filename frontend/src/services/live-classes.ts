import { apiClient } from "@/services/api";
import type { LectureProgress, LiveClass, RecordedLecture } from "@/types/live-class";

export async function getLiveClasses() {
  const response = await apiClient.get<{ liveClasses: LiveClass[] }>("/live-classes");
  return response.data.liveClasses;
}

export async function getRecordedLectures() {
  const response = await apiClient.get<{ lectures: RecordedLecture[] }>("/recorded-lectures");
  return response.data.lectures;
}

export async function getRecordedLecture(id: string) {
  const response = await apiClient.get<{ lecture: RecordedLecture }>(`/recorded-lectures/${id}`);
  return response.data.lecture;
}

export async function updateLectureProgress(payload: { lectureId: string; watchedDuration: number; completed?: boolean }) {
  const response = await apiClient.post<{ progress: LectureProgress }>("/lecture-progress/update", payload);
  return response.data.progress;
}

export async function getLectureProgress(lectureId: string) {
  const response = await apiClient.get<{ progress: LectureProgress | null }>(`/lecture-progress/${lectureId}`);
  return response.data.progress;
}
