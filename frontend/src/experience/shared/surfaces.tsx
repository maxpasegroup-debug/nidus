/**
 * Surface primitives for NIDUS Experience V2.
 * These wrappers express paper, glass, solid, editorial, and immersive treatments.
 */
import type { HTMLAttributes } from "react";
import { cn } from "@/components/design-system/utils";
import type { ExperienceSurfaceKind, WithChildren } from "../types";

const surfaceClasses: Record<ExperienceSurfaceKind, string> = {
  paper: "border border-[#071d36]/10 bg-[#fbf8f1] shadow-[0_10px_28px_rgba(7,29,54,0.06)]",
  glass: "border border-white/48 bg-white/68 shadow-[0_28px_90px_rgba(7,29,54,0.12)] backdrop-blur-2xl",
  solid: "border border-[#071d36]/10 bg-white shadow-[0_18px_54px_rgba(7,29,54,0.10)]",
  image: "overflow-hidden border border-[#071d36]/10 bg-[#071d36]",
  editorial: "border border-[#071d36]/10 bg-white shadow-sm",
  immersive: "border border-white/12 bg-[#071d36] text-white shadow-[0_36px_110px_rgba(7,29,54,0.22)]",
  minimal: "bg-transparent"
};

/**
 * Wraps content in an approved cinematic surface treatment.
 */
export function ExperienceSurface({ children, className, surface = "solid", ...props }: WithChildren & HTMLAttributes<HTMLDivElement> & { surface?: ExperienceSurfaceKind }) {
  return <div {...props} className={cn("rounded-[1.5rem]", surfaceClasses[surface], className)}>{children}</div>;
}

/**
 * Wraps content in the approved glass treatment for atmospheric overlays.
 */
export function GlassWrapper(props: Omit<Parameters<typeof ExperienceSurface>[0], "surface">) {
  return <ExperienceSurface {...props} surface="glass" />;
}

/**
 * Wraps content in the approved paper treatment for planning and trust moments.
 */
export function PaperWrapper(props: Omit<Parameters<typeof ExperienceSurface>[0], "surface">) {
  return <ExperienceSurface {...props} surface="paper" />;
}
