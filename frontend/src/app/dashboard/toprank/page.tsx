"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, CreditCard, Medal, X } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { topRankExams, type TopRankExam } from "@/components/marketing/public-modules";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useToast } from "@/components/providers/toast-provider";
import { useSubscriptions } from "@/hooks/use-payments";
import { createPaymentOrder, verifyPayment } from "@/services/payments";
import { openRazorpayCheckout } from "@/services/razorpay";
import { createToprankSession } from "@/services/toprank";

const TOPRANK_MONTHLY_BASE_AMOUNT = 2999;
const TOPRANK_GST_RATE = 0.18;
const TOPRANK_MONTHLY_PAYABLE_AMOUNT = Number((TOPRANK_MONTHLY_BASE_AMOUNT * (1 + TOPRANK_GST_RATE)).toFixed(2));

export default function DashboardToprankPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const subscriptions = useSubscriptions();
  const [selectedExam, setSelectedExam] = useState<TopRankExam | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [launchingExam, setLaunchingExam] = useState<string | null>(null);
  const hasTestAccess = user?.roleMetadata?.testAccess === true && user.roleMetadata?.paymentBypass === true;
  const hasToprankSubscription = (subscriptions.data ?? []).some((item) => {
    const active = ["ACTIVE", "PAID", "SUCCESS", "VERIFIED"].includes(item.status.toUpperCase());
    return active && item.planName.toLowerCase().includes("toprank") && new Date(item.endDate) >= new Date();
  });
  const hasToprankAccess = hasTestAccess || hasToprankSubscription;

  async function startToprankPayment() {
    if (!user) {
      showToast("Please login or start free before activating TOPRANK.", "error");
      return;
    }
    if (hasToprankAccess) {
      showToast("TOPRANK access is already active.", "success");
      return;
    }
    if (user.role !== "STUDENT") {
      showToast("Apply for student access before activating TOPRANK coaching.", "info");
      return;
    }

    setCheckoutLoading(true);
    try {
      const order = await createPaymentOrder({
        amount: TOPRANK_MONTHLY_PAYABLE_AMOUNT,
        product: "TOPRANK_MONTHLY",
        paymentMethod: "TOPRANK_MONTHLY"
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
              showToast("TOPRANK activated for 30 days across all exam arenas.", "success");
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

  async function startExamCoaching(exam: TopRankExam) {
    if (!hasToprankAccess) {
      setSelectedExam(exam);
      showToast("Subscribe once to unlock the full TOPRANK arena.", "info");
      return;
    }
    if (exam.slug !== "nda") {
      setSelectedExam(exam);
      showToast(`${exam.title} arena is unlocked. Live AI launch will appear as this exam route is connected.`, "info");
      return;
    }

    setLaunchingExam(exam.slug);
    try {
      const { launchUrl } = await createToprankSession("nda-army");
      window.location.assign(launchUrl);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to start TOPRANK coaching.", "error");
    } finally {
      setLaunchingExam(null);
    }
  }

  return (
    <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}>
      <div className="space-y-8">
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_52%,#dce9f3_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">TOPRANK Exam Ecosystem</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">Choose your exam. Train for top ranks.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">
            Subscribe once and unlock the TOPRANK arena for all exam tracks. Train with active learning practice, regular exam loops, profiling and 24x7 AI trainer guidance.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="rounded border border-[#b9913f]/35 bg-white/80 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3f4a32]">Single TOPRANK Subscription</p>
              <p className="mt-2 text-4xl font-semibold text-[#071d36]">Rs 2,999 <span className="text-base font-medium text-[#64748b]">+ GST / month</span></p>
              <p className="mt-2 text-sm text-[#64748b]">Payable today: Rs {TOPRANK_MONTHLY_PAYABLE_AMOUNT.toLocaleString("en-IN")} for 30 days access.</p>
            </div>
            <Button type="button" onClick={() => void startToprankPayment()} disabled={checkoutLoading || hasToprankAccess} className="w-full lg:w-auto">
              <CreditCard className="h-4 w-4" />
              {hasToprankAccess ? "Access Active" : checkoutLoading ? "Opening Razorpay..." : "Subscribe Once"}
            </Button>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {topRankExams.map((exam) => {
            const Icon = exam.icon;
            return (
              <article key={exam.slug} className="group overflow-hidden rounded-lg border border-[#071d36]/10 bg-white text-left shadow-[0_18px_60px_rgba(7,29,54,0.08)] transition hover:-translate-y-1 hover:border-[#b9913f]/45">
                <button type="button" onClick={() => setSelectedExam(exam)} className="block w-full text-left">
                  <div className="relative aspect-[16/9] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,10,20,0.06),rgba(5,10,20,0.55)),url('${exam.image}')` }}>
                  <Icon className="absolute bottom-4 left-4 h-7 w-7 text-white" />
                  <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#071d36]">{exam.status === "live" ? "Live" : "Preview"}</span>
                  </div>
                </button>
                <div className="p-5">
                  <h2 className="text-3xl font-semibold text-[#071d36]">{exam.title}</h2>
                  <p className="mt-2 min-h-14 text-sm leading-6 text-[#64748b]">{exam.subtitle}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#071d36]">
                    {hasToprankAccess ? "Start Exam Coaching" : "View Training Plan"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                  {hasToprankAccess ? (
                    <Button type="button" size="sm" onClick={() => void startExamCoaching(exam)} disabled={launchingExam === exam.slug} className="mt-4 w-full">
                      {launchingExam === exam.slug ? "Starting..." : "Start Coaching"}
                    </Button>
                  ) : null}
                </div>
              </article>
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
                    <p className="mt-5 text-4xl font-semibold text-[#071d36]">Rs 2,999 <span className="text-base font-medium text-[#64748b]">+ GST / month</span></p>
                    <p className="mt-2 text-sm font-semibold text-[#3f4a32]">One subscription unlocks TOPRANK access for every exam arena.</p>
                    <p className="mt-4 text-sm leading-7 text-[#64748b]">Includes 24x7 AI Trainer, active learning practice, regular examination loop, profiling activation, revision guidance and mission-based performance improvement.</p>
                    <Button type="button" onClick={() => hasToprankAccess ? void startExamCoaching(selectedExam) : void startToprankPayment()} disabled={checkoutLoading || launchingExam === selectedExam.slug} className="mt-5 w-full">
                      <CreditCard className="h-4 w-4" />
                      {hasToprankAccess ? launchingExam === selectedExam.slug ? "Starting..." : "Start Exam Coaching" : checkoutLoading ? "Opening Razorpay..." : user?.role === "STUDENT" ? "Subscribe and Unlock" : "Apply for Student Access"}
                    </Button>
                  </article>
                  <div className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-5">
                    <h4 className="font-semibold text-[#071d36]">What happens after payment?</h4>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-[#64748b]">
                      <p>1. Razorpay verifies the payment securely.</p>
                      <p>2. TOPRANK arena unlocks for all exams for 30 days.</p>
                      <p>3. Choose an exam and continue coaching from inside the arena.</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#64748b]">No exam-wise payments. One focused subscription for students who want daily exam training and rank-focused improvement.</p>
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
