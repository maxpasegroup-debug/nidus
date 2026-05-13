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

  async updateProgress(userId: string, payload: { lectureId: string; watchedDuration: number; completed?: boolean; eventType?: string; position?: number; duration?: number }) {
    const lecture = await prisma.recordedLecture.findUnique({ where: { id: payload.lectureId } });
    if (!lecture) throw new Error("Recorded lecture not found");
    const completionPercent = lecture.duration > 0 ? Math.min(100, Math.round((payload.watchedDuration / Math.max(1, lecture.duration * 60)) * 100)) : 0;
    const activeWatchTime = payload.duration ?? 0;
    const engagementScore = Math.min(100, Math.round((completionPercent * 0.7) + (activeWatchTime > 0 ? 30 : 0)));
    const progress = await prisma.lectureProgress.upsert({
      where: { userId_lectureId: { userId, lectureId: payload.lectureId } },
      create: {
        userId,
        lectureId: payload.lectureId,
        watchedDuration: payload.watchedDuration,
        completed: payload.completed ?? completionPercent >= 90,
        activeWatchTime,
        lastPosition: payload.position ?? payload.watchedDuration,
        engagementScore
      },
      update: {
        watchedDuration: payload.watchedDuration,
        completed: payload.completed ?? completionPercent >= 90,
        activeWatchTime: { increment: activeWatchTime },
        lastPosition: payload.position ?? payload.watchedDuration,
        engagementScore
      }
    });
    await prisma.lecturePlaybackEvent.create({
      data: {
        userId,
        lectureId: payload.lectureId,
        eventType: payload.eventType ?? "PROGRESS",
        position: payload.position ?? payload.watchedDuration,
        duration: payload.duration ?? 0,
        metadata: { completionPercent, fakeWatchShell: activeWatchTime === 0 && payload.watchedDuration > 0 }
      }
    });
    return progress;
  },

  progress(userId: string, lectureId: string) {
    return prisma.lectureProgress.findUnique({ where: { userId_lectureId: { userId, lectureId } } });
  }
};
