import Link from "next/link";

type LegalSection = {
  title: string;
  text: string;
};

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <main className="bg-[#f6f7fb] px-4 pb-20 pt-32 text-[#111827] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-[#263a8f]">Back to NIDUS</Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-[#263a8f]">NIDUS Academy Legal</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">{title}</h1>
        <p className="mt-5 text-sm leading-7 text-[#536072] sm:text-base">{intro}</p>
        <div className="mt-10 grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-lg border border-[#263a8f]/10 bg-white p-5 shadow-[0_18px_60px_rgba(19,35,72,0.08)]">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#536072]">{section.text}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-xs leading-6 text-[#536072]">
          Last updated: May 25, 2026. For policy support, contact NIDUS Academy through the Contact page or official WhatsApp support.
        </p>
      </section>
    </main>
  );
}
