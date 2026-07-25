"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Eye, EyeOff, FileBarChart2, GraduationCap, KeyRound, Mail, Phone, Save, Search, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { getAcademyBatches, getStudentProgressSummary, resetAcademyStudentPin, updateAcademyStudent, type AcademyBatch } from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";
import { AcademicHero, AcademicPill, AcademicShell, EmptyState, Panel, StatCard } from "@/app/dashboard/director/academic/_components";

type Props = {
  audience: "director" | "academic-head" | "admission-cell";
  embedded?: boolean;
};

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

type BatchStudent = NonNullable<AcademyBatch["students"]>[number]["student"];
type BatchStudentEntry = NonNullable<AcademyBatch["students"]>[number];
type StudentDraft = {
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  pin: string;
};

function loginMobile(student: BatchStudent) {
  return metadataString(student.roleMetadata, "loginMobile") || student.mobile || "No mobile";
}

function accessPinLabel(metadata?: Record<string, unknown> | null) {
  const pin = metadataString(metadata, "accessPin");
  if (/^\d{4}$/.test(pin)) return pin;
  if (metadata?.defaultPin === true || metadata?.defaultPassword === true) return "1234";
  return "Reset required";
}

function metric(value: number | null | undefined, suffix = "%") {
  return typeof value === "number" ? `${value}${suffix}` : "No data";
}

const emptyBatches: AcademyBatch[] = [];

function batchCourseKey(batch: AcademyBatch) {
  return batch.course?.slug || batch.programSlug || batch.course?.title || "general";
}

function batchCourseLabel(batch: AcademyBatch) {
  return batch.course?.title || batch.programSlug || "General Course";
}

