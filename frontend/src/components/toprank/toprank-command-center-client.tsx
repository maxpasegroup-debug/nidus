"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { getTopRankMe } from "@/services/toprank-auth-service";
import { getTopRankAssessmentStatus } from "@/services/toprank-assessment-service";
import { getTopRankOnboardingStatus } from "@/services/toprank-enrollment-service";
import { getTopRankMissionDashboard } from "@/services/toprank-mission-service";
import type { TopRankAssessmentStatus, TopRankMissionDashboard, TopRankOnboardingStatus, TopRankUser } from "@/types/toprank";
import { CommandCenterCard, DailyMissionWidget, MissionStats, WelcomeBanner } from "./toprank-components";

export function TopRankCommandCenterClient() {
  const [user, setUser] = useState<TopRankUser | null>(null);
  const [status, setStatus] = useState<TopRankOnboardingStatus | null>(null);
  const [assessment, setAssessment] = useState<TopRankAssessmentStatus | null>(null);
  const [missions, setMissions] = useState<TopRankMissionDashboard | null>(null);
  const [error, setError] = useState("");
  const [daysUntilStart, setDaysUntilStart] = useState(0);

  useEffect(() => {
    Promise.all([getTopRankMe(), getTopRankOnboardingStatus(), getTopRankAssessmentStatus(), getTopRankMissionDashboard()])
      .then(([me, onboarding, assessmentStatus, missionData]) => {
        if (!assessmentStatus.completed) {
          window.location.href = "/toprank/assessment";
          return;
        }
        setUser(me.user);
        setStatus(onboarding);
        setAssessment(assessmentStatus);
        setMissions(missionData);
        const startDate = onboarding.selectedBatch?.startDate ? new Date(onboarding.selectedBatch.startDate) : null;
        setDaysUntilStart(startDate ? Math.max(0, Math.ceil((startDate.getTime() - Date.now()) / 86400000)) : 0);
      })
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  if (error) return <p className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-bold text-red-100">{error}</p>;

  const startDate = status?.selectedBatch?.startDate ? new Date(status.selectedBatch.startDate) : null;
  const todayMission = missions?.todayMissions[0] ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      <WelcomeBanner name={user?.name ?? "TopRank Student"} batchName={status?.selectedBatch?.name} />
      <div className="mt-8">
        <DailyMissionWidget mission={todayMission} />
      </div>
      <div className="mt-8">
        {missions ? <MissionStats stats={missions.progress} /> : null}
      </div>
      <div className="mt-8 grid gap-5">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <CommandCenterCard title="Today's Study Time" value={`${todayMission?.estimatedMinutes ?? 0} min`} note="Planned from APR and profile." />
          <CommandCenterCard title="Weekly Completion" value={`${missions?.progress.completion ?? 0}%`} note="Mission completion across generated roadmap." />
          <CommandCenterCard title="Upcoming Revision" value={missions?.upcomingMission?.title ?? "Pending"} note="Next mission in your queue." />
          <CommandCenterCard title="APR Readiness" value={assessment?.apr ? `${Math.round(assessment.apr.overallScore)}%` : "Pending"} note="RC4 diagnostic readiness baseline." />
          <CommandCenterCard title="Batch Information" value={status?.selectedBatch?.name ?? "Selection Pending"} note="Batch allocation from the TopRank batch system." />
          <CommandCenterCard title="Upcoming Batch" value={startDate ? startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Pending"} note="Training start date based on selected batch." />
          <CommandCenterCard title="Training Starts In" value={`${daysUntilStart} days`} note="Countdown is based on the assigned batch date." />
        </div>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <Link href="/toprank/student/missions" className="rounded-full bg-[#d6a447] px-5 py-3 text-center text-sm font-black text-[#06120e]">Quick Continue</Link>
        <Link href="/toprank/student/calendar" className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-white">Mission Calendar</Link>
        <Link href="/toprank/student/apr" className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-white">View APR</Link>
        <Link href="/toprank/student/profile" className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-white">Profile</Link>
      </div>
    </div>
  );
}
