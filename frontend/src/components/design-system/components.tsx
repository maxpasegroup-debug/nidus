"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Info,
  Loader2,
  Search,
  X
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";
import { cn, makeId } from "./utils";

type Tone = "default" | "success" | "warning" | "danger" | "info";
type Size = "sm" | "md" | "lg";

const toneClasses: Record<Tone, string> = {
  default: "border-[var(--ds-color-border)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-text)]",
  success: "border-[color-mix(in_srgb,var(--ds-color-success)_30%,transparent)] bg-[color-mix(in_srgb,var(--ds-color-success)_12%,transparent)] text-[var(--ds-color-success-strong)]",
  warning: "border-[color-mix(in_srgb,var(--ds-color-warning)_36%,transparent)] bg-[color-mix(in_srgb,var(--ds-color-warning)_14%,transparent)] text-[var(--ds-color-warning-strong)]",
  danger: "border-[color-mix(in_srgb,var(--ds-color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--ds-color-danger)_12%,transparent)] text-[var(--ds-color-danger-strong)]",
  info: "border-[color-mix(in_srgb,var(--ds-color-info)_30%,transparent)] bg-[color-mix(in_srgb,var(--ds-color-info)_12%,transparent)] text-[var(--ds-color-info-strong)]"
};

export type ButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  loading?: boolean;
  size?: Size;
  variant?: "primary" | "secondary" | "ghost" | "danger";
} & ButtonHTMLAttributes<HTMLButtonElement>;

const buttonVariants = {
  primary: "border-[var(--ds-color-primary)] bg-[var(--ds-color-primary)] text-[var(--ds-color-primary-foreground)] shadow-[var(--ds-shadow-soft)] hover:bg-[var(--ds-color-primary-hover)]",
  secondary: "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-text)] shadow-sm hover:border-[var(--ds-color-border-strong)] hover:bg-[var(--ds-color-surface-raised)]",
  ghost: "border-transparent bg-transparent text-[var(--ds-color-text)] hover:bg-[var(--ds-color-muted-soft)]",
  danger: "border-[var(--ds-color-danger)] bg-[var(--ds-color-danger)] text-white shadow-[var(--ds-shadow-soft)] hover:bg-[var(--ds-color-danger-strong)]"
};

const buttonSizes = {
  sm: "min-h-9 rounded-[var(--ds-radius-medium)] px-3 text-sm",
  md: "min-h-10 rounded-[var(--ds-radius-large)] px-4 text-sm",
  lg: "min-h-12 rounded-[var(--ds-radius-large)] px-5 text-base"
};

export function Button({ children, className, disabled, href, icon, iconAfter, loading, size = "md", type = "button", variant = "primary", ...props }: ButtonProps) {
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      <span>{children}</span>
      {iconAfter}
    </>
  );
  const classes = cn(
    "ds-motion-interactive inline-flex items-center justify-center gap-2 border font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-background)] disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled || loading ? true : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button {...props} disabled={disabled || loading} type={type} className={classes}>
      {content}
    </button>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-soft)]", className)} />;
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={cn("rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-raised)] p-5 shadow-[var(--ds-shadow-medium)]", className)} />;
}

export function MetricCard({ label, value, delta, tone = "default", className }: { label: string; value: ReactNode; delta?: ReactNode; tone?: Tone; className?: string }) {
  return (
    <Card className={cn("p-4", className)}>
      <p className="ds-text-label text-[var(--ds-color-muted)]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-black tracking-normal text-[var(--ds-color-text)]">{value}</p>
        {delta ? <StatusChip tone={tone}>{delta}</StatusChip> : null}
      </div>
    </Card>
  );
}

