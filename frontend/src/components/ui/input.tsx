import type { InputHTMLAttributes } from "react";

type InputProps = {
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={inputId} className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        id={inputId}
        className={`mt-2 h-12 w-full rounded border border-white/12 bg-white/6 px-4 text-sm text-white outline-none transition placeholder:text-muted/60 focus:border-gold focus:bg-white/10 focus:ring-2 focus:ring-gold/20 ${className}`}
        {...props}
      />
      {error ? <span className="mt-2 block text-xs text-red-200">{error}</span> : null}
    </label>
  );
}

