"use client";

import { Clock, Sparkles } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { guruRecordedQuests } from "@/components/marketing/public-modules";
import { Button } from "@/components/ui/button";

export default function DashboardNidusGuruPage() {
  return (
    <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}>
      <div className="space-y-8">
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_52%,#eef4f7_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">NIDUS Guru</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">NIDUS Guru is coming soon.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">
            Personal growth quests will open after the Academy learning cycle is stable for students. For now, continue classes, practice, tests and progress tracking.
          </p>
          <Button href="/dashboard/student" className="mt-7">Back to Student Dashboard</Button>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {guruRecordedQuests.map((quest) => {
            const Icon = quest.icon;
            return (
              <article key={quest.slug} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded bg-[#f7f3ea] text-[#b9913f]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-bold text-[#071d36]">
                    <Clock className="h-3.5 w-3.5" />
                    Coming Soon
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-semibold text-[#071d36]">{quest.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{quest.subtitle}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border border-[#b9913f]/25 bg-white p-6 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
          <Sparkles className="h-7 w-7 text-[#b9913f]" />
          <h2 className="mt-4 text-3xl font-semibold text-[#071d36]">Focus now: Academy learning habit.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#64748b]">NIDUS Guru will later support focus, discipline and confidence. Today, students should complete their class cycle and weekly tests.</p>
        </section>
      </div>
    </RoleDashboardGuard>
  );
}
