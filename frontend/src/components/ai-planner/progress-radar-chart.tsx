"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

export function ProgressRadarChart({ data }: { data: Array<{ trait: string; value: number }> }) {
  return (
    <div className="h-80 rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <p className="font-semibold text-white">Progress radar</p>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.15)" />
          <PolarAngleAxis dataKey="trait" stroke="#9fb0c7" fontSize={12} />
          <Radar dataKey="value" stroke="#f2d675" fill="#f2d675" fillOpacity={0.25} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
