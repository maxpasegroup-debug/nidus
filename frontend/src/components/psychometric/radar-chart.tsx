"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart as ReRadarChart, ResponsiveContainer } from "recharts";

export function RadarChart({ data }: { data: Array<{ trait: string; value: number }> }) {
  return (
    <div className="h-96 rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <p className="font-semibold text-white">OLQ Radar</p>
      <ResponsiveContainer width="100%" height="90%">
        <ReRadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.16)" />
          <PolarAngleAxis dataKey="trait" stroke="#9fb0c7" fontSize={11} />
          <Radar dataKey="value" stroke="#f2d675" fill="#f2d675" fillOpacity={0.28} />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
