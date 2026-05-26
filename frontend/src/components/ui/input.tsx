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
        className={`mt-2 h-12 w-full rounded border border-[#071d36]/15 bg-white px-4 text-sm text-[#071d36] outline-none transition placeholder:text-[#64748b] focus:border-[#b9913f] focus:bg-white focus:ring-2 focus:ring-[#b9913f]/20 ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? <span id={`${inputId}-error`} className="mt-2 block text-xs text-red-200">{error}</span> : null}
    </label>
  );
}
