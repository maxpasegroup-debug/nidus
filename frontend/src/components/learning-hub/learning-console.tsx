"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Newspaper, Swords, Trophy } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrentAffairCard, LeaderboardTable, LearningAnalytics, LearningEmptyState, PYQCard, QuizBattleCard, StreakBadge } from "@/components/learning-hub/learning-components";
import { useCurrentAffairs, useLeaderboard, usePYQBank, useQuizBattles } from "@/hooks/use-learning-hub";

type LearningView = "pyq" | "current" | "battles" | "leaderboard";

const links = [
  ["/pyq-bank", "PYQ Bank", BookOpen],
  ["/current-affairs", "Current Affairs", Newspaper],
  ["/quiz-battles", "Quiz Battles", Swords],
  ["/leaderboard", "Leaderboard", Trophy]
] as const;

function value(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

export function LearningConsole({ view }: { view: LearningView }) {
  const [filters, setFilters] = useState({ examType: "", subject: "", year: "", search: "" });
  const [currentCategory, setCurrentCategory] = useState("");
  const pyq = usePYQBank({ examType: filters.examType || undefined, subject: filters.subject || undefined, year: filters.year || undefined, search: filters.search || undefined });
  const currentAffairs = useCurrentAffairs(currentCategory || undefined);
  const battles = useQuizBattles();
  const leaderboard = useLeaderboard();
  const pyqQuestions = pyq.questions.data ?? [];
  const currentData = currentAffairs.data ?? [];
  const battleData = battles.data ?? [];
  const leaderboardData = leaderboard.data ?? [];

  return (
    <motion.div className="space-y-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">NIDUS Learning Arena</p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">PYQ Bank, Current Affairs & Quiz Battle</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Gamified defence learning with previous year questions, daily affairs, live quiz duels, XP points, streaks and rank badges.</p>
        </div>
        <div className="flex flex-wrap gap-2">{links.map(([href, label, Icon]) => <Link key={href} href={href} className="inline-flex h-10 items-center gap-2 rounded border border-white/10 px-3 text-sm text-ink transition hover:border-gold/50 hover:text-gold"><Icon className="h-4 w-4" />{label}</Link>)}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><p className="text-sm text-muted">PYQ Questions</p><b className="mt-2 block text-3xl text-white">{pyqQuestions.length}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Daily Affairs</p><b className="mt-2 block text-3xl text-white">{currentData.length}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Live Battles</p><b className="mt-2 block text-3xl text-white">{battleData.length}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Top Streak</p><b className="mt-2 block text-3xl text-white">{leaderboardData[0]?.streak ?? 0}</b></Card>
      </section>

      {view === "pyq" ? (
        <section className="space-y-4">
          <Card className="p-5"><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; setFilters({ examType: value(form, "examType"), subject: value(form, "subject"), year: value(form, "year"), search: value(form, "search") }); }}><div className="grid gap-3 md:grid-cols-4"><Input name="examType" label="Exam" placeholder="NDA/CDS" /><Input name="subject" label="Subject" /><Input name="year" label="Year" /><Input name="search" label="Search" /></div><div className="mt-4"><Button size="sm">Apply Filters</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2">{pyqQuestions.length ? pyqQuestions.map((question) => <PYQCard key={question.id} question={question} />) : <LearningEmptyState title="No PYQs found" note="Try a different exam, subject, year or search term." />}</div>
        </section>
      ) : null}

      {view === "current" ? (
        <section className="space-y-4">
          <Card className="p-5"><div className="flex flex-wrap gap-2">{["", "Defence Reform", "Maritime Security", "International Relations"].map((item) => <button key={item || "all"} onClick={() => setCurrentCategory(item)} className={`rounded border px-3 py-2 text-sm ${currentCategory === item ? "border-gold bg-gold/15 text-gold-soft" : "border-white/10 text-ink"}`}>{item || "All"}</button>)}</div></Card>
          <Card className="p-5"><h2 className="text-xl font-bold text-white">Monthly Capsule</h2><p className="mt-3 text-sm leading-6 text-muted">Defence reforms, maritime security, jointness, space and cyber awareness are grouped for rapid NDA/CDS revision. Achievement placeholders are ready for capsule completion badges.</p></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{currentData.map((item) => <CurrentAffairCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {view === "battles" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="text-xl font-bold text-white">Real-time Leaderboard Placeholder</h2><p className="mt-3 text-sm text-muted">Live socket updates can plug into this battle surface later; current submissions update the persistent leaderboard and participant ranks.</p></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{battleData.map((battle) => <QuizBattleCard key={battle.id} battle={battle} onJoin={() => battles.join.mutate(battle.id)} onSubmit={() => battles.submit.mutate({ battleId: battle.id, score: Math.floor(70 + Math.random() * 30), timeTaken: Math.floor(240 + Math.random() * 120) })} />)}</div>
        </section>
      ) : null}

      {view === "leaderboard" ? (
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]"><LeaderboardTable rows={leaderboardData} /><LearningAnalytics rows={leaderboardData} /></div>
          <div className="grid gap-4 md:grid-cols-3">{leaderboardData.slice(0, 3).map((row) => <Card key={row.id} className="p-5"><p className="text-xs uppercase tracking-[0.2em] text-gold">Rank Badge</p><h3 className="mt-2 text-xl font-bold text-white">{row.user?.name ?? row.userId}</h3><p className="mt-3 text-3xl font-black text-gold">{row.points} XP</p><div className="mt-3"><StreakBadge streak={row.streak} /></div></Card>)}</div>
        </section>
      ) : null}
    </motion.div>
  );
}
