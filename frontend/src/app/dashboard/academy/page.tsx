"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Rocket } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { academyCategories } from "@/components/academy/academy-programs";
import { Button } from "@/components/ui/button";

export default function DashboardAcademyPage() {
  return (
    <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}>
      <div className="space-y-8">
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_55%,#dce9f3_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Academy Programs</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">Choose your physical academy pathway.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">Explore all NIDUS Academy programs, select the right defence path and apply for counselling or admission.</p>
          <Button href="/join" className="mt-7">
            <Rocket className="h-4 w-4" />
            Apply Now
          </Button>
        </section>

        <section className="grid gap-8">
          {academyCategories.map((category) => (
            <div key={category.title} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3f4a32]">{category.title}</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#64748b]">{category.description}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {category.programs.map((program) => (
                  <Link key={program.slug} href={`/programs/${program.slug}`} className="group rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4 transition hover:-translate-y-1 hover:border-[#b9913f]/45 hover:bg-white">
                    <GraduationCap className="h-5 w-5 text-[#b9913f]" />
                    <h2 className="mt-4 text-lg font-semibold text-[#071d36]">{program.title}</h2>
                    <p className="mt-2 min-h-16 text-sm leading-6 text-[#64748b]">{program.summary}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                      View Details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </RoleDashboardGuard>
  );
}
