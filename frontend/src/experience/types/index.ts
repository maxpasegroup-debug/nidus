/**
 * Shared type contracts for the NIDUS Experience V2 foundation.
 * These types keep future cinematic scenes consistent without tying them to one implementation.
 */
import type { ReactNode } from "react";

export type ExperienceSceneMode = "normal" | "sticky" | "pinned" | "layered" | "split" | "parallax" | "immersive";

export type ExperienceSceneLength = "short" | "medium" | "long" | "extraLong";

export type ExperienceSurfaceKind = "paper" | "glass" | "solid" | "image" | "editorial" | "immersive" | "minimal";

export type ExperienceTone = "default" | "trust" | "ceremonial" | "recovery" | "success" | "warning" | "danger";

export type ExperienceTextStyle = "displayXXL" | "displayXL" | "hero" | "headline" | "section" | "lead" | "bodyLarge" | "body" | "bodySmall" | "caption" | "label" | "overline" | "micro";

export type ExperienceMotionName = "heroReveal" | "sectionReveal" | "fade" | "scale" | "parallax" | "pinnedScene" | "timelineReveal" | "imageReveal" | "buttonInteraction" | "cardInteraction" | "pageTransition" | "loading" | "success";

export type ExperienceContainerSize = "reading" | "content" | "visual" | "full";

export type SceneRegistration = {
  id: string;
  mode: ExperienceSceneMode;
  length: ExperienceSceneLength;
  element: HTMLElement | null;
};

export type SceneProgressSnapshot = {
  id: string;
  progress: number;
  isActive: boolean;
  bounds: DOMRectReadOnly | null;
};

export type ExperienceChapterMetadata = {
  id: string;
  title: string;
  description: string;
  sceneIds: string[];
  order: number;
};

export type ExperienceSceneMetadata = {
  id: string;
  title: string;
  chapterId: string;
  order: number;
  mode: ExperienceSceneMode;
  length: ExperienceSceneLength;
};

export type ExperienceManifest = {
  id: string;
  title: string;
  chapters: ExperienceChapterMetadata[];
  scenes: ExperienceSceneMetadata[];
};

export type WithChildren = {
  children: ReactNode;
  className?: string;
};
