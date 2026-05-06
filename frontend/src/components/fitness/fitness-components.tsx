"use client";

import { motion } from "framer-motion";
import { Activity, CalendarDays, Droplets, Flame, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { DailyFitnessLog, FitnessProfile, PhysicalEligibility, PTSchedule } from "@/types/fitness";

export function FitnessEmptyState({ title, note }: { title: string; note: string }) {
  return <Card className="p-6 text-center text-sm text-muted"><p className="text-base font-bold text-ink">{title}</p><p className="mt-2">{note}</p></Card>;
}

export function FitnessStatCard({ label, value, note, icon }: { label: string; value: string; note: string; icon?: "run" | "water" | "fire" | "shield" }) {
  const Icon = icon === "water" ? Droplets : icon === "fire" ? Flame : icon === "shield" ? ShieldCheck : Activity;
  return <Card className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted">{label}</p><Icon className="h-5 w-5 text-gold" /></div><b className="mt-3 block text-3xl text-white">{value}</b><p className="mt-2 text-xs text-muted">{note}</p></Card>;
}

export function BMIWidget({ profile }: { profile?: FitnessProfile | null }) {
  const bmi = profile?.bmi ?? 0;
  return <Card className="p-6"><p className="text-sm text-muted">BMI Readiness</p><b className="mt-2 block text-5xl text-white">{bmi || "--"}</b><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gold" style={{ width: `${Math.min(Math.max((bmi / 30) * 100, 0), 100)}%` }} /></div><p className="mt-3 text-sm text-gold">{profile?.fitnessLevel ?? "Profile pending"}</p></Card>;
}

export function PTScheduleCard({ schedule, onAttend }: { schedule: PTSchedule; onAttend?: () => void }) {
  return <Card className="p-5"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-white">{schedule.title}</h3><p className="text-sm text-muted">{schedule.activityType} - {schedule.duration} min</p></div><CalendarDays className="h-5 w-5 text-gold" /></div><p className="mt-4 text-sm text-ink">{schedule.description}</p><p className="mt-3 text-xs text-muted">{new Date(schedule.scheduledDate).toLocaleString()} with {schedule.trainerName}</p>{onAttend ? <button onClick={onAttend} className="mt-4 rounded border border-gold/35 px-3 py-2 text-sm text-gold">Mark Present</button> : null}</Card>;
}

export function EligibilityIndicator({ item }: { item: PhysicalEligibility }) {
  const ready = item.eligibilityStatus === "ELIGIBLE";
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{item.examType}</h3><p className="mt-2 text-sm text-muted">{item.overallRemark}</p></div><span className={`rounded border px-2 py-1 text-xs ${ready ? "border-emerald-300/40 text-emerald-100" : "border-gold/35 text-gold"}`}>{item.eligibilityStatus}</span></div><div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-muted">{[["Height", item.heightEligible], ["Weight", item.weightEligible], ["BMI", item.bmiEligible], ["Stamina", item.staminaEligible]].map(([label, ok]) => <span key={String(label)}><b className="block text-base text-white">{ok ? "YES" : "NO"}</b>{label}</span>)}</div></Card>;
}

export function WorkoutLogCard({ log }: { log: DailyFitnessLog }) {
  return <Card className="p-5"><h3 className="font-bold text-white">{new Date(log.createdAt).toLocaleDateString()}</h3><div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted"><span><b className="block text-lg text-white">{log.runningDistance} km</b>Running</span><span><b className="block text-lg text-white">{log.caloriesBurned}</b>Calories</span><span><b className="block text-lg text-white">{log.waterIntake} L</b>Water</span><span><b className="block text-lg text-white">{log.workoutDuration} min</b>Workout</span></div><p className="mt-4 text-sm text-ink">{log.notes ?? "No notes"}</p></Card>;
}

export function FitnessProgressChart({ logs, type = "line" }: { logs: DailyFitnessLog[]; type?: "line" | "bar" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = logs.slice().reverse().map((log) => ({ label: new Date(log.createdAt).toLocaleDateString(undefined, { weekday: "short" }), running: log.runningDistance, calories: log.caloriesBurned, duration: log.workoutDuration }));
  return <Card className="p-5"><h3 className="mb-4 font-bold text-white">Weekly Fitness Progress</h3><div className="h-56">{mounted ? <ResponsiveContainer width="100%" height="100%">{type === "bar" ? <BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#9fb0c7" /><YAxis stroke="#9fb0c7" /><Tooltip /><Bar dataKey="calories" fill="#c9a646" /></BarChart> : <LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#9fb0c7" /><YAxis stroke="#9fb0c7" /><Tooltip /><Line dataKey="running" stroke="#f2d675" strokeWidth={3} /><Line dataKey="duration" stroke="#2dd4bf" strokeWidth={3} /></LineChart>}</ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}</div></Card>;
}
