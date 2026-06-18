import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { ssbMappingSeed, ssbOlqBandSeed, ssbOlqSeed } from "./ssb-intelligence.data.js";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const ssbOlqService = {
  async seed() {
    let olqs = 0;
    let mappings = 0;
    let interpretations = 0;

    for (const seed of ssbOlqSeed) {
      const olq = await prisma.assessmentSsbOlq.upsert({
        where: { slug: seed.slug },
        create: { ...seed, metadata: json({ source: "NIDUS SSB Intelligence V2" }) },
        update: { ...seed, metadata: json({ source: "NIDUS SSB Intelligence V2" }) }
      });
      olqs += 1;
      for (const band of ssbOlqBandSeed) {
        await prisma.assessmentSsbOlqInterpretation.upsert({
          where: { olqId_band: { olqId: olq.id, band: band.band } },
          create: { olqId: olq.id, ...band },
          update: band
        });
        interpretations += 1;
      }
    }

    const olqByName = new Map((await prisma.assessmentSsbOlq.findMany()).map((olq) => [olq.name, olq]));
    for (const [sourceName, olqNames] of ssbMappingSeed) {
      for (const olqName of olqNames) {
        const olq = olqByName.get(olqName);
        if (!olq) continue;
        await prisma.assessmentSsbOlqMapping.upsert({
          where: { olqId_sourceType_sourceName: { olqId: olq.id, sourceType: "TRAIT", sourceName } },
          create: {
            olqId: olq.id,
            sourceType: "TRAIT",
            sourceName,
            weight: 1,
            metadata: json({ sourceSlug: slugify(sourceName) })
          },
          update: {
            weight: 1,
            metadata: json({ sourceSlug: slugify(sourceName) })
          }
        });
        mappings += 1;
      }
    }

    return { olqs, mappings, interpretations };
  },

  list() {
    return prisma.assessmentSsbOlq.findMany({
      orderBy: { name: "asc" },
      include: {
        mappings: { orderBy: [{ sourceType: "asc" }, { sourceName: "asc" }] },
        interpretations: { orderBy: { minScore: "asc" } }
      }
    });
  },

  mappings() {
    return prisma.assessmentSsbOlqMapping.findMany({
      orderBy: [{ sourceType: "asc" }, { sourceName: "asc" }],
      include: { olq: { select: { slug: true, name: true } } }
    });
  },

  async counts() {
    const [olqs, mappings, interpretations] = await Promise.all([
      prisma.assessmentSsbOlq.count(),
      prisma.assessmentSsbOlqMapping.count(),
      prisma.assessmentSsbOlqInterpretation.count()
    ]);
    return { olqs, mappings, interpretations };
  }
};
