"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/courses/empty-state";
import { nidusAnswerChoices, nidusOptionalGuidance, nidusProfileAccuracy, nidusQuestionPrompt } from "@/components/psychometric/nidus-ai-assessment-engine";
import { usePsychometricActiveAttempt, useSubmitPsychometric } from "@/hooks/use-psychometric";
import { getApiErrorMessage } from "@/services/api";
import type { PsychometricAttempt, PsychometricQuestion } from "@/types/psychometric";

function readCachedAttempt(attemptId: string) {
  if (typeof window === "undefined") return null;
  try {
    const attempt = JSON.parse(localStorage.getItem("nidus_psychometric_attempt") ?? "null") as (PsychometricAttempt & { test: PsychometricAttempt["test"] & { questions: PsychometricQuestion[] } }) | null;
    return attempt?.id === attemptId ? attempt : null;
  } catch {
    return null;
  }
}

function NidusAssessmentOrb() {
  return (
    <div className="relative mx-auto grid h-24 w-24 place-items-center sm:h-28 sm:w-28">
      <div className="absolute inset-0 rounded-full bg-[#d7a642]/30 blur-3xl" />
      <div className="absolute inset-3 rounded-full bg-[#3f4a32]/25 blur-2xl" />
      <motion.div
        animate={{ scale: [1, 1.05, 1], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative grid h-20 w-20 place-items-center rounded-full border border-[#f7d37c]/35 bg-[linear-gradient(135deg,#071d36_0%,#3f4a32_52%,#d7a642_100%)] shadow-[0_0_70px_rgba(215,166,66,0.42)] sm:h-24 sm:w-24"
      >
        <BrainCircuit className="h-8 w-8 text-[#fff7de]" />
      </motion.div>
    </div>
  );
}

function cleanQuestionText(value: string) {
  return value.replace(/^.+?\s+scenario\s+\d+\s+-\s+.+?:\s*/i, "").trim();
}

const focusStopWords = new Set([
  "when",
  "what",
  "which",
  "where",
  "how",
  "does",
  "your",
  "you",
  "usually",
  "naturally",
  "first",
  "before",
  "after",
  "with",
  "into",
  "from",
  "that",
  "this",
  "there",
  "their",
  "becomes",
  "important",
  "situation"
]);

function focusPhrase(questionText: string) {
  const cleaned = cleanQuestionText(questionText).toLowerCase();
  if (cleaned.includes("information") && cleaned.includes("incomplete")) return "incomplete facts";
  if (cleaned.includes("confused")) return "group confusion";
  if (cleaned.includes("ownership")) return "ownership";
  if (cleaned.includes("quieter")) return "quiet member";
  if (cleaned.includes("teammate") && cleaned.includes("weak")) return "weak teammate";
  if (cleaned.includes("disagree")) return "disagreement";
  if (cleaned.includes("suggestion")) return "ignored suggestion";
  if (cleaned.includes("phone") || cleaned.includes("distract")) return "distractions";
  if (cleaned.includes("routine")) return "routine break";
  if (cleaned.includes("deadline")) return "missed deadline";
  if (cleaned.includes("team") && cleaned.includes("confidence")) return "team confidence";
  if (cleaned.includes("group")) return "group pressure";
  if (cleaned.includes("goal")) return "goal clarity";
  if (cleaned.includes("future")) return "future plan";
  if (cleaned.includes("pressure")) return "pressure";
  if (cleaned.includes("fitness") || cleaned.includes("training") || cleaned.includes("stamina")) return "training";
  if (cleaned.includes("speak") || cleaned.includes("voice") || cleaned.includes("communicate")) return "speaking";

  const words = cleaned
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !focusStopWords.has(word));
  return words.slice(0, 2).join(" ") || "this moment";
}

function scenarioChoiceLabels(questionText: string) {
  const cleaned = cleanQuestionText(questionText).toLowerCase();
  if (cleaned.includes("planned routine breaks")) return ["Restart today", "Do a smaller target", "Wait for motivation", "Lose more time"];
  if (cleaned.includes("nobody checks your work")) return ["Keep full effort", "Do only required", "Need reminders", "Quality drops"];
  if (cleaned.includes("wake up late")) return ["Recover the day", "Do short training", "Excuse the day", "Skip routine"];
  if (cleaned.includes("repetitive") && cleaned.includes("boring")) return ["Continue quietly", "Make it measurable", "Need excitement", "Stop midway"];
  if (cleaned.includes("miss a deadline")) return ["Own and fix it", "Inform and replan", "Feel stuck", "Hide the delay"];
  if (cleaned.includes("group becomes confused")) return ["Organize the group", "Clarify first step", "Support another lead", "Wait silently"];
  if (cleaned.includes("taking ownership")) return ["Take ownership", "Share responsibility", "Wait for seniors", "Avoid pressure"];
  if (cleaned.includes("others are louder")) return ["Speak clearly", "Pick right moment", "Keep idea inside", "Withdraw"];
  if (cleaned.includes("losing confidence")) return ["Lift morale", "Set small target", "Stay in my role", "Lose energy"];
  if (cleaned.includes("responsibility comes suddenly")) return ["Accept quickly", "Ask key details", "Need backup", "Feel overwhelmed"];
  if (cleaned.includes("first 20 minutes")) return ["Stay locked in", "Reset attention", "Drift slowly", "Quit early"];
  if (cleaned.includes("phone distracts")) return ["Keep phone away", "Use time blocks", "Check sometimes", "Keep scrolling"];
  if (cleaned.includes("mentally heavy")) return ["Start one part", "Break into pieces", "Delay it", "Avoid fully"];
  if (cleaned.includes("lose concentration")) return ["Return fast", "Take short reset", "Need external push", "Keep drifting"];
  if (cleaned.includes("multiple tasks")) return ["Pick priority", "Make order list", "Jump between tasks", "Leave all pending"];
  if (cleaned.includes("introduce yourself")) return ["Speak confidently", "Speak with nerves", "Say very little", "Avoid eye contact"];
  if (cleaned.includes("senior questions")) return ["Answer calmly", "Explain with proof", "Doubt myself", "Become defensive"];
  if (cleaned.includes("visible mistake")) return ["Correct openly", "Recover quietly", "Feel embarrassed", "Give up"];
  if (cleaned.includes("without perfect preparation")) return ["Speak anyway", "Use simple points", "Stay silent", "Panic"];
  if (cleaned.includes("others seem more capable")) return ["Learn from them", "Compete calmly", "Feel smaller", "Stop trying"];
  if (cleaned.includes("pressure rises")) return ["Take action", "Stabilize first", "Freeze briefly", "Follow crowd"];
  if (cleaned.includes("plan fails")) return ["Find next option", "Review facts", "Need direction", "Lose control"];
  if (cleaned.includes("blamed") && cleaned.includes("unfairly")) return ["Stay composed", "Explain facts", "React emotionally", "Carry anger"];
  if (cleaned.includes("information is incomplete")) return ["Decide with facts", "Ask key questions", "Wait longer", "Avoid decision"];
  if (cleaned.includes("fear appears")) return ["Move through fear", "Use preparation", "Need reassurance", "Step back"];
  if (cleaned.includes("future goal")) return ["Explain clearly", "Explain roughly", "Still confused", "Change often"];
  if (cleaned.includes("goal feels far")) return ["Do today's task", "Review plan", "Only think about it", "Lose interest"];
  if (cleaned.includes("people doubt")) return ["Stay committed", "Use doubt as fuel", "Question myself", "Drop the path"];
  if (cleaned.includes("ambition is high")) return ["Build routine", "Start again", "Stay inconsistent", "Only dream"];
  if (cleaned.includes("comfort and long-term")) return ["Choose progress", "Balance both", "Choose comfort", "Avoid choice"];
  if (cleaned.includes("group members disagree")) return ["Calm the group", "Find common point", "Stay away", "Argue back"];
  if (cleaned.includes("quieter member")) return ["Invite them", "Mention their idea", "Ignore it", "Dominate"];
  if (cleaned.includes("teammate is weak")) return ["Help patiently", "Give small role", "Avoid them", "Get irritated"];
  if (cleaned.includes("group ignores your suggestion")) return ["Stay useful", "Try once more", "Feel rejected", "Stop helping"];
  if (cleaned.includes("protect morale")) return ["Encourage team", "Reduce tension", "Focus only on me", "Spread stress"];
  if (cleaned.includes("criticizes you harshly")) return ["Listen calmly", "Take useful part", "Feel hurt", "React fast"];
  if (cleaned.includes("anger appears")) return ["Control response", "Pause briefly", "Suppress it", "Burst out"];
  if (cleaned.includes("plans change suddenly")) return ["Adapt quickly", "Replan slowly", "Get disturbed", "Resist change"];
  if (cleaned.includes("embarrassment happens")) return ["Recover soon", "Laugh and move", "Think for hours", "Avoid people"];
  if (cleaned.includes("stress builds")) return ["Use routine", "Talk and reset", "Bottle it up", "Break down"];
  if (cleaned.includes("training becomes uncomfortable")) return ["Push safely", "Slow and continue", "Complain inside", "Stop early"];
  if (cleaned.includes("low energy")) return ["Start warm-up", "Do light session", "Skip today", "Break routine"];
  if (cleaned.includes("stamina is weaker")) return ["Train gradually", "Track progress", "Feel ashamed", "Avoid comparison"];
  if (cleaned.includes("miss a workout")) return ["Resume next day", "Do make-up work", "Lose streak", "Quit week"];
  if (cleaned.includes("training pain")) return ["Check and continue", "Adjust intensity", "Fear injury", "Stop fully"];
  if (cleaned.includes("explain an idea")) return ["Keep it clear", "Use examples", "Speak too much", "Stay unclear"];
  if (cleaned.includes("misunderstand your instruction")) return ["Re-explain simply", "Check their doubt", "Blame them", "Get irritated"];
  if (cleaned.includes("persuade")) return ["Speak respectfully", "Use logic", "Force opinion", "Stay passive"];
  if (cleaned.includes("room feels intense")) return ["Keep voice steady", "Slow down", "Lose clarity", "Go silent"];
  if (cleaned.includes("correct someone")) return ["Correct politely", "Speak privately", "Sound harsh", "Avoid correction"];
  if (cleaned.includes("many possible solutions")) return ["Compare options", "Pick practical one", "Get confused", "Copy others"];
  if (cleaned.includes("first solution fails")) return ["Try another route", "Study facts again", "Need someone", "Stop trying"];
  if (cleaned.includes("requires planning")) return ["List steps", "Set sequence", "Start randomly", "Delay planning"];
  if (cleaned.includes("complex issue")) return ["Simplify it", "Find root cause", "Get tense", "Add confusion"];
  if (cleaned.includes("defence role")) return ["Leadership role", "Technical role", "Field action", "Still exploring"];
  if (cleaned.includes("field action")) return ["Action pathway", "Tech pathway", "Aviation pathway", "Leadership pathway"];
  if (cleaned.includes("strict systems")) return ["Accept discipline", "Adjust slowly", "Feel restricted", "Resist rules"];
  if (cleaned.includes("army, navy, air force")) return ["Match strengths", "Ask counselling", "Follow trend", "No clarity"];
  if (cleaned.includes("mission environment")) return ["High responsibility", "Team operations", "Technical challenge", "Comfort zone"];
  if (cleaned.includes("comfort conflicts with duty")) return ["Choose duty", "Balance both", "Need push", "Choose comfort"];
  if (cleaned.includes("wearing a uniform")) return ["Daily discipline", "Service pride", "Only status", "Not sure"];
  if (cleaned.includes("discipline feels strict")) return ["See purpose", "Adjust gradually", "Feel pressure", "Reject it"];
  if (cleaned.includes("sacrifice")) return ["Accept sacrifice", "Think deeply", "Need motivation", "Avoid sacrifice"];
  if (cleaned.includes("country") || cleaned.includes("institution needs responsibility")) return ["Step forward", "Support team", "Wait for others", "Stay back"];
  if (cleaned.includes("dream and distraction")) return ["Dream wins", "Fight back", "Distraction wins", "Lose control"];
  if (cleaned.includes("goal control")) return ["Guides my day", "Guides sometimes", "Only in mood", "Rarely matters"];
  if (cleaned.includes("dopamine distractions")) return ["Block them", "Limit them", "Fall often", "Give in"];
  if (cleaned.includes("motivational content")) return ["Act immediately", "Note one task", "Just feel inspired", "Forget later"];
  if (cleaned.includes("future self")) return ["Protect time", "Schedule it", "Use leftover time", "Waste it"];

  const focus = focusPhrase(questionText);
  return [`Face ${focus}`, `Think it through`, `Need support`, `Step away`];
}

function generatedChoiceLabel(question: PsychometricQuestion, index: number) {
  const options = scenarioChoiceLabels(question.questionText);
  return options[index] ?? `Option ${String.fromCharCode(65 + index)}`;
}

function isRepeatedSeedOption(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("i act early") ||
    normalized.includes("i stay steady") ||
    normalized.includes("i need support") ||
    normalized.includes("i usually delay") ||
    normalized.includes("i take direct responsibility") ||
    normalized.includes("i pause, read") ||
    normalized.includes("i ask for support before") ||
    normalized.includes("i avoid") ||
    normalized.includes("i step in early") ||
    normalized.includes("i stay calm") ||
    normalized.includes("i need more time") ||
    normalized.includes("i lose rhythm") ||
    normalized.includes("i convert") ||
    normalized.includes("i break") ||
    normalized.includes("i depend on someone") ||
    normalized.includes("i delay action") ||
    normalized.includes("i choose the responsible") ||
    normalized.includes("i keep control") ||
    normalized.includes("i can handle") ||
    normalized.includes("i withdraw") ||
    normalized.includes("i face") ||
    normalized.includes("i make a clear mini-plan") ||
    normalized.includes("i look for help") ||
    normalized.includes("i postpone") ||
    normalized.includes("scenario") && normalized.includes("this is my")
  );
}

function shortAnswerLabel(question: PsychometricQuestion, value: string, index: number) {
  if (isRepeatedSeedOption(value)) return generatedChoiceLabel(question, index);

  const afterColon = value.includes(":") ? value.split(":").pop() ?? value : value;
  const cleaned = afterColon
    .replace(/Scenario\s+\d+.*$/i, "")
    .replace(/this is my.*$/i, "")
    .replace(/this fits me.*$/i, "")
    .replace(/^I\s+/i, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 5).join(" ");
  return words || `Option ${String.fromCharCode(65 + index)}`;
}

export default function PsychometricAttemptPage() {
  const params = useParams<{ id: string }>();
  const attemptId = params?.id ?? "";
  const submitMutation = useSubmitPsychometric();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const cachedAttempt = useMemo(() => readCachedAttempt(attemptId), [attemptId]);
  const { data: fetchedAttempt, isLoading, error } = usePsychometricActiveAttempt(attemptId, !cachedAttempt);
  const attempt = cachedAttempt ?? fetchedAttempt ?? null;

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-[#071d36]/10" />;
  if (error) return <EmptyState title="Assessment not loaded" description={getApiErrorMessage(error)} />;
  if (!attempt) return <EmptyState title="Assessment not loaded" description="Start an assessment from the psychometric page." />;

  const questions = attempt.test.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((question) => Boolean(answers[question.id])).length;
  const progress = nidusProfileAccuracy(answeredCount, questions.length);
  const questionProgress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  function update(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function submit() {
    submitMutation.mutate({
      attemptId,
      answers: Object.entries(answers).map(([questionId, answerText]) => ({ questionId, answerText }))
    });
  }

  function goNext() {
    setCurrentIndex((index) => Math.min(index + 1, Math.max(questions.length - 1, 0)));
  }

  function goBack() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  if (!currentQuestion) return <EmptyState title="No questions available" description="NIDUS AI could not find questions for this assessment." />;

  const currentChoices = nidusAnswerChoices(currentQuestion).map((option, index) => ({
    value: option,
    label: shortAnswerLabel(currentQuestion, option, index)
  }));
  const displayQuestion = cleanQuestionText(currentQuestion.questionText);
  const selectedAnswer = answers[currentQuestion.id] ?? "";
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <main className="min-h-[calc(100vh-5rem)] overflow-hidden rounded-lg border border-[#d7a642]/20 bg-[#071d36] text-white shadow-[0_30px_90px_rgba(7,29,54,0.35)]">
      <div className="relative min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(215,166,66,0.20),transparent_22rem),radial-gradient(circle_at_18%_90%,rgba(63,74,50,0.36),transparent_26rem),linear-gradient(180deg,#071d36_0%,#061525_50%,#082622_100%)]" />
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(247,211,124,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(247,211,124,0.14)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto max-w-5xl">
          <header className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm font-semibold text-white/85">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{questionProgress}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/15">
              <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,#f8d77c,#d7a642,#3f4a32)]" animate={{ width: `${questionProgress}%` }} transition={{ duration: 0.35 }} />
            </div>
          </header>

          <section className="grid min-h-[calc(100vh-12rem)] place-items-center py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full"
              >
                <div className="mx-auto max-w-3xl text-center">
                  <NidusAssessmentOrb />
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.35em] text-[#f7d37c]">NIDUS AI</p>
                  <p className="mt-3 text-sm leading-6 text-white/70">{nidusQuestionPrompt(currentQuestion, attempt.test)}</p>
                  {currentQuestion.imageUrl ? <Image src={currentQuestion.imageUrl} alt="" width={900} height={420} unoptimized className="mx-auto mt-5 max-h-64 w-auto rounded-lg object-cover" /> : null}
                  <h1 className="mx-auto mt-7 max-w-2xl text-balance text-3xl font-bold leading-tight text-white sm:text-4xl">
                    {displayQuestion}
                  </h1>
                  <p className="mt-4 text-base font-medium text-white/70">Choose what feels most true for you right now.</p>
                </div>

                {Array.isArray(currentQuestion.options) ? (
                  <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                    {currentChoices.map((option, optionIndex) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: optionIndex * 0.04 }}
                        onClick={() => update(currentQuestion.id, option.value)}
                        className={`group flex min-h-16 items-center rounded-2xl border px-5 py-4 text-left text-base font-semibold leading-6 transition hover:-translate-y-0.5 ${selectedAnswer === option.value ? "border-[#f7d37c] bg-[#fff7de] text-[#071d36] shadow-[0_0_36px_rgba(215,166,66,0.26)]" : "border-[#f7d37c]/18 bg-white/[0.075] text-white hover:border-[#f7d37c]/65 hover:bg-white/[0.12]"}`}
                      >
                        <span className={`mr-3 inline-grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${selectedAnswer === option.value ? "bg-[#071d36] text-[#f7d37c]" : "bg-white/10 text-white/75 group-hover:bg-[#d7a642]/20"}`}>{String.fromCharCode(65 + optionIndex)}</span>
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={selectedAnswer}
                    className="mx-auto mt-8 block min-h-36 w-full max-w-3xl rounded-2xl border border-[#f7d37c]/20 bg-white/[0.085] p-5 text-base text-white outline-none placeholder:text-white/45 focus:border-[#f7d37c]"
                    onChange={(event) => update(currentQuestion.id, event.target.value)}
                    placeholder="Answer naturally. NIDUS AI is reading the behaviour pattern, not judging the wording."
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          <footer className="relative grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm leading-6 text-white/65">
              {nidusOptionalGuidance(progress)} {answeredCount}/{questions.length} responses captured.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={goBack} variant="secondary" disabled={currentIndex === 0}>
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>
              {!isLastQuestion ? (
                <Button onClick={goNext} disabled={!selectedAnswer}>
                  Next Question <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={submitMutation.isPending || answeredCount === 0}>
                  {submitMutation.isPending ? "NIDUS AI is interpreting..." : "Generate Report"} <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
