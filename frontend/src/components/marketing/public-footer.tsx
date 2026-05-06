import Link from "next/link";

const columns = [
  ["Platform", ["AI Mentor", "Mock Tests", "SSB Training", "Psychometrics"]],
  ["Academy", ["CRM", "Hostel", "Payments", "Analytics"]],
  ["Exams", ["NDA", "CDS", "AFCAT", "AISSEE"]]
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#030812] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded border border-gold/45 bg-gold/12 text-sm font-bold text-gold-soft">N</span>
            <span>
              <span className="block text-xl font-semibold text-ink">NIDUS</span>
              <span className="block text-xs uppercase tracking-[0.22em] text-gold-soft">Defence Training Reimagined</span>
            </span>
          </Link>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted">
            A premium AI-powered defence preparation and academy operations ecosystem for aspirants, parents, faculty, and leadership.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {columns.map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <div className="mt-4 grid gap-3">
                {links.map((item) => <span key={item} className="text-sm text-muted">{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} NIDUS Defence Training Platform.</p>
        <p>Built for discipline, intelligence, and officer mindset.</p>
      </div>
    </footer>
  );
}
