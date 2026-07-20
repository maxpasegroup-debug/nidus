import { prisma } from "../../config/prisma.js";

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export const topRankCalendarService = {
  missionDate(startDate: Date, dayNumber: number) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayNumber - 1);
    return date;
  },

  async calendar(userId: string, date = new Date()) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const today = dayRange(date);
    const [month, todayItems, upcoming] = await Promise.all([
      prisma.topRankMissionCalendar.findMany({ where: { userId, calendarDate: { gte: monthStart, lt: monthEnd } }, include: { mission: true }, orderBy: { calendarDate: "asc" } }),
      prisma.topRankMissionCalendar.findMany({ where: { userId, calendarDate: { gte: today.start, lt: today.end } }, include: { mission: { include: { tasks: true } } }, orderBy: { calendarDate: "asc" } }),
      prisma.topRankMission.findMany({ where: { userId, dueDate: { gt: today.end }, status: { in: ["PENDING", "IN_PROGRESS"] } }, orderBy: [{ dueDate: "asc" }, { priority: "asc" }], take: 10 })
    ]);
    return { month, today: todayItems, upcoming };
  }
};

