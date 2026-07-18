/**
 * Typography primitives for NIDUS Experience V2.
 * These map approved text roles to repeatable visual treatments.
 */
import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/components/design-system/utils";
import type { ExperienceTextStyle } from "../types";

const textClasses: Record<ExperienceTextStyle, string> = {
  displayXXL: "text-[clamp(4.75rem,10vw,9.5rem)] font-black leading-[0.98] tracking-normal",
  displayXL: "text-[clamp(3.75rem,7vw,7rem)] font-black leading-[1.02] tracking-normal",
  hero: "text-[clamp(3rem,5.8vw,6rem)] font-black leading-[1.04] tracking-normal",
  headline: "text-[clamp(2.5rem,4.6vw,4.75rem)] font-black leading-[1.08] tracking-normal",
  section: "text-[clamp(2rem,3.4vw,3.5rem)] font-black leading-[1.12] tracking-normal",
  lead: "text-[clamp(1.125rem,1.8vw,1.5rem)] font-semibold leading-[1.65]",
  bodyLarge: "text-lg leading-8",
  body: "text-base leading-7",
  bodySmall: "text-sm leading-6",
  caption: "text-[0.8125rem] leading-5",
  label: "text-xs font-black uppercase tracking-[0.28em]",
  overline: "text-xs font-black uppercase tracking-[0.32em]",
  micro: "text-[0.6875rem] leading-4"
};

type TypographyProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant?: ExperienceTextStyle;
  tone?: "primary" | "secondary" | "muted" | "inverse" | "ceremonial";
};

const toneClasses = {
  primary: "text-[#071d36]",
  secondary: "text-[#40516a]",
  muted: "text-[#64748b]",
  inverse: "text-white",
  ceremonial: "text-[#8a6426]"
};

/**
 * Renders semantic text with approved NIDUS Experience typography roles.
 */
export function ExperienceText({ as: Component = "p", className, tone = "primary", variant = "body", ...props }: TypographyProps) {
  const TextElement = Component as "p";
  return <TextElement {...props} className={cn(textClasses[variant], toneClasses[tone], className)} />;
}

/**
 * Renders the approved overline treatment for cinematic scene labels.
 */
export function Overline(props: Omit<TypographyProps, "variant" | "as">) {
  return <ExperienceText {...props} as="p" variant="overline" />;
}

/**
 * Renders the approved label treatment for small command-style text.
 */
export function LabelText(props: Omit<TypographyProps, "variant" | "as">) {
  return <ExperienceText {...props} as="span" variant="label" />;
}
