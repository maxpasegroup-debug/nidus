import { prisma } from "../../config/prisma.js";

export const topRankUserService = {
  async listStudents(query?: string) {
    return prisma.topRankUser.findMany({
      where: {
        role: "TOPRANK_STUDENT",
        OR: query ? [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } }
        ] : undefined
      },
      include: {
        studentProfile: true,
        enrollments: { include: { batch: true, program: true }, orderBy: { enrollmentDate: "desc" }, take: 1 }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  },

  async listMentorBatches(mentorId: string) {
    return prisma.topRankBatch.findMany({
      where: { mentorId },
      include: { students: true, program: true },
      orderBy: { startDate: "asc" }
    });
  }
};

