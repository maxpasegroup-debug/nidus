/**
 * Cinematic layout primitives for NIDUS Experience V2.
 * These containers define the only approved layout widths and scene wrappers.
 */
import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/components/design-system/utils";
import { experienceTokens } from "../design-system";
import type { ExperienceContainerSize, ExperienceSceneLength, ExperienceSceneMode, WithChildren } from "../types";

const containerSizeClasses: Record<ExperienceContainerSize, string> = {
  reading: "max-w-[46rem]",
  content: "max-w-[76rem]",
  visual: "max-w-[96rem]",
  full: "max-w-none"
};

const sceneLengthMinHeights: Record<ExperienceSceneLength, string> = {
  short: "min-h-[min(72vh,42rem)]",
  medium: "min-h-[min(110vh,64rem)]",
  long: "min-h-[min(150vh,88rem)]",
  extraLong: "min-h-[min(210vh,130rem)]"
};

const sceneModeClasses: Record<ExperienceSceneMode, string> = {
  normal: "relative",
  sticky: "relative",
  pinned: "relative",
  layered: "relative overflow-hidden",
  split: "relative",
  parallax: "relative overflow-hidden",
  immersive: "relative overflow-hidden"
};

type SceneContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  length?: ExperienceSceneLength;
  mode?: ExperienceSceneMode;
};

/**
 * Frames a complete cinematic scene with approved length and behavior metadata.
 */
export const SceneContainer = forwardRef<HTMLElement, SceneContainerProps>(function SceneContainer({ as: Component = "section", className, length = "medium", mode = "normal", style, ...props }, ref) {
  const sceneStyle = {
    "--experience-scene-spacing": experienceTokens.sceneSpacing[length],
    ...style
  } as CSSProperties;

  return <Component {...props} ref={ref} data-experience-scene-mode={mode} style={sceneStyle} className={cn("px-4 py-24 text-[#071d36] sm:px-6 lg:px-8", sceneLengthMinHeights[length], sceneModeClasses[mode], className)} />;
});

type ContainerProps = WithChildren & HTMLAttributes<HTMLDivElement> & {
  size?: ExperienceContainerSize;
};

/**
 * Constrains content to an approved reading, content, visual, or full width.
 */
export function ExperienceContainer({ children, className, size = "content", ...props }: ContainerProps) {
  return <div {...props} className={cn("mx-auto w-full", containerSizeClasses[size], className)}>{children}</div>;
}

/**
 * Provides the approved narrow width for calm reading and parent-facing copy.
 */
export function ReadingContainer(props: Omit<ContainerProps, "size">) {
  return <ExperienceContainer {...props} size="reading" />;
}

/**
 * Provides the approved structured width for cards, journeys, and proof content.
 */
export function ContentContainer(props: Omit<ContainerProps, "size">) {
  return <ExperienceContainer {...props} size="content" />;
}

/**
 * Provides the approved broad width for cinematic visuals and gallery frames.
 */
export function VisualContainer(props: Omit<ContainerProps, "size">) {
  return <ExperienceContainer {...props} size="visual" />;
}

/**
 * Adds consistent breathing room between major story beats.
 */
export function SectionSpacer({ className, size = "scene" }: { className?: string; size?: keyof typeof experienceTokens.spacing }) {
  return <div aria-hidden="true" className={className} style={{ height: experienceTokens.spacing[size] }} />;
}

/**
 * Applies edge-safe spacing for cinematic scenes across device sizes.
 */
export function SafeArea({ children, className, ...props }: WithChildren & HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
