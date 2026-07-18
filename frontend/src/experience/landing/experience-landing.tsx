"use client";

/**
 * Production landing experience for NIDUS Experience V2.
 * It wires the shell to the manifest-driven composer without hardcoding scene order.
 */
import { ExperienceComposer } from "../composer";
import { experienceManifest } from "../manifest";
import { ExperienceErrorBoundary } from "../runtime";
import { ExperienceShell } from "../shell";

const shellChapters = experienceManifest.chapters
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((chapter) => ({
    id: chapter.id,
    label: chapter.title
  }));

const shellScenes = experienceManifest.scenes
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((scene) => ({
    id: scene.id,
    label: scene.title
  }));

const navigationItems = experienceManifest.chapters
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((chapter) => ({
    id: chapter.id,
    label: chapter.title,
    href: `#${chapter.id}`
  }));

/**
 * Renders the complete public cinematic landing page.
 */
export function ExperienceLanding() {
  return (
    <ExperienceErrorBoundary boundaryId="experience-landing">
      <ExperienceShell
        background={{ mode: "atmospheric", tone: "navy" }}
        chapters={shellChapters}
        navigationItems={navigationItems}
        overlays={["noise", "paperGrain"]}
        scenes={shellScenes}
      >
        <ExperienceComposer manifest={experienceManifest} />
      </ExperienceShell>
    </ExperienceErrorBoundary>
  );
}
