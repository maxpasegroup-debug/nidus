"use client";

import { motion } from "framer-motion";
import { Award, CalendarDays, Clock, Flame, Swords } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import type { CurrentAffair, LeaderboardEntry, PYQQuestion, QuizBattle } from "@/types/learning-hub";

export function LearningEmptyState({ title, note }: { title: string; note: string }) {
  return <Card className="p-6 text-center text-sm text-muted"><p className="text-base font-bold text-ink">{title}</p><p className="mt-2">{note}</p></Card>;
}

export function PYQCard({ question }: { question: PYQQuestion }) {
  const [revealed, setRevealed] = useState(false);
  const options = [
    ["A", question.optionA],
    ["B", question.optionB],
    ["C", question.optionC],
    ["D", question.optionD]
  ];
  return <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-gold">{question.category?.examType} {question.year}</p><h3 className="mt-2 font-bold text-white">{question.questionText}</h3></div><span className="rounded border border-gold/35 px-2 py-1 text-xs text-gold">{question.difficultyLevel}</span></div><div className="mt-4 grid gap-2 text-sm text-ink">{options.map(([key, option]) => <p key={key}>{key}. {option}</p>)}</div><button className="mt-4 rounded border border-gold/35 px-3 py-2 text-sm text-gold" onClick={() => setRevealed((current) => !current)}>{revealed ? "Hide" : "Reveal"} Answer</button>{revealed ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-ink">Answer {question.correctAnswer}: {question.explanation}</p> : null}</Card>;
}

export function CurrentAffairCard({ item }: { item: CurrentAffair }) {
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><Card className="overflow-hidden"><div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl || "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf"})` }} /><div className="p-5"><p className="text-xs uppercase tracking-[0.2em] text-gold">{item.category}</p><h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3><p className="mt-3 text-sm leading-6 text-ink">{item.description}</p><p className="mt-3 text-xs text-muted">{new Date(item.publishedDate).toLocaleDateString()} · {item.quizzes?.length ?? 0} quiz items</p></div></Card></motion.div>;
}

export function QuizTimer({ endTime }: { endTime: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemaining(`${minutes}m ${seconds}s`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endTime]);
  return <span className="inline-flex items-center gap-2 text-sm text-gold"><Clock className="h-4 w-4" />{remaining}</span>;
}

export function QuizBattleCard({ battle, onJoin, onSubmit }: { battle: QuizBattle; onJoin?: () => void; onSubmit?: () => void }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-gold">{battle.category}</p><h3 className="mt-2 text-xl font-bold text-white">{battle.title}</h3></div><Swords className="h-6 w-6 text-gold" /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><QuizTimer endTime={battle.endTime} /><span className="text-sm text-muted">{battle.participants?.length ?? 0} cadets</span></div><div className="mt-4 flex gap-2">{onJoin ? <button onClick={onJoin} className="rounded border border-gold/35 px-3 py-2 text-sm text-gold">Join battle</button> : null}{onSubmit ? <button onClick={onSubmit} className="rounded border border-white/12 px-3 py-2 text-sm text-ink">Submit demo score</button> : null}</div></Card>;
}

export function StreakBadge({ streak }: { streak: number }) {
  return <span className="inline-flex items-center gap-1 rounded border border-gold/35 bg-gold/15 px-2 py-1 text-xs text-gold"><Flame className="h-3 w-3" />{streak} day streak</span>;
}

export function LeaderboardTable({ rows }: { rows: LeaderboardEntry[] }) {
  return <div className="table-scroll rounded-lg border border-white/10"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-white/8 text-muted"><tr><th className="p-3">Rank</th><th>Cadet</th><th>XP Points</th><th>Streak</th><th>Badge</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id} className="border-t border-white/10"><td className="p-3 text-xl font-black text-gold">#{row.rank ?? index + 1}</td><td className="font-semibold text-white">{row.user?.name ?? row.userId}</td><td>{row.points}</td><td><StreakBadge streak={row.streak} /></td><td><span className="inline-flex items-center gap-1 text-gold"><Award className="h-4 w-4" />{index === 0 ? "Command Gold" : index < 3 ? "Battle Silver" : "Rising Cadet"}</span></td></tr>)}</tbody></table></div>;
}

export function LearningAnalytics({ rows }: { rows: LeaderboardEntry[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = useMemo(() => rows.slice(0, 8).map((row) => ({ label: row.user?.name?.split(" ")[0] ?? "Cadet", value: row.points })), [rows]);
  return <Card className="p-5"><div className="mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-gold" /><h3 className="font-bold text-white">XP Analytics</h3></div><div className="h-56">{mounted ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#9fb0c7" /><YAxis stroke="#9fb0c7" /><Tooltip /><Bar dataKey="value" fill="#c9a646" /></BarChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}</div></Card>;
}
