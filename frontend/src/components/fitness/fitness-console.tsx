"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, CalendarDays, ClipboardCheck, Dumbbell } from "lucide-react";
import { type FormEvent } from "react";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BMIWidget, EligibilityIndicator, FitnessEmptyState, FitnessProgressChart, FitnessStatCard, PTScheduleCard, WorkoutLogCard } from "@/components/fitness/fitness-components";
import { useEligibility, useFitnessLogs, useFitnessProfile, usePTSchedules } from "@/hooks/use-fitness";

type FitnessView = "dashboard" | "pt" | "eligibility" | "logs";

const links = [
  ["/fitness", "Dashboard", Dumbbell],
  ["/fitness/pt-schedule", "PT Schedule", CalendarDays],
  ["/fitness/eligibility", "Eligibility", ClipboardCheck],
  ["/fitness/logs", "Daily Logs", Activity]
] as const;

function value(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function FitnessConsole({ view }: { view: FitnessView }) {
  const { user } = useAuth();
  const profile = useFitnessProfile();
  const schedules = usePTSchedules();
  const eligibility = useEligibility();
  const logs = useFitnessLogs();
  const profileData = profile.data;
  const scheduleData = schedules.data ?? [];
  const eligibilityData = eligibility.data ?? [];
  const logData = logs.data ?? [];
  const consistency = logData.length ? Math.min(100, logData.length * 14) : 0;

  return (
    <motion.div className="space-y-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">NIDUS Physical Command</p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">Fitness Tracking & Physical Eligibility</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Military fitness analytics for PT schedules, stamina readiness, daily logs and NDA/CDS/AFCAT physical eligibility.</p>
        </div>
        <div className="flex flex-wrap gap-2">{links.map(([href, label, Icon]) => <Link key={href} href={href} className="inline-flex h-10 items-center gap-2 rounded border border-white/10 px-3 text-sm text-ink transition hover:border-gold/50 hover:text-gold"><Icon className="h-4 w-4" />{label}</Link>)}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <FitnessStatCard label="Stamina Score" value={String(Math.round(profileData?.staminaScore ?? 0))} note={profileData?.fitnessLevel ?? "Profile pending"} />
        <FitnessStatCard label="Running Time" value={`${profileData?.runningTime ?? "--"} min`} note="1.6 km benchmark" />
        <FitnessStatCard label="Strength" value={`${profileData?.pushups ?? 0}/${profileData?.pullups ?? 0}`} note="Pushups / Pullups" icon="shield" />
        <FitnessStatCard label="Consistency" value={`${consistency}%`} note="Workout log rhythm" icon="fire" />
      </section>

      {view === "dashboard" ? (
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]"><BMIWidget profile={profileData} /><FitnessProgressChart logs={logData} /></div>
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Update Fitness Profile</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; profile.save.mutate({ height: Number(value(form, "height")), weight: Number(value(form, "weight")), runningTime: Number(value(form, "runningTime")), pushups: Number(value(form, "pushups")), pullups: Number(value(form, "pullups")), situps: Number(value(form, "situps")) }); }}><Grid><Input name="height" label="Height CM" type="number" defaultValue={profileData?.height} required /><Input name="weight" label="Weight KG" type="number" defaultValue={profileData?.weight} required /><Input name="runningTime" label="Running Time" type="number" defaultValue={profileData?.runningTime} required /><Input name="pushups" label="Pushups" type="number" defaultValue={profileData?.pushups} required /><Input name="pullups" label="Pullups" type="number" defaultValue={profileData?.pullups} required /><Input name="situps" label="Situps" type="number" defaultValue={profileData?.situps} required /></Grid><div className="mt-4"><Button size="sm">Save Profile</Button></div></form></Card>
        </section>
      ) : null}

      {view === "pt" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Create PT Session</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; schedules.create.mutate({ title: value(form, "title"), description: value(form, "description"), scheduledDate: value(form, "scheduledDate"), trainerName: value(form, "trainerName"), activityType: value(form, "activityType"), duration: Number(value(form, "duration")) }); }}><Grid><Input name="title" label="Title" required /><Input name="description" label="Description" required /><Input name="scheduledDate" label="Scheduled Date" type="datetime-local" required /><Input name="trainerName" label="Trainer Name" required /><Input name="activityType" label="Activity Type" required /><Input name="duration" label="Duration" type="number" required /></Grid><div className="mt-4"><Button size="sm">Create Session</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{scheduleData.map((item) => <PTScheduleCard key={item.id} schedule={item} onAttend={() => schedules.mark.mutate({ studentId: user?.id ?? "", ptScheduleId: item.id, attendanceStatus: "PRESENT", remarks: "Marked from dashboard" })} />)}</div>
        </section>
      ) : null}

      {view === "eligibility" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Defence Eligibility Checker</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; eligibility.check.mutate({ examType: value(form, "examType"), userId: value(form, "userId") || undefined }); }}><Grid><Input name="examType" label="Exam Type" defaultValue="NDA" required /><Input name="userId" label="User ID" defaultValue={user?.id} /><Input label="NDA/CDS/AFCAT Standards" value="Height, BMI, weight, stamina" readOnly /><Input label="AI Improvement Prediction" value="Placeholder active" readOnly /></Grid><div className="mt-4"><Button size="sm">Check Eligibility</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2">{eligibilityData.length ? eligibilityData.map((item) => <EligibilityIndicator key={item.id} item={item} />) : <FitnessEmptyState title="No eligibility checks" note="Create a fitness profile and run a physical readiness check." />}</div>
        </section>
      ) : null}

      {view === "logs" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Daily Workout Tracking</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; logs.create.mutate({ runningDistance: Number(value(form, "runningDistance")), caloriesBurned: Number(value(form, "caloriesBurned")), waterIntake: Number(value(form, "waterIntake")), workoutDuration: Number(value(form, "workoutDuration")), notes: value(form, "notes") }); form.reset(); }}><Grid><Input name="runningDistance" label="Running Distance KM" type="number" required /><Input name="caloriesBurned" label="Calories Burned" type="number" required /><Input name="waterIntake" label="Water Intake L" type="number" required /><Input name="workoutDuration" label="Workout Duration" type="number" required /><Input name="notes" label="Notes" /></Grid><div className="mt-4"><Button size="sm">Save Log</Button></div></form></Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]"><FitnessProgressChart logs={logData} type="bar" /><FitnessProgressChart logs={logData} /></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{logData.map((item) => <WorkoutLogCard key={item.id} log={item} />)}</div>
        </section>
      ) : null}
    </motion.div>
  );
}
