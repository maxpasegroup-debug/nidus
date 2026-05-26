"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Download, FileText, X } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { assessmentCatalog } from "@/components/assessments/assessment-catalog";
import { Button } from "@/components/ui/button";

export default function DashboardAssessmentsPage() {
  const [open, setOpen] = useState(true);

  return (
    <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}>
      <div className="space-y-8">
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_55%,#dce9f3_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Assessments</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">Understand yourself before choosing the path.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">Perform assessments, generate reports and use the reports section to download and review your progress.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => setOpen(true)}>How Assessments Work</Button>
            <Button href="/psychometric/reports" variant="secondary">
              <FileText className="h-4 w-4" />
              Reports Section
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assessmentCatalog.map((assessment) => {
            const Icon = assessment.icon;
            return (
              <Link key={assessment.id} href={`/psychometric/${assessment.id}`} className="group rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-[#f7f3ea] text-[#b9913f]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#071d36]">{assessment.title}</h2>
                    <p className="mt-2 min-h-16 text-sm leading-6 text-[#64748b]">{assessment.subtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-[#3f4a32]">{assessment.access}</span>
                      <span className="rounded-full border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-[#3f4a32]">PDF Report</span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                      Start Test <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {open ? (
          <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#071d36]/45 p-4 backdrop-blur-sm">
            <div className="mx-auto my-10 max-w-3xl rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] p-6 shadow-[0_30px_120px_rgba(7,29,54,0.28)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Assessment Engine</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[#071d36]">How assessments work</h2>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded border border-[#071d36]/12 bg-white text-[#071d36]" aria-label="Close assessment explanation">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 grid gap-3">
                {[
                  ["Perform", "Choose a test and answer in the NIDUS AI guided interface."],
                  ["Understand", "Get simple interpretation, score and next action clarity."],
                  ["Download", "Open reports and download detailed PDF reports when available."]
                ].map(([title, text]) => (
                  <div key={title} className="rounded border border-[#071d36]/10 bg-white p-4">
                    <BarChart3 className="h-5 w-5 text-[#b9913f]" />
                    <h3 className="mt-3 font-semibold text-[#071d36]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={() => setOpen(false)}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/psychometric/reports" variant="secondary">
                  <Download className="h-4 w-4" />
                  View Reports
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleDashboardGuard>
  );
}
