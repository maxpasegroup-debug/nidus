import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Plus, ShieldCheck } from "lucide-react";
import { BrandGlassMark } from "@/components/brand/brand-glass-mark";

export function AcademicShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6 lg:h-[calc(100vh-var(--nav-height)-2rem)] lg:min-h-0 lg:overflow-hidden">
      <section className="mx-auto flex h-full max-w-[1500px] flex-col gap-4 overflow-x-hidden overflow-y-auto pr-0 lg:pr-2">{children}</section>
    </main>
  );
}

export function AcademicHero({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="shrink-0 rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm md:p-5">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:items-center">
        <BrandGlassMark compact />
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">{description}</p>
          </div>
          {action}
        </div>
      </div>
    </section>
  );
}

export function Panel({ id, title, eyebrow, children }: { id?: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="min-h-0 rounded-2xl border border-[var(--border)] bg-white/95 p-3 shadow-sm sm:p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black text-[var(--navy)]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 px-3 py-2.5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-0.5 text-xl font-black text-[var(--gold)]">{value}</p>
    </div>
  );
}

export function AcademicCard({
  title,
  eyebrow,
  description,
  icon: Icon,
  status,
  children,
  action,
  selected,
}: {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  icon: LucideIcon;
  status?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  selected?: boolean;
}) {
  return (
    <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md ${selected ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)]"}`}>
      <div className="relative flex h-14 items-center justify-center bg-[var(--gold-soft)]">
        <Icon className="h-5 w-5 text-[var(--navy)]" />
        {status ? <div className="absolute right-3 top-3">{status}</div> : null}
      </div>
      <div className="p-3.5">
        {eyebrow ? <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">{eyebrow}</p> : null}
        <h3 className="mt-1 text-lg font-black leading-tight text-[var(--navy)]">{title}</h3>
        {description ? <div className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{description}</div> : null}
        {children ? <div className="mt-3">{children}</div> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </article>
  );
}

export function AcademicPill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-black">{children}</span>;
}

export function AcademicActionButton({
  children,
  active,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black ${active ? "bg-[var(--navy)] text-white" : "border border-[var(--border)] bg-white text-[var(--navy)]"}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--navy)]">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--navy)]">
      {label}
      <textarea
        className="min-h-24 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  children,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--navy)]">
      {label}
      <select
        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
      >
        {children}
      </select>
    </label>
  );
}

export function GoldButton({
  children,
  disabled,
  onClick,
  type = "submit",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)] shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/75 p-4 text-sm text-[var(--muted-blue)]">
      <ShieldCheck className="mb-3 h-5 w-5 text-[var(--gold)]" />
      <p>{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
