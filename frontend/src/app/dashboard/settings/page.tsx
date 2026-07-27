"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Activity, AlertCircle, Camera, CheckCircle2, HeartPulse, KeyRound, PhoneCall, RefreshCw, Save, ShieldCheck, UserRound } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/providers/toast-provider";
import { apiClient, getApiErrorMessage } from "@/services/api";
import { changePin, updateProfile, updateProfilePhoto, type ProfileUpdatePayload } from "@/services/auth.v2";
import { useAuth } from "@/components/providers/auth-provider-v2";

const requiredFields: Array<{ key: keyof ProfileUpdatePayload; label: string }> = [
  { key: "name", label: "Full name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "gender", label: "Gender" },
  { key: "address", label: "Address" },
  { key: "bloodGroup", label: "Blood group" },
  { key: "emergencyContactName", label: "Emergency contact name" },
  { key: "emergencyContactMobile", label: "Emergency contact mobile" },
  { key: "emergencyContactRelation", label: "Emergency relation" },
  { key: "designation", label: "Designation" },
  { key: "department", label: "Department" },
];

const progressFields: Array<{ key: keyof ProfileUpdatePayload; label: string }> = [
  { key: "attendanceDiscipline", label: "Attendance discipline" },
  { key: "syllabusDelivery", label: "Syllabus delivery" },
  { key: "assignmentReview", label: "Assignment review" },
  { key: "examReadiness", label: "Exam readiness" },
  { key: "ndpCompletion", label: "NDP completion" },
  { key: "personalGrowth", label: "Personal growth" },
];

type TeachingBatch = {
  id: string;
  name: string;
  students?: unknown[];
  _count?: { students?: number };
};

type TeacherSystemProgress = {
  loading: boolean;
  error: string | null;
  assignedBatches: number;
  totalStudents: number;
  attendanceRecords: number;
  assignments: number;
  exams: number;
  materials: number;
  syllabusAverage: number;
  attendanceSignal: number;
  assignmentSignal: number;
  examSignal: number;
  materialSignal: number;
  systemScore: number;
};

const emptySystemProgress: TeacherSystemProgress = {
  loading: false,
  error: null,
  assignedBatches: 0,
  totalStudents: 0,
  attendanceRecords: 0,
  assignments: 0,
  exams: 0,
  materials: 0,
  syllabusAverage: 0,
  attendanceSignal: 0,
  assignmentSignal: 0,
  examSignal: 0,
  materialSignal: 0,
  systemScore: 0,
};

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 0;
}

function studentCount(batch: TeachingBatch) {
  return batch._count?.students ?? batch.students?.length ?? 0;
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? Math.round(clean.reduce((total, value) => total + value, 0) / clean.length) : 0;
}

function signal(count: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((count / target) * 100));
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-[var(--ink)]">
      <span>{label}{required ? <span className="text-rose-600"> *</span> : null}</span>
      {children}
    </label>
  );
}

function MetricTile({ label, value, loading }: { label: string; value: string | number; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-1 text-xl font-black">{loading ? "--" : value}</p>
    </div>
  );
}

function inputClass(missing = false) {
  return `min-h-12 rounded-xl border bg-white px-4 text-sm font-bold outline-none focus:border-slate-950 ${missing ? "border-rose-300" : "border-[var(--border)]"}`;
}

