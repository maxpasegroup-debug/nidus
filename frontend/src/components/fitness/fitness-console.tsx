"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ClipboardCheck, Dumbbell, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/services/api";
import type { DailyFitnessLog, FitnessProfile, PhysicalEligibility, PTAttendance, PTSchedule } from "@/types/fitness";
import { useAuth } from "@/components/providers/auth-provider-v2";

type FitnessView = "dashboard" | "pt" | "eligibility" | "logs" | "attendance" | "records";
type SimpleView = "today" | "batches" | "attendance" | "records" | "reports";

type FitnessRecordForm = {
  height: string;
  weight: string;
  runningTime: string;
  pushups: string;
  pullups: string;
  situps: string;
  remarks: string;
};

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

const tabs: Array<{ key: SimpleView; label: string }> = [
  { key: "today", label: "Today" },
  { key: "batches", label: "My Batches" },
  { key: "attendance", label: "Attendance" },
  { key: "records", label: "Fitness Records" },
  { key: "reports", label: "Reports" },
];

const emptyBatches: AssignedBatch[] = [];
const emptyStudents: AssignedStudent[] = [];

function viewFromRoute(view: FitnessView): SimpleView {
  if (view === "pt") return "batches";
  if (view === "eligibility" || view === "attendance") return "attendance";
  if (view === "records") return "records";
  if (view === "logs") return "reports";
  return "today";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function studentId(entry: AssignedStudent, index: number) {
  return entry.student?.id ?? entry.studentId ?? entry.id ?? String(index);
}

function studentName(entry: AssignedStudent, index: number) {
  return entry.student?.name ?? `Student ${index + 1}`;
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

async function getFitnessProfile(userId: string) {
  if (!userId) return null;
  return (await apiClient.get<{ profile: FitnessProfile | null }>("/fitness/profile", { params: { userId } })).data.profile;
}

async function upsertFitnessProfile(payload: Pick<FitnessProfile, "height" | "weight" | "runningTime" | "pushups" | "pullups" | "situps"> & { userId?: string }) {
  return (await apiClient.post<{ profile: FitnessProfile; suggestions: string }>("/fitness/profile", payload)).data;
}

async function createFitnessLog(payload: Omit<DailyFitnessLog, "id" | "createdAt" | "userId"> & { userId?: string }) {
  return (await apiClient.post<{ log: DailyFitnessLog }>("/fitness/log", payload)).data.log;
}

async function getFitnessLogs(userId: string) {
  if (!userId) return [];
  return (await apiClient.get<{ logs: DailyFitnessLog[] }>("/fitness/logs", { params: { userId } })).data.logs;
}

async function getEligibility(userId: string) {
  if (!userId) return [];
  return (await apiClient.get<{ eligibility: PhysicalEligibility[] }>("/fitness/eligibility", { params: { userId } })).data.eligibility;
}

async function checkEligibility(payload: { userId: string; examType: string }) {
  return (await apiClient.post<{ eligibility: PhysicalEligibility }>("/fitness/eligibility/check", payload)).data.eligibility;
}

export function FitnessConsole({ view }: { view: FitnessView }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<SimpleView>(viewFromRoute(view));
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [fitnessForm, setFitnessForm] = useState({
    height: "",
    weight: "",
    runningTime: "",
    pushups: "",
    pullups: "",
    situps: "",
    remarks: "",
  });
  const [fitnessSuggestion, setFitnessSuggestion] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const batchesQuery = useQuery({ queryKey: ["pt", "assigned-batches"], queryFn: getAssignedBatches });
  const schedulesQuery = useQuery({ queryKey: ["pt", "schedules"], queryFn: getPTSchedules });

  const batches = batchesQuery.data ?? emptyBatches;
  const schedules = schedulesQuery.data ?? [];
  const today = todayKey();
  const selectedBatch = useMemo(() => batches.find((batch) => batch.id === selectedBatchId) ?? batches[0], [batches, selectedBatchId]);
  const todaySessions = schedules.filter((schedule) => schedule.scheduledDate.slice(0, 10) === today && (!selectedBatch?.id || !schedule.batchId || schedule.batchId === selectedBatch.id));
  const activeSchedule = todaySessions[0] ?? schedules.find((schedule) => schedule.scheduledDate.slice(0, 10) >= today && (!selectedBatch?.id || !schedule.batchId || schedule.batchId === selectedBatch.id)) ?? null;
  const students = selectedBatch?.students ?? emptyStudents;
  const selectedStudent = useMemo(
    () => students.find((entry, index) => studentId(entry, index) === selectedStudentId) ?? students[0],
    [students, selectedStudentId],
  );
  const selectedStudentIndex = selectedStudent ? students.indexOf(selectedStudent) : -1;
  const activeStudentId = selectedStudent ? studentId(selectedStudent, Math.max(selectedStudentIndex, 0)) : "";
  const totalStudents = batches.reduce((sum, batch) => sum + (batch.students?.length ?? 0), 0);

  const attendanceQuery = useQuery({
    queryKey: ["pt", "attendance", activeStudentId],
    queryFn: () => getPTAttendance(activeStudentId),
    enabled: Boolean(activeStudentId),
  });
  const attendance = attendanceQuery.data ?? [];
  const selectedPresent = attendance.filter((item) => item.attendanceStatus === "PRESENT").length;
  const selectedAttendancePercent = attendance.length ? Math.round((selectedPresent / attendance.length) * 100) : 0;
  const profileQuery = useQuery({
    queryKey: ["pt", "profile", activeStudentId],
    queryFn: () => getFitnessProfile(activeStudentId),
    enabled: Boolean(activeStudentId),
  });
  const logsQuery = useQuery({
    queryKey: ["pt", "logs", activeStudentId],
    queryFn: () => getFitnessLogs(activeStudentId),
    enabled: Boolean(activeStudentId),
  });
  const eligibilityQuery = useQuery({
    queryKey: ["pt", "eligibility", activeStudentId],
    queryFn: () => getEligibility(activeStudentId),
    enabled: Boolean(activeStudentId),
  });
  const selectedProfile = profileQuery.data ?? null;
  const fitnessLogs = logsQuery.data ?? [];
  const eligibilityRows = eligibilityQuery.data ?? [];

  const createTodaySession = useMutation({
    mutationFn: () => createPTSchedule({
      title: "PT Attendance",
      description: selectedBatch ? `Daily PT attendance register for ${selectedBatch.name ?? selectedBatch.batchName ?? "selected batch"}` : "Daily PT attendance register",
      scheduledDate: new Date().toISOString(),
      batchId: selectedBatch?.id,
      trainerName: user?.name ?? "Physical Trainer",
      activityType: "PT",
      duration: 60,
    }),
    onSuccess: async () => {
      setMessage("Today PT register created.");
      await queryClient.invalidateQueries({ queryKey: ["pt", "schedules"] });
    },
    onError: (error) => setMessage(getApiErrorMessage(error)),
  });

  const attendanceMutation = useMutation({
    mutationFn: markPTAttendance,
    onSuccess: async () => {
      setMessage("Attendance saved.");
      await queryClient.invalidateQueries({ queryKey: ["pt", "attendance"] });
    },
    onError: (error) => setMessage(getApiErrorMessage(error)),
  });

  const markStudent = (entry: AssignedStudent, index: number, attendanceStatus: string) => {
    if (!activeSchedule) {
      setMessage("Create today's PT register before marking attendance.");
      return;
    }
    attendanceMutation.mutate({
      studentId: studentId(entry, index),
      ptScheduleId: activeSchedule.id,
      attendanceStatus,
      remarks,
    });
  };

  const markAllPresent = async () => {
    if (!activeSchedule) {
      setMessage("Create today's PT register before marking attendance.");
      return;
    }
    if (!students.length) {
      setMessage("No students found in this batch.");
      return;
    }
    setMessage("Saving attendance...");
    try {
      await Promise.all(students.map((entry, index) => markPTAttendance({
        studentId: studentId(entry, index),
        ptScheduleId: activeSchedule.id,
        attendanceStatus: "PRESENT",
        remarks,
      })));
      setMessage("All students marked present.");
      await queryClient.invalidateQueries({ queryKey: ["pt", "attendance"] });
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  };

  const saveFitnessRecord = async () => {
    if (!activeStudentId) {
      setMessage("Choose a student before saving fitness records.");
      return;
    }

    const height = Number(fitnessForm.height);
    const weight = Number(fitnessForm.weight);
    const runningTime = Number(fitnessForm.runningTime);
    const pushups = Number(fitnessForm.pushups);
    const pullups = Number(fitnessForm.pullups);
    const situps = Number(fitnessForm.situps);

    if ([height, weight, runningTime, pushups, pullups, situps].some((value) => !Number.isFinite(value) || value < 0) || height === 0 || weight === 0) {
      setMessage("Enter valid numbers for height, weight and fitness activities.");
      return;
    }

    const result = await upsertFitnessProfile({
      userId: activeStudentId,
      height,
      weight,
      runningTime,
      pushups,
      pullups,
      situps,
    });

    if (fitnessForm.remarks.trim()) {
      await createFitnessLog({
        userId: activeStudentId,
        runningDistance: 0,
        caloriesBurned: 0,
        waterIntake: 0,
        workoutDuration: 0,
        notes: `PT record: running ${runningTime} min, pushups ${pushups}, pullups ${pullups}, situps ${situps}. ${fitnessForm.remarks.trim()}`,
      });
    }

    setFitnessSuggestion(result.suggestions);
  };

  const fitnessRecordMutation = useMutation({
    mutationFn: saveFitnessRecord,
    onSuccess: async () => {
      setMessage("Fitness record saved.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pt", "profile", activeStudentId] }),
        queryClient.invalidateQueries({ queryKey: ["pt", "logs", activeStudentId] }),
      ]);
    },
    onError: (error) => setMessage(getApiErrorMessage(error)),
  });

  const eligibilityMutation = useMutation({
    mutationFn: checkEligibility,
    onSuccess: async () => {
      setMessage("Eligibility checked.");
      await queryClient.invalidateQueries({ queryKey: ["pt", "eligibility", activeStudentId] });
    },
    onError: (error) => setMessage(getApiErrorMessage(error)),
  });

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-5 text-[var(--navy)] md:px-6">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Physical Training</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">PT attendance desk</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-blue)]">Open your assigned batch, mark attendance, and save student fitness records without technical screens.</p>
            </div>
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">Trainer</p>
              <h2 className="mt-1 text-xl font-black">{user?.name ?? "Physical Trainer"}</h2>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">Assigned batches only</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Dumbbell} label="Batches" value={batches.length} note="assigned" />
          <Metric icon={Users} label="Students" value={totalStudents} note="in assigned batches" />
          <Metric icon={CalendarDays} label="Today PT" value={todaySessions.length} note="registers" />
          <Metric icon={ClipboardCheck} label="Selected" value={selectedAttendancePercent} note="attendance %" />
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key)}
                className={`min-h-12 rounded-xl border px-4 text-sm font-black ${activeView === tab.key ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {message ? <Message text={message} /> : null}

        {activeView === "today" ? (
          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel title="Today Register" eyebrow="Start here">
              {activeSchedule ? <SessionCard session={activeSchedule} /> : (
                <div className="grid gap-3">
                  <SoftNote text="No PT register is available for today." />
                  <button type="button" onClick={() => createTodaySession.mutate()} disabled={createTodaySession.isPending || !selectedBatch} className="min-h-12 rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50">Create Today Register</button>
                </div>
              )}
            </Panel>
            <Panel title="Quick Attendance" eyebrow={selectedBatch?.name ?? "Assigned batch"}>
              <AttendanceDesk
                activeSchedule={activeSchedule}
                attendancePending={attendanceMutation.isPending}
                batches={batches}
                markAllPresent={markAllPresent}
                markStudent={markStudent}
                remarks={remarks}
                selectedBatch={selectedBatch}
                selectedBatchId={selectedBatch?.id ?? ""}
                setRemarks={setRemarks}
                setSelectedBatchId={setSelectedBatchId}
                setSelectedStudentId={setSelectedStudentId}
                students={students}
              />
            </Panel>
          </section>
        ) : null}

        {activeView === "batches" ? (
          <Panel title="My Batches" eyebrow="Allocated by Academic Head">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {batches.map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => {
                    setSelectedBatchId(batch.id);
                    setSelectedStudentId("");
                    setActiveView("attendance");
                  }}
                  className={`min-h-32 rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 ${selectedBatch?.id === batch.id ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"}`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">{batch.batchType ?? "PT Batch"}</p>
                  <h3 className="mt-3 text-xl font-black">{batch.name ?? batch.batchName}</h3>
                  <p className={`mt-2 text-sm ${selectedBatch?.id === batch.id ? "text-white/70" : "text-[var(--muted-blue)]"}`}>{batch.students?.length ?? 0} students</p>
                </button>
              ))}
              {!batches.length ? <SoftNote text="No batch is allocated to this physical trainer." /> : null}
            </div>
          </Panel>
        ) : null}

        {activeView === "attendance" ? (
          <Panel title="Take Attendance" eyebrow={selectedBatch?.name ?? "Select batch"}>
            <AttendanceDesk
              activeSchedule={activeSchedule}
              attendancePending={attendanceMutation.isPending}
              batches={batches}
              markAllPresent={markAllPresent}
              markStudent={markStudent}
              remarks={remarks}
              selectedBatch={selectedBatch}
              selectedBatchId={selectedBatch?.id ?? ""}
              setRemarks={setRemarks}
              setSelectedBatchId={setSelectedBatchId}
              setSelectedStudentId={setSelectedStudentId}
              students={students}
            />
          </Panel>
        ) : null}

        {activeView === "records" ? (
          <Panel title="Fitness Records" eyebrow="Student profile">
            <FitnessRecordDesk
              batches={batches}
              fitnessForm={fitnessForm}
              fitnessPending={fitnessRecordMutation.isPending}
              fitnessSuggestion={fitnessSuggestion}
              onSave={() => fitnessRecordMutation.mutate()}
              selectedBatch={selectedBatch}
              selectedBatchId={selectedBatch?.id ?? ""}
              selectedStudentId={activeStudentId}
              setFitnessForm={setFitnessForm}
              setSelectedBatchId={setSelectedBatchId}
              setSelectedStudentId={setSelectedStudentId}
              students={students}
            />
          </Panel>
        ) : null}

        {activeView === "reports" ? (
          <TrainerReports
            attendance={attendance}
            batches={batches}
            eligibilityPending={eligibilityMutation.isPending}
            eligibilityRows={eligibilityRows}
            fitnessLogs={fitnessLogs}
            onCheckEligibility={(examType) => eligibilityMutation.mutate({ userId: activeStudentId, examType })}
            profile={selectedProfile}
            selectedAttendancePercent={selectedAttendancePercent}
            selectedBatch={selectedBatch}
            selectedBatchId={selectedBatch?.id ?? ""}
            selectedStudent={selectedStudent}
            selectedStudentId={activeStudentId}
            setSelectedBatchId={setSelectedBatchId}
            setSelectedStudentId={setSelectedStudentId}
            students={students}
          />
        ) : null}
      </section>
    </main>
  );
}

