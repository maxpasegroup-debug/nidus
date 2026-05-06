"use client";

import { motion } from "framer-motion";
import { Bot, Brain, Radio, ShieldCheck } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import type { AIRecommendation, DoubtQuery, OfficerPotential } from "@/types/ai-engine";

export function AISkeleton() {
  return <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-lg border border-gold/10 bg-white/8" />)}</div>;
}

export function AIInterviewerCard({ title = "AI Interviewing Officer", note = "Voice interaction channel armed" }: { title?: string; note?: string }) {
  return <Card className="relative overflow-hidden p-6"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,166,70,0.22),transparent_55%)]" /><div className="relative flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-gold/10"><Bot className="h-7 w-7 text-gold" /></div><div><h3 className="text-xl font-black text-white">{title}</h3><p className="mt-1 text-sm text-muted">{note}</p></div></div><div className="relative mt-6 h-2 rounded-full bg-white/10"><motion.div className="h-2 rounded-full bg-gold" animate={{ width: ["20%", "80%", "45%"] }} transition={{ repeat: Infinity, duration: 3 }} /></div></Card>;
}

export function AIResponseCard({ title, body }: { title: string; body: string }) {
  return <Card className="p-5"><div className="flex items-start gap-3"><Brain className="mt-1 h-5 w-5 text-gold" /><div><h3 className="font-bold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-ink">{body}</p></div></div></Card>;
}

export function InterviewProgress({ answered, total }: { answered: number; total: number }) {
  const percent = total ? Math.round((answered / total) * 100) : 0;
  return <Card className="p-5"><p className="text-sm text-muted">Interview Progress</p><div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gold" style={{ width: `${percent}%` }} /></div><p className="mt-3 text-sm text-ink">{answered}/{total} analyzed</p></Card>;
}

export function RecommendationCard({ item }: { item: AIRecommendation }) {
  return <Card className="p-5"><div className="flex justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-gold">{item.category}</p><h3 className="mt-2 font-bold text-white">{item.recommendation}</h3></div><span className="h-fit rounded border border-gold/35 px-2 py-1 text-xs text-gold">{item.priority}</span></div></Card>;
}

export function OfficerReadinessGauge({ potential }: { potential: OfficerPotential }) {
  return <Card className="p-6 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-gold" /><p className="mt-4 text-sm text-muted">Officer Readiness</p><b className="mt-2 block text-5xl text-white">{Math.round(potential.officerReadiness)}%</b><p className="mt-4 text-sm leading-6 text-ink">{potential.aiSummary}</p></Card>;
}

export function DoubtChatBubble({ doubt }: { doubt: DoubtQuery }) {
  return <div className="space-y-3"><div className="max-w-[82%] rounded-lg border border-white/10 bg-white/8 p-4 text-sm text-ink">{doubt.question}</div><div className="ml-auto max-w-[88%] rounded-lg border border-gold/35 bg-gold/15 p-4 text-sm leading-6 text-gold-soft">{doubt.aiResponse}</div></div>;
}

export function OfficerRadar({ potential }: { potential: OfficerPotential }) {
  const data = [
    { trait: "Leadership", value: potential.leadershipScore },
    { trait: "Communication", value: potential.communicationScore },
    { trait: "Discipline", value: potential.disciplineScore },
    { trait: "Confidence", value: potential.confidenceScore }
  ];
  return <Card className="p-5"><div className="mb-3 flex items-center gap-2"><Radio className="h-5 w-5 text-gold" /><h3 className="font-bold text-white">Officer Analytics</h3></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><RadarChart data={data}><PolarGrid stroke="rgba(255,255,255,0.16)" /><PolarAngleAxis dataKey="trait" tick={{ fill: "#9fb0c7", fontSize: 12 }} /><Radar dataKey="value" stroke="#f2d675" fill="#c9a646" fillOpacity={0.28} /></RadarChart></ResponsiveContainer></div></Card>;
}
