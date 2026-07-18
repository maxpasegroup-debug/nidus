/**
 * Media wrappers for NIDUS Experience V2.
 * These primitives enforce cinematic crops and accessible media defaults.
 */
import Image, { type ImageProps } from "next/image";
import type { VideoHTMLAttributes } from "react";
import { cn } from "@/components/design-system/utils";

type ExperienceImageProps = ImageProps & {
  frame?: "hero" | "portrait" | "landscape" | "square" | "panoramic";
  imageClassName?: string;
};

const frameClasses = {
  hero: "aspect-[16/10]",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[16/9]",
  square: "aspect-square",
  panoramic: "aspect-[21/9]"
};

/**
 * Renders an optimized image inside an approved cinematic frame.
 */
export function ExperienceImage({ className, frame = "landscape", imageClassName, sizes = "(min-width: 1024px) 50vw, 100vw", ...props }: ExperienceImageProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-[1.75rem] border border-[#071d36]/10 bg-[#071d36]", frameClasses[frame], className)}>
      <Image {...props} fill sizes={sizes} className={cn("object-cover", imageClassName)} />
    </div>
  );
}

/**
 * Renders video with NIDUS-approved defaults for cinematic scenes.
 */
export function ExperienceVideo({ className, muted = true, playsInline = true, preload = "metadata", ...props }: VideoHTMLAttributes<HTMLVideoElement>) {
  return <video {...props} muted={muted} playsInline={playsInline} preload={preload} className={cn("block w-full rounded-[1.75rem] object-cover", className)} />;
}
