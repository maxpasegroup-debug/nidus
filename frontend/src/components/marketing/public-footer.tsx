import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const columns = [
  ["Programs", ["Foundation", "Defence Entrance", "Specialized Modules", "SSB"]],
  ["Learning", ["Live Classes", "Recorded Courses", "Monthly Tests", "Progress Reports"]],
  ["AI Advantage", ["NIDUS AI", "Study Planner", "Exam Support", "Interview Practice"]],
  ["Access", ["Admissions", "Student Login", "Parent View", "Contact"]]
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-[#263a8f]/10 bg-white px-4 py-12 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_2.2fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded border border-[#263a8f]/20 bg-[#263a8f]/8 text-[#263a8f]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-semibold text-[#111827]">NIDUS</span>
              <span className="block text-xs uppercase tracking-[0.22em] text-[#263a8f]">Defence Training Reimagined</span>
            </span>
          </Link>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#536072]">
            A premium AI-powered defence preparation academy for aspirants, parents, teachers, and academy leadership.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
              <div className="mt-4 grid gap-3">
                {links.map((item) => <span key={item} className="text-sm text-[#536072]">{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-[#263a8f]/10 pt-6 text-xs text-[#536072] sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright {new Date().getFullYear()} NIDUS Defence Training Platform.</p>
        <p>Built for discipline, intelligence, and officer mindset.</p>
      </div>
    </footer>
  );
}
