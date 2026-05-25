import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseClasses =
  "inline-flex items-center justify-center rounded border font-semibold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "border-[#071d36] bg-[#071d36] text-white shadow-[0_14px_34px_rgba(7,29,54,0.16)] hover:bg-[#0d2a4b]",
  secondary: "border-[#071d36]/18 bg-white/70 text-[#071d36] hover:border-[#b9913f]/60 hover:bg-white"
};

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-sm"
};

export function Button(props: ButtonProps) {
  const { children, className = "", href, size = "md", variant = "primary", ...rest } = props;
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button {...rest} className={classes}>
      {children}
    </button>
  );
}
