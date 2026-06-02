"use client";

import Link from "next/link";
import { ArrowRight, Clock, Trophy } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { topRankExams } from "@/components/marketing/public-modules";
import { Button } from "@/components/ui/button";

export default function DashboardToprankPage() {
  return (
    <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}>
      <div className="space-y-8">
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_55%,#fff7de_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6426]">TOPRANK</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">TOPRANK exam coaching is coming soon.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">
            We are preparing the AI-powered exam training arena. For now, students should continue Academy classes, tests, attendance and weekly mock practice.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/dashboard/student">Go to Student Dashboard</Button>
            <Button href="/dashboard/academy" variant="secondary">Apply for Academy Program</Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topRankExams.map((exam) => {
            const Icon = exam.icon;
            return (
              <article key={exam.slug} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded bg-[#fff7de] text-[#b9913f]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-bold text-[#071d36]">
                    <Clock className="h-3.5 w-3.5" />
                    Coming Soon
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-[#071d36]">{exam.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{exam.subtitle}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border border-[#b9913f]/25 bg-[#071d36] p-6 text-white">
          <Trophy className="h-8 w-8 text-[#e7c873]" />
          <h2 className="mt-4 text-3xl font-semibold">Until TOPRANK opens, follow your Academy weekly system.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Recorded class, 10 MCQs, topic analysis, improvement work, Saturday mock and Sunday paper analysis.</p>
          <Link href="/dashboard/student" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#e7c873]">
            Open class cycle <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </RoleDashboardGuard>
  );
}