export function StatCard({ label, value, description, icon, className }: { label: string; value: ReactNode; description?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ds-text-label text-[var(--ds-color-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[var(--ds-color-text)]">{value}</p>
        </div>
        {icon ? <span className="grid h-10 w-10 place-items-center rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">{icon}</span> : null}
      </div>
      {description ? <p className="mt-3 text-sm leading-6 text-[var(--ds-color-muted)]">{description}</p> : null}
    </Card>
  );
}

export function Badge({ children, tone = "default", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex min-h-7 items-center rounded-[var(--ds-radius-full)] border px-2.5 text-xs font-bold", toneClasses[tone], className)}>{children}</span>;
}

export function StatusChip({ children, tone = "default", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <Badge tone={tone} className={cn("gap-1.5", className)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{children}</Badge>;
}

function FieldLabel({ children, htmlFor, required }: { children?: ReactNode; htmlFor?: string; required?: boolean }) {
  if (!children) return null;
  return (
    <label htmlFor={htmlFor} className="ds-text-label mb-2 block text-[var(--ds-color-text)]">
      {children}{required ? <span className="ml-1 text-[var(--ds-color-danger)]">*</span> : null}
    </label>
  );
}

function FieldMessage({ id, children, tone = "default" }: { id: string; children?: ReactNode; tone?: "default" | "danger" }) {
  if (!children) return null;
  return <p id={id} className={cn("mt-2 text-sm", tone === "danger" ? "text-[var(--ds-color-danger-strong)]" : "text-[var(--ds-color-muted)]")}>{children}</p>;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; error?: ReactNode; hint?: ReactNode };

export function Input({ className, error, hint, id, label, required, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  return (
    <div>
      <FieldLabel htmlFor={inputId} required={required}>{label}</FieldLabel>
      <input
        {...props}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={cn("min-h-10 w-full rounded-[var(--ds-radius-medium)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-3 text-sm text-[var(--ds-color-text)] outline-none placeholder:text-[var(--ds-color-muted)] focus:border-[var(--ds-color-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ds-color-focus)_24%,transparent)]", className)}
      />
      <FieldMessage id={descriptionId} tone={error ? "danger" : "default"}>{error ?? hint}</FieldMessage>
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: ReactNode; error?: ReactNode; hint?: ReactNode };

export function Textarea({ className, error, hint, id, label, required, ...props }: TextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  return (
    <div>
      <FieldLabel htmlFor={inputId} required={required}>{label}</FieldLabel>
      <textarea
        {...props}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={cn("min-h-28 w-full resize-y rounded-[var(--ds-radius-medium)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-3 py-2 text-sm text-[var(--ds-color-text)] outline-none placeholder:text-[var(--ds-color-muted)] focus:border-[var(--ds-color-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ds-color-focus)_24%,transparent)]", className)}
      />
      <FieldMessage id={descriptionId} tone={error ? "danger" : "default"}>{error ?? hint}</FieldMessage>
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: ReactNode; error?: ReactNode; hint?: ReactNode; options?: Array<{ label: string; value: string }> };

export function Select({ children, className, error, hint, id, label, options, required, ...props }: SelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  return (
    <div>
      <FieldLabel htmlFor={inputId} required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          {...props}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error || hint ? descriptionId : undefined}
          className={cn("min-h-10 w-full appearance-none rounded-[var(--ds-radius-medium)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-3 pr-9 text-sm text-[var(--ds-color-text)] outline-none focus:border-[var(--ds-color-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ds-color-focus)_24%,transparent)]", className)}
        >
          {options ? options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>) : children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ds-color-muted)]" aria-hidden="true" />
      </div>
      <FieldMessage id={descriptionId} tone={error ? "danger" : "default"}>{error ?? hint}</FieldMessage>
    </div>
  );
}

type CheckableProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode };

export function Checkbox({ className, description, label, ...props }: CheckableProps) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-[var(--ds-radius-medium)] p-1 text-sm text-[var(--ds-color-text)]", className)}>
      <input {...props} type="checkbox" className="mt-1 h-4 w-4 rounded border-[var(--ds-color-border)] accent-[var(--ds-color-primary)]" />
      <span><span className="font-semibold">{label}</span>{description ? <span className="mt-1 block text-[var(--ds-color-muted)]">{description}</span> : null}</span>
    </label>
  );
}

export function Radio({ className, description, label, ...props }: CheckableProps) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-[var(--ds-radius-medium)] p-1 text-sm text-[var(--ds-color-text)]", className)}>
      <input {...props} type="radio" className="mt-1 h-4 w-4 border-[var(--ds-color-border)] accent-[var(--ds-color-primary)]" />
      <span><span className="font-semibold">{label}</span>{description ? <span className="mt-1 block text-[var(--ds-color-muted)]">{description}</span> : null}</span>
    </label>
  );
}

