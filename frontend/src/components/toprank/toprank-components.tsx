import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, Clock, LockKeyhole, PlayCircle, ShieldCheck } from "lucide-react";
import type { TopRankDashboardCard, TopRankGateway } from "@/types/toprank";

export function TopRankHero({ eyebrow, title, subtitle, primaryHref, primaryLabel, secondaryHref, secondaryLabel }: { eyebrow?: string; title: ReactNode; subtitle: string; primaryHref?: string; primaryLabel?: string; secondaryHref?: string; secondaryLabel?: string }) {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,rgba(214,164,71,0.18),transparent_30rem),radial-gradient(circle_at_18%_14%,rgba(39,88,59,0.3),transparent_28rem),linear-gradient(135deg,#06120e_0%,#092019_58%,#050807_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d6a447]/50 to-transparent" />
      <div className="relative mx-auto max-w-6xl">
        {eyebrow ? <p className="text-sm font-black uppercase tracking-[0.28em] text-[#f6d17a]">{eyebrow}</p> : null}
        <h1 className="mt-6 max-w-5xl text-5xl font-black uppercase leading-[0.95] tracking-normal text-white sm:text-7xl lg:text-8xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#dbe4d7] sm:text-2xl">{subtitle}</p>
        {primaryHref || secondaryHref ? (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {primaryHref && primaryLabel ? (
              <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e] shadow-[0_20px_60px_rgba(214,164,71,0.24)] transition hover:brightness-110">
                {primaryLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
            {secondaryHref && secondaryLabel ? (
              <Link href={secondaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/18 px-6 text-sm font-bold text-white transition hover:bg-white/8">
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function GatewayCard({ gateway }: { gateway: TopRankGateway }) {
  const enabled = gateway.status === "ADMISSIONS_OPEN";
  const content = (
    <article className={`flex h-full flex-col rounded-[1.5rem] border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition ${enabled ? "border-[#d6a447]/40 bg-[#0b1c15] hover:-translate-y-1 hover:border-[#d6a447]/70" : "border-white/10 bg-white/[0.045] opacity-72"}`}>
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[#d6a447]/32 bg-[#d6a447]/10 text-sm font-black text-[#f6d17a]">{gateway.symbol}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${enabled ? "bg-[#d6a447] text-[#06120e]" : "border border-white/12 text-[#b9c2b4]"}`}>{gateway.badge}</span>
      </div>
      <h3 className="mt-7 text-2xl font-black uppercase tracking-normal text-white">{gateway.title}</h3>
      <p className="mt-3 min-h-16 text-sm leading-6 text-[#b9c2b4]">{gateway.description}</p>
      <div className="mt-8">
        <span className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black ${enabled ? "bg-[#d6a447] text-[#06120e]" : "border border-white/12 text-[#a9b3a3]"}`}>
          Enter Gateway <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  );

  return enabled ? <Link href={gateway.href}>{content}</Link> : content;
}

export function DashboardCard({ card }: { card: TopRankDashboardCard }) {
  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <ShieldCheck className="h-5 w-5 text-[#f6d17a]" aria-hidden="true" />
        {card.status ? <span className="rounded-full border border-[#d6a447]/24 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f6d17a]">{card.status}</span> : null}
      </div>
      <h3 className="mt-5 text-xl font-black text-white">{card.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#b9c2b4]">{card.description}</p>
    </article>
  );
}

export function RoleCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="rounded-[1.25rem] border border-white/10 bg-[#0b1c15] p-5 transition hover:-translate-y-1 hover:border-[#d6a447]/50">
      <LockKeyhole className="h-5 w-5 text-[#f6d17a]" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#b9c2b4]">{description}</p>
    </Link>
  );
}

export function TopRankSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6d17a]">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function TopRankEmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-white/16 bg-white/[0.035] p-6 text-center">
      <p className="text-lg font-black text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#b9c2b4]">{description}</p>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.26em] text-[#f6d17a]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-[#b9c2b4]">{description}</p> : null}
    </div>
  );
}

export function HeroBanner({ eyebrow, title, description, primaryHref, primaryLabel, secondaryHref, secondaryLabel }: { eyebrow: string; title: ReactNode; description: string; primaryHref?: string; primaryLabel?: string; secondaryHref?: string; secondaryLabel?: string }) {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(214,164,71,0.2),transparent_28rem),radial-gradient(circle_at_14%_22%,rgba(24,76,49,0.38),transparent_30rem),linear-gradient(135deg,#07120e_0%,#0b2419_54%,#050806_100%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="relative mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.28)] sm:p-10 lg:p-14">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6d17a]">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-[0.98] text-white sm:text-6xl lg:text-7xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#dbe4d7]">{description}</p>
        {primaryHref || secondaryHref ? (
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {primaryHref && primaryLabel ? <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e] transition hover:brightness-110">{primaryLabel}<ArrowRight className="h-4 w-4" /></Link> : null}
            {secondaryHref && secondaryLabel ? <Link href={secondaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/16 px-6 text-sm font-bold text-white transition hover:bg-white/8">{secondaryLabel}</Link> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-5">
      <CheckCircle2 className="h-5 w-5 text-[#f6d17a]" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#b9c2b4]">{description}</p>
    </article>
  );
}

export function TrainerCard({ category, experience, specialization, bio }: { category: string; experience: string; specialization: string; bio: string }) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b1c15]">
      <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_50%_25%,rgba(246,209,122,0.18),transparent_14rem),linear-gradient(135deg,#10251b,#07120e)] text-xs font-black uppercase tracking-[0.22em] text-[#f6d17a]">
        Photo Placeholder
      </div>
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">{experience}</p>
        <h3 className="mt-2 text-xl font-black text-white">{category}</h3>
        <p className="mt-2 text-sm font-bold text-[#dbe4d7]">{specialization}</p>
        <p className="mt-3 text-sm leading-6 text-[#b9c2b4]">{bio}</p>
      </div>
    </article>
  );
}

export function CurriculumCard({ subject, description, hours, objectives }: { subject: string; description: string; hours: string; objectives: string[] }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl font-black text-white">{subject}</h3>
        <span className="rounded-full border border-[#d6a447]/24 px-3 py-1 text-xs font-black text-[#f6d17a]">{hours}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#b9c2b4]">{description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {objectives.map((objective) => (
          <span key={objective} className="rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-[#dbe4d7]">{objective}</span>
        ))}
      </div>
    </article>
  );
}

export function Timeline({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-3">
      {items.map((item, index) => (
        <li key={item} className="grid grid-cols-[44px_1fr] gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d6a447] text-sm font-black text-[#06120e]">{index + 1}</span>
          <p className="self-center text-sm font-bold text-[#e6eadf]">{item}</p>
        </li>
      ))}
    </ol>
  );
}

export function StatsCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-[1.25rem] border border-[#d6a447]/20 bg-[#d6a447]/10 p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#c9d0c2]">{note}</p>
    </article>
  );
}

export function VideoCard({ title, duration, description, badge }: { title: string; duration: string; description: string; badge: string }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-[#0b1c15] p-5">
      <div className="grid aspect-video place-items-center rounded-[1rem] border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(246,209,122,0.2),transparent_12rem),linear-gradient(135deg,#10251b,#07120e)]">
        <PlayCircle className="h-12 w-12 text-[#f6d17a]" aria-hidden="true" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <span className="rounded-full bg-[#d6a447] px-3 py-1 text-xs font-black text-[#06120e]">{badge}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#b9c2b4]"><Clock className="h-3.5 w-3.5" />{duration}</span>
      </div>
      <h3 className="mt-4 text-xl font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#b9c2b4]">{description}</p>
      <div className="mt-5 flex items-center justify-between gap-4">
        <button type="button" className="rounded-full bg-[#d6a447] px-5 py-2.5 text-sm font-black text-[#06120e]">Watch</button>
        <span className="rounded-full border border-white/12 px-3 py-1 text-xs font-bold text-[#dbe4d7]">Completion pending</span>
      </div>
    </article>
  );
}

export function CountdownCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">{title}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-[#b9c2b4]">{note}</p>
    </article>
  );
}

export function FAQAccordion({ items }: { items: Array<{ question: string; answer: string }> }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <details key={item.question} className="group rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-5">
          <summary className="cursor-pointer list-none text-base font-black text-white">{item.question}</summary>
          <p className="mt-3 text-sm leading-6 text-[#b9c2b4]">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
