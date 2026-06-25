"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Dumbbell,
  Gauge,
  HeartPulse,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiClient } from "@/services/api";
import type { DailyFitnessLog, FitnessProfile, PhysicalEligibility, PTAttendance, PTSchedule } from "@/types/fitness";
import { useAuth } from "@/components/providers/auth-provider-v2";

type FitnessView = "dashboard" | "pt" | "eligibility" | "logs";

type AssignedStudent = {
  id?: string;
  studentId?: string;
  student?: {
    id: string;
    name?: string | null;
    email?: string | null;
    mobile?: string | null;
  };
};

type AssignedBatch = {
  id: string;
  name: string;
  batchName?: string | null;
  batchType?: string | null;
  course?: { title?: string | null } | null;
  programSlug?: string | null;
  students?: AssignedStudent[];
};

type FitnessProfilePayload = {
  userId?: string;
  height: number;
  weight: number;
  runningTime: number;
  pushups: number;
  pullups: number;
  situps: number;
};

type FitnessLogPayload = {
  userId?: string;
  runningDistance: number;
  caloriesBurned: number;
  waterIntake: number;
  workoutDuration: number;
  notes?: string;
};

const tabs: Array<{ key: FitnessView; label: string }> = [
  { key: "dashboard", label: "Today" },
  { key: "pt", label: "My Batches" },
  { key: "eligibility", label: "Fitness Records" },
  { key: "logs", label: "Reports" },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function field(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

async function getAssignedBatches() {
  const response = await apiClient.get<{ batches?: AssignedBatch[] } | AssignedBatch[]>("/academy/my-teaching-plan");
  return Array.isArray(response.data) ? response.data : response.data.batches ?? [];
}

async function getPTSchedules() {
  return (await apiClient.get<{ schedules: PTSchedule[] }>("/fitness/pt-schedules")).data.schedules;
}

async function createPTSchedule(payload: Omit<PTSchedule, "id" | "createdAt">) {
  return (await apiClient.post<{ schedule: PTSchedule }>("/fitness/pt-schedules", payload)).data.schedule;
}

async function markPTAttendance(payload: { studentId: string; ptScheduleId: string; attendanceStatus: string; remarks?: string }) {
  return (await apiClient.post<{ attendance: PTAttendance }>("/fitness/attendance", payload)).data.attendance;
}

async function getPTAttendance(studentId: string) {
  if (!studentId) return [];
  return (await apiClient.get<{ attendance: PTAttendance[] }>(`/fitness/attendance/${studentId}`)).data.attendance;
}

async function upsertFitnessProfile(payload: FitnessProfilePayload) {
  return (await apiClient.post<{ profile: FitnessProfile; suggestions: string }>("/fitness/profile", payload)).data;
}

async function createFitnessLog(payload: FitnessLogPayload) {
  return (await apiClient.post<{ log: DailyFitnessLog }>("/fitness/log", payload)).data.log;
}

async function getFitnessLogs() {
  return (await apiClient.get<{ logs: DailyFitnessLog[] }>("/fitness/logs")).data.logs;
}

async function getEligibility() {
  return (await apiClient.get<{ eligibility: PhysicalEligibility[] }>("/fitness/eligibility")).data.eligibility;
}

async function checkEligibility(payload: { userId?: string; examType: string }) {
  return (await apiClient.post<{ eligibility: PhysicalEligibility }>("/fitness/eligibility/check", payload)).data.eligibility;
}

export function FitnessConsole({ view }: { view: FitnessView }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<FitnessView>(view);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [attendanceRemarks, setAttendanceRemarks] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const batchesQuery = useQuery({ queryKey: ["pt", "assigned-batches"], queryFn: getAssignedBatches });
  const schedulesQuery = useQuery({ queryKey: ["pt", "schedules"], queryFn: getPTSchedules });
  const logsQuery = useQuery({ queryKey: ["pt", "logs"], queryFn: getFitnessLogs });
  const eligibilityQuery = useQuery({ queryKey: ["pt", "eligibility"], queryFn: getEligibility });

  const batches = batchesQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const logs = logsQuery.data ?? [];
  const eligibility = eligibilityQuery.data ?? [];
  const selectedBatch = useMemo(() => batches.find((batch) => batch.id === selectedBatchId) ?? batches[0], [batches, selectedBatchId]);
  const students = selectedBatch?.students ?? [];
  const selectedStudent = useMemo(
    () => students.find((entry, index) => studentId(entry, index) === selectedStudentId) ?? students[0],
    [students, selectedStudentId],
  );
  const activeStudentId = selectedStudent ? studentId(selectedStudent, 0) : "";
  const activeStudentName = selectedStudent?.student?.name ?? "Select a student";
  const today = todayKey();
  const todaySessions = schedules.filter((schedule) => schedule.scheduledDate.slice(0, 10) === today);
  const upcomingSessions = schedules.filter((schedule) => schedule.scheduledDate.slice(0, 10) >= today).slice(0, 5);

  const attendanceQuery = useQuery({
    queryKey: ["pt", "attendance", activeStudentId],
    queryFn: () => getPTAttendance(activeStudentId),
    enabled: Boolean(activeStudentId),
  });
  const attendance = attendanceQuery.data ?? [];

  const createScheduleMutation = useMutation({
    mutationFn: createPTSchedule,
    onSuccess: async () => {
      setMessage("PT session created.");
      await queryClient.invalidateQueries({ queryKey: ["pt", "schedules"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not create PT session."),
  });

  const attendanceMutation = useMutation({
    mutationFn: markPTAttendance,
    onSuccess: async () => {
      setMessage("PT attendance saved.");
      await queryClient.invalidateQueries({ queryKey: ["pt", "attendance", activeStudentId] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not save PT attendance."),
  });

  const profileMutation = useMutation({
    mutationFn: upsertFitnessProfile,
    onSuccess: async () => {
      setMessage("Fitness score saved.");
      await queryClient.invalidateQueries({ queryKey: ["pt", "logs"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not save fitness score."),
  });

  const logMutation = useMutation({
    mutationFn: createFitnessLog,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pt", "logs"] });
    },
  });

  const eligibilityMutation = useMutation({
    mutationFn: checkEligibility,
    onSuccess: async () => {
      setMessage("Eligibility checked.");
      await queryClient.invalidateQueries({ queryKey: ["pt", "eligibility"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not check eligibility."),
  });

  const totalStudents = batches.reduce((sum, batch) => sum + (batch.students?.length ?? 0), 0);
  const latestLog = logs[0];
  const readyCount = eligibility.filter((item) => item.eligibilityStatus === "ELIGIBLE").length;
  const attendancePresent = attendance.filter((item) => item.attendanceStatus === "PRESENT").length;
  const attendancePercent = attendance.length ? Math.round((attendancePresent / attendance.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-5 text-[var(--navy)] md:px-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Physical Training</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">PT ground register</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">
                Open today&apos;s PT duty, mark attendance, enter running and fitness scores, and track students who need physical improvement.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Trainer</p>
              <h2 className="mt-2 text-2xl font-black">{user?.name ?? "Physical Instructor"}</h2>
              <p className="mt-2 text-sm text-[var(--muted-blue)]">Assigned batches and students only.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={CalendarDays} label="Today PT" value={todaySessions.length} note="sessions" />
          <Metric icon={Dumbbell} label="Batches" value={batches.length} note="assigned" />
          <Metric icon={UserRound} label="Students" value={totalStudents} note="active" />
          <Metric icon={CheckCircle2} label="Ready" value={readyCount} note="eligible" />
          <Metric icon={Gauge} label="Attendance" value={attendancePercent} note="selected %" />
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key)}
                className={`min-h-12 rounded-2xl border px-4 text-sm font-black ${
                  activeView === tab.key ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white text-[var(--navy)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {message ? <Message text={message} /> : null}

        {activeView === "dashboard" ? (
          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Panel title="Today's PT Duty" eyebrow="Start here">
              <div className="grid gap-3">
                {todaySessions.map((session) => <SessionCard key={session.id} session={session} />)}
                {!todaySessions.length ? <SoftNote text="No PT session is scheduled for today. Create one from My Batches or ask the Academic Head to schedule PT." /> : null}
              </div>
            </Panel>
            <Panel title="Next PT Programs" eyebrow="Upcoming">
              <div className="grid gap-3">
                {upcomingSessions.map((session) => <SessionCard key={session.id} session={session} compact />)}
                {!upcomingSessions.length ? <SoftNote text="Upcoming PT sessions will appear here." /> : null}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeView === "pt" ? (
          <section className="space-y-6">
            <Panel title="My Batches" eyebrow="Assigned groups">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {batches.map((batch) => (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => {
                      setSelectedBatchId(batch.id);
                      setSelectedStudentId("");
                    }}
                    className={`min-h-36 rounded-2xl border p-5 text-left transition ${
                      selectedBatch?.id === batch.id ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white hover:-translate-y-1"
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{batch.batchType ?? "Batch"}</p>
                    <h3 className="mt-3 text-xl font-black">{batch.name ?? batch.batchName}</h3>
                    <p className={`mt-3 text-sm ${selectedBatch?.id === batch.id ? "text-white/70" : "text-[var(--muted-blue)]"}`}>
                      {batch.students?.length ?? 0} students
                    </p>
                  </button>
                ))}
                {!batches.length ? <SoftNote text="No active batches are assigned to this physical instructor." /> : null}
              </div>
            </Panel>

            <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <Panel title="Student Fitness Register" eyebrow={selectedBatch?.name ?? selectedBatch?.batchName ?? "Batch"}>
                <div className="grid gap-3">
                  {students.map((entry, index) => {
                    const id = studentId(entry, index);
                    const name = entry.student?.name ?? `Student ${index + 1}`;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedStudentId(id)}
                        className={`rounded-2xl border px-4 py-3 text-left ${
                          activeStudentId === id ? "border-emerald-600 bg-emerald-50" : "border-[var(--border)] bg-white"
                        }`}
                      >
                        <p className="font-black">{name}</p>
                        <p className="mt-1 text-xs text-[var(--muted-blue)]">{entry.student?.mobile ?? entry.student?.email ?? "Student profile"}</p>
                      </button>
                    );
                  })}
                  {!students.length ? <SoftNote text="No students are assigned in this batch." /> : null}
                </div>
              </Panel>

              <Panel title={activeStudentName} eyebrow="Attendance and score">
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <h3 className="text-xl font-black">Mark PT Attendance</h3>
                    <p className="mt-2 text-sm text-[var(--muted-blue)]">Tap the correct status and save remarks.</p>
                    <textarea value={attendanceRemarks} onChange={(event) => setAttendanceRemarks(event.target.value)} rows={2} placeholder="Remarks, injury note, late arrival..." className="mt-4 w-full rounded-xl border border-[var(--border)] px-3 py-3 text-sm" />
                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      {["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={!activeStudentId || !upcomingSessions[0]}
                          onClick={() => attendanceMutation.mutate({ studentId: activeStudentId, ptScheduleId: upcomingSessions[0].id, attendanceStatus: status, remarks: attendanceRemarks })}
                          className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black disabled:opacity-40"
                        >
                          {status.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <FitnessScoreForm
                    disabled={!activeStudentId}
                    onSubmit={(payload) => {
                      profileMutation.mutate({ ...payload.profile, userId: activeStudentId });
                      logMutation.mutate({ ...payload.log, userId: activeStudentId });
                    }}
                    onEligibility={() => activeStudentId && eligibilityMutation.mutate({ userId: activeStudentId, examType: "NDA" })}
                  />
                </div>
              </Panel>
            </section>
          </section>
        ) : null}

        {activeView === "eligibility" ? (
          <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <Panel title="Selected Student History" eyebrow={activeStudentName}>
              <div className="grid gap-3">
                {attendance.slice(0, 6).map((item) => (
                  <HistoryRow key={item.id} title={item.ptSchedule?.title ?? "PT Session"} note={new Date(item.markedAt).toLocaleString()} badge={item.attendanceStatus} />
                ))}
                {!attendance.length ? <SoftNote text="No PT attendance history for the selected student yet." /> : null}
              </div>
            </Panel>
            <Panel title="Eligibility Records" eyebrow="Defence standards">
              <div className="grid gap-3">
                {eligibility.map((item) => (
                  <HistoryRow key={item.id} title={`${item.examType} - ${item.eligibilityStatus}`} note={item.overallRemark} badge={item.eligibilityStatus} />
                ))}
                {!eligibility.length ? <SoftNote text="Eligibility checks will appear after fitness scores are entered." /> : null}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeView === "logs" ? (
          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel title="PT Reports" eyebrow="Quick signals">
              <div className="grid gap-3 sm:grid-cols-2">
                <ReportCard title="Students Under Watch" value={String(Math.max(totalStudents - readyCount, 0))} note="Need score or improvement" icon={HeartPulse} />
                <ReportCard title="Fitness Logs" value={String(logs.length)} note="Records captured" icon={Activity} />
                <ReportCard title="Latest Run" value={latestLog ? `${latestLog.runningDistance} km` : "--"} note={latestLog?.notes ?? "No latest log"} icon={Dumbbell} />
                <ReportCard title="Eligibility Done" value={String(eligibility.length)} note="Checks completed" icon={ClipboardCheck} />
              </div>
            </Panel>
            <Panel title="Recent Fitness Logs" eyebrow="Activity">
              <div className="grid gap-3">
                {logs.slice(0, 8).map((log) => (
                  <HistoryRow key={log.id} title={`${log.runningDistance} km / ${log.workoutDuration} min`} note={log.notes ?? `Calories ${log.caloriesBurned}, Water ${log.waterIntake}L`} badge={new Date(log.createdAt).toLocaleDateString()} />
                ))}
                {!logs.length ? <SoftNote text="Fitness logs will appear after you save scores." /> : null}
              </div>
            </Panel>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function studentId(entry: AssignedStudent, index: number) {
  return entry.student?.id ?? entry.studentId ?? entry.id ?? String(index);
}

function Metric({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: number; note: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-black">{label}</p>
      <p className="text-xs text-[var(--muted-blue)]">{note}</p>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-sm md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SessionCard({ session, compact = false }: { session: PTSchedule; compact?: boolean }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{new Date(session.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <h3 className="mt-1 text-xl font-black">{session.title}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{session.activityType} / {session.duration} min / {session.trainerName}</p>
          {!compact ? <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{session.description}</p> : null}
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1 text-xs font-black">PT</span>
      </div>
    </article>
  );
}

function FitnessScoreForm({
  disabled,
  onSubmit,
  onEligibility,
}: {
  disabled: boolean;
  onSubmit: (payload: { profile: FitnessProfilePayload; log: FitnessLogPayload }) => void;
  onEligibility: () => void;
}) {
  return (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        onSubmit({
          profile: {
            height: Number(field(form, "height")),
            weight: Number(field(form, "weight")),
            runningTime: Number(field(form, "runningTime")),
            pushups: Number(field(form, "pushups")),
            pullups: Number(field(form, "pullups")),
            situps: Number(field(form, "situps")),
          },
          log: {
            runningDistance: Number(field(form, "runningDistance") || 1.6),
            caloriesBurned: Number(field(form, "caloriesBurned") || 0),
            waterIntake: Number(field(form, "waterIntake") || 0),
            workoutDuration: Number(field(form, "workoutDuration") || 0),
            notes: field(form, "remarks"),
          },
        });
      }}
      className="rounded-2xl border border-[var(--border)] bg-white p-4"
    >
      <h3 className="text-xl font-black">Enter Fitness Score</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Input name="height" label="Height CM" type="number" />
        <Input name="weight" label="Weight KG" type="number" />
        <Input name="runningTime" label="1.6 KM Time" type="number" step="0.1" />
        <Input name="pushups" label="Pushups" type="number" />
        <Input name="pullups" label="Pullups" type="number" />
        <Input name="situps" label="Situps" type="number" />
        <Input name="runningDistance" label="Run KM" type="number" step="0.1" defaultValue="1.6" />
        <Input name="workoutDuration" label="Workout Min" type="number" />
        <Input name="caloriesBurned" label="Calories" type="number" defaultValue="0" />
        <Input name="waterIntake" label="Water L" type="number" step="0.1" defaultValue="0" />
        <label className="grid gap-2 text-sm font-black sm:col-span-2">
          Remarks
          <input name="remarks" className="min-h-12 rounded-xl border border-[var(--border)] px-3 text-sm font-normal" placeholder="Improved, injury, weak stamina..." />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button disabled={disabled} className="min-h-11 rounded-xl bg-[var(--gold-gradient)] px-4 text-sm font-black disabled:opacity-40">
          Save Score
        </button>
        <button type="button" disabled={disabled} onClick={onEligibility} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black disabled:opacity-40">
          Check NDA Eligibility
        </button>
      </div>
    </form>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <input {...props} required className="min-h-12 rounded-xl border border-[var(--border)] px-3 text-sm font-normal" />
    </label>
  );
}

function HistoryRow({ title, note, badge }: { title: string; note: string; badge: string }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-black">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">{note}</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-1 text-xs font-black">{badge}</span>
      </div>
    </article>
  );
}

function ReportCard({ title, value, note, icon: Icon }: { title: string; value: string; note: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <h3 className="mt-1 font-black">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{note}</p>
    </div>
  );
}

function Message({ text }: { text: string }) {
  return <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-black">{text}</div>;
}

function SoftNote({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/80 p-5 text-sm text-[var(--muted-blue)]">{text}</div>;
}