export function Switch({ checked, className, label, onCheckedChange, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & { checked?: boolean; label?: ReactNode; onCheckedChange?: (checked: boolean) => void }) {
  const [internal, setInternal] = useState(Boolean(checked));
  const active = checked ?? internal;
  function toggle() {
    const next = !active;
    setInternal(next);
    onCheckedChange?.(next);
  }
  return (
    <button {...props} type="button" role="switch" aria-checked={active} onClick={toggle} className={cn("inline-flex items-center gap-3 text-sm font-semibold text-[var(--ds-color-text)]", className)}>
      <span className={cn("flex h-6 w-11 items-center rounded-full border p-0.5 transition-colors", active ? "border-[var(--ds-color-primary)] bg-[var(--ds-color-primary)]" : "border-[var(--ds-color-border)] bg-[var(--ds-color-muted-soft)]")}>
        <span className={cn("h-4 w-4 rounded-full bg-white shadow transition-transform", active ? "translate-x-5" : "translate-x-0")} />
      </span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}

const TabsContext = createContext<{ value: string; setValue: (value: string) => void } | null>(null);

export function Tabs({ children, defaultValue, value, onValueChange, className }: { children: ReactNode; defaultValue: string; value?: string; onValueChange?: (value: string) => void; className?: string }) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const context = useMemo(() => ({
    value: selected,
    setValue(next: string) {
      setInternal(next);
      onValueChange?.(next);
    }
  }), [onValueChange, selected]);
  return <TabsContext.Provider value={context}><div className={className}>{children}</div></TabsContext.Provider>;
}

export function TabList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} role="tablist" className={cn("inline-flex rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-muted-soft)] p-1", className)} />;
}

export function Tab({ children, value, className }: { children: ReactNode; value: string; className?: string }) {
  const context = useContext(TabsContext);
  const selected = context?.value === value;
  return (
    <button type="button" role="tab" aria-selected={selected} tabIndex={selected ? 0 : -1} onClick={() => context?.setValue(value)} className={cn("min-h-9 rounded-[var(--ds-radius-medium)] px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus)]", selected ? "bg-[var(--ds-color-surface)] text-[var(--ds-color-text)] shadow-sm" : "text-[var(--ds-color-muted)] hover:text-[var(--ds-color-text)]", className)}>
      {children}
    </button>
  );
}

export function TabPanel({ children, value, className }: { children: ReactNode; value: string; className?: string }) {
  const context = useContext(TabsContext);
  if (context?.value !== value) return null;
  return <div role="tabpanel" className={className}>{children}</div>;
}

