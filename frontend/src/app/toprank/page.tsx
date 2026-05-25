import Link from "next/link";
import { ArrowRight, BrainCircuit, Radar, ShieldCheck } from "lucide-react";
import { ProgramEnquiryForm } from "@/components/academy/program-enquiry-form";
import { topRankExams } from "@/components/marketing/public-modules";

export default function TopRankPage() {
  return (
    <div className="bg-[#f7f3ea] pt-20 text-[#101827]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.16),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(110,143,175,0.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_27rem] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">TOPRANK</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] text-[#071d36] sm:text-7xl">AI exam practice arena for defence aspirants.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#64748b]">Practice with profiling, diagnostics, adaptive revision, mock intelligence, and mentor-ready reports.</p>
            <div className="mt-8">
              <Link href="#exams" className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-5 py-3 text-sm font-semibold text-[#071d36] shadow-[0_16px_36px_rgba(185,145,63,0.24)] transition hover:-translate-y-0.5 hover:brightness-105">
                Choose Exam <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-[#071d36]/10 bg-white/82 p-5 shadow-[0_24px_80px_rgba(7,29,54,0.10)]">
            <BrainCircuit className="h-7 w-7 text-[#b9913f]" />
            <h2 className="mt-5 text-3xl font-semibold text-[#071d36]">Performance Engine</h2>
            <div className="mt-6 grid gap-3">
              {["Profile", "Diagnose", "Practice", "Review", "Improve"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded border border-[#071d36]/10 bg-[#f7f3ea] p-3 text-sm font-semibold text-[#071d36]">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-xs text-[#3f4a32]">{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="exams" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Exam Arenas</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Pick one exam. Enter the arena.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {topRankExams.map(({ title, subtitle, href, image, icon: Icon }) => (
              <Link key={title} href={href} className="group overflow-hidden rounded-lg border border-[#071d36]/10 bg-white shadow-[0_24px_70px_rgba(7,29,54,0.10)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <div className="relative aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.03),rgba(5,10,20,0.50)),url('${image}')` }}>
                  <Icon className="absolute bottom-4 left-4 h-7 w-7 text-white" />
                </div>
                <div className="p-5">
                  <h3 className="text-3xl font-semibold">{title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-[#64748b]">{subtitle}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                    Open Arena <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Radar className="h-7 w-7 text-[#3f4a32]" />
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#071d36] sm:text-5xl">Need help choosing the right arena?</h2>
            <p className="mt-5 text-sm leading-7 text-[#64748b]">Submit your details and the NIDUS team will guide you to the right exam path.</p>
          </div>
          <ProgramEnquiryForm programTitle="TOPRANK Exam Coaching" source="TOPRANK Branding Page" />
        </div>
      </section>
    </div>
  );
}
