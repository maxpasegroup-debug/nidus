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
  primary: "border-gold bg-gold text-navy shadow-[0_14px_34px_rgba(201,166,70,0.24)] hover:bg-gold-soft",
  secondary: "border-gold/35 bg-transparent text-gold hover:border-gold hover:bg-gold/10"
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
