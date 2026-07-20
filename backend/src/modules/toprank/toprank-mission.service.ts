import { prisma } from "../../config/prisma.js";
import { topRankAPRService } from "./toprank-apr.service.js";
import { topRankCalendarService } from "./toprank-calendar.service.js";
import { topRankPlannerService } from "./toprank-planner.service.js";
import { topRankProgressService } from "./toprank-progress.service.js";

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export const topRankMissionService = {
  async generatePlan(userId: string, force = false) {
    const existing = await prisma.topRankMission.count({ where: { userId } });
    if (existing && !force) return this.dashboard(userId);

    if (force) {
      await prisma.topRankMission.deleteMany({ where: { userId } });
    }

    const [apr, profile, enrollment] = await Promise.all([
      topRankAPRService.latest(userId),
      prisma.topRankStudentProfile.findUnique({ where: { userId } }),
      prisma.topRankEnrollment.findFirst({ where: { userId }, include: { batch: true }, orderBy: { enrollmentDate: "desc" } })
    ]);
    const startDate = enrollment?.batch?.startDate ?? enrollment?.enrollmentDate ?? new Date();
    const drafts = topRankPlannerService.createRoadmap({ apr, profile, startDate, durationDays: 180 });

    for (const draft of drafts) {
      const dueDate = topRankCalendarService.missionDate(startDate, draft.dayNumber);
      const mission = await prisma.topRankMission.create({
        data: {
          userId,
          title: draft.title,
          description: draft.description,
          missionType: draft.missionType,
          difficulty: draft.difficulty,
          priority: draft.priority,
          estimatedMinutes: draft.estimatedMinutes,
          dueDate,
          dayNumber: draft.dayNumber,
          weekNumber: draft.weekNumber,
          objectives: draft.objectives,
          metadata: draft.metadata,
          tasks: { create: draft.tasks }
        }
      });
      await prisma.topRankMissionCalendar.create({
        data: {
          userId,
          missionId: mission.id,
          calendarDate: dueDate,
          weekNumber: draft.weekNumber,
          dayNumber: draft.dayNumber,
          status: "SCHEDULED",
          schedule: { estimatedMinutes: draft.estimatedMinutes, missionType: draft.missionType }
        }
      });
    }
    return this.dashboard(userId);
  },

  async dashboard(userId: string) {
    const today = startOfToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [todayMissions, upcomingMission, progress, weekly] = await Promise.all([
      prisma.topRankMission.findMany({ where: { userId, dueDate: { gte: today, lt: tomorrow } }, include: { tasks: true }, orderBy: [{ priority: "asc" }, { estimatedMinutes: "desc" }] }),
      prisma.topRankMission.findFirst({ where: { userId, dueDate: { gte: tomorrow }, status: { in: ["PENDING", "IN_PROGRESS"] } }, orderBy: [{ dueDate: "asc" }, { priority: "asc" }] }),
      topRankProgressService.summary(userId),
      topRankProgressService.weekly(userId)
    ]);
    return { todayMissions, upcomingMission, progress, weekly };
  },

  async detail(userId: string, missionId: string) {
    const mission = await prisma.topRankMission.findFirst({ where: { id: missionId, userId }, include: { tasks: { orderBy: { sequence: "asc" } }, completions: true } });
    if (!mission) throw new Error("TopRank mission not found");
    return mission;
  },

  async complete(userId: string, missionId: string, input: { notes?: string; checklist?: unknown }) {
    const mission = await this.detail(userId, missionId);
    await prisma.topRankMissionTask.updateMany({ where: { missionId }, data: { completed: true } });
    await prisma.topRankMission.update({ where: { id: mission.id }, data: { status: "COMPLETED" } });
    await prisma.topRankMissionCalendar.updateMany({ where: { userId, missionId }, data: { status: "COMPLETED" } });
    const completion = await prisma.topRankMissionCompletion.upsert({
      where: { userId_missionId: { userId, missionId } },
      create: { userId, missionId, status: "COMPLETED", notes: input.notes, checklist: input.checklist as any },
      update: { status: "COMPLETED", notes: input.notes, checklist: input.checklist as any, completedAt: new Date() }
    });
    return { mission: await this.detail(userId, missionId), completion, progress: await topRankProgressService.summary(userId) };
  },

  async calendar(userId: string) {
    return topRankCalendarService.calendar(userId);
  }
};

