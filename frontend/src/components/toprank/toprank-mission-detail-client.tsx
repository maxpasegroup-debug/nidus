"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { completeTopRankMission, getTopRankMissionDetail } from "@/services/toprank-mission-service";
import type { TopRankMission } from "@/types/toprank";
import { MissionChecklist, MissionHeader } from "./toprank-components";

export function TopRankMissionDetailClient({ missionId }: { missionId: string }) {
  const router = useRouter();
  const [mission, setMission] = useState<TopRankMission | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getTopRankMissionDetail(missionId).then((result) => setMission(result.mission)).catch((err) => setError(getApiErrorMessage(err)));
  }, [missionId]);

  async function complete() {
    setBusy(true);
    setError("");
    try {
      await completeTopRankMission(missionId, notes);
      router.push("/toprank/student/missions");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-bold text-red-100">{error}</p>;
  if (!mission) return <p className="text-sm font-bold text-[#b9c2b4]">Loading mission...</p>;

  const objectives = Array.isArray(mission.objectives) ? mission.objectives : [];

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <MissionHeader mission={mission} />
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5">
        <h2 className="text-2xl font-black text-white">Objectives</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">{objectives.map((objective) => <div key={objective} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-bold text-[#dbe4d7]">{objective}</div>)}</div>
      </section>
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5">
        <h2 className="text-2xl font-black text-white">Completion Checklist</h2>
        <div className="mt-4"><MissionChecklist tasks={mission.tasks ?? []} /></div>
      </section>
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5">
        <h2 className="text-2xl font-black text-white">Notes</h2>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-4 min-h-28 w-full rounded-xl border border-white/12 bg-[#06120e] px-4 py-3 text-white outline-none focus:border-[#d6a447]" />
        <button type="button" disabled={busy} onClick={() => void complete()} className="mt-5 min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e] disabled:opacity-60">{busy ? "Saving" : "Mark Complete"}</button>
      </section>
    </div>
  );
}

