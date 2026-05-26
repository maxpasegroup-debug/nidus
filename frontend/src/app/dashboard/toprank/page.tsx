"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, CreditCard, Medal, X } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { topRankExams, type TopRankExam } from "@/components/marketing/public-modules";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useToast } from "@/components/providers/toast-provider";
import { createPaymentOrder, verifyPayment } from "@/services/payments";
import { openRazorpayCheckout } from "@/services/razorpay";

const TOPRANK_MONTHLY_AMOUNT = 2999;

export default function DashboardToprankPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedExam, setSelectedExam] = useState<TopRankExam | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const hasTestAccess = user?.roleMetadata?.testAccess === true && user.roleMetadata?.paymentBypass === true;

  async function startToprankPayment(exam: TopRankExam) {
    if (!user) {
      showToast("Please login or start free before activating TOPRANK.", "error");
      return;
    }
    if (hasTestAccess) {
      showToast("Test access is already active for TOPRANK.", "success");
      return;
    }
    if (user.role !== "STUDENT") {
      showToast("Apply for student access before activating TOPRANK coaching.", "info");
      return;
    }

    setCheckoutLoading(true);
    try {
      const order = await createPaymentOrder({
        amount: TOPRANK_MONTHLY_AMOUNT,
        product: "TOPRANK_MONTHLY",
        paymentMethod: "TOPRANK_MONTHLY",
        examSlug: exam.slug
      });
      await openRazorpayCheckout(
        order,
        { name: user.name, email: user.email, mobile: user.mobile },
        async (response) => {
          try {
            const result = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: "RAZORPAY"
            });
            if (result.verified) {
              showToast("TOPRANK activated for 30 days.", "success");
              window.location.assign("/dashboard/toprank");
            } else {
              showToast("Payment verification failed. Please contact support.", "error");
            }
          } catch (error) {
            showToast(error instanceof Error ? error.message : "Payment verification failed.", "error");
          }
        },
        () => showToast("Payment was not completed.", "info")
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to open Razorpay checkout.", "error");
    } finally {
      setCheckoutLoading(false);
    }
  }

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
                  <h3 className="text-xl font-semibold text-[#071d36]">Activate TOPRANK</h3>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <article className="rounded border border-[#b9913f]/35 bg-[#fff9e8] p-5 shadow-[0_18px_60px_rgba(185,145,63,0.12)]">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#071d36] text-[#f3d37a]">
                        <Bot className="h-5 w-5" />
                      </span>
                      <div>
                        <h4 className="text-lg font-semibold text-[#071d36]">TOPRANK AI Trainer Monthly</h4>
                        <p className="text-sm text-[#64748b]">30 days of live exam coaching access</p>
                      </div>
                    </div>
                    <p className="mt-5 text-4xl font-semibold text-[#071d36]">Rs 2,999 <span className="text-base font-medium text-[#64748b]">/ month</span></p>
                    <p className="mt-4 text-sm leading-7 text-[#64748b]">Includes 24x7 AI Trainer, active learning practice, regular examination loop, profiling activation, revision guidance and mission-based performance improvement.</p>
                    <Button type="button" onClick={() => void startToprankPayment(selectedExam)} disabled={checkoutLoading} className="mt-5 w-full">
                      <CreditCard className="h-4 w-4" />
                      {hasTestAccess ? "Test Access Active" : checkoutLoading ? "Opening Razorpay..." : user?.role === "STUDENT" ? "Pay and Activate" : "Apply for Student Access"}
                    </Button>
                  </article>
                  <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-5">
                    <h4 className="font-semibold text-[#071d36]">What happens after payment?</h4>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-[#64748b]">
                      <p>1. Razorpay verifies the payment securely.</p>
                      <p>2. Your selected exam gets TOPRANK access for 30 days.</p>
                      <p>3. Training opens with profiling, practice loops and AI trainer guidance.</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#64748b]">No confusing tiers. One focused plan for students who want daily exam training and rank-focused improvement.</p>
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
