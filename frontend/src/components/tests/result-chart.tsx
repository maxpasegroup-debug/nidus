"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ResultChart({
  data
}: {
  data: Array<{ topic: string; accuracy: number }>;
}) {
  return (
    <div className="h-72 rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <p className="font-semibold text-white">Topic-wise analysis</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="topic" stroke="#9fb0c7" tickLine={false} axisLine={false} />
            <YAxis stroke="#9fb0c7" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#06111f", border: "1px solid rgba(201,166,70,0.3)", borderRadius: 8 }} />
            <Bar dataKey="accuracy" fill="#f2d675" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
