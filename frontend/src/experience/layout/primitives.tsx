/**
 * Reusable composition primitives for NIDUS Experience V2.
 * These primitives keep future scene layout rhythm consistent.
 */
import type { HTMLAttributes } from "react";
import { cn } from "@/components/design-system/utils";
import type { WithChildren } from "../types";

type Gap = "tiny" | "small" | "medium" | "large" | "xl" | "xxl";

const gapClasses: Record<Gap, string> = {
  tiny: "gap-1",
  small: "gap-2",
  medium: "gap-4",
  large: "gap-6",
  xl: "gap-10",
  xxl: "gap-16"
};

/**
 * Creates a vertical content rhythm with approved spacing.
 */
export function Stack({ children, className, gap = "medium", ...props }: WithChildren & HTMLAttributes<HTMLDivElement> & { gap?: Gap }) {
  return <div {...props} className={cn("flex flex-col", gapClasses[gap], className)}>{children}</div>;
}

/**
 * Creates a horizontal wrapping cluster for actions and compact metadata.
 */
export function Cluster({ children, className, gap = "medium", ...props }: WithChildren & HTMLAttributes<HTMLDivElement> & { gap?: Gap }) {
  return <div {...props} className={cn("flex flex-wrap items-center", gapClasses[gap], className)}>{children}</div>;
}

/**
 * Creates an approved responsive grid for content groups.
 */
export function Grid({ children, className, columns = "three", gap = "medium", ...props }: WithChildren & HTMLAttributes<HTMLDivElement> & { columns?: "two" | "three" | "four"; gap?: Gap }) {
  const columnClass = {
    two: "md:grid-cols-2",
    three: "md:grid-cols-3",
    four: "md:grid-cols-2 xl:grid-cols-4"
  }[columns];

  return <div {...props} className={cn("grid", columnClass, gapClasses[gap], className)}>{children}</div>;
}

/**
 * Creates a controlled split composition for image-and-story scenes.
 */
export function Split({ children, className, reverse = false, ...props }: WithChildren & HTMLAttributes<HTMLDivElement> & { reverse?: boolean }) {
  return <div {...props} className={cn("grid gap-10 lg:grid-cols-2 lg:items-center", reverse ? "lg:[&>*:first-child]:order-2" : "", className)}>{children}</div>;
}
