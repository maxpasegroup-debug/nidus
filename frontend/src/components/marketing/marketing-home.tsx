import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

const headerLinks = [
  ["Assessments", "/psychometric"],
  ["Courses", "/programs"],
  ["Nidus Gurus", "/faculty"],
  ["Gallery / Stories", "/gallery"],
  ["Login / Signup", "/login"]
] as const;

function GlossHeader() {
  return (
    <header className="absolute left-0 right-0 top-0 z-30 px-3 pt-3 sm:px-5 lg:px-8">
      <div className="mx-auto flex min-h-[72px] max-w-[96rem] items-center justify-between gap-3 rounded-[1.5rem] border border-white/12 bg-[#06111f]/62 px-4 py-3 text-white shadow-[0_24px_80px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl sm:px-5 lg:px-7">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="NIDUS Academy home">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#e6b64a]/30 bg-white shadow-[0_0_34px_rgba(230,182,74,0.18)]">
            <Image src="/brand/nidus-logo.png" alt="" width={44} height={44} className="h-10 w-10 object-contain" priority sizes="44px" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-serif text-xl font-black uppercase leading-none tracking-[0.16em] text-white sm:text-2xl">NIDUS</span>
            <span className="mt-1 block truncate text-[10px] font-black uppercase tracking-[0.22em] text-[#e6b64a] sm:text-xs">Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Landing navigation">
          {headerLinks.map(([label, href]) => (
            <Link key={label} href={href} className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/82 transition hover:bg-white/10 hover:text-[#f2bd4a]">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/login" className="hidden min-h-10 items-center justify-center gap-2 rounded-xl border border-[#e6b64a]/42 bg-white/6 px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-white/12 md:inline-flex">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Login
          </Link>
          <Link href="/start-free?intent=academy" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ffe18b_0%,#e6b64a_46%,#b37a24_100%)] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#06111f] shadow-[0_16px_42px_rgba(230,182,74,0.22)] transition hover:brightness-110 sm:px-5">
            Apply Now
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <nav className="mx-auto mt-2 flex max-w-[96rem] gap-2 overflow-x-auto rounded-full border border-white/10 bg-[#06111f]/58 px-3 py-2 text-white backdrop-blur-xl xl:hidden" aria-label="Mobile landing navigation">
        {headerLinks.map(([label, href]) => (
          <Link key={label} href={href} className="shrink-0 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-white/82">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function HeroFooter() {
  return (
    <footer className="absolute inset-x-0 bottom-0 z-20 px-3 pb-3 sm:px-5 lg:px-8">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-3 rounded-[1.2rem] border border-white/10 bg-[#06111f]/56 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white/70 shadow-[0_18px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p>NIDUS Defence Academy · Kerala</p>
        <p className="text-[#e6b64a]">NDA · CDS · AFCAT · SSB · Agniveer</p>
      </div>
    </footer>
  );
}

export function MarketingHome() {
  return (
    <main id="main-content" className="relative min-h-[100svh] overflow-hidden bg-[#06111f] text-white">
      <Image
        src="/landing-replica/hero.png"
        alt="A student looking toward the Indian flag and NIDUS Defence Academy campus at sunrise"
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="scale-[1.16] object-cover object-[64%_center] sm:scale-[1.1] lg:scale-105 lg:object-center"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,10,18,0.98)_0%,rgba(3,10,18,0.92)_27%,rgba(3,10,18,0.48)_48%,rgba(3,10,18,0.1)_78%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(230,182,74,0.06),transparent_34rem),linear-gradient(180deg,rgba(3,10,18,0.2)_0%,rgba(3,10,18,0)_36%,rgba(3,10,18,0.72)_100%)]" />

      <GlossHeader />

      <section className="relative z-10 flex min-h-[100svh] items-center px-5 pb-28 pt-36 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full border border-[#e6b64a]/28 bg-white/7 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#e6b64a] backdrop-blur-xl">
            Trusted Defence Career Academy
          </p>
          <h1 className="mt-7 max-w-3xl font-serif text-[clamp(3rem,6.2vw,6.8rem)] font-black uppercase leading-[0.9] tracking-normal text-white">
            Every officer was once <span className="text-[#e6b64a]">a student.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-white/76 sm:text-lg">
            NIDUS guides defence aspirants through focused coaching, disciplined training and officer-level mentorship.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/start-free?intent=academy" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[linear-gradient(135deg,#ffe18b_0%,#e6b64a_46%,#b37a24_100%)] px-6 text-sm font-black uppercase tracking-[0.13em] text-[#06111f] shadow-[0_18px_44px_rgba(230,182,74,0.24)] transition hover:brightness-110">
              Apply Now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-white/22 bg-white/7 px-6 text-sm font-black uppercase tracking-[0.13em] text-white backdrop-blur-xl transition hover:bg-white/12">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Login / Signup
            </Link>
          </div>
        </div>
      </section>

      <HeroFooter />
    </main>
  );
}
