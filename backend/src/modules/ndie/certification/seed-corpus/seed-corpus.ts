import type { SeedCorpusManifest } from "./contracts.js";

export const SEED_CORPUS_VERSION = "nuee-seed-corpus-1.0.0" as const;
export const SEED_CORPUS_TARGET = { minimum: 150, preferred: 300 } as const;
export const SEED_CORPUS_ALLOCATION = {
  partitions: { DEVELOPMENT: 0.6, VALIDATION: 0.2, BLIND_CERTIFICATION: 0.2 },
  minimumSubjects: { MATHEMATICS: 30, PHYSICS: 30, CHEMISTRY: 25, BIOLOGY: 15, ENGINEERING: 15, HUMANITIES: 15, LANGUAGES: 20 }
} as const;

export function summarizeSeedCorpus(manifests: SeedCorpusManifest[]) {
  const real = manifests.filter((manifest) => manifest.evidenceClass === "REAL");
  const expertVerified = real.filter((manifest) => ["EXPERT_VERIFIED", "ADJUDICATED"].includes(manifest.annotation.status));
  const byPartition = Object.fromEntries(["DEVELOPMENT", "VALIDATION", "BLIND_CERTIFICATION"].map((partition) => [partition, real.filter((manifest) => manifest.partition === partition).length]));
  const bySubject = Object.fromEntries(Object.keys(SEED_CORPUS_ALLOCATION.minimumSubjects).map((subject) => [subject, real.filter((manifest) => manifest.subject === subject).length]));
  return { version: SEED_CORPUS_VERSION, target: SEED_CORPUS_TARGET, realDocuments: real.length, developmentFixturesExcluded: manifests.length - real.length, expertVerifiedDocuments: expertVerified.length, byPartition, bySubject, evidenceComplete: real.length >= SEED_CORPUS_TARGET.minimum && expertVerified.length >= SEED_CORPUS_TARGET.minimum };
}

