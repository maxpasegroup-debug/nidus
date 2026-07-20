import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, Clock, LockKeyhole, PlayCircle, ShieldCheck } from "lucide-react";
import type { TopRankBatch, TopRankDashboardCard, TopRankGateway, TopRankMission, TopRankMissionTask, TopRankStudentProfile } from "@/types/toprank";

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

export function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <ol className="grid gap-3 md:grid-cols-6" aria-label="TopRank onboarding steps">
      {steps.map((step, index) => {
        const active = index === currentStep;
        const complete = index < currentStep;
        return (
          <li key={step} className={`rounded-2xl border p-3 text-xs font-black uppercase tracking-[0.12em] ${active ? "border-[#d6a447] bg-[#d6a447]/14 text-[#f6d17a]" : complete ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-[#95a08f]"}`}>
            {index + 1}. {step}
          </li>
        );
      })}
    </ol>
  );
}

export function EnrollmentCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:p-8">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#b9c2b4]">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function BatchCard({ batch, selected, onSelect }: { batch: TopRankBatch; selected?: boolean; onSelect?: (batchId: string) => void }) {
  const metadata = batch.metadata ?? {};
  const seats = typeof metadata.seats === "number" ? metadata.seats : 60;
  const seatsRemaining = typeof metadata.seatsRemaining === "number" ? metadata.seatsRemaining : seats;
  return (
    <button type="button" onClick={() => onSelect?.(batch.id)} className={`h-full rounded-[1.25rem] border p-5 text-left transition ${selected ? "border-[#d6a447] bg-[#d6a447]/14" : "border-white/10 bg-white/[0.045] hover:border-[#d6a447]/40"}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">{batch.status}</p>
      <h3 className="mt-3 text-xl font-black text-white">{batch.name}</h3>
      <p className="mt-3 text-sm text-[#c9d0c2]">Start date: {batch.startDate ? new Date(batch.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Announcing soon"}</p>
      <p className="mt-2 text-sm text-[#c9d0c2]">Seats: {seatsRemaining} of {seats}</p>
    </button>
  );
}

export function ProfileForm({ profile, onChange }: { profile: TopRankStudentProfile; onChange: (profile: TopRankStudentProfile) => void }) {
  const update = (key: keyof TopRankStudentProfile, value: string) => {
    const numericKeys: Array<keyof TopRankStudentProfile> = ["age", "heightCm", "weightKg", "previousAgniveerAttempts", "dailyStudyHours"];
    onChange({ ...profile, [key]: numericKeys.includes(key) ? Number(value || 0) : value });
  };
  const fields: Array<{ key: keyof TopRankStudentProfile; label: string; type?: string }> = [
    { key: "age", label: "Age", type: "number" },
    { key: "gender", label: "Gender" },
    { key: "heightCm", label: "Height in cm", type: "number" },
    { key: "weightKg", label: "Weight in kg", type: "number" },
    { key: "education", label: "Education" },
    { key: "currentOccupation", label: "Current occupation" },
    { key: "preferredLanguage", label: "Preferred language" },
    { key: "previousAgniveerAttempts", label: "Previous Agniveer attempts", type: "number" },
    { key: "runningExperience", label: "Running experience" },
    { key: "pushUpExperience", label: "Push-up experience" },
    { key: "sitUpExperience", label: "Sit-up experience" },
    { key: "currentPreparationLevel", label: "Current preparation level" },
    { key: "dailyStudyHours", label: "Daily study hours", type: "number" },
    { key: "internetAvailability", label: "Internet availability" },
    { key: "deviceType", label: "Device type" },
    { key: "learningPreference", label: "Learning preference" },
    { key: "careerGoal", label: "Career goal" }
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((field) => (
        <label key={field.key} className="grid gap-2 text-sm font-bold text-[#d9dccf]">
          {field.label}
          <input type={field.type ?? "text"} value={String(profile[field.key] ?? "")} onChange={(event) => update(field.key, event.target.value)} className="min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]" />
        </label>
      ))}
    </div>
  );
}

export function AgreementCard({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  const points = ["Follow program rules and training discipline.", "Maintain attendance expectations and batch timing.", "Respect mentors, peers and the TopRank code of conduct.", "Understand the refund policy placeholder before final enrollment."];
  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-5">
      <div className="grid gap-3">
        {points.map((point) => <p key={point} className="text-sm leading-6 text-[#c9d0c2]">{point}</p>)}
      </div>
      <label className="mt-6 flex items-start gap-3 text-sm font-bold text-white">
        <input type="checkbox" checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} className="mt-1" />
        I digitally accept the TopRank Agniveer program agreement.
      </label>
    </article>
  );
}

export function WelcomeBanner({ name, batchName }: { name: string; batchName?: string | null }) {
  return (
    <section className="rounded-[2rem] border border-[#d6a447]/25 bg-[radial-gradient(circle_at_85%_12%,rgba(214,164,71,0.18),transparent_22rem),linear-gradient(135deg,#0b1c15,#06120e)] p-6 sm:p-10">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6d17a]">Welcome to TopRank Command Center</p>
      <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">{name}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#dbe4d7]">Enrollment is active{batchName ? ` for ${batchName}` : ""}. Your training workspace is ready for orientation, profile completion and batch preparation.</p>
    </section>
  );
}

export function CommandCenterCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">{title}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#b9c2b4]">{note}</p>
    </article>
  );
}

export function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="grid place-items-center rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-5 text-center">
      <div className="grid h-28 w-28 place-items-center rounded-full border-8 border-[#d6a447]/80 text-2xl font-black text-white">{value}%</div>
      <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-[#f6d17a]">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-white/16 bg-white/[0.035] p-6 text-center">
      <p className="text-lg font-black text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#b9c2b4]">{description}</p>
    </div>
  );
}

export function ProfileSummary({ user, profile }: { user: { name: string; email: string; phone: string } | null; profile: TopRankStudentProfile }) {
  return (
    <section className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-6 md:grid-cols-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">Student</p>
        <p className="mt-2 text-2xl font-black text-white">{user?.name ?? "TopRank Student"}</p>
        <p className="mt-1 text-sm text-[#b9c2b4]">{user?.email ?? "Email loading"}</p>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">Mobile</p>
        <p className="mt-2 text-2xl font-black text-white">{user?.phone ?? "Loading"}</p>
        <p className="mt-1 text-sm text-[#b9c2b4]">Authentication contact</p>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">Profile</p>
        <p className="mt-2 text-2xl font-black text-white">{profile.completionPercentage ?? 0}%</p>
        <p className="mt-1 text-sm text-[#b9c2b4]">Digital profile completion</p>
      </div>
    </section>
  );
}

export function AssessmentStepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return <Stepper steps={steps} currentStep={currentStep} />;
}

export function ProgressHeader({ current, total, title }: { current: number; total: number; title: string }) {
  const percent = Math.round(((current + 1) / total) * 100);
  return (
    <header className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f6d17a]">{title}</p>
        <p className="text-sm font-black text-white">{percent}%</p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-[#d6a447]" style={{ width: `${percent}%` }} />
      </div>
    </header>
  );
}

export function QuestionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-6 text-[#b9c2b4]">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </article>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const label = score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 50 ? "Average" : "Weak";
  return <span className="rounded-full border border-[#d6a447]/25 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#f6d17a]">{label}</span>;
}

export function ReadinessGauge({ score }: { score: number }) {
  return (
    <div className="grid place-items-center rounded-[2rem] border border-[#d6a447]/25 bg-[#d6a447]/10 p-8 text-center">
      <div className="grid h-40 w-40 place-items-center rounded-full border-[12px] border-[#d6a447] text-5xl font-black text-white">{Math.round(score)}%</div>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[#f6d17a]">Overall Readiness</p>
    </div>
  );
}

export function APRCard({ title, score, note }: { title: string; score: number; note: string }) {
  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">{title}</p>
        <ScoreBadge score={score} />
      </div>
      <p className="mt-4 text-3xl font-black text-white">{Math.round(score)}%</p>
      <p className="mt-2 text-sm leading-6 text-[#b9c2b4]">{note}</p>
    </article>
  );
}

export function CategoryScoreCard({ title, score }: { title: string; score: number }) {
  return <APRCard title={title} score={score} note={`${title} baseline from diagnostic assessment.`} />;
}

export function StrengthCard({ title }: { title: string }) {
  return <article className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm font-black text-emerald-100">{title}</article>;
}

export function WeaknessCard({ title }: { title: string }) {
  return <article className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm font-black text-amber-100">{title}</article>;
}

export function AssessmentSummary({ completedAt }: { completedAt?: string }) {
  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d17a]">Assessment Completed</p>
      <p className="mt-3 text-xl font-black text-white">{completedAt ? new Date(completedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Pending"}</p>
    </article>
  );
}

export function MissionBadge({ status, type }: { status?: string; type?: string }) {
  return <span className="rounded-full border border-[#d6a447]/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f6d17a]">{status ?? type ?? "Mission"}</span>;
}

export function MissionCard({ mission }: { mission: TopRankMission }) {
  return (
    <Link href={`/toprank/student/missions/${mission.id}`} className="block rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 transition hover:border-[#d6a447]/45">
      <div className="flex items-start justify-between gap-4">
        <MissionBadge status={mission.status} type={mission.missionType} />
        <span className="text-xs font-black text-[#b9c2b4]">{mission.estimatedMinutes} min</span>
      </div>
      <h3 className="mt-4 text-xl font-black text-white">{mission.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#b9c2b4]">{mission.description}</p>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#f6d17a]">Day {mission.dayNumber} / Week {mission.weekNumber}</p>
    </Link>
  );
}

export function DailyMissionWidget({ mission }: { mission: TopRankMission | null }) {
  if (!mission) return <EmptyState title="No mission for today" description="Generate your 180-day plan to receive today's mission." />;
  return (
    <section className="rounded-[2rem] border border-[#d6a447]/25 bg-[radial-gradient(circle_at_88%_10%,rgba(214,164,71,0.18),transparent_20rem),linear-gradient(135deg,#0b1c15,#06120e)] p-6">
      <MissionBadge type={mission.missionType} status={mission.status} />
      <h2 className="mt-4 text-3xl font-black text-white">Today&apos;s Mission</h2>
      <h3 className="mt-3 text-xl font-black text-[#f6d17a]">{mission.title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#dbe4d7]">{mission.description}</p>
      <Link href={`/toprank/student/missions/${mission.id}`} className="mt-6 inline-flex rounded-full bg-[#d6a447] px-5 py-3 text-sm font-black text-[#06120e]">Continue Mission</Link>
    </section>
  );
}

export function MissionProgress({ value }: { value: number }) {
  return <ProgressRing value={value} label="Mission Progress" />;
}

export function MissionStats({ stats }: { stats: { total: number; completed: number; pending: number; missed: number; completion: number } }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <CommandCenterCard title="Completion" value={`${stats.completion}%`} note="Overall mission completion." />
      <CommandCenterCard title="Completed" value={String(stats.completed)} note="Missions completed." />
      <CommandCenterCard title="Pending" value={String(stats.pending)} note="Missions waiting." />
      <CommandCenterCard title="Missed" value={String(stats.missed)} note="Needs attention." />
    </div>
  );
}

export function MissionChecklist({ tasks }: { tasks: TopRankMissionTask[] }) {
  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <label key={task.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-bold text-[#dbe4d7]">
          <input type="checkbox" defaultChecked={task.completed} className="mt-1" />
          <span>{task.sequence}. {task.title} <span className="text-[#95a08f]">({task.durationMinutes} min)</span></span>
        </label>
      ))}
    </div>
  );
}

export function MissionHeader({ mission }: { mission: TopRankMission }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6">
      <MissionBadge status={mission.status} type={mission.missionType} />
      <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">{mission.title}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#b9c2b4]">{mission.description}</p>
    </section>
  );
}

export function MissionTimeline({ missions }: { missions: TopRankMission[] }) {
  return (
    <div className="grid gap-3">
      {missions.map((mission) => <MissionCard key={mission.id} mission={mission} />)}
    </div>
  );
}

export function MissionCalendar({ entries }: { entries: Array<{ calendarDate: string; status: string; mission: TopRankMission }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {entries.slice(0, 35).map((entry) => (
        <Link key={`${entry.mission.id}-${entry.calendarDate}`} href={`/toprank/student/missions/${entry.mission.id}`} className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <p className="text-xs font-black text-[#f6d17a]">{new Date(entry.calendarDate).getDate()}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-white">{entry.mission.title}</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#95a08f]">{entry.status}</p>
        </Link>
      ))}
    </div>
  );
}

export function WeeklySummary({ weekly }: { weekly: Array<{ weekNumber: number; status: string; _count: { id: number } }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {weekly.slice(0, 8).map((row) => <CommandCenterCard key={`${row.weekNumber}-${row.status}`} title={`Week ${row.weekNumber}`} value={String(row._count.id)} note={row.status} />)}
    </div>
  );
}
