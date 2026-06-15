export type LiveClass = {
  id: string;
  title: string;
  description: string;
  examType: string;
  instructorName: string;
  scheduledAt: string;
  duration: number;
  meetingLink: string;
  thumbnail: string;
  isLive: boolean;
  batchId?: string | null;
  programSlug?: string | null;
  subject?: string | null;
  topic?: string | null;
  teacherId?: string | null;
  status?: string | null;
  recordingUrl?: string | null;
  createdAt: string;
};

export type RecordedLecture = {
  id: string;
  title: string;
  description: string;
  courseId?: string | null;
  moduleId?: string | null;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  instructorName: string;
  createdAt: string;
  course?: { id: string; title: string; examType: string } | null;
};

export type LectureProgress = {
  id: string;
  userId: string;
  lectureId: string;
  watchedDuration: number;
  completed: boolean;
  updatedAt: string;
};
