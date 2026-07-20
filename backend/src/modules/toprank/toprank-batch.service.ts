import { prisma } from "../../config/prisma.js";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function nextBatchDate(day: 1 | 15) {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), day, 9, 0, 0, 0);
  if (candidate <= now) return new Date(now.getFullYear(), now.getMonth() + 1, day, 9, 0, 0, 0);
  return candidate;
}

export const topRankBatchService = {
  async ensureAgniveerFoundation() {
    const gateway = await prisma.topRankGateway.upsert({
      where: { slug: "agniveer" },
      create: { slug: "agniveer", name: "AGNIVEER", status: "ADMISSIONS_OPEN", description: "Admissions open for the TopRank Agniveer Gateway." },
      update: { status: "ADMISSIONS_OPEN" }
    });
    const program = await prisma.topRankProgram.upsert({
      where: { slug: "agniveer-6-month-toprank-training" },
      create: {
        gatewayId: gateway.id,
        slug: "agniveer-6-month-toprank-training",
        title: "6 Month AI Powered TopRank Training Program",
        duration: "6 months",
        feeLabel: "Foundation fee placeholder",
        status: "ACTIVE"
      },
      update: { status: "ACTIVE" }
    });

    const first = nextBatchDate(1);
    const fifteenth = nextBatchDate(15);
    const seeds = [
      { name: `Agniveer TopRank ${first.toLocaleString("en-IN", { month: "short", year: "numeric" })} - 1st Batch`, startDate: first },
      { name: `Agniveer TopRank ${fifteenth.toLocaleString("en-IN", { month: "short", year: "numeric" })} - 15th Batch`, startDate: fifteenth }
    ];
    for (const seed of seeds) {
      const existing = await prisma.topRankBatch.findFirst({ where: { programId: program.id, startDate: seed.startDate } });
      if (!existing) {
        await prisma.topRankBatch.create({
          data: {
            programId: program.id,
            name: seed.name,
            startDate: seed.startDate,
            endDate: addDays(seed.startDate, 180),
            status: "ADMISSIONS_OPEN",
            metadata: { seats: 60, seatsRemaining: 60, cadence: seed.startDate.getDate() === 1 ? "1st of every month" : "15th of every month" }
          }
        });
      }
    }
    return program;
  },

  async listAvailableBatches() {
    const program = await this.ensureAgniveerFoundation();
    return prisma.topRankBatch.findMany({ where: { programId: program.id }, orderBy: { startDate: "asc" } });
  }
};

