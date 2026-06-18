import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { defenceTraitLibrarySeed, readinessInterpretationSeed, riskInterpretationSeed, traitBandSeed } from "./assessment-trait-library.data.js";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const assessmentTraitLibraryService = {
  async seed() {
    let traits = 0;
    let dimensions = 0;
    let traitInterpretations = 0;

    for (const traitSeed of defenceTraitLibrarySeed) {
      const trait = await prisma.assessmentTraitLibraryItem.upsert({
        where: { slug: traitSeed.slug },
        create: {
          slug: traitSeed.slug,
          name: traitSeed.name,
          definition: traitSeed.definition,
          defenceRelevance: traitSeed.defenceRelevance,
          ssbRelevance: traitSeed.ssbRelevance,
          topRankRelevance: traitSeed.topRankRelevance,
          riskRelevance: traitSeed.riskRelevance,
          assessmentRelevance: json(traitSeed.assessmentRelevance),
          metadata: json({ source: "NIDUS Defence Trait Library V2" })
        },
        update: {
          definition: traitSeed.definition,
          defenceRelevance: traitSeed.defenceRelevance,
          ssbRelevance: traitSeed.ssbRelevance,
          topRankRelevance: traitSeed.topRankRelevance,
          riskRelevance: traitSeed.riskRelevance,
          assessmentRelevance: json(traitSeed.assessmentRelevance),
          metadata: json({ source: "NIDUS Defence Trait Library V2" })
        }
      });
      traits += 1;

      for (const dimensionName of traitSeed.dimensions) {
        await prisma.assessmentDimensionLibraryItem.upsert({
          where: { traitId_slug: { traitId: trait.id, slug: slugify(dimensionName) } },
          create: {
            traitId: trait.id,
            slug: slugify(dimensionName),
            name: dimensionName,
            description: `${dimensionName} measures a specific observable part of ${trait.name}.`,
            importance: `${dimensionName} helps NIDUS separate broad ${trait.name} potential from specific trainable behaviour.`,
            riskImpact: `Weak ${dimensionName} can reduce ${trait.name} reliability in defence preparation and SSB contexts.`,
            metadata: json({ parentTrait: trait.name })
          },
          update: {
            description: `${dimensionName} measures a specific observable part of ${trait.name}.`,
            importance: `${dimensionName} helps NIDUS separate broad ${trait.name} potential from specific trainable behaviour.`,
            riskImpact: `Weak ${dimensionName} can reduce ${trait.name} reliability in defence preparation and SSB contexts.`,
            metadata: json({ parentTrait: trait.name })
          }
        });
        dimensions += 1;
      }

      for (const band of traitBandSeed) {
        await prisma.assessmentTraitBandInterpretation.upsert({
          where: { traitId_band: { traitId: trait.id, band: band.band } },
          create: {
            traitId: trait.id,
            band: band.band,
            minScore: band.minScore,
            maxScore: band.maxScore,
            interpretation: `${trait.name}: ${band.interpretation}`,
            recommendation: band.recommendation
          },
          update: {
            minScore: band.minScore,
            maxScore: band.maxScore,
            interpretation: `${trait.name}: ${band.interpretation}`,
            recommendation: band.recommendation
          }
        });
        traitInterpretations += 1;
      }
    }

    for (const risk of riskInterpretationSeed) {
      await prisma.assessmentRiskInterpretation.upsert({
        where: { riskLevel: risk.riskLevel },
        create: risk,
        update: risk
      });
    }

    for (const readiness of readinessInterpretationSeed) {
      await prisma.assessmentReadinessInterpretation.upsert({
        where: { band: readiness.band },
        create: readiness,
        update: readiness
      });
    }

    return {
      traits,
      dimensions,
      traitInterpretations,
      riskInterpretations: riskInterpretationSeed.length,
      readinessInterpretations: readinessInterpretationSeed.length
    };
  },

  listTraits() {
    return prisma.assessmentTraitLibraryItem.findMany({
      orderBy: { name: "asc" },
      include: {
        dimensions: { orderBy: { name: "asc" } },
        interpretations: { orderBy: { minScore: "asc" } }
      }
    });
  },

  getTrait(slug: string) {
    return prisma.assessmentTraitLibraryItem.findUnique({
      where: { slug },
      include: {
        dimensions: { orderBy: { name: "asc" } },
        interpretations: { orderBy: { minScore: "asc" } }
      }
    });
  },

  listDimensions(traitSlug?: string) {
    return prisma.assessmentDimensionLibraryItem.findMany({
      where: traitSlug ? { trait: { slug: traitSlug } } : undefined,
      orderBy: [{ trait: { name: "asc" } }, { name: "asc" }],
      include: { trait: { select: { id: true, slug: true, name: true } } }
    });
  },

  async interpretations() {
    const [traitBands, risks, readiness] = await Promise.all([
      prisma.assessmentTraitBandInterpretation.findMany({
        orderBy: [{ trait: { name: "asc" } }, { minScore: "asc" }],
        include: { trait: { select: { slug: true, name: true } } }
      }),
      prisma.assessmentRiskInterpretation.findMany({ orderBy: { riskLevel: "asc" } }),
      prisma.assessmentReadinessInterpretation.findMany({ orderBy: { minScore: "asc" } })
    ]);
    return { traitBands, risks, readiness };
  },

  async counts() {
    const [traits, dimensions, traitInterpretations, riskInterpretations, readinessInterpretations] = await Promise.all([
      prisma.assessmentTraitLibraryItem.count(),
      prisma.assessmentDimensionLibraryItem.count(),
      prisma.assessmentTraitBandInterpretation.count(),
      prisma.assessmentRiskInterpretation.count(),
      prisma.assessmentReadinessInterpretation.count()
    ]);
    return { traits, dimensions, traitInterpretations, riskInterpretations, readinessInterpretations };
  }
};
