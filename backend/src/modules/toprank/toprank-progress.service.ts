import { prisma } from "../../config/prisma.js";

export const topRankProgressService = {
  async summary(userId: string) {
    const [total, completed, pending, missed] = await Promise.all([
      prisma.topRankMission.count({ where: { userId } }),
      prisma.topRankMission.count({ where: { userId, status: "COMPLETED" } }),
      prisma.topRankMission.count({ where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
      prisma.topRankMission.count({ where: { userId, status: "MISSED" } })
    ]);
    const completion = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, missed, completion };
  },

  async weekly(userId: string) {
    const rows = await prisma.topRankMission.groupBy({
      by: ["weekNumber", "status"],
      where: { userId },
      _count: { id: true },
      orderBy: { weekNumber: "asc" }
    });
    return rows;
  }
};

