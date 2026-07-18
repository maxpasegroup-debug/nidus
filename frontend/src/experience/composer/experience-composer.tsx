"use client";

/**
 * Manifest-driven composer for NIDUS Experience V2.
 * It renders chapters and scenes in manifest order while keeping scene components isolated.
 */
import { Fragment, useMemo } from "react";
import { Chapter } from "../chapters";
import { experienceManifest } from "../manifest";
import { ExperienceErrorBoundary, logExperienceWarning, validateExperienceManifest } from "../runtime";
import type { ExperienceManifest } from "../types";
import { experienceSceneRegistry, getExperienceSceneComponent } from "./scene-registry";

type ExperienceComposerProps = {
  manifest?: ExperienceManifest;
};

/**
 * Renders the complete cinematic journey from declarative manifest metadata.
 */
export function ExperienceComposer({ manifest = experienceManifest }: ExperienceComposerProps) {
  const validation = useMemo(() => validateExperienceManifest(manifest, experienceSceneRegistry), [manifest]);
  const orderedChapters = useMemo(() => [...(manifest?.chapters ?? [])].sort((a, b) => a.order - b.order), [manifest]);
  const sceneById = useMemo(() => new Map((manifest?.scenes ?? []).map((scene) => [scene.id, scene])), [manifest]);

  if (!validation.isValid) {
    logExperienceWarning("manifest-validation", "Experience manifest has recoverable validation issues.", validation.issues);
  }

  return (
    <>
      {orderedChapters.map((chapter) => {
        const chapterScenes = chapter.sceneIds
          .map((sceneId) => sceneById.get(sceneId))
          .filter((scene): scene is NonNullable<typeof scene> => Boolean(scene))
          .sort((a, b) => a.order - b.order);

        return (
          <ExperienceErrorBoundary key={chapter.id} boundaryId={`chapter:${chapter.id}`}>
            <Chapter metadata={chapter}>
              {chapterScenes.map((scene) => {
                const SceneComponent = getExperienceSceneComponent(scene.id);
                if (!SceneComponent) {
                  logExperienceWarning(`missing-scene:${scene.id}`, `Scene ${scene.id} is missing from registry and was skipped.`);
                  return null;
                }
                return (
                  <Fragment key={scene.id}>
                    <ExperienceErrorBoundary boundaryId={`scene:${scene.id}`}>
                      <SceneComponent />
                    </ExperienceErrorBoundary>
                  </Fragment>
                );
              })}
            </Chapter>
          </ExperienceErrorBoundary>
        );
      })}
    </>
  );
}