function profileTitle(role?: string | null) {
  if (role === "DIRECTOR") return "Director Profile";
  if (role === "ACADEMIC_HEAD") return "Academic Head Profile";
  if (role === "PHYSICAL_TRAINER") return "Trainer Profile";
  if (role === "STUDENT") return "Student Profile";
  if (role === "PARENT") return "Parent Profile";
  if (role === "ADMINISTRATIVE_OFFICER") return "Administrative Profile";
  if (role === "BUSINESS_DEVELOPMENT_EXECUTIVE" || role === "MARKETING_COORDINATOR" || role === "TELECALLER") return "Business Profile";
  if (role === "TEACHER") return "Teacher Profile";
  return "Profile Setup";
}

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, refreshUser } = useAuth();
  const metadata = useMemo(() => user?.roleMetadata && typeof user.roleMetadata === "object" ? user.roleMetadata : {}, [user]);
  const progress = useMemo(
    () => metadata.teacherProgress && typeof metadata.teacherProgress === "object" && !Array.isArray(metadata.teacherProgress) ? metadata.teacherProgress as Record<string, unknown> : {},
    [metadata]
  );
  const [profile, setProfile] = useState<ProfileUpdatePayload>({
    name: "",
    email: "",
    mobile: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodGroup: "",
    emergencyContactName: "",
    emergencyContactMobile: "",
    emergencyContactRelation: "",
    designation: "",
    department: "",
    qualification: "",
    experience: "",
    attendanceDiscipline: 0,
    syllabusDelivery: 0,
    assignmentReview: 0,
    examReadiness: 0,
    ndpCompletion: 0,
    personalGrowth: 0,
    progressNote: "",
  });
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [systemProgress, setSystemProgress] = useState<TeacherSystemProgress>(emptySystemProgress);

  useEffect(() => {
    setMustChangePassword(new URLSearchParams(window.location.search).get("mustChangePassword") === "1");
  }, []);

  useEffect(() => {
    setProfile({
      name: user?.name ?? "",
      email: user?.email ?? "",
      mobile: user?.mobile ?? "",
      dateOfBirth: textValue(metadata.dateOfBirth),
      gender: textValue(metadata.gender),
      address: textValue(metadata.address),
      bloodGroup: textValue(metadata.bloodGroup),
      emergencyContactName: textValue(metadata.emergencyContactName),
      emergencyContactMobile: textValue(metadata.emergencyContactMobile),
      emergencyContactRelation: textValue(metadata.emergencyContactRelation),
      designation: textValue(metadata.designation) || (user?.role === "TEACHER" ? "Faculty" : ""),
      department: textValue(metadata.department) || (user?.role === "TEACHER" ? "Academics" : ""),
      qualification: textValue(metadata.qualification),
      experience: textValue(metadata.experience),
      attendanceDiscipline: numberValue(progress.attendanceDiscipline),
      syllabusDelivery: numberValue(progress.syllabusDelivery),
      assignmentReview: numberValue(progress.assignmentReview),
      examReadiness: numberValue(progress.examReadiness),
      ndpCompletion: numberValue(progress.ndpCompletion),
      personalGrowth: numberValue(progress.personalGrowth),
      progressNote: textValue(progress.progressNote),
    });
  }, [metadata, progress, user]);

  async function loadSystemProgress() {
    if (!user || !["TEACHER", "ACADEMIC_HEAD", "DIRECTOR"].includes(user.role)) return;
    setSystemProgress((current) => ({ ...current, loading: true, error: null }));
    try {
      const plan = await apiClient.get<{ batches?: TeachingBatch[] }>("/academy/my-teaching-plan");
      const batches = Array.isArray(plan.data.batches) ? plan.data.batches : [];
      const workspace = await Promise.all(batches.map(async (batch) => {
        const [attendance, assignments, materials, exams, progressItems] = await Promise.all([
          apiClient.get<{ attendance?: Array<{ records?: unknown[] }> }>(`/academy/attendance?batchId=${encodeURIComponent(batch.id)}`).catch(() => ({ data: { attendance: [] } })),
          apiClient.get<{ assignments?: unknown[] }>(`/academy/assignments?batchId=${encodeURIComponent(batch.id)}`).catch(() => ({ data: { assignments: [] } })),
          apiClient.get<{ materials?: unknown[] }>(`/academy/study-materials?batchId=${encodeURIComponent(batch.id)}&includeArchived=true`).catch(() => ({ data: { materials: [] } })),
          apiClient.get<{ exams?: unknown[] }>(`/academy/exams?batchId=${encodeURIComponent(batch.id)}`).catch(() => ({ data: { exams: [] } })),
          apiClient.get<{ progress?: Array<{ completionPercentage?: number; completionPercent?: number; progress?: number }> }>(`/academy/syllabus-progress?batchId=${encodeURIComponent(batch.id)}`).catch(() => ({ data: { progress: [] } })),
        ]);
        return {
          attendance: attendance.data.attendance ?? [],
          assignments: assignments.data.assignments ?? [],
          materials: materials.data.materials ?? [],
          exams: exams.data.exams ?? [],
          progress: progressItems.data.progress ?? [],
        };
      }));
      const totalStudents = batches.reduce((total, batch) => total + studentCount(batch), 0);
      const attendanceRecords = workspace.reduce((total, item) => total + item.attendance.length, 0);
      const assignments = workspace.reduce((total, item) => total + item.assignments.length, 0);
      const materials = workspace.reduce((total, item) => total + item.materials.length, 0);
      const exams = workspace.reduce((total, item) => total + item.exams.length, 0);
      const syllabusAverage = average(workspace.flatMap((item) => item.progress.map((record) => numberValue(record.completionPercentage ?? record.completionPercent ?? record.progress))));
      const attendanceSignal = signal(attendanceRecords, Math.max(1, batches.length));
      const assignmentSignal = signal(assignments, Math.max(1, batches.length));
      const examSignal = signal(exams, Math.max(1, batches.length));
      const materialSignal = signal(materials, Math.max(1, batches.length));
      const systemScore = average([attendanceSignal, assignmentSignal, examSignal, materialSignal, syllabusAverage]);
      setSystemProgress({
        loading: false,
        error: null,
        assignedBatches: batches.length,
        totalStudents,
        attendanceRecords,
        assignments,
        exams,
        materials,
        syllabusAverage,
        attendanceSignal,
        assignmentSignal,
        examSignal,
        materialSignal,
        systemScore,
      });
    } catch (error) {
      setSystemProgress({ ...emptySystemProgress, loading: false, error: getApiErrorMessage(error) });
    }
  }

  useEffect(() => {
    void loadSystemProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const missingFields = requiredFields.filter((field) => !String(profile[field.key] ?? "").trim());
  const hasProfilePhoto = Boolean(user?.imageUrl);
  const missingItems = [!hasProfilePhoto ? "Profile photo" : null, ...missingFields.map((field) => field.label)].filter((item): item is string => Boolean(item));
  const completion = Math.round(((requiredFields.length + 1 - missingItems.length) / (requiredFields.length + 1)) * 100);
  const progressScore = Math.round(progressFields.reduce((total, field) => total + numberValue(profile[field.key]), 0) / progressFields.length);
  const hybridScore = systemProgress.systemScore ? Math.round((systemProgress.systemScore + progressScore) / 2) : progressScore;

  function updateField<K extends keyof ProfileUpdatePayload>(key: K, value: ProfileUpdatePayload[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    try {
      const response = await updateProfile(profile);
      await refreshUser();
      showToast(response.message ?? "Profile saved", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function submitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      showToast("PIN must be exactly 4 digits", "error");
      return;
    }
    if (newPin !== confirmPin) {
      showToast("New PINs do not match", "error");
      return;
    }
    setIsSubmittingPin(true);
    try {
      const response = await changePin({ currentPin, newPin });
      showToast(response.message ?? "PIN changed successfully", "success");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      router.replace("/login");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmittingPin(false);
    }
  }

  async function uploadPhoto(file?: File) {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const response = await updateProfilePhoto(file);
      await refreshUser();
      showToast(response.message ?? "Profile photo updated", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <RoleDashboardGuard role={["ADMIN", "DIRECTOR", "ACADEMIC_HEAD", "TEACHER", "PHYSICAL_TRAINER", "STUDENT", "PARENT", "TELECALLER", "MARKETING_COORDINATOR", "BUSINESS_DEVELOPMENT_EXECUTIVE", "ADMINISTRATIVE_OFFICER", "GUEST"]}>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto grid max-w-6xl gap-6">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex items-center gap-4">
                <div className="grid h-24 w-24 overflow-hidden rounded-2xl border border-gold/30 bg-gold/10 text-3xl font-black text-gold-soft">
                  {user?.imageUrl ? <span className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${user.imageUrl})` }} /> : <span className="m-auto">{user?.name?.slice(0, 1).toUpperCase() ?? "N"}</span>}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">{profileTitle(user?.role)}</p>
                  <h1 className="mt-2 text-3xl font-black text-[var(--ink)]">{profile.name || "Complete your profile"}</h1>
                  <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">{profile.designation || user?.role || "Role pending"} / {profile.mobile || "Mobile pending"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    <span className={`rounded-full px-3 py-1 ${completion === 100 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>Profile {completion}% complete</span>
                    <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-[var(--ink)]">Hybrid progress {hybridScore}%</span>
                    <span className={`rounded-full px-3 py-1 ${hasProfilePhoto ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{hasProfilePhoto ? "Photo added" : "Photo required"}</span>
                    <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-[var(--ink)]">{profile.bloodGroup || "Blood group pending"}</span>
                  </div>
                </div>
              </div>
              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-black text-navy-deep">
                <Camera className="h-4 w-4" />
                {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                <input className="sr-only" type="file" accept="image/*" disabled={isUploadingPhoto} onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
              </label>
            </div>
            {completion < 100 ? (
              <div className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900">
                Mandatory profile completion pending: {missingItems.join(", ")}.
              </div>
            ) : null}
          </div>

          <form onSubmit={submitProfile} className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-[var(--gold-dark)]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Basic Details</p>
                    <h2 className="mt-1 text-2xl font-black">Identity and contact</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Full Name" required><input className={inputClass(!profile.name)} value={profile.name} onChange={(event) => updateField("name", event.target.value)} /></Field>
                  <Field label="Mobile Number" required><input className={inputClass(!profile.mobile)} value={profile.mobile} onChange={(event) => updateField("mobile", event.target.value.replace(/[^\d+]/g, ""))} /></Field>
                  <Field label="Email" required><input className={inputClass(!profile.email)} value={profile.email} onChange={(event) => updateField("email", event.target.value)} /></Field>
                  <Field label="Date of Birth" required><input type="date" className={inputClass(!profile.dateOfBirth)} value={profile.dateOfBirth} onChange={(event) => updateField("dateOfBirth", event.target.value)} /></Field>
                  <Field label="Gender" required>
                    <select className={inputClass(!profile.gender)} value={profile.gender} onChange={(event) => updateField("gender", event.target.value)}>
                      <option value="">Select</option><option>Female</option><option>Male</option><option>Other</option>
                    </select>
                  </Field>
                  <Field label="Blood Group" required>
                    <select className={inputClass(!profile.bloodGroup)} value={profile.bloodGroup} onChange={(event) => updateField("bloodGroup", event.target.value)}>
                      <option value="">Select</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </Field>
                  <div className="md:col-span-2"><Field label="Address" required><textarea className={`${inputClass(!profile.address)} min-h-24 py-3`} value={profile.address} onChange={(event) => updateField("address", event.target.value)} /></Field></div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <PhoneCall className="h-5 w-5 text-[var(--gold-dark)]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Emergency</p>
                    <h2 className="mt-1 text-2xl font-black">Safety details</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4">
                  <Field label="Emergency Contact Name" required><input className={inputClass(!profile.emergencyContactName)} value={profile.emergencyContactName} onChange={(event) => updateField("emergencyContactName", event.target.value)} /></Field>
                  <Field label="Emergency Contact Mobile" required><input className={inputClass(!profile.emergencyContactMobile)} value={profile.emergencyContactMobile} onChange={(event) => updateField("emergencyContactMobile", event.target.value.replace(/[^\d+]/g, ""))} /></Field>
                  <Field label="Relationship" required><input className={inputClass(!profile.emergencyContactRelation)} value={profile.emergencyContactRelation} onChange={(event) => updateField("emergencyContactRelation", event.target.value)} placeholder="Father, spouse, sibling" /></Field>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                    <div className="flex items-center gap-2 text-rose-800"><HeartPulse size={18} /><b>Medical quick card</b></div>
                    <p className="mt-2 text-sm font-bold text-rose-900">Blood group: {profile.bloodGroup || "Mandatory"}</p>
                    <p className="mt-1 text-sm text-rose-900">{profile.emergencyContactName || "Emergency contact pending"} / {profile.emergencyContactMobile || "Number pending"}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[var(--gold-dark)]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Professional</p>
                    <h2 className="mt-1 text-2xl font-black">Role details</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4">
                  <Field label="Designation" required><input className={inputClass(!profile.designation)} value={profile.designation} onChange={(event) => updateField("designation", event.target.value)} /></Field>
                  <Field label="Department" required><input className={inputClass(!profile.department)} value={profile.department} onChange={(event) => updateField("department", event.target.value)} /></Field>
                  <Field label="Qualification"><input className={inputClass()} value={profile.qualification} onChange={(event) => updateField("qualification", event.target.value)} placeholder="MA English, B.Ed" /></Field>
                  <Field label="Experience"><input className={inputClass()} value={profile.experience} onChange={(event) => updateField("experience", event.target.value)} placeholder="5 years" /></Field>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-[var(--gold-dark)]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Performance Tracker</p>
                    <h2 className="mt-1 text-2xl font-black">My teaching progress</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricTile label="System Score" value={`${systemProgress.systemScore}%`} loading={systemProgress.loading} />
                    <MetricTile label="Self Score" value={`${progressScore}%`} />
                    <MetricTile label="Hybrid Score" value={`${hybridScore}%`} />
                  </div>
                  {systemProgress.error ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{systemProgress.error}</p> : null}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <MetricTile label="Batches" value={systemProgress.assignedBatches} loading={systemProgress.loading} />
                    <MetricTile label="Students" value={systemProgress.totalStudents} loading={systemProgress.loading} />
                    <MetricTile label="Materials" value={systemProgress.materials} loading={systemProgress.loading} />
                    <MetricTile label="Attendance Records" value={systemProgress.attendanceRecords} loading={systemProgress.loading} />
                    <MetricTile label="Assignments" value={systemProgress.assignments} loading={systemProgress.loading} />
                    <MetricTile label="Exams" value={systemProgress.exams} loading={systemProgress.loading} />
                  </div>
                  <div className="rounded-2xl bg-[var(--page-bg)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">Overall Hybrid Progress</p>
                        <p className="mt-1 text-4xl font-black">{hybridScore}%</p>
                      </div>
                      <button type="button" onClick={() => {
                        updateField("attendanceDiscipline", systemProgress.attendanceSignal);
                        updateField("syllabusDelivery", systemProgress.syllabusAverage);
                        updateField("assignmentReview", systemProgress.assignmentSignal);
                        updateField("examReadiness", systemProgress.examSignal);
                      }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
                        <RefreshCw size={15} /> Use system signals
                      </button>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><span className="block h-full rounded-full bg-emerald-700" style={{ width: `${hybridScore}%` }} /></div>
                  </div>
                  {progressFields.map((field) => (
                    <label key={field.key} className="grid gap-2 text-sm font-black">
                      <span className="flex items-center justify-between"><span>{field.label}</span><b>{numberValue(profile[field.key])}%</b></span>
                      <input type="range" min={0} max={100} value={numberValue(profile[field.key])} onChange={(event) => updateField(field.key, Number(event.target.value) as never)} />
                    </label>
                  ))}
                  <Field label="Progress Note"><textarea className={`${inputClass()} min-h-20 py-3`} value={profile.progressNote} onChange={(event) => updateField("progressNote", event.target.value)} placeholder="What should you improve this week?" /></Field>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-lg backdrop-blur">
              <p className={`inline-flex items-center gap-2 text-sm font-bold ${completion === 100 ? "text-emerald-700" : "text-amber-800"}`}>
                {completion === 100 ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                Mandatory profile completion: <b className="text-[var(--ink)]">{completion}%</b>
              </p>
              <Button type="submit" disabled={isSavingProfile} className="inline-flex gap-2">{isSavingProfile ? "Saving..." : <><Save size={16} /> Save Profile</>}</Button>
            </div>
          </form>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gold/15 p-3 text-gold-soft"><KeyRound className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Account Security</p>
                <h2 className="mt-1 text-2xl font-black">Change PIN</h2>
              </div>
            </div>
            {mustChangePassword ? <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft">This account is using the default PIN. Change it now to continue securely.</div> : null}
            <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={submitPin}>
              <PasswordInput label="Current PIN" value={currentPin} onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 4))} minLength={4} maxLength={4} inputMode="numeric" required />
              <PasswordInput label="New 4 Digit PIN" value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 4))} minLength={4} maxLength={4} inputMode="numeric" required />
              <PasswordInput label="Confirm New PIN" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))} minLength={4} maxLength={4} inputMode="numeric" required />
              <div className="md:col-span-3"><Button type="submit" disabled={isSubmittingPin}>{isSubmittingPin ? "Updating..." : "Update PIN"}</Button></div>
            </form>
          </section>
        </section>
      </main>
    </RoleDashboardGuard>
  );
}
