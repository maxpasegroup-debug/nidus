"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { getTopRankMissionDashboard } from "@/services/toprank-mission-service";
import type { TopRankMissionDashboard } from "@/types/toprank";
import { DailyMissionWidget, MissionStats, MissionTimeline, WeeklySummary } from "./toprank-components";

export function TopRankMissionsClient() {
  const [data, setData] = useState<TopRankMissionDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTopRankMissionDashboard().then(setData).catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  if (error) return <p className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-bold text-red-100">{error}</p>;
  const primary = data?.todayMissions[0] ?? null;
  const study = data?.todayMissions.find((mission) => mission.missionType === "Study" || mission.missionType === "Revision") ?? primary;
  const physical = data?.todayMissions.find((mission) => mission.missionType === "Physical") ?? null;
  const battle = data?.todayMissions.find((mission) => mission.missionType === "Battle Test") ?? null;

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <DailyMissionWidget mission={primary} />
      {data ? <MissionStats stats={data.progress} /> : null}
      <div className="grid gap-5 md:grid-cols-3">
        <DailyMissionWidget mission={study} />
        <DailyMissionWidget mission={physical} />
        <DailyMissionWidget mission={battle} />
      </div>
      <section>
        <h2 className="text-2xl font-black text-white">Today&apos;s Mission Queue</h2>
        <div className="mt-4"><MissionTimeline missions={data?.todayMissions ?? []} /></div>
      </section>
      <section>
        <h2 className="text-2xl font-black text-white">Upcoming Mission</h2>
        <div className="mt-4"><MissionTimeline missions={data?.upcomingMission ? [data.upcomingMission] : []} /></div>
      </section>
      <section>
        <h2 className="text-2xl font-black text-white">Weekly Progress</h2>
        <div className="mt-4">{data ? <WeeklySummary weekly={data.weekly} /> : null}</div>
      </section>
    </div>
  );
}

