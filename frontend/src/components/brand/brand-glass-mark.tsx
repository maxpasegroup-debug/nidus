import Image from "next/image";

export function BrandGlassMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-2xl border border-white/70 bg-white/45 shadow-[0_18px_60px_rgba(7,29,54,0.16)] backdrop-blur-xl ${
        compact ? "min-h-24 p-3" : "min-h-32 p-4"
      }`}
    >
      <div className="absolute -left-8 -top-10 h-24 w-24 rounded-full bg-[rgba(194,141,34,0.22)] blur-2xl" />
      <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-[rgba(7,29,54,0.12)] blur-2xl" />
      <div className="relative flex h-full items-center gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-2xl border border-[var(--gold-border)] bg-white/90 p-2 shadow-[0_0_34px_rgba(194,141,34,0.35)] ${
            compact ? "h-14 w-14" : "h-20 w-20"
          }`}
        >
          <Image
            src="/brand/nidus-logo.png"
            alt="NIDUS Academy logo"
            width={compact ? 48 : 72}
            height={compact ? 48 : 72}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <Image
            src="/brand/nidus-logo-horizontal.png"
            alt="NIDUS Academy"
            width={compact ? 156 : 220}
            height={compact ? 42 : 60}
            className={`${compact ? "max-h-10" : "max-h-14"} w-auto object-contain`}
            priority
          />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.26em] text-[var(--muted-blue)]">Command OS</p>
        </div>
      </div>
    </div>
  );
}
