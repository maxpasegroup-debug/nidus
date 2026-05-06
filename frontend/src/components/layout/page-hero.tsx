import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: Array<{ value: string; label: string }>;
};

export function PageHero({ eyebrow, title, description, actions, stats = [] }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-gold/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.035))] p-5 shadow-[0_28px_110px_rgba(0,0,0,0.36)] backdrop-blur-2xl sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-gold/20 md:block" />
        <div className="absolute right-14 top-14 hidden h-16 w-16 rounded-full border border-sky-300/20 md:block" />
      </div>
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-soft">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted sm:text-base">{description}</p>
          {actions ? <div className="mt-6 flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
        </div>
        {stats.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[28rem]">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded border border-white/10 bg-navy-deep/55 p-4">
                <p className="text-2xl font-semibold text-gold-soft">{stat.value}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