export default function StudentsByClassWorkspace({ audience, embedded = false }: Props) {
  const queryClient = useQueryClient();
  const [activeBatchId, setActiveBatchId] = useState("");
  const [activeCourseKey, setActiveCourseKey] = useState("");
  const [search, setSearch] = useState("");
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [draft, setDraft] = useState<StudentDraft>({ name: "", email: "", phone: "", rollNumber: "", pin: "" });
  const [pinVisible, setPinVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const batchesQuery = useQuery({ queryKey: ["academy", "batches", "students-workspace"], queryFn: () => getAcademyBatches() });
  const progressQuery = useQuery({ queryKey: ["academy", "student-progress-summary"], queryFn: getStudentProgressSummary });
  const batches = batchesQuery.data ?? emptyBatches;
  const progressByBatch = useMemo(
    () => new Map((progressQuery.data?.batches ?? []).map((batch) => [batch.batchId, batch])),
    [progressQuery.data?.batches],
  );
  const courseGroups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; batches: AcademyBatch[]; students: number }>();
    for (const batch of batches) {
      const key = batchCourseKey(batch);
      const current = map.get(key) ?? { key, label: batchCourseLabel(batch), batches: [], students: 0 };
      current.batches.push(batch);
      current.students += batch._count?.students ?? batch.students?.length ?? 0;
      map.set(key, current);
    }
    return Array.from(map.values()).sort((first, second) => first.label.localeCompare(second.label));
  }, [batches]);
  const activeCourse = courseGroups.find((course) => course.key === activeCourseKey) ?? courseGroups[0] ?? null;
  const visibleBatches = activeCourse?.batches ?? batches;
  const selectedBatch = batches.find((batch) => batch.id === activeBatchId) ?? batches[0] ?? null;
  const selectedHealth = selectedBatch ? progressByBatch.get(selectedBatch.id) : null;
  const normalizedSearch = search.trim().toLowerCase();
  const selectedStudents = (selectedBatch?.students ?? []).filter((entry) => {
    if (!normalizedSearch) return true;
    const student = entry.student;
    return [student?.name, student?.email, student?.mobile, loginMobile(student), student?.rollNumber, entry.remarks]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
  const totalStudents = batches.reduce((sum, batch) => sum + (batch._count?.students ?? batch.students?.length ?? 0), 0);
  const progressUrl = audience === "director" ? "/dashboard/director/academic/student-progress" : audience === "academic-head" ? "/dashboard/academic-head/hod/student-monitoring" : "/dashboard/admission-cell#students";
  const selectedEntry = selectedBatch?.students?.find((entry) => entry.student.id === selectedStudentId) ?? null;
  const selectedStudent = selectedEntry?.student ?? null;
  const studentProfileUrl = selectedStudent ? `${progressUrl}?studentId=${selectedStudent.id}&batchId=${selectedBatch?.id ?? ""}` : progressUrl;
  const invalidateStudents = () => {
    queryClient.invalidateQueries({ queryKey: ["academy", "batches", "students-workspace"] });
    queryClient.invalidateQueries({ queryKey: ["academy", "student-progress-summary"] });
  };
  const updateMutation = useMutation({
    mutationFn: () =>
      updateAcademyStudent(selectedStudentId, {
        batchId: selectedBatch?.id,
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        rollNumber: draft.rollNumber,
        pin: draft.pin || undefined,
      }),
    onSuccess: () => {
      setDraft((current) => ({ ...current, pin: "" }));
      setSuccessMessage("Student profile and login saved.");
      invalidateStudents();
    },
  });
  const resetPinMutation = useMutation({
    mutationFn: () => resetAcademyStudentPin(selectedStudentId, draft.pin || "1234"),
    onSuccess: () => {
      setDraft((current) => ({ ...current, pin: "" }));
      setSuccessMessage("Student PIN reset and login unlocked.");
      invalidateStudents();
    },
  });

  useEffect(() => {
    if (!courseGroups.length) return;
    setActiveCourseKey((current) => current && courseGroups.some((course) => course.key === current) ? current : courseGroups[0].key);
  }, [courseGroups]);

  useEffect(() => {
    if (!visibleBatches.length) return;
    setActiveBatchId((current) => current && visibleBatches.some((batch) => batch.id === current) ? current : visibleBatches[0].id);
  }, [visibleBatches]);

  useEffect(() => {
    if (!selectedEntry) return;
    setDraft({
      name: selectedEntry.student.name || "",
      email: selectedEntry.student.email || "",
      phone: loginMobile(selectedEntry.student) === "No mobile" ? "" : loginMobile(selectedEntry.student),
      rollNumber: selectedEntry.student.rollNumber || selectedEntry.remarks || "",
      pin: "",
    });
    setPinVisible(false);
    setSuccessMessage("");
  }, [selectedEntry]);

  function openStudent(entry: BatchStudentEntry) {
    setSelectedStudentId(entry.student.id);
  }

  const content = (
    <>
      <AcademicHero
        eyebrow="Students"
        title="Students by Class"
        description="Open a class first, then check admitted students, login mobile numbers, PIN status and progress history from one place."
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-4">
        <StatCard label="Classes" value={batches.length} />
        <StatCard label="Students" value={totalStudents} />
        <StatCard label="Need Attention" value={(progressQuery.data?.batches ?? []).filter((batch) => batch.overallStatus !== "Healthy" && batch.overallStatus !== "No Data").length} />
        <StatCard label="Risk Students" value={(progressQuery.data?.batches ?? []).reduce((sum, batch) => sum + batch.riskStudentCount, 0)} />
      </section>

      <Panel title="Courses and batches" eyebrow="Select course then batch">
        {batchesQuery.isLoading ? <EmptyState text="Loading classes..." /> : null}
        {!batchesQuery.isLoading && !batches.length ? <EmptyState text="No active classes are available yet. Students will appear here after they are enrolled in a batch." /> : null}
        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <div className="grid gap-2 content-start">
            {courseGroups.map((course) => (
              <button
                key={course.key}
                type="button"
                onClick={() => {
                  setActiveCourseKey(course.key);
                  setActiveBatchId(course.batches[0]?.id ?? "");
                }}
                className={`rounded-xl border px-3 py-3 text-left transition ${activeCourse?.key === course.key ? "border-[var(--gold-border)] bg-[var(--gold-soft)] shadow-sm" : "border-[var(--border)] bg-white hover:border-[var(--gold-border)]"}`}
              >
                <p className="truncate text-sm font-black text-[var(--navy)]">{course.label}</p>
                <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">{course.batches.length} batch{course.batches.length === 1 ? "" : "es"} / {course.students} students</p>
              </button>
            ))}
          </div>

          <div className="min-w-0">
            <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
              {visibleBatches.map((batch) => {
                const health = progressByBatch.get(batch.id);
                const selected = selectedBatch?.id === batch.id;
                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => setActiveBatchId(batch.id)}
                    className={`rounded-xl border p-3 text-left transition hover:border-[var(--gold-border)] ${selected ? "border-[var(--gold-border)] bg-[var(--gold-soft)] shadow-sm" : "border-[var(--border)] bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[var(--gold)]">{batch.batchType || "Batch"}</p>
                        <h3 className="mt-1 truncate text-base font-black leading-tight">{batch.name}</h3>
                      </div>
                      <AcademicPill>{selected ? "Open" : health?.overallStatus ?? batch.status}</AcademicPill>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      <ClassMetric icon={Users} label="Students" value={batch._count?.students ?? batch.students?.length ?? 0} />
                      <ClassMetric icon={ShieldCheck} label="Attendance" value={metric(health?.attendancePercentage)} />
                      <ClassMetric icon={FileBarChart2} label="Health" value={metric(health?.batchHealthScore)} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={selectedBatch ? selectedBatch.name : "Student Profiles"} eyebrow="Profiles credentials progress">
        {selectedBatch ? (
          <div className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="grid gap-2 sm:grid-cols-4">
                <ClassMetric icon={Users} label="Students" value={selectedBatch._count?.students ?? selectedBatch.students?.length ?? 0} />
                <ClassMetric icon={ShieldCheck} label="Attendance" value={metric(selectedHealth?.attendancePercentage)} />
                <ClassMetric icon={BookOpen} label="Assignments" value={metric(selectedHealth?.assignmentCompletionPercentage)} />
                <ClassMetric icon={GraduationCap} label="Exam Avg" value={metric(selectedHealth?.examAveragePercentage)} />
              </div>
              <Link href={progressUrl} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black text-[var(--navy)]">
                <FileBarChart2 className="h-4 w-4" />
                Progress Reports
              </Link>
            </div>

            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted-blue)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student name, mobile, email or roll number"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </label>

            {!selectedStudents.length ? <EmptyState text="No students match this class and search." /> : null}
            <div className="grid gap-2">
              {selectedStudents.map((entry) => {
                const student = entry.student;
                const pinLabel = accessPinLabel(student.roleMetadata);
                const canRevealPin = /^\d{4}$/.test(pinLabel);
                const pinVisible = visiblePins[student.id] === true;
                return (
                  <article key={entry.id} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm transition hover:border-[var(--gold-border)] xl:grid-cols-[1.35fr_0.9fr_1fr_0.9fr_auto] xl:items-center">
                    <button type="button" onClick={() => openStudent(entry)} className="flex min-w-0 items-center gap-3 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-[var(--gold-border)]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black">{student.name || "Student"}</h3>
                        <p className="truncate text-xs text-[var(--muted-blue)]">Click to open and edit profile</p>
                      </div>
                    </button>
                    <InfoBlock label="Roll / Notes" value={student.rollNumber || entry.remarks || "Not set"} />
                    <InfoBlock label="Login Mobile" value={loginMobile(student)} />
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">PIN</p>
                        <p className="mt-1 truncate text-sm font-black">{pinVisible || !canRevealPin ? pinLabel : "****"}</p>
                      </div>
                      {canRevealPin ? (
                        <button
                          type="button"
                          onClick={() => setVisiblePins((items) => ({ ...items, [student.id]: !items[student.id] }))}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white"
                          aria-label={`${pinVisible ? "Hide" : "Show"} PIN for ${student.name || "student"}`}
                        >
                          {pinVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      ) : null}
                    </div>
                    <button type="button" onClick={() => openStudent(entry)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-3 py-2 text-sm font-black text-white">
                      Manage
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState text="Select a class to see student profiles, credentials and progress links." />
        )}
      </Panel>

      {selectedStudent && selectedEntry ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label={`Manage ${selectedStudent.name}`}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              updateMutation.mutate();
            }}
            className="grid max-h-[92vh] w-full max-w-2xl gap-4 overflow-auto rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] text-xl font-black text-[var(--gold)]">
                  {(selectedStudent.name || "S").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">Student Profile</p>
                  <h2 className="truncate text-2xl font-black text-[var(--navy)]">{selectedStudent.name || "Student"}</h2>
                  <p className="truncate text-sm text-[var(--muted-blue)]">{selectedBatch?.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedStudentId("")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white" aria-label="Close student profile">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <InfoBlock label="Current Login" value={loginMobile(selectedStudent)} />
              <InfoBlock label="Current PIN" value={accessPinLabel(selectedStudent.roleMetadata)} />
              <InfoBlock label="Roll Number" value={selectedStudent.rollNumber || selectedEntry.remarks || "Not set"} />
            </div>

            {(updateMutation.error || resetPinMutation.error) ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{getApiErrorMessage(updateMutation.error || resetPinMutation.error)}</div>
            ) : null}
            {successMessage ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{successMessage}</div> : null}

            <div className="grid gap-3 md:grid-cols-2">
              <ProfileField label="Student Name" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} icon={UserRound} required />
              <ProfileField label="Login Mobile Number" value={draft.phone} onChange={(value) => setDraft((current) => ({ ...current, phone: value }))} icon={Phone} required />
              <ProfileField label="Email" value={draft.email} onChange={(value) => setDraft((current) => ({ ...current, email: value }))} icon={Mail} />
              <ProfileField label="Roll Number" value={draft.rollNumber} onChange={(value) => setDraft((current) => ({ ...current, rollNumber: value.toUpperCase() }))} icon={ShieldCheck} />
            </div>

            <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3 md:grid-cols-[1fr_auto] md:items-end">
              <label className="grid gap-1 text-sm font-bold text-[var(--navy)]">
                <span>Set New 4 Digit PIN</span>
                <span className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
                  <KeyRound className="h-4 w-4 text-[var(--muted-blue)]" />
                  <input
                    value={draft.pin}
                    onChange={(event) => setDraft((current) => ({ ...current, pin: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    type={pinVisible ? "text" : "password"}
                    inputMode="numeric"
                    placeholder="Leave blank unless changing"
                    className="min-w-0 flex-1 bg-transparent outline-none"
                  />
                  <button type="button" onClick={() => setPinVisible((value) => !value)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white" aria-label={pinVisible ? "Hide PIN" : "Show PIN"}>
                    {pinVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>
              <button
                type="button"
                onClick={() => resetPinMutation.mutate()}
                disabled={resetPinMutation.isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black text-[var(--navy)] disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" />
                {resetPinMutation.isPending ? "Resetting..." : `Reset to ${draft.pin || "1234"}`}
              </button>
            </div>

            <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-between">
              <Link href={studentProfileUrl} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black text-[var(--navy)]">
                <FileBarChart2 className="h-4 w-4" />
                Open Progress Report
              </Link>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => setSelectedStudentId("")} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black text-[var(--navy)]">
                  Close
                </button>
                <button type="submit" disabled={updateMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-sm font-black text-white disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );

  if (embedded) return <section className="grid gap-4">{content}</section>;

  return <AcademicShell>{content}</AcademicShell>;
}

function ClassMetric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5">
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[var(--muted-blue)]">
        <Icon className="h-3.5 w-3.5" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  icon: Icon,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: typeof UserRound;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-[var(--navy)]">
      <span>{label}</span>
      <span className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
        <Icon className="h-4 w-4 shrink-0 text-[var(--muted-blue)]" />
        <input value={value} onChange={(event) => onChange(event.target.value)} required={required} className="min-w-0 flex-1 bg-transparent outline-none" />
      </span>
    </label>
  );
}
