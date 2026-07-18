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

const landingSections = [
  {
    id: "dream",
    title: "Every officer was once a student.",
    image: "/landing-replica/hero.png",
    cropTop: "top-0 lg:-top-[118px]",
    imageHeight: "h-full lg:h-[calc(100%+118px)]",
    priority: true
  },
  {
    id: "journey",
    title: "From dream to duty.",
    image: "/landing-replica/journey.png",
    cropTop: "top-0",
    imageHeight: "h-full",
    priority: false
  },
  {
    id: "decision",
    title: "Take the first step today.",
    image: "/landing-replica/decision.png",
    cropTop: "top-0 lg:-top-[94px]",
    imageHeight: "h-full lg:h-[calc(100%+94px)]",
    priority: false
  }
] as const;

function GlossHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-5 lg:px-8">
      <div className="mx-auto flex min-h-[76px] max-w-[96rem] items-center justify-between gap-4 rounded-[1.6rem] border border-white/12 bg-[#03111f]/58 px-4 py-3 text-white shadow-[0_26px_90px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl sm:px-5 lg:px-7">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="NIDUS Academy home">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#e7b64d]/28 bg-[#071d36]/70 shadow-[0_0_34px_rgba(231,182,77,0.2)]">
            <Image src="/brand/nidus-logo.png" alt="" width={52} height={52} className="h-11 w-11 object-contain" priority />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-serif text-xl font-black uppercase leading-none tracking-[0.16em] text-white sm:text-2xl">NIDUS</span>
            <span className="mt-1 block truncate text-[10px] font-black uppercase tracking-[0.2em] text-[#e7b64d] sm:text-xs">Academy</span>
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
          <Link href="/login" className="hidden min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e7b64d]/42 bg-white/6 px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-white/12 md:inline-flex">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Login
          </Link>
          <Link href="/start-free?intent=academy" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ffe08a_0%,#e7b64d_45%,#b57b24_100%)] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#06111f] shadow-[0_16px_42px_rgba(231,182,77,0.24)] transition hover:brightness-110 sm:px-5">
            Apply Now
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <nav className="mx-auto mt-2 flex max-w-[96rem] gap-2 overflow-x-auto rounded-full border border-white/10 bg-[#03111f]/52 px-3 py-2 text-white backdrop-blur-xl xl:hidden" aria-label="Mobile landing navigation">
        {headerLinks.map(([label, href]) => (
          <Link key={label} href={href} className="shrink-0 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-white/82">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function ReplicaSection({ section }: { section: (typeof landingSections)[number] }) {
  return (
    <section id={section.id} aria-label={section.title} className="relative min-h-screen overflow-hidden bg-[#03111f]">
      <h2 className="sr-only">{section.title}</h2>
      <div className={`absolute inset-x-0 ${section.cropTop} ${section.imageHeight}`}>
        <Image src={section.image} alt={section.title} fill priority={section.priority} sizes="100vw" className="object-contain md:object-cover" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#03111f]/78 via-[#03111f]/18 to-transparent" />
    </section>
  );
}

export function MarketingHome() {
  return (
    <main id="main-content" className="bg-[#03111f] text-white">
      <GlossHeader />
      {landingSections.map((section) => (
        <ReplicaSection key={section.id} section={section} />
      ))}
    </main>
  );
}
