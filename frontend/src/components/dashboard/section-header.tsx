type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  action?: string;
};

export function SectionHeader({ eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--ink)]">{title}</h2>
      </div>
      {action ? <p className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm font-bold text-[var(--muted-blue)]">{action}</p> : null}
    </div>
  );
}
