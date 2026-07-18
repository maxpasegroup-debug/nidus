/**
 * Type contracts for the NIDUS Experience V2 shell.
 * These keep navigation, backgrounds, overlays, and progress layers consistent.
 */
import type { ReactNode } from "react";

export type ExperienceNavigationItem = {
  id: string;
  label: string;
  href: string;
};

export type ExperienceChapter = {
  id: string;
  label: string;
};

export type ExperienceSceneIndicator = {
  id: string;
  label: string;
};

export type ExperienceBackgroundMode = "static" | "gradient" | "image" | "atmospheric";

export type ExperienceBackgroundState = {
  mode: ExperienceBackgroundMode;
  imageUrl?: string;
  tone?: "dawn" | "ivory" | "navy" | "gold" | "steel";
};

export type ExperienceOverlayKind = "noise" | "paperGrain" | "light" | "fog" | "gradient" | "colorWash";

export type ExperienceShellProps = {
  children: ReactNode;
  navigationItems?: ExperienceNavigationItem[];
  chapters?: ExperienceChapter[];
  scenes?: ExperienceSceneIndicator[];
  background?: ExperienceBackgroundState;
  overlays?: ExperienceOverlayKind[];
  debug?: boolean;
};
