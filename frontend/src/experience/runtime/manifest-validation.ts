"use client";

/**
 * Manifest validation for NIDUS Experience V2.
 * Invalid entries are reported once and skipped instead of crashing the homepage.
 */
import type { ExperienceManifest } from "../types";
import type { ExperienceSceneComponent } from "../composer/scene-registry";

export type ManifestValidationIssue = {
  code: string;
  message: string;
};

export type ManifestValidationResult = {
  isValid: boolean;
  issues: ManifestValidationIssue[];
};

export function validateExperienceManifest(manifest: ExperienceManifest | null | undefined, registry: Record<string, ExperienceSceneComponent>): ManifestValidationResult {
  const issues: ManifestValidationIssue[] = [];
  if (!manifest) {
    return { isValid: false, issues: [{ code: "manifest_missing", message: "Experience manifest is missing." }] };
  }

  const chapterIds = new Set<string>();
  const sceneIds = new Set<string>();
  const registryIds = new Set(Object.keys(registry));

  for (const chapter of manifest.chapters ?? []) {
    if (chapterIds.has(chapter.id)) issues.push({ code: "duplicate_chapter", message: `Duplicate chapter id: ${chapter.id}` });
    chapterIds.add(chapter.id);
    if (!Number.isFinite(chapter.order)) issues.push({ code: "invalid_chapter_order", message: `Invalid chapter order: ${chapter.id}` });
  }

  for (const scene of manifest.scenes ?? []) {
    if (sceneIds.has(scene.id)) issues.push({ code: "duplicate_scene", message: `Duplicate scene id: ${scene.id}` });
    sceneIds.add(scene.id);
    if (!chapterIds.has(scene.chapterId)) issues.push({ code: "invalid_scene_chapter", message: `Scene ${scene.id} references missing chapter ${scene.chapterId}` });
    if (!Number.isFinite(scene.order)) issues.push({ code: "invalid_scene_order", message: `Invalid scene order: ${scene.id}` });
    if (!registryIds.has(scene.id)) issues.push({ code: "missing_registry_entry", message: `Scene ${scene.id} is missing from the scene registry.` });
  }

  for (const chapter of manifest.chapters ?? []) {
    for (const sceneId of chapter.sceneIds ?? []) {
      if (!sceneIds.has(sceneId)) issues.push({ code: "missing_scene_metadata", message: `Chapter ${chapter.id} references missing scene ${sceneId}` });
    }
  }

  return { isValid: issues.length === 0, issues };
}
