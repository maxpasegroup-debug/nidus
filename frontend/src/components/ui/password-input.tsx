"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  label: string;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ label, error, id, className = "", ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={inputId} className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="relative mt-2 block">
        <input
          id={inputId}
          type={isVisible ? "text" : "password"}
          className={`h-12 w-full rounded border border-[#071d36]/15 bg-white px-4 pr-12 text-sm text-[#071d36] outline-none transition placeholder:text-[#64748b] focus:border-[#b9913f] focus:bg-white focus:ring-2 focus:ring-[#b9913f]/20 ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        <button
          type="button"
          aria-label={isVisible ? "Hide secret text" : "Reveal secret text"}
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[#40516a] transition hover:bg-[#f4f1e8] hover:text-[#071d36] focus:outline-none focus:ring-2 focus:ring-[#b9913f]/25"
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      {error ? <span id={`${inputId}-error`} className="mt-2 block text-xs text-red-200">{error}</span> : null}
    </label>
  );
}
