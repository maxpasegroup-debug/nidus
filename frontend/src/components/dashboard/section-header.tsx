type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  action?: string;
};

export function SectionHeader({ eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      </div>
      {action ? <p className="text-sm text-muted">{action}</p> : null}
    </div>
  );
}

