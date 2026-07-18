"use client";

/**
 * Manifest-driven composer for NIDUS Experience V2.
 * It renders chapters and scenes in manifest order while keeping scene components isolated.
 */
import { Fragment, useMemo } from "react";
import { Chapter } from "../chapters";
import { experienceManifest } from "../manifest";
import type { ExperienceManifest } from "../types";
import { getExperienceSceneComponent } from "./scene-registry";

type ExperienceComposerProps = {
  manifest?: ExperienceManifest;
};

/**
 * Renders the complete cinematic journey from declarative manifest metadata.
 */
export function ExperienceComposer({ manifest = experienceManifest }: ExperienceComposerProps) {
  const orderedChapters = useMemo(() => [...manifest.chapters].sort((a, b) => a.order - b.order), [manifest.chapters]);
  const sceneById = useMemo(() => new Map(manifest.scenes.map((scene) => [scene.id, scene])), [manifest.scenes]);

  return (
    <>
      {orderedChapters.map((chapter) => {
        const chapterScenes = chapter.sceneIds
          .map((sceneId) => sceneById.get(sceneId))
          .filter((scene): scene is NonNullable<typeof scene> => Boolean(scene))
          .sort((a, b) => a.order - b.order);

        return (
          <Chapter key={chapter.id} metadata={chapter}>
            {chapterScenes.map((scene) => {
              const SceneComponent = getExperienceSceneComponent(scene.id);
              return SceneComponent ? (
                <Fragment key={scene.id}>
                  <SceneComponent />
                </Fragment>
              ) : null;
            })}
          </Chapter>
        );
      })}
    </>
  );
}
