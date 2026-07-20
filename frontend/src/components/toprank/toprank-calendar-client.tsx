"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { getTopRankMissionCalendar } from "@/services/toprank-mission-service";
import type { TopRankMission, TopRankMissionCalendarEntry } from "@/types/toprank";
import { MissionCalendar, MissionTimeline } from "./toprank-components";

export function TopRankCalendarClient() {
  const [month, setMonth] = useState<TopRankMissionCalendarEntry[]>([]);
  const [today, setToday] = useState<TopRankMissionCalendarEntry[]>([]);
  const [upcoming, setUpcoming] = useState<TopRankMission[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getTopRankMissionCalendar()
      .then((result) => {
        setMonth(result.month);
        setToday(result.today);
        setUpcoming(result.upcoming);
      })
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  if (error) return <p className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-bold text-red-100">{error}</p>;

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <section>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#f6d17a]">Mission Calendar</p>
        <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">Your 180-Day Roadmap</h1>
      </section>
      <section>
        <h2 className="text-2xl font-black text-white">Monthly Calendar</h2>
        <div className="mt-4"><MissionCalendar entries={month} /></div>
      </section>
      <section>
        <h2 className="text-2xl font-black text-white">Today&apos;s Schedule</h2>
        <div className="mt-4"><MissionTimeline missions={today.map((entry) => entry.mission)} /></div>
      </section>
      <section>
        <h2 className="text-2xl font-black text-white">Upcoming Missions</h2>
        <div className="mt-4"><MissionTimeline missions={upcoming} /></div>
      </section>
    </div>
  );
}

