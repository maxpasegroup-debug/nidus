import { prisma } from "../../config/prisma.js";

export type LiveClassPayload = {
  title: string;
  description: string;
  examType: string;
  instructorName: string;
  scheduledAt: string;
  duration: number;
  meetingLink: string;
  thumbnail: string;
  isLive?: boolean;
};

export const liveClassesService = {
  listLiveClasses() {
    return prisma.liveClass.findMany({ orderBy: { scheduledAt: "asc" } });
  },

  createLiveClass(payload: LiveClassPayload) {
    return prisma.liveClass.create({
      data: { ...payload, scheduledAt: new Date(payload.scheduledAt), isLive: payload.isLive ?? false }
    });
  },

  async updateLiveClass(id: string, payload: Partial<LiveClassPayload>) {
    await this.getLiveClass(id);
    return prisma.liveClass.update({
      where: { id },
      data: {
        title: payload.title,
        description: payload.description,
        examType: payload.examType,
        instructorName: payload.instructorName,
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
        duration: payload.duration,
        meetingLink: payload.meetingLink,
        thumbnail: payload.thumbnail,
        isLive: payload.isLive
      }
    });
  },

  async deleteLiveClass(id: string) {
    await this.getLiveClass(id);
    await prisma.liveClass.delete({ where: { id } });
    return { message: "Live class deleted successfully" };
  },

  async getLiveClass(id: string) {
    const liveClass = await prisma.liveClass.findUnique({ where: { id } });
    if (!liveClass) throw new Error("Live class not found");
    return liveClass;
  },

  listLectures() {
    return prisma.recordedLecture.findMany({
      orderBy: { createdAt: "desc" },
      include: { course: { select: { id: true, title: true, examType: true } } }
    });
  },

  async getLecture(id: string) {
    const lecture = await prisma.recordedLecture.findUnique({
      where: { id },
      include: { course: { select: { id: true, title: true, examType: true } } }
    });
    if (!lecture) throw new Error("Recorded lecture not found");
    return lecture;
  },

  updateProgress(userId: string, payload: { lectureId: string; watchedDuration: number; completed?: boolean }) {
    return prisma.lectureProgress.upsert({
      where: { userId_lectureId: { userId, lectureId: payload.lectureId } },
      create: {
        userId,
        lectureId: payload.lectureId,
        watchedDuration: payload.watchedDuration,
        completed: payload.completed ?? false
      },
      update: {
        watchedDuration: payload.watchedDuration,
        completed: payload.completed
      }
    });
  },

  progress(userId: string, lectureId: string) {
    return prisma.lectureProgress.findUnique({ where: { userId_lectureId: { userId, lectureId } } });
  }
};
