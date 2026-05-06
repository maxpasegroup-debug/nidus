export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  examType: string;
  duration: string;
  price: number;
  isPremium: boolean;
  createdAt: string;
  modules?: CourseModule[];
  _count?: {
    modules?: number;
    enrollments?: number;
  };
};

export type CourseModule = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

export type Lesson = {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl: string;
  pdfUrl: string;
  duration: string;
  isPreview: boolean;
  order: number;
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number;
  course: Course;
};
