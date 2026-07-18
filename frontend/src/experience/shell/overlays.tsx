"use client";

/**
 * Reusable atmospheric overlays for the NIDUS Experience V2 shell.
 * Overlays are mounted only after hydration to keep the initial shell lightweight.
 */
import { useEffect, useState } from "react";
import { cn } from "@/components/design-system/utils";
import type { ExperienceOverlayKind } from "./types";

const overlayClasses: Record<ExperienceOverlayKind, string> = {
  noise: "opacity-[0.035] [background-image:radial-gradient(#071d36_0.65px,transparent_0.65px)] [background-size:4px_4px]",
  paperGrain: "opacity-[0.06] [background-image:linear-gradient(90deg,rgba(7,29,54,0.06)_1px,transparent_1px),linear-gradient(rgba(7,29,54,0.04)_1px,transparent_1px)] [background-size:44px_44px]",
  light: "opacity-60 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.44),transparent_34rem)]",
  fog: "opacity-50 bg-[radial-gradient(circle_at_18%_70%,rgba(220,233,243,0.38),transparent_30rem)]",
  gradient: "opacity-80 bg-[linear-gradient(180deg,rgba(251,248,241,0.18)_0%,transparent_24%,rgba(247,243,234,0.32)_100%)]",
  colorWash: "opacity-35 bg-[radial-gradient(circle_at_82%_12%,rgba(185,145,63,0.18),transparent_28rem)]"
};

/**
 * Renders optional global atmosphere overlays without blocking interaction.
 */
export function ExperienceOverlayLayer({ overlays = [] }: { overlays?: ExperienceOverlayKind[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || overlays.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
      {overlays.map((overlay) => <div key={overlay} className={cn("absolute inset-0", overlayClasses[overlay])} />)}
    </div>
  );
}
