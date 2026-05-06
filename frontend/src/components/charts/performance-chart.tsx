"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

type ChartPoint = {
  label: string;
  score: number;
  attendance: number;
};

type PerformanceChartProps = {
  title: string;
  data: ChartPoint[];
};

export function PerformanceChart({ title, data }: PerformanceChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <DashboardCard className="p-5">
      <p className="font-semibold text-white">{title}</p>
      <div className="mt-5 h-72 min-h-72 min-w-0">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f2d675" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#f2d675" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#9fb0c7" tickLine={false} axisLine={false} />
              <YAxis stroke="#9fb0c7" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(6,17,31,0.94)",
                  border: "1px solid rgba(201,166,70,0.28)",
                  borderRadius: 8,
                  color: "#eef4ff"
                }}
              />
              <Area type="monotone" dataKey="score" stroke="#f2d675" fill="url(#scoreGradient)" />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#60a5fa"
                fill="url(#attendanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full animate-pulse rounded border border-white/10 bg-white/[0.05]" />
        )}
      </div>
    </DashboardCard>
  );
}