export function Modal({ children, description, open, title, onClose }: { children: ReactNode; description?: ReactNode; open: boolean; title: ReactNode; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="ds-modal-title" aria-describedby={description ? "ds-modal-description" : undefined} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-5 shadow-[var(--ds-shadow-floating)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="ds-modal-title" className="ds-text-title text-[var(--ds-color-text)]">{title}</h2>
            {description ? <p id="ds-modal-description" className="mt-1 text-sm text-[var(--ds-color-muted)]">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-[var(--ds-radius-medium)] text-[var(--ds-color-muted)] hover:bg-[var(--ds-color-muted-soft)]" aria-label="Close dialog"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

export function Drawer({ children, open, title, side = "right", onClose }: { children: ReactNode; open: boolean; title: ReactNode; side?: "left" | "right"; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" onMouseDown={onClose}>
      <aside role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Drawer"} onMouseDown={(event) => event.stopPropagation()} className={cn("fixed top-0 h-full w-[min(28rem,100vw)] overflow-y-auto border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-5 shadow-[var(--ds-shadow-floating)]", side === "right" ? "right-0 border-l" : "left-0 border-r")}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="ds-text-title text-[var(--ds-color-text)]">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-[var(--ds-radius-medium)] text-[var(--ds-color-muted)] hover:bg-[var(--ds-color-muted-soft)]" aria-label="Close drawer"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5">{children}</div>
      </aside>
    </div>
  );
}

export function Avatar({ alt, fallback, src, size = "md", className }: { alt?: string; fallback?: string; src?: string; size?: Size; className?: string }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };
  const imageSizes = { sm: 32, md: 40, lg: 48 };
  return (
    <span className={cn("inline-grid place-items-center overflow-hidden rounded-full bg-[var(--ds-color-primary)] font-black text-[var(--ds-color-primary-foreground)]", sizes[size], className)}>
      {src ? <Image src={src} alt={alt ?? ""} width={imageSizes[size]} height={imageSizes[size]} className="h-full w-full object-cover" /> : fallback?.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function Progress({ value, max = 100, label, className }: { value: number; max?: number; label?: string; className?: string }) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className={className}>
      {label ? <div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-[var(--ds-color-text)]">{label}</span><span className="text-[var(--ds-color-muted)]">{percentage}%</span></div> : null}
      <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} className="h-2 overflow-hidden rounded-full bg-[var(--ds-color-muted-soft)]">
        <div className="h-full rounded-full bg-[var(--ds-color-primary)]" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function Timeline({ items, className }: { items: Array<{ title: ReactNode; description?: ReactNode; tone?: Tone; time?: ReactNode }>; className?: string }) {
  return (
    <ol className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <li key={index} className="grid grid-cols-[1rem_1fr] gap-3">
          <span className={cn("mt-1 h-3 w-3 rounded-full border", toneClasses[item.tone ?? "default"])} />
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-[var(--ds-color-text)]">{item.title}</p>
              {item.time ? <span className="text-xs text-[var(--ds-color-muted)]">{item.time}</span> : null}
            </div>
            {item.description ? <p className="mt-1 text-sm text-[var(--ds-color-muted)]">{item.description}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function SearchBox({ className, label = "Search", ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ds-color-muted)]" aria-hidden="true" />
      <input {...props} type="search" className="min-h-10 w-full rounded-[var(--ds-radius-large)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] pl-10 pr-3 text-sm text-[var(--ds-color-text)] outline-none placeholder:text-[var(--ds-color-muted)] focus:border-[var(--ds-color-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ds-color-focus)_24%,transparent)]" />
    </label>
  );
}

export function CommandBar({ children, className, label = "Command bar" }: { children: ReactNode; className?: string; label?: string }) {
  return <div role="toolbar" aria-label={label} className={cn("flex flex-wrap items-center gap-2 rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-2 shadow-[var(--ds-shadow-soft)]", className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions, className }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-4 py-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? <p className="ds-text-label text-[var(--ds-color-primary)]">{eyebrow}</p> : null}
        <h1 className="ds-text-display mt-1 text-[var(--ds-color-text)]">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ds-color-muted)] sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function WorkspaceHeader({ title, description, actions, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-[var(--ds-color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h2 className="ds-text-heading text-[var(--ds-color-text)]">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[var(--ds-color-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, description, actions, className }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? <p className="ds-text-label text-[var(--ds-color-primary)]">{eyebrow}</p> : null}
        <h3 className="ds-text-title text-[var(--ds-color-text)]">{title}</h3>
        {description ? <p className="mt-1 text-sm text-[var(--ds-color-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: ReactNode; description?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-[var(--ds-radius-xl)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-6 py-12 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--ds-color-muted-soft)] text-[var(--ds-color-primary)]">{icon ?? <Info className="h-5 w-5" aria-hidden="true" />}</div>
        <h3 className="ds-text-title mt-4 text-[var(--ds-color-text)]">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-[var(--ds-color-muted)]">{description}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return <div role="status" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ds-color-muted)]"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{label}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-muted-soft)]", className ?? "h-4 w-full")} />;
}

export function Toast({ children, tone = "info", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-[var(--ds-radius-large)] border px-4 py-3 text-sm shadow-[var(--ds-shadow-floating)]", toneClasses[tone], className)}>{children}</div>;
}

export function Tooltip({ children, content }: { children: ReactNode; content: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--ds-radius-medium)] bg-[var(--ds-color-text)] px-2 py-1 text-xs font-semibold text-[var(--ds-color-background)] shadow-[var(--ds-shadow-medium)] group-hover:block group-focus-within:block">
        {content}
      </span>
    </span>
  );
}

export function Divider({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) {
  return <div role="separator" aria-orientation={orientation} className={cn(orientation === "horizontal" ? "h-px w-full" : "h-full w-px", "bg-[var(--ds-color-border)]", className)} />;
}

export function Breadcrumb({ items, className }: { items: Array<{ label: ReactNode; href?: string }>; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--ds-color-muted)]">
        {items.map((item, index) => (
          <li key={`${index}-${typeof item.label === "string" ? item.label : "item"}`} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {item.href ? <Link href={item.href} className="font-semibold hover:text-[var(--ds-color-text)]">{item.label}</Link> : <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("ds-text-label text-[var(--ds-color-text)]", className)} />;
}

export function StepStatus({ complete }: { complete?: boolean }) {
  return complete ? <CheckCircle2 className="h-4 w-4 text-[var(--ds-color-success)]" aria-hidden="true" /> : <Circle className="h-4 w-4 text-[var(--ds-color-muted)]" aria-hidden="true" />;
}

export function CheckIcon() {
  return <Check className="h-4 w-4" aria-hidden="true" />;
}

export function fieldId(label: string) {
  return makeId(label);
}
