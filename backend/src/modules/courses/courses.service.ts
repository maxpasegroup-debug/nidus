import { prisma } from "../../config/prisma.js";

export type CoursePayload = {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  examType: string;
  duration: string;
  price: number;
  isPremium?: boolean;
  modules?: Array<{
    title: string;
    order: number;
    lessons: Array<{
      title: string;
      description: string;
      videoUrl: string;
      pdfUrl: string;
      duration: string;
      isPreview?: boolean;
      order: number;
    }>;
  }>;
};

const courseInclude = {
  modules: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        orderBy: { order: "asc" as const }
      }
    }
  },
  _count: {
    select: { enrollments: true }
  }
};

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const coursesService = {
  async listCourses(filters: { search?: string; category?: string; examType?: string }) {
    return prisma.course.findMany({
      where: {
        AND: [
          filters.search
            ? {
                OR: [
                  { title: { contains: filters.search, mode: "insensitive" } },
                  { description: { contains: filters.search, mode: "insensitive" } }
                ]
              }
            : {},
          filters.category ? { category: filters.category } : {},
          filters.examType ? { examType: filters.examType } : {}
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { modules: true, enrollments: true }
        }
      }
    });
  },

  async getCourseBySlug(slug: string) {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: courseInclude
    });

    if (!course) {
      throw new Error("Course not found");
    }

    return course;
  },

  async createCourse(payload: CoursePayload) {
    return prisma.course.create({
      data: {
        title: payload.title,
        slug: normalizeSlug(payload.slug),
        description: payload.description,
        thumbnail: payload.thumbnail,
        category: payload.category,
        examType: payload.examType,
        duration: payload.duration,
        price: payload.price,
        isPremium: payload.isPremium ?? false,
        modules: {
          create:
            payload.modules?.map((module) => ({
              title: module.title,
              order: module.order,
              lessons: {
                create: module.lessons.map((lesson) => ({
                  title: lesson.title,
                  description: lesson.description,
                  videoUrl: lesson.videoUrl,
                  pdfUrl: lesson.pdfUrl,
                  duration: lesson.duration,
                  isPreview: lesson.isPreview ?? false,
                  order: lesson.order
                }))
              }
            })) ?? []
        }
      },
      include: courseInclude
    });
  },

  async updateCourse(id: string, payload: Partial<CoursePayload>) {
    const course = await prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new Error("Course not found");
    }

    return prisma.course.update({
      where: { id },
      data: {
        title: payload.title,
        slug: payload.slug ? normalizeSlug(payload.slug) : undefined,
        description: payload.description,
        thumbnail: payload.thumbnail,
        category: payload.category,
        examType: payload.examType,
        duration: payload.duration,
        price: payload.price,
        isPremium: payload.isPremium
      },
      include: courseInclude
    });
  },

  async deleteCourse(id: string) {
    const course = await prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new Error("Course not found");
    }

    await prisma.course.delete({ where: { id } });
    return { message: "Course deleted successfully" };
  },

  async enroll(userId: string, courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      throw new Error("Course not found");
    }

    return prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      update: {},
      create: {
        userId,
        courseId
      },
      include: {
        course: {
          include: courseInclude
        }
      }
    });
  },

  async myCourses(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: {
          include: courseInclude
        }
      }
    });
  }
};
