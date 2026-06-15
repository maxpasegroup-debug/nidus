import { prisma } from "../../config/prisma.js";
import { Role } from "../../generated/prisma/client.js";

type LiveClassUser = {
  id: string;
  role: Role;
  roleMetadata?: Record<string, unknown> | null;
};

function liveClassTemplate(user: LiveClassUser) {
  const metadata = user.roleMetadata && typeof user.roleMetadata === "object" ? user.roleMetadata : {};
  return typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate.toUpperCase() : "";
}

function canManageAllLiveClasses(user: LiveClassUser) {
  const dashboardTemplate = liveClassTemplate(user);
  return (
    user.role === Role.DIRECTOR ||
    user.role === Role.ACADEMIC_HEAD ||
    dashboardTemplate === "ACADEMIC_HEAD" ||
    (user.role === Role.ADMIN && !["ADMISSION_CELL", "MARKETING", "SALES_BOOSTER", "ADMINISTRATION"].includes(dashboardTemplate))
  );
}

async function assignedBatchIdsForTeacher(userId: string) {
  const assignments = await prisma.teacherBatchAssignment.findMany({
    where: { teacherId: userId, status: "ACTIVE" },
    select: { batchId: true }
  });
  return assignments.map((assignment) => assignment.batchId);
}

export type LiveClassPayload = {
  title: string;
  description: string;
  examType: string;
  instructorName: string;
  scheduledAt: string;
  duration: number;
  meetingLink: string;
  thumbnail?: string;
  isLive?: boolean;
  batchId?: string;
  programSlug?: string;
  subject?: string;
  topic?: string;
  teacherId?: string;
  status?: string;
  recordingUrl?: string;
};

export const liveClassesService = {
  async listLiveClasses(user: LiveClassUser) {
    if (canManageAllLiveClasses(user)) {
      return prisma.liveClass.findMany({
        where: { status: { not: "CANCELLED" } },
        orderBy: { scheduledAt: "asc" }
      });
    }

    if (user.role === Role.TEACHER || user.role === Role.PHYSICAL_TRAINER) {
      const batchIds = await assignedBatchIdsForTeacher(user.id);
      return prisma.liveClass.findMany({
        where: {
          status: { not: "CANCELLED" },
          OR: [
            { teacherId: user.id },
            ...(batchIds.length ? [{ batchId: { in: batchIds } }] : [])
          ]
        },
        orderBy: { scheduledAt: "asc" }
      });
    }

    if (user.role === Role.STUDENT) {
      const enrollments = await prisma.batchStudent.findMany({
        where: { studentId: user.id, status: "ACTIVE" },
        select: { batchId: true }
      });
      const batchIds = enrollments.map((enrollment) => enrollment.batchId);
      if (!batchIds.length) return [];
      return prisma.liveClass.findMany({
        where: { batchId: { in: batchIds }, status: { not: "CANCELLED" } },
        orderBy: { scheduledAt: "asc" }
      });
    }

    if (user.role === Role.PARENT) {
      const links = await prisma.parentStudentLink.findMany({
        where: { parentId: user.id, status: "ACTIVE" },
        select: { studentId: true }
      });
      const studentIds = links.map((link) => link.studentId);
      if (!studentIds.length) return [];
      const enrollments = await prisma.batchStudent.findMany({
        where: { studentId: { in: studentIds }, status: "ACTIVE" },
        select: { batchId: true }
      });
      const batchIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.batchId)));
      if (!batchIds.length) return [];
      return prisma.liveClass.findMany({
        where: { batchId: { in: batchIds }, status: { not: "CANCELLED" } },
        orderBy: { scheduledAt: "asc" }
      });
    }

    return [];
  },

  createLiveClass(payload: LiveClassPayload) {
    return prisma.liveClass.create({
      data: {
        title: payload.title,
        description: payload.description,
        examType: payload.examType,
        instructorName: payload.instructorName,
        scheduledAt: new Date(payload.scheduledAt),
        duration: payload.duration,
        meetingLink: payload.meetingLink,
        thumbnail: payload.thumbnail || "",
        isLive: payload.isLive ?? false,
        batchId: payload.batchId,
        programSlug: payload.programSlug,
        subject: payload.subject,
        topic: payload.topic,
        teacherId: payload.teacherId,
        status: payload.status || "SCHEDULED",
        recordingUrl: payload.recordingUrl
      }
    });
  },

  async updateLiveClass(user: LiveClassUser, id: string, payload: Partial<LiveClassPayload>) {
    await this.assertManageAccess(user, id);
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
        isLive: payload.isLive,
        batchId: payload.batchId,
        programSlug: payload.programSlug,
        subject: payload.subject,
        topic: payload.topic,
        teacherId: payload.teacherId,
        status: payload.status,
        recordingUrl: payload.recordingUrl
      }
    });
  },

  async deleteLiveClass(user: LiveClassUser, id: string) {
    await this.assertManageAccess(user, id);
    await prisma.liveClass.delete({ where: { id } });
    return { message: "Live class deleted successfully" };
  },

  async assertManageAccess(user: LiveClassUser, id: string) {
    const liveClass = await this.getLiveClass(id);
    if (canManageAllLiveClasses(user)) return liveClass;
    if (liveClass.teacherId === user.id) return liveClass;
    if (liveClass.batchId && (user.role === Role.TEACHER || user.role === Role.PHYSICAL_TRAINER)) {
      const batchIds = await assignedBatchIdsForTeacher(user.id);
      if (batchIds.includes(liveClass.batchId)) return liveClass;
    }
    throw Object.assign(new Error("This live class is not assigned to this user"), { statusCode: 403 });
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
        metadata: { completionPercent, passiveProgressCredit: activeWatchTime === 0 && payload.watchedDuration > 0 }
      }
    });
    return progress;
  },

  progress(userId: string, lectureId: string) {
    return prisma.lectureProgress.findUnique({ where: { userId_lectureId: { userId, lectureId } } });
  }
};
