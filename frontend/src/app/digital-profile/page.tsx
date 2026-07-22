"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, Download, GraduationCap, Medal, Share2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { DashboardError, DashboardSkeleton, RoleDashboardGuard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { useStudentDashboard } from "@/hooks/use-dashboard";
import { getMyNdpReviews } from "@/services/academy";

export default function DigitalProfilePage() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const { data, isLoading, error, refetch } = useStudentDashboard(Boolean(isStudent));
  const ndpQuery = useQuery({ queryKey: ["digital-profile", "ndp"], queryFn: getMyNdpReviews, enabled: Boolean(isStudent) });

  if (isStudent && isLoading) return <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}><DashboardSkeleton /></RoleDashboardGuard>;
  if (isStudent && (error || !data)) return <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}><DashboardError error={error} onRefresh={() => refetch()} /></RoleDashboardGuard>;

  const name = data?.profile?.name ?? user?.name ?? "NIDUS User";
  const email = data?.profile?.email ?? user?.email ?? "Email pending";
  const completedReports = data?.assessmentProfile?.completedCount ?? 0;
  const readiness = data?.assessmentProfile?.averageScore ?? 0;
  const profileCompletion = isStudent ? Math.min(100, 35 + completedReports * 8 + (data?.enrolledCourses.length ? 20 : 0)) : 28;
  const target = data?.enrolledCourses[0]?.title ?? "Defence Career Pathway";
  const latestNdp = ndpQuery.data?.reviews?.[0] ?? null;

  return (
    <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}>
      <div className="space-y-8">
        <section className="rounded-lg border border-[#071d36]/10 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_55%,#dce9f3_100%)] p-6 shadow-[0_28px_90px_rgba(7,29,54,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f4a32]">Digital Profile</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#071d36] sm:text-6xl">{name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">
            A hybrid digital profile designed as a portfolio, CV and shareable recruiter-ready identity for defence training, academics, assessments, discipline and leadership growth.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/dashboard/student#assessments">
              Complete Assessments <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/join" variant="secondary">
              <Share2 className="h-4 w-4" />
              Share for Counselling
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          {[
            ["Profile Completion", `${profileCompletion}%`],
            ["Readiness Signal", readiness ? `${readiness}/100` : "Pending"],
            ["Assessment Reports", String(completedReports)],
            ["Primary Path", target],
            ["NDP Status", latestNdp ? `${latestNdp.reviewPeriod} published` : "Not published"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#071d36]/10 bg-white p-5 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
              <p className="text-sm text-[#64748b]">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#071d36]">{value}</p>
            </div>
          ))}
        </section>

        {isStudent ? (
          <section className="rounded-lg border border-[#071d36]/10 bg-white p-6 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b9913f]">NIDUS Digital Profile</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#071d36]">{latestNdp ? `${latestNdp.reviewPeriod} NDP is published` : "NDP report pending"}</h2>
            <p className="mt-2 text-sm leading-7 text-[#64748b]">
              {latestNdp
                ? `Overall readiness ${latestNdp.scores?.overallReadiness ?? "--"}%. Open the complete progress profile to see term marks, teacher remarks and action plan.`
                : "Your NDP term marks and teacher performance review will appear after Academic Head approval and publication."}
            </p>
            <div className="mt-4">
              <Button href="/dashboard/student/progress">Open Complete Profile <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-[#071d36]/10 bg-white p-6 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <UserRound className="h-7 w-7 text-[#b9913f]" />
            <h2 className="mt-4 text-2xl font-semibold text-[#071d36]">Profile Identity</h2>
            <div className="mt-5 grid gap-3 text-sm">
              <Info label="Name" value={name} />
              <Info label="Email" value={email} />
              <Info label="Role" value={user?.role ?? "GUEST"} />
              <Info label="Portfolio Status" value={isStudent ? "Student profile active" : "Guest profile started"} />
            </div>
          </div>

          <div className="rounded-lg border border-[#071d36]/10 bg-white p-6 shadow-[0_18px_60px_rgba(7,29,54,0.08)]">
            <BriefcaseBusiness className="h-7 w-7 text-[#b9913f]" />
            <h2 className="mt-4 text-2xl font-semibold text-[#071d36]">Recruiter Magnetic Profile Layers</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                [ShieldCheck, "Defence intent", "Career direction and uniform ambition."],
                [ClipboardCheck, "Assessment reports", "Personality, leadership and readiness signals."],
                [GraduationCap, "Academic pathway", "Courses, programs and learning progress."],
                [Medal, "Leadership signal", "Discipline, confidence and officer potential."],
                [Sparkles, "NIDUS Guru growth", "Focus, habits and personal transformation."],
                [Download, "Shareable CV profile", "Future PDF/share link ready structure."]
              ].map(([Icon, title, text]) => {
                const ItemIcon = Icon as typeof ShieldCheck;
                return (
                  <div key={String(title)} className="rounded border border-[#071d36]/10 bg-[#f7f3ea] p-4">
                    <ItemIcon className="h-5 w-5 text-[#b9913f]" />
                    <h3 className="mt-3 font-semibold text-[#071d36]">{String(title)}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{String(text)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#b9913f]/25 bg-[#071d36] p-6 text-white shadow-[0_24px_80px_rgba(7,29,54,0.18)]">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e7c873]">Next Profile Upgrade</p>
              <h2 className="mt-3 text-3xl font-semibold">Make your profile stronger.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Complete assessments and apply to the academy to convert this into a full student portfolio.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/dashboard/student#assessments">Assessments</Button>
            </div>
          </div>
        </section>
      </div>
    </RoleDashboardGuard>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-[#071d36]/10 bg-[#f7f3ea] px-3 py-2">
      <span className="text-[#64748b]">{label}</span>
      <span className="text-right font-semibold text-[#071d36]">{value}</span>
    </div>
  );
}
