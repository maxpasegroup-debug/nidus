/**
 * Scene utility helpers for NIDUS Experience V2.
 * These functions keep scene naming and progress math consistent across future chapters.
 */
import type { ExperienceSceneLength } from "../types";

const sceneLengthOrder: Record<ExperienceSceneLength, number> = {
  short: 1,
  medium: 2,
  long: 3,
  extraLong: 4
};

/**
 * Creates a stable scene id from a numeric storyboard index and readable name.
 */
export function createSceneId(sceneNumber: number, name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `scene-${String(sceneNumber).padStart(2, "0")}-${slug}`;
}

/**
 * Compares scene lengths for production planning and testing.
 */
export function compareSceneLength(a: ExperienceSceneLength, b: ExperienceSceneLength): number {
  return sceneLengthOrder[a] - sceneLengthOrder[b];
}
