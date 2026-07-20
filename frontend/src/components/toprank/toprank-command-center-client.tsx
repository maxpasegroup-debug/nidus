"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { getTopRankMe } from "@/services/toprank-auth-service";
import { getTopRankAssessmentStatus } from "@/services/toprank-assessment-service";
import { getTopRankOnboardingStatus } from "@/services/toprank-enrollment-service";
import type { TopRankAssessmentStatus, TopRankOnboardingStatus, TopRankUser } from "@/types/toprank";
import { CommandCenterCard, ProgressRing, WelcomeBanner } from "./toprank-components";

export function TopRankCommandCenterClient() {
  const [user, setUser] = useState<TopRankUser | null>(null);
  const [status, setStatus] = useState<TopRankOnboardingStatus | null>(null);
  const [assessment, setAssessment] = useState<TopRankAssessmentStatus | null>(null);
  const [error, setError] = useState("");
  const [daysUntilStart, setDaysUntilStart] = useState(0);

  useEffect(() => {
    Promise.all([getTopRankMe(), getTopRankOnboardingStatus(), getTopRankAssessmentStatus()])
      .then(([me, onboarding, assessmentStatus]) => {
        if (!assessmentStatus.completed) {
          window.location.href = "/toprank/assessment";
          return;
        }
        setUser(me.user);
        setStatus(onboarding);
        setAssessment(assessmentStatus);
        const startDate = onboarding.selectedBatch?.startDate ? new Date(onboarding.selectedBatch.startDate) : null;
        setDaysUntilStart(startDate ? Math.max(0, Math.ceil((startDate.getTime() - Date.now()) / 86400000)) : 0);
      })
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  if (error) return <p className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-bold text-red-100">{error}</p>;

  const profileCompletion = status?.profile?.completionPercentage ?? 0;
  const startDate = status?.selectedBatch?.startDate ? new Date(status.selectedBatch.startDate) : null;

  return (
    <div className="mx-auto max-w-6xl">
      <WelcomeBanner name={user?.name ?? "TopRank Student"} batchName={status?.selectedBatch?.name} />
      <div className="mt-8 grid gap-5 lg:grid-cols-[260px_1fr]">
        <ProgressRing value={profileCompletion} label="Profile Completion" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <CommandCenterCard title="Program Status" value={status?.enrollment.status ?? "Loading"} note="Enrollment state for Agniveer RC3 onboarding." />
          <CommandCenterCard title="APR Readiness" value={assessment?.apr ? `${Math.round(assessment.apr.overallScore)}%` : "Pending"} note="RC4 diagnostic readiness baseline." />
          <CommandCenterCard title="Assessment Status" value={assessment?.completed ? "Completed" : "Pending"} note={assessment?.assessment?.completedAt ? `Completed on ${new Date(assessment.assessment.completedAt).toLocaleDateString("en-IN")}` : "Assessment required before dashboard entry."} />
          <CommandCenterCard title="Batch Information" value={status?.selectedBatch?.name ?? "Selection Pending"} note="Batch allocation from the TopRank batch system." />
          <CommandCenterCard title="Orientation Progress" value="0%" note="Placeholder until orientation tracking is activated." />
          <CommandCenterCard title="Upcoming Batch" value={startDate ? startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Pending"} note="Training start date based on selected batch." />
          <CommandCenterCard title="Training Starts In" value={`${daysUntilStart} days`} note="Countdown is based on the assigned batch date." />
          <CommandCenterCard title="Enrollment Complete" value={status?.enrollment.status === "ENROLLED" ? "Yes" : "In Progress"} note="Complete onboarding to unlock future RC training engines." />
        </div>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <Link href="/toprank/gateway/agniveer/orientation" className="rounded-full bg-[#d6a447] px-5 py-3 text-center text-sm font-black text-[#06120e]">Watch Orientation</Link>
        <Link href="/toprank/student/profile" className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-white">Complete Profile</Link>
        <Link href="/toprank/student/apr" className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-white">View APR</Link>
        <span className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-[#95a08f]">Begin Training</span>
      </div>
    </div>
  );
}
