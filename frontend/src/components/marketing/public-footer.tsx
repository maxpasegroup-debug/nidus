import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { publicSiteLinks } from "@/components/marketing/public-pages";

const columns = [
  {
    title: "NIDUS Academy",
    links: publicSiteLinks.slice(1, 6)
  },
  {
    title: "Explore",
    links: [
      ["Facilities", "/facilities"],
      ["Gallery", "/gallery"],
      ["Events", "/events"],
      ["Blog / News", "/blog"],
      ["FAQ", "/faq"],
      ["Guru Ecosystem", "/guru"],
      ["Assessments", "/psychometric"]
    ]
  },
  {
    title: "Legal",
    links: [
      ["Privacy Policy", "/privacy-policy"],
      ["Terms & Conditions", "/terms-and-conditions"],
      ["Refund Policy", "/refund-policy"],
      ["Cancellation Policy", "/cancellation-policy"],
      ["Disclaimer", "/disclaimer"]
    ]
  }
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-[#071d36]/10 bg-white px-4 py-12 text-[#101827] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_2.2fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded border border-[#b9913f]/28 bg-[#071d36] text-[#e7c873]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-semibold text-[#071d36]">NIDUS</span>
              <span className="block text-xs uppercase tracking-[0.22em] text-[#3f4a32]">Defence Training Reimagined</span>
            </span>
          </Link>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#64748b]">
            A premium AI-powered defence career ecosystem for aspirants, parents, mentors, and academy leadership.
          </p>
          <div className="mt-4 space-y-1 text-sm leading-6 text-[#64748b]">
            <p className="font-semibold text-[#071d36]">Operated by Unique Solution</p>
            <p>Ground Floor, Dalam Arcade, Kollam Kadavu Road, Chinnakada, Kollam - 691001, Kerala.</p>
            <p>GSTIN: 32AAZFN9320K1ZP</p>
            <p>Email: info@uniquesolutionkochi.com | Mob: 9020905655</p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-[#071d36]">{column.title}</h3>
              <div className="mt-4 grid gap-3">
                {column.links.map(([label, href]) => (
                  <Link key={href} href={href} className="text-sm text-[#64748b] transition hover:text-[#071d36]">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-[#071d36]/10 pt-6 text-xs text-[#64748b] sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright {new Date().getFullYear()} NIDUS Academy by Unique Solution.</p>
        <p>Built for discipline, intelligence, and officer mindset.</p>
      </div>
    </footer>
  );
}
