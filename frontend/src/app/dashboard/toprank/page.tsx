"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, CreditCard, Medal, X } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { topRankExams, type TopRankExam } from "@/components/marketing/public-modules";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";

const plans = [
  { name: "Starter", price: "Rs 2,499 / month", text: "TOPRANK exam practice, active learning loops, free online mentoring support programs." },
  { name: "Top Rank Mentor", price: "Rs 9,999 / month", text: "TOPRANK training plus one-to-one mentoring for exam discipline and performance correction." },
  { name: "Premium Officer Track", price: "Rs 19,999 / month", text: "One-to-one mentoring, advanced training, and guidance from retired Army officers." }
];

export default function DashboardToprankPage() {
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<TopRankExam | null>(null);
  const hasTestAccess = user?.roleMetadata?.testAccess === true && user.roleMetadata?.paymentBypass === true;

  return (
    <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}>
      <div className="space-y-8">
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_52%,#dce9f3_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">TOPRANK Exam Ecosystem</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">Choose your exam. Train for top ranks.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">
            TOPRANK is the primary exam training system inside NIDUS. It is built around active learning practice, regular examination loops, profiling and mentoring instead of passive learning.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {topRankExams.map((exam) => {
            const Icon = exam.icon;
            return (
              <button key={exam.slug} type="button" onClick={() => setSelectedExam(exam)} className="group overflow-hidden rounded-lg border border-[#071d36]/10 bg-white text-left shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <div className="relative aspect-[16/9] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.06),rgba(5,10,20,0.55)),url('${exam.image}')` }}>
                  <Icon className="absolute bottom-4 left-4 h-7 w-7 text-white" />
                  <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#071d36]">{exam.status === "live" ? "Live" : "Preview"}</span>
                </div>
                <div className="p-5">
                  <h2 className="text-3xl font-semibold text-[#071d36]">{exam.title}</h2>
                  <p className="mt-2 min-h-14 text-sm leading-6 text-[#64748b]">{exam.subtitle}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                    View Training Plan <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {selectedExam ? (
          <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#071d36]/45 p-4 backdrop-blur-sm">
            <div className="mx-auto my-8 max-w-5xl rounded-lg border border-[#071d36]/10 bg-[#f7f3ea] p-5 shadow-[0_30px_120px_rgba(7,29,54,0.28)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Exam Training Arena</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[#071d36]">{selectedExam.title} TOPRANK Training</h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#64748b]">{selectedExam.whatItIs}</p>
                </div>
                <button type="button" onClick={() => setSelectedExam(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded border border-[#071d36]/12 bg-white text-[#071d36]" aria-label="Close TOPRANK details">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {["Active Learning Practices", "Regular Examination Loop", "Profiling Activation"].map((item) => (
                  <div key={item} className="rounded border border-[#071d36]/10 bg-white p-4">
                    <CheckCircle2 className="h-5 w-5 text-[#b9913f]" />
                    <h3 className="mt-3 font-semibold text-[#071d36]">{item}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">Focused practice, review and correction designed to help committed students move toward top ranks.</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-lg border border-[#071d36]/10 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-[#b9913f]" />
                  <h3 className="text-xl font-semibold text-[#071d36]">Select Plan</h3>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <article key={plan.name} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                      <h4 className="text-lg font-semibold text-[#071d36]">{plan.name}</h4>
                      <p className="mt-2 text-2xl font-semibold text-[#3f4a32]">{plan.price}</p>
                      <p className="mt-3 min-h-24 text-sm leading-6 text-[#64748b]">{plan.text}</p>
                      <Button href={hasTestAccess ? "/dashboard/student" : user?.role === "STUDENT" ? "/subscriptions" : "/join"} className="mt-4 w-full">
                        <CreditCard className="h-4 w-4" />
                        {hasTestAccess ? "Test Access Active" : user?.role === "STUDENT" ? "Continue to Payment" : "Apply for Student Access"}
                      </Button>
                    </article>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-[#64748b]">After payment approval, profiling activates for the selected examination and the training loop begins from the student dashboard.</p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button href={user?.role === "STUDENT" ? "/dashboard/student" : "/join"}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href={`/toprank/${selectedExam.slug}`} className="inline-flex min-h-12 items-center justify-center rounded border border-[#071d36]/14 bg-white px-5 py-3 text-sm font-semibold text-[#071d36]">
                  Read Public Details
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleDashboardGuard>
  );
}
