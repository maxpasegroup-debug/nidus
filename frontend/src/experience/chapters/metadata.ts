/**
 * Chapter metadata for NIDUS Experience V2.
 * The canonical chapter list lives in the Experience Manifest.
 */
import { experienceManifest } from "../manifest";
import type { ExperienceChapterMetadata } from "../types";

export const experienceChapters = experienceManifest.chapters;

/**
 * Finds chapter metadata by its stable id.
 */
export function getExperienceChapter(chapterId: string): ExperienceChapterMetadata | undefined {
  return experienceChapters.find((chapter) => chapter.id === chapterId);
}
