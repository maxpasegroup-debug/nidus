/**
 * Content primitives for proof, quotes, labels, and visual separators.
 */
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/design-system/utils";
import { ExperienceText } from "./typography";

/**
 * Renders a quiet divider for editorial rhythm.
 */
export function ExperienceDivider({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} role="separator" className={cn("h-px w-full bg-[#071d36]/10", className)} />;
}

/**
 * Renders a quote with restrained witness-style hierarchy.
 */
export function QuoteBlock({ quote, source, className }: { quote: ReactNode; source?: ReactNode; className?: string }) {
  return (
    <figure className={cn("rounded-[1.5rem] border border-[#071d36]/10 bg-white p-6 shadow-sm", className)}>
      <blockquote><ExperienceText variant="lead" tone="primary">{quote}</ExperienceText></blockquote>
      {source ? <figcaption className="mt-5"><ExperienceText variant="caption" tone="muted">{source}</ExperienceText></figcaption> : null}
    </figure>
  );
}

/**
 * Renders a statistic with evidence-first hierarchy.
 */
export function StatisticBlock({ label, value, description, className }: { label: ReactNode; value: ReactNode; description?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[1.25rem] border border-[#071d36]/10 bg-white p-5", className)}>
      <ExperienceText variant="label" tone="ceremonial">{label}</ExperienceText>
      <ExperienceText as="p" variant="section" className="mt-3">{value}</ExperienceText>
      {description ? <ExperienceText variant="bodySmall" tone="secondary" className="mt-2">{description}</ExperienceText> : null}
    </div>
  );
}
