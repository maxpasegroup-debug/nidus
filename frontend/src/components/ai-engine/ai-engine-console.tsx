"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, Lightbulb, Radar, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AIInterviewerCard, AIResponseCard, AISkeleton, DoubtChatBubble, InterviewProgress, OfficerRadar, OfficerReadinessGauge, RecommendationCard } from "@/components/ai-engine/ai-engine-components";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAIInterview, useAIRecommendations, useDoubtSolver, useOfficerPotential } from "@/hooks/use-ai-engine";

type AIView = "start" | "session" | "result" | "doubt" | "recommendations" | "potential";

const links = [
  ["/ai-interview", "Interview", Bot],
  ["/ai-doubt-solver", "Doubt Solver", Lightbulb],
  ["/ai-recommendations", "Recommendations", Sparkles],
  ["/officer-potential", "Officer Potential", Radar]
] as const;

function value(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

export function AIEngineConsole({ view }: { view: AIView }) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;
  const interview = useAIInterview(sessionId);
  const doubt = useDoubtSolver();
  const recommendations = useAIRecommendations();
  const potential = useOfficerPotential();
  const [activeQuestionId, setActiveQuestionId] = useState<string>("");
  const result = interview.result.data;
  const questions = result?.questions ?? [];
  const current = questions[questions.length - 1];

  return (
    <motion.div className="space-y-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">NIDUS AI Command</p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">AI Interview Simulator & Recommendation Engine</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Cinematic defence AI for SSB interview practice, doubt solving, officer potential analysis and smart readiness recommendations.</p>
        </div>
        <div className="flex flex-wrap gap-2">{links.map(([href, label, Icon]) => <Link key={href} href={href} className="inline-flex h-10 items-center gap-2 rounded border border-white/10 px-3 text-sm text-ink transition hover:border-gold/50 hover:text-gold"><Icon className="h-4 w-4" />{label}</Link>)}</div>
      </section>

      {view === "start" ? (
        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <AIInterviewerCard />
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Start Interview Flow</h2><form onSubmit={async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; const data = await interview.start.mutateAsync({ examType: value(form, "examType"), interviewType: value(form, "interviewType") }); router.push(`/ai-interview/session/${data.session.id}`); }}><div className="grid gap-3 md:grid-cols-2"><Input name="examType" label="Exam Type" defaultValue="SSB" required /><Input name="interviewType" label="Interview Type" defaultValue="Personal Interview" required /><Input label="Voice Interaction" value="Placeholder ready" readOnly /><Input label="AI Hologram" value="Active" readOnly /></div><div className="mt-4"><Button>{interview.start.isPending ? "Starting..." : "Start AI Interview"}</Button></div></form></Card>
        </section>
      ) : null}

      {view === "session" ? (
        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4"><AIInterviewerCard title="Live AI Interviewer" note={result?.status ?? "Session loading"} /><InterviewProgress answered={questions.filter((item) => item.userAnswer).length} total={Math.max(questions.length, 1)} /></div>
          <Card className="p-5"><h2 className="text-xl font-bold text-white">Live Question Display</h2><p className="mt-4 rounded-lg border border-gold/20 bg-gold/10 p-4 text-lg text-gold-soft">{current?.question ?? "Loading question..."}</p><form className="mt-5" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; interview.submitAnswer.mutate({ questionId: activeQuestionId || current?.id || "", userAnswer: value(form, "answer") }); form.reset(); }}><Input name="answer" label="Your Answer" required /><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" type="submit">Analyze Answer</Button><Button size="sm" type="button" variant="secondary" onClick={async () => { const next = await interview.nextQuestion.mutateAsync({ sessionId: sessionId ?? "" }); setActiveQuestionId(next.id); interview.result.refetch(); }}>Next Question</Button><Button size="sm" type="button" href={`/ai-interview/result/${sessionId}`} variant="secondary">View Result</Button></div></form>{current?.aiAnalysis ? <div className="mt-5"><AIResponseCard title={`Score ${current.score ?? 0}`} body={current.aiAnalysis} /></div> : null}</Card>
        </section>
      ) : null}

      {view === "result" ? (
        result ? <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><Card className="p-6"><p className="text-sm text-muted">Overall Score</p><b className="mt-2 block text-5xl text-white">{Math.round(result.overallScore ?? 0)}%</b><p className="mt-4 text-sm leading-6 text-ink">{result.aiFeedback}</p></Card><div className="space-y-4">{questions.map((item) => <AIResponseCard key={item.id} title={item.question} body={item.aiAnalysis ?? "Awaiting analysis"} />)}</div></section> : <AISkeleton />
      ) : null}

      {view === "doubt" ? (
        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]"><Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Ask AI</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; doubt.solve.mutate({ subject: value(form, "subject"), question: value(form, "question") }); form.reset(); }}><div className="grid gap-3"><Input name="subject" label="Subject" defaultValue="Mathematics" required /><Input name="question" label="Question" required /></div><div className="mt-4"><Button>Solve Doubt</Button></div></form></Card><div className="space-y-5">{doubt.data?.map((item) => <DoubtChatBubble key={item.id} doubt={item} />)}</div></section>
      ) : null}

      {view === "recommendations" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{recommendations.data?.map((item) => <RecommendationCard key={item.id} item={item} />)}</section>
      ) : null}

      {view === "potential" ? (
        potential.data ? <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><OfficerReadinessGauge potential={potential.data} /><OfficerRadar potential={potential.data} /></section> : <AISkeleton />
      ) : null}
    </motion.div>
  );
}