function AttendanceDesk({
  activeSchedule,
  attendancePending,
  batches,
  markAllPresent,
  markStudent,
  remarks,
  selectedBatch,
  selectedBatchId,
  setRemarks,
  setSelectedBatchId,
  setSelectedStudentId,
  students,
}: {
  activeSchedule: PTSchedule | null;
  attendancePending: boolean;
  batches: AssignedBatch[];
  markAllPresent: () => void;
  markStudent: (entry: AssignedStudent, index: number, attendanceStatus: string) => void;
  remarks: string;
  selectedBatch?: AssignedBatch;
  selectedBatchId: string;
  setRemarks: (value: string) => void;
  setSelectedBatchId: (value: string) => void;
  setSelectedStudentId: (value: string) => void;
  students: AssignedStudent[];
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-black">{selectedBatch?.name ?? selectedBatch?.batchName ?? "No batch selected"}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{activeSchedule ? `Register: ${activeSchedule.title}` : "Create today's register before marking attendance."}</p>
        </div>
        <button type="button" onClick={markAllPresent} disabled={!activeSchedule || !students.length || attendancePending} className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white disabled:opacity-50">Mark All Present</button>
      </div>

      <label className="grid gap-2 text-sm font-black">
        Batch
        <select
          value={selectedBatchId}
          onChange={(event) => {
            setSelectedBatchId(event.target.value);
            setSelectedStudentId("");
          }}
          className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-normal"
        >
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>{batch.name ?? batch.batchName ?? "PT Batch"}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-black">
        Common remarks
        <input value={remarks} onChange={(event) => setRemarks(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] px-3 text-sm font-normal" placeholder="Late, injury, ground drill, running practice..." />
      </label>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="hidden grid-cols-[1fr_120px_120px_120px] bg-[var(--page-bg)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-blue)] md:grid">
          <span>Student</span>
          <span>Present</span>
          <span>Absent</span>
          <span>Leave</span>
        </div>
        {students.map((entry, index) => (
          <div key={studentId(entry, index)} className="grid gap-3 border-t border-[var(--border)] p-4 first:border-t-0 md:grid-cols-[1fr_120px_120px_120px] md:items-center">
            <button type="button" onClick={() => setSelectedStudentId(studentId(entry, index))} className="text-left">
              <strong>{studentName(entry, index)}</strong>
              <span className="mt-1 block text-xs text-[var(--muted-blue)]">{entry.student?.mobile ?? entry.student?.email ?? "Student"}</span>
            </button>
            <AttendanceButton label="Present" disabled={!activeSchedule || attendancePending} onClick={() => markStudent(entry, index, "PRESENT")} />
            <AttendanceButton label="Absent" disabled={!activeSchedule || attendancePending} onClick={() => markStudent(entry, index, "ABSENT")} />
            <AttendanceButton label="Leave" disabled={!activeSchedule || attendancePending} onClick={() => markStudent(entry, index, "LEAVE")} />
          </div>
        ))}
        {!students.length ? <SoftNote text="No students are available in this batch." /> : null}
      </div>

    </div>
  );
}

function FitnessRecordDesk({
  batches,
  fitnessForm,
  fitnessPending,
  fitnessSuggestion,
  onSave,
  selectedBatch,
  selectedBatchId,
  selectedStudentId,
  setFitnessForm,
  setSelectedBatchId,
  setSelectedStudentId,
  students,
}: {
  batches: AssignedBatch[];
  fitnessForm: FitnessRecordForm;
  fitnessPending: boolean;
  fitnessSuggestion: string | null;
  onSave: () => void;
  selectedBatch?: AssignedBatch;
  selectedBatchId: string;
  selectedStudentId: string;
  setFitnessForm: (value: FitnessRecordForm) => void;
  setSelectedBatchId: (value: string) => void;
  setSelectedStudentId: (value: string) => void;
  students: AssignedStudent[];
}) {
  const updateField = (key: keyof FitnessRecordForm, value: string) => {
    setFitnessForm({ ...fitnessForm, [key]: value });
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-black">
          Batch
          <select
            value={selectedBatchId}
            onChange={(event) => {
              setSelectedBatchId(event.target.value);
              setSelectedStudentId("");
            }}
            className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-normal"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.name ?? batch.batchName ?? "PT Batch"}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black">
          Student
          <select
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
            className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-normal"
          >
            {students.map((entry, index) => (
              <option key={studentId(entry, index)} value={studentId(entry, index)}>{studentName(entry, index)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
        <h3 className="text-xl font-black">{selectedBatch?.name ?? selectedBatch?.batchName ?? "Select a batch"}</h3>
        <p className="mt-1 text-sm text-[var(--muted-blue)]">Enter the latest PT measurement for one student. Use zero only when the activity was not tested.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FitnessInput label="Height (cm)" value={fitnessForm.height} onChange={(value) => updateField("height", value)} />
        <FitnessInput label="Weight (kg)" value={fitnessForm.weight} onChange={(value) => updateField("weight", value)} />
        <FitnessInput label="Running time (min)" value={fitnessForm.runningTime} onChange={(value) => updateField("runningTime", value)} />
        <FitnessInput label="Pushups" value={fitnessForm.pushups} onChange={(value) => updateField("pushups", value)} />
        <FitnessInput label="Pullups" value={fitnessForm.pullups} onChange={(value) => updateField("pullups", value)} />
        <FitnessInput label="Situps" value={fitnessForm.situps} onChange={(value) => updateField("situps", value)} />
      </div>

      <label className="grid gap-2 text-sm font-black">
        Remarks
        <textarea
          value={fitnessForm.remarks}
          onChange={(event) => updateField("remarks", event.target.value)}
          className="min-h-28 rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm font-normal"
          placeholder="Improved stamina, knee pain, needs running practice..."
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onSave} disabled={fitnessPending || !selectedStudentId} className="min-h-12 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">
          Save Fitness Record
        </button>
        {fitnessSuggestion ? <p className="text-sm font-semibold text-[var(--muted-blue)]">{fitnessSuggestion}</p> : null}
      </div>

      {!batches.length ? <SoftNote text="No batch is allocated to this physical trainer." /> : null}
      {batches.length && !students.length ? <SoftNote text="No students are available in this batch." /> : null}
    </div>
  );
}

function FitnessInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-normal"
        placeholder="0"
      />
    </label>
  );
}

function TrainerReports({
  attendance,
  batches,
  eligibilityPending,
  eligibilityRows,
  fitnessLogs,
  onCheckEligibility,
  profile,
  selectedAttendancePercent,
  selectedBatch,
  selectedBatchId,
  selectedStudent,
  selectedStudentId,
  setSelectedBatchId,
  setSelectedStudentId,
  students,
}: {
  attendance: PTAttendance[];
  batches: AssignedBatch[];
  eligibilityPending: boolean;
  eligibilityRows: PhysicalEligibility[];
  fitnessLogs: DailyFitnessLog[];
  onCheckEligibility: (examType: string) => void;
  profile: FitnessProfile | null;
  selectedAttendancePercent: number;
  selectedBatch?: AssignedBatch;
  selectedBatchId: string;
  selectedStudent?: AssignedStudent;
  selectedStudentId: string;
  setSelectedBatchId: (value: string) => void;
  setSelectedStudentId: (value: string) => void;
  students: AssignedStudent[];
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel title="Student Report" eyebrow="Select and check">
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Batch
              <select
                value={selectedBatchId}
                onChange={(event) => {
                  setSelectedBatchId(event.target.value);
                  setSelectedStudentId("");
                }}
                className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-normal"
              >
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name ?? batch.batchName ?? "PT Batch"}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Student
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-normal"
              >
                {students.map((entry, index) => (
                  <option key={studentId(entry, index)} value={studentId(entry, index)}>{studentName(entry, index)}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
            <h3 className="text-xl font-black">{selectedStudent ? selectedStudent.student?.name ?? "Student" : "No student selected"}</h3>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">{selectedBatch?.name ?? selectedBatch?.batchName ?? "Select a batch"} / {selectedStudent?.student?.mobile ?? selectedStudent?.student?.email ?? "Student profile"}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ReportCard title="Attendance" value={`${selectedAttendancePercent}%`} note={`${attendance.length} attendance entries`} icon={CheckCircle2} />
            <ReportCard title="Fitness Level" value={profile?.fitnessLevel?.replaceAll("_", " ") ?? "Pending"} note={profile ? `Score ${profile.staminaScore}` : "No fitness record"} icon={ClipboardCheck} />
            <ReportCard title="BMI" value={profile ? String(profile.bmi) : "-"} note={profile ? `${profile.height} cm / ${profile.weight} kg` : "Save fitness record"} icon={Dumbbell} />
            <ReportCard title="Eligibility" value={eligibilityRows[0]?.eligibilityStatus?.replaceAll("_", " ") ?? "Not checked"} note={eligibilityRows[0]?.examType ?? "Run check"} icon={CalendarDays} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" disabled={!profile || !selectedStudentId || eligibilityPending} onClick={() => onCheckEligibility("NDA")} className="min-h-12 rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50">Check NDA Eligibility</button>
            <button type="button" disabled={!profile || !selectedStudentId || eligibilityPending} onClick={() => onCheckEligibility("AFCAT")} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black disabled:opacity-50">Check AFCAT Eligibility</button>
          </div>

          {!profile ? <SoftNote text="Save a fitness record first, then eligibility can be checked." /> : null}
        </div>
      </Panel>

      <Panel title="Recent Activity" eyebrow="Attendance and records">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <h3 className="text-lg font-black">Attendance</h3>
            {attendance.slice(0, 6).map((item) => (
              <HistoryRow key={item.id} title={item.ptSchedule?.title ?? "PT Session"} note={new Date(item.markedAt).toLocaleString()} badge={item.attendanceStatus} />
            ))}
            {!attendance.length ? <SoftNote text="No PT attendance is available for this student." /> : null}
          </div>

          <div className="grid gap-3">
            <h3 className="text-lg font-black">Fitness Notes</h3>
            {fitnessLogs.slice(0, 6).map((item) => (
              <HistoryRow key={item.id} title="Fitness record" note={item.notes || new Date(item.createdAt).toLocaleString()} badge={new Date(item.createdAt).toLocaleDateString()} />
            ))}
            {!fitnessLogs.length ? <SoftNote text="No fitness notes are available for this student." /> : null}
          </div>
        </div>
      </Panel>
    </section>
  );
}

function AttendanceButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black disabled:opacity-40">
      {label}
    </button>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: number; note: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-black">{label}</p>
      <p className="text-xs text-[var(--muted-blue)]">{note}</p>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-6">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SessionCard({ session }: { session: PTSchedule }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">{new Date(session.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      <h3 className="mt-2 text-xl font-black">{session.title}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{session.activityType} / {session.duration} min / {session.trainerName}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{session.description}</p>
    </article>
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
