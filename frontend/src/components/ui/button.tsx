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
  "inline-flex items-center justify-center gap-2 rounded-xl border font-bold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-[#f7f3ea] disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] text-[#071d36] shadow-[0_14px_34px_rgba(185,145,63,0.24)] hover:brightness-105",
  secondary: "border-[#071d36]/14 bg-white/82 text-[#071d36] shadow-sm hover:border-[#b9913f]/60 hover:bg-white hover:shadow-md"
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
