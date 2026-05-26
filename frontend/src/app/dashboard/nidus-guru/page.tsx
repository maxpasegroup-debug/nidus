"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { guruRecordedQuests } from "@/components/marketing/public-modules";
import { Button } from "@/components/ui/button";

export default function DashboardNidusGuruPage() {
  const [open, setOpen] = useState(true);

  return (
    <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}>
      <div className="space-y-8">
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_52%,#eef4f7_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">NIDUS Guru</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">Personal growth through ALTT.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">
            NIDUS Guru contains personal growth programs built on brain rewiring, Active Learning Transformation Techniques and mission-based behaviour change.
          </p>
          <Button type="button" onClick={() => setOpen(true)} className="mt-7">What is NIDUS Guru?</Button>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {guruRecordedQuests.map((quest) => {
            const Icon = quest.icon;
            return (
              <Link key={quest.slug} href={quest.href} className="group rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <div className="grid h-12 w-12 place-items-center rounded bg-[#f7f3ea] text-[#b9913f]">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-[#071d36]">{quest.title}</h2>
                <p className="mt-2 min-h-16 text-sm leading-6 text-[#64748b]">{quest.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                  View Quest <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </section>

        {open ? (
          <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#071d36]/45 p-4 backdrop-blur-sm">
            <div className="mx-auto my-10 max-w-3xl rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] p-6 shadow-[0_30px_120px_rgba(7,29,54,0.28)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Active Learning Transformation</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[#071d36]">What is NIDUS Guru?</h2>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded border border-[#071d36]/12 bg-white text-[#071d36]" aria-label="Close NIDUS Guru explanation">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-5 text-sm leading-7 text-[#64748b]">
                NIDUS Guru is not a normal course library. It is a personal transformation arena focused on brain rewiring, discipline, focus, confidence and student performance. We use ALTT: Active Learning Transformation Techniques.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Learn through missions", "Reflect on behaviour", "Apply daily action", "Repeat until transformation"].map((item) => (
                  <div key={item} className="rounded border border-[#071d36]/10 bg-white p-4 text-sm font-semibold text-[#071d36]">
                    <CheckCircle2 className="mb-3 h-5 w-5 text-[#b9913f]" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={() => setOpen(false)}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="/guru" className="inline-flex min-h-12 items-center justify-center rounded border border-[#071d36]/14 bg-white px-5 py-3 text-sm font-semibold text-[#071d36]">
                  Public Guru Page
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleDashboardGuard>
  );
}
