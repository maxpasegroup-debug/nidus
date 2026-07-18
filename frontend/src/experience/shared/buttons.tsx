/**
 * Button primitives for NIDUS Experience V2.
 * These encode the approved decision language without scene-specific content.
 */
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/design-system/utils";

type ExperienceButtonVariant = "primary" | "secondary" | "ghost" | "text" | "danger" | "success";
type ExperienceButtonSize = "sm" | "md" | "lg";

type BaseButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  loading?: boolean;
  size?: ExperienceButtonSize;
  variant?: ExperienceButtonVariant;
};

type ExperienceButtonProps = BaseButtonProps & ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>;

const variantClasses: Record<ExperienceButtonVariant, string> = {
  primary: "border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] text-[#071d36] shadow-[0_18px_46px_rgba(185,145,63,0.24)] hover:brightness-105",
  secondary: "border border-[#071d36]/14 bg-white/82 text-[#071d36] shadow-[0_12px_30px_rgba(7,29,54,0.08)] hover:border-[#b9913f]/55",
  ghost: "border border-transparent bg-transparent text-[#071d36] hover:bg-white/60",
  text: "border border-transparent bg-transparent px-0 text-[#071d36] hover:text-[#8a6426]",
  danger: "border border-red-900/20 bg-red-900 text-white shadow-[0_18px_46px_rgba(127,29,29,0.18)]",
  success: "border border-emerald-900/20 bg-emerald-800 text-white shadow-[0_18px_46px_rgba(6,95,70,0.18)]"
};

const sizeClasses: Record<ExperienceButtonSize, string> = {
  sm: "min-h-10 rounded-full px-4 py-2 text-sm",
  md: "min-h-12 rounded-full px-5 py-3 text-sm",
  lg: "min-h-14 rounded-full px-6 py-4 text-base"
};

/**
 * Renders a cinematic decision control as a link or button.
 */
export function ExperienceButton({ children, className, disabled, href, icon, iconAfter, loading, size = "md", type = "button", variant = "primary", ...props }: ExperienceButtonProps) {
  const classes = cn("inline-flex items-center justify-center gap-2 font-black outline-none transition will-change-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#b9913f]/45 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45", variantClasses[variant], sizeClasses[size], className);
  const content = <>{icon}{children}{loading ? <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-current" /> : iconAfter}</>;

  if (href) {
    return <Link href={href} className={classes} aria-disabled={disabled || loading ? true : undefined}>{content}</Link>;
  }

  return <button {...props} disabled={disabled || loading} type={type} className={classes}>{content}</button>;
}
