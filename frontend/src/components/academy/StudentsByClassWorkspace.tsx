"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, BookOpen, KeyRound, Mail, Phone, Plus, Save, Search, UserRound, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  addStudentToBatch,
  createAcademyBatch,
  getAcademyBatches,
  resetAcademyStudentPin,
  transferAcademyStudent,
  updateAcademyStudent,
  type AcademyBatch,
} from "@/services/academy";
import { getApiErrorMessage } from "@/services/api";
import { getAdmissions } from "@/services/crm";
import type { Admission } from "@/types/crm";
import { AcademicHero, AcademicShell, EmptyState, Panel, StatCard } from "@/app/dashboard/director/academic/_components";

type Props = {
  audience: "director" | "academic-head" | "admission-cell";
  embedded?: boolean;
};

type BatchStudentEntry = NonNullable<AcademyBatch["students"]>[number];
type BatchStudent = BatchStudentEntry["student"];

type StudentForm = {
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  pin: string;
};

type MoveMode = "COPY" | "TRANSFER";

const emptyBatches: AcademyBatch[] = [];
const emptyForm: StudentForm = { name: "", email: "", phone: "", rollNumber: "", pin: "" };

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function loginMobile(student?: BatchStudent | null) {
  if (!student) return "";
  return metadataString(student.roleMetadata, "loginMobile") || student.mobile || "";
}

function pinStatus(metadata?: Record<string, unknown> | null) {
  const pin = metadataString(metadata, "accessPin");
  if (/^\d{4}$/.test(pin)) return "PIN set";
  if (metadata?.defaultPin === true || metadata?.defaultPassword === true) return "Default PIN";
  return "Reset required";
}

function batchStudentCount(batch: AcademyBatch) {
  return batch._count?.students ?? batch.students?.length ?? 0;
}

function rollBatchCode(batch?: Pick<AcademyBatch, "batchType" | "name" | "programSlug"> | null) {
  const source = [batch?.name, batch?.batchType, batch?.programSlug].filter(Boolean).join(" ").toUpperCase();
  const seen = new Set<string>();
  const tokens = (source.match(/[A-Z0-9]+/g) ?? ["NIDUS"])
    .map((token) => {
      if (/^20\d{2}$/.test(token)) return token.slice(-2);
      if (token === "OFFLINE") return "OFF";
      if (token === "ONLINE") return "ONL";
      return token;
    })
    .filter((token) => {
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    });
  return tokens.slice(0, 4).join("-") || "NIDUS";
}

function nextAutoRollNumber(batch?: AcademyBatch | null) {
  if (!batch) return "";
  return `${rollBatchCode(batch)}-${String(batchStudentCount(batch) + 1).padStart(3, "0")}`;
}

function studentSearchText(entry: BatchStudentEntry) {
  const student = entry.student;
  return [student.name, student.email, student.mobile, loginMobile(student), student.rollNumber, entry.remarks].filter(Boolean).join(" ").toLowerCase();
}

function progressHref(audience: Props["audience"], studentId?: string, batchId?: string) {
  const base = audience === "director" ? "/dashboard/director/academic/student-progress" : audience === "academic-head" ? "/dashboard/academic-head/hod/student-monitoring" : "/dashboard/admission-cell#students";
  return studentId && batchId ? `${base}?studentId=${studentId}&batchId=${batchId}` : base;
}

export default function StudentsByClassWorkspace({ audience, embedded = false }: Props) {
  const queryClient = useQueryClient();
  const [activeBatchId, setActiveBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addSource, setAddSource] = useState<"ADMISSION" | "MANUAL">("ADMISSION");
  const [admissionSearch, setAdmissionSearch] = useState("");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  const [addBatchMode, setAddBatchMode] = useState<"EXISTING" | "NEW">("EXISTING");
  const [addTargetBatchId, setAddTargetBatchId] = useState("");
  const [newBatchName, setNewBatchName] = useState("");
  const [studentForm, setStudentForm] = useState<StudentForm>(emptyForm);
  const [addForm, setAddForm] = useState<StudentForm>(emptyForm);
  const [targetBatchId, setTargetBatchId] = useState("");
  const [moveMode, setMoveMode] = useState<MoveMode>("TRANSFER");
  const [notice, setNotice] = useState("");

  const batchesQuery = useQuery({ queryKey: ["academy", "batches", "students-workspace"], queryFn: () => getAcademyBatches() });
  const admissionsQuery = useQuery({ queryKey: ["crm", "admissions", "students-workspace"], queryFn: getAdmissions });
  const batches = useMemo(() => (batchesQuery.data ?? emptyBatches).filter((batch) => batch.status !== "ARCHIVED"), [batchesQuery.data]);
  const admissions = useMemo(() => admissionsQuery.data ?? [], [admissionsQuery.data]);
  const activeBatch = useMemo(() => batches.find((batch) => batch.id === activeBatchId) ?? batches[0] ?? null, [activeBatchId, batches]);
  const nextRollNumber = nextAutoRollNumber(activeBatch);
  const activeBatchStudents = useMemo(() => activeBatch?.students ?? [], [activeBatch?.students]);
  const selectedEntry = activeBatchStudents.find((entry) => entry.student.id === selectedStudentId) ?? null;
  const selectedStudent = selectedEntry?.student ?? null;
  const allStudentRows = useMemo(() => batches.flatMap((batch) => (batch.students ?? []).map((entry) => ({ batch, entry }))), [batches]);
  const selectedAdmission = useMemo(() => admissions.find((admission) => admission.id === selectedAdmissionId) ?? null, [admissions, selectedAdmissionId]);
  const admissionCourseOptions = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    for (const admission of admissions) {
      if (admission.courseId) map.set(admission.courseId, { id: admission.courseId, title: admission.course?.title ?? admission.batch ?? "Admission Course" });
    }
    return Array.from(map.values()).sort((left, right) => left.title.localeCompare(right.title));
  }, [admissions]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const visibleAdmissions = useMemo(() => {
    const query = admissionSearch.trim().toLowerCase();
    return admissions.filter((admission) => {
      const student = admission.student;
      const matchesCourse = !selectedCourseId || admission.courseId === selectedCourseId;
      const haystack = [student?.name, student?.mobile, student?.email, admission.course?.title, admission.batch, admission.paymentStatus, admission.approvalStatus].filter(Boolean).join(" ").toLowerCase();
      return matchesCourse && (!query || haystack.includes(query));
    });
  }, [admissionSearch, admissions, selectedCourseId]);

  const membershipMap = useMemo(() => {
    const map = new Map<string, Array<{ batchId: string; batchName: string; rollNumber?: string | null }>>();
    for (const batch of batches) {
      for (const entry of batch.students ?? []) {
        const rows = map.get(entry.student.id) ?? [];
        rows.push({ batchId: batch.id, batchName: batch.name, rollNumber: entry.student.rollNumber || entry.remarks });
        map.set(entry.student.id, rows);
      }
    }
    return map;
  }, [batches]);

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = query
      ? allStudentRows.filter(({ batch, entry }) => `${studentSearchText(entry)} ${batch.name} ${batch.course?.title ?? ""} ${batch.programSlug ?? ""}`.toLowerCase().includes(query))
      : activeBatch
        ? activeBatchStudents.map((entry) => ({ batch: activeBatch, entry }))
        : [];
    const seen = new Set<string>();
    return rows.filter(({ entry }) => {
      if (!query) return true;
      if (seen.has(entry.student.id)) return false;
      seen.add(entry.student.id);
      return true;
    });
  }, [activeBatch, activeBatchStudents, allStudentRows, search]);

  const totalStudents = useMemo(() => new Set(batches.flatMap((batch) => (batch.students ?? []).map((entry) => entry.student.id))).size, [batches]);
  const multiBatchStudents = useMemo(() => Array.from(membershipMap.values()).filter((items) => items.length > 1).length, [membershipMap]);

  const refreshStudents = () => {
    queryClient.invalidateQueries({ queryKey: ["academy", "batches", "students-workspace"] });
    queryClient.invalidateQueries({ queryKey: ["academy", "student-progress-summary"] });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      let targetBatchId = addBatchMode === "EXISTING" ? addTargetBatchId || activeBatchId : "";
      if (addBatchMode === "NEW") {
        const admissionCourse = selectedAdmission?.course;
        const batchName = newBatchName.trim() || selectedAdmission?.batch || `${admissionCourse?.title ?? "New"} Batch`;
        const createdBatch = await createAcademyBatch({
          name: batchName,
          batchType: "OFFLINE",
          learningMode: "OFFLINE",
          programSlug: slugify(admissionCourse?.title ?? selectedAdmission?.batch ?? batchName) || "academy-program",
          programName: admissionCourse?.title ?? selectedAdmission?.batch ?? "Academy Program",
          programType: admissionCourse?.examType ?? "Academy Program",
          courseId: selectedAdmission?.courseId,
          status: "ACTIVE",
        });
        targetBatchId = createdBatch.id;
      }
      if (!targetBatchId) throw new Error("Select or create a batch first.");
      if (addSource === "ADMISSION") {
        if (!selectedAdmission) throw new Error("Select a student from the admission list.");
        return addStudentToBatch(targetBatchId, {
          userId: selectedAdmission.studentId,
          email: selectedAdmission.student?.email,
          phone: selectedAdmission.student?.mobile,
          name: selectedAdmission.student?.name,
          rollNumber: addForm.rollNumber || undefined,
          notes: addForm.rollNumber || selectedAdmission.remarks,
        });
      }
      return addStudentToBatch(targetBatchId, { ...addForm, notes: addForm.rollNumber });
    },
    onSuccess: () => {
      setNotice("Student added to batch.");
      setAddForm(emptyForm);
      setShowAddStudent(false);
      setSelectedAdmissionId("");
      setNewBatchName("");
      refreshStudents();
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAcademyStudent(selectedStudentId, {
        batchId: activeBatchId,
        name: studentForm.name,
        email: studentForm.email,
        phone: studentForm.phone,
        rollNumber: studentForm.rollNumber,
        pin: studentForm.pin || undefined,
      }),
    onSuccess: () => {
      setNotice("Student profile saved.");
      setStudentForm((current) => ({ ...current, pin: "" }));
      refreshStudents();
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  const resetPinMutation = useMutation({
    mutationFn: () => resetAcademyStudentPin(selectedStudentId, studentForm.pin || "1234"),
    onSuccess: () => {
      setNotice("Student PIN reset.");
      setStudentForm((current) => ({ ...current, pin: "" }));
      refreshStudents();
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      transferAcademyStudent(selectedStudentId, {
        fromBatchId: activeBatchId,
        toBatchId: targetBatchId,
        mode: moveMode,
        rollNumber: studentForm.rollNumber || selectedEntry?.remarks || undefined,
      }),
    onSuccess: () => {
      setNotice(moveMode === "COPY" ? "Student added to another batch." : "Student transferred to another batch.");
      setSelectedStudentId("");
      refreshStudents();
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
  });

  useEffect(() => {
    if (!batches.length) return;
    setActiveBatchId((current) => current && batches.some((batch) => batch.id === current) ? current : batches[0].id);
  }, [batches]);

  useEffect(() => {
    if (!activeBatch) return;
    setSelectedStudentId((current) => current && activeBatch.students?.some((entry) => entry.student.id === current) ? current : "");
    setTargetBatchId((current) => current && current !== activeBatch.id && batches.some((batch) => batch.id === current) ? current : batches.find((batch) => batch.id !== activeBatch.id)?.id ?? "");
    setAddTargetBatchId((current) => current && batches.some((batch) => batch.id === current) ? current : activeBatch.id);
  }, [activeBatch, batches]);

  useEffect(() => {
    if (!selectedEntry) {
      setStudentForm(emptyForm);
      return;
    }
    setStudentForm({
      name: selectedEntry.student.name || "",
      email: selectedEntry.student.email || "",
      phone: loginMobile(selectedEntry.student),
      rollNumber: selectedEntry.student.rollNumber || selectedEntry.remarks || "",
      pin: "",
    });
  }, [selectedEntry]);

  function submitAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (addBatchMode === "EXISTING" && !addTargetBatchId && !activeBatchId) {
      setNotice("Select a batch first.");
      return;
    }
    if (addSource === "ADMISSION" && !selectedAdmissionId) {
      setNotice("Select a student from the admission list.");
      return;
    }
    addMutation.mutate();
  }

  function submitSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStudentId) {
      setNotice("Select a student first.");
      return;
    }
    saveMutation.mutate();
  }

  function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStudentId || !targetBatchId) {
      setNotice("Select a student and destination batch.");
      return;
    }
    transferMutation.mutate();
  }

  const content = (
    <>
      <AcademicHero
        eyebrow="Students"
        title="Students"
        description="Search any student by name, open a batch, and manage profile or batch allocation only when needed."
      />

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard label="Batches" value={batches.length} />
        <StatCard label="Students" value={totalStudents} />
        <StatCard label="Multi-batch" value={multiBatchStudents} />
        <StatCard label="Current Batch" value={activeBatch ? batchStudentCount(activeBatch) : 0} />
      </section>

      {notice ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-3 text-sm font-black">{notice}</div> : null}

      <section className="grid min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--gold)]">Batches</p>
              <h2 className="text-lg font-black">Live</h2>
            </div>
            <button type="button" onClick={() => setShowAddStudent(true)} className="icon-button h-10 w-10 rounded-xl bg-[var(--navy)] text-white" aria-label="Add student">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {batchesQuery.isLoading ? <EmptyState text="Loading batches..." /> : null}
          {!batchesQuery.isLoading && !batches.length ? <EmptyState text="No batches are available yet." /> : null}
          <div className="grid max-h-[68vh] gap-2 overflow-auto pr-1">
            {batches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                onClick={() => {
                  setActiveBatchId(batch.id);
                  setSelectedStudentId("");
                  setSearch("");
                }}
                className={`rounded-xl border p-3 text-left transition hover:border-[var(--gold-border)] ${activeBatchId === batch.id ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`}
              >
                <p className="truncate text-sm font-black">{batch.name}</p>
                <p className="mt-1 truncate text-xs font-bold text-[var(--muted-blue)]">{batch.course?.title || batch.programSlug || "Course"}</p>
                <p className="mt-2 text-xs font-black text-[var(--gold-dark)]">{batchStudentCount(batch)} student{batchStudentCount(batch) === 1 ? "" : "s"}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm">
              <Search className="h-4 w-4 text-[var(--muted-blue)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Master search: student name, mobile, email, roll number or batch"
                className="min-w-0 flex-1 bg-transparent font-bold outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowAddStudent(true)}
              disabled={!activeBatch}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-black text-white disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add Student
            </button>
          </div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--gold)]">{search.trim() ? "Search Results" : "Selected Batch"}</p>
              <h2 className="text-xl font-black text-[var(--navy)]">{search.trim() ? "All Students" : activeBatch?.name ?? "Students"}</h2>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-black">{visibleStudents.length} shown</span>
          </div>
          {!visibleStudents.length ? <EmptyState text={search.trim() ? "No student matches this search." : "No students found in this batch."} /> : null}
          <div className="grid max-h-[68vh] grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {visibleStudents.map(({ batch, entry }) => {
              const memberships = membershipMap.get(entry.student.id) ?? [];
              const selected = selectedStudentId === entry.student.id && activeBatchId === batch.id;
              return (
                <button
                  key={`${batch.id}-${entry.id}`}
                  type="button"
                  onClick={() => {
                    setActiveBatchId(batch.id);
                    setSelectedStudentId(entry.student.id);
                  }}
                  className={`group grid min-h-36 place-items-center rounded-xl border p-3 text-center transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md ${selected ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`}
                >
                  <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--gold-soft)] text-lg font-black text-[var(--navy)]">
                    {entry.student.photoUrl || entry.student.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.student.photoUrl || entry.student.avatarUrl || ""} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (entry.student.name || "S").slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="mt-2 min-w-0">
                    <span className="block line-clamp-2 text-sm font-black leading-5">{entry.student.name || "Student"}</span>
                    <span className="mt-1 block truncate text-[11px] font-bold text-[var(--muted-blue)]">
                      {entry.student.rollNumber || entry.remarks || "Roll not set"}
                    </span>
                    <span className="mt-2 block truncate text-[10px] font-black text-[var(--muted-blue)]">
                      {batch.name}
                    </span>
                  </span>
                  <span className="mt-2 flex flex-wrap justify-center gap-1 text-[10px] font-black">
                    <span className="rounded-full bg-white px-2 py-0.5">{pinStatus(entry.student.roleMetadata)}</span>
                    {memberships.length > 1 ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{memberships.length} batches</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </main>

        <div className="grid content-start gap-4">
          <Panel title="Manage Student" eyebrow={selectedStudent ? selectedStudent.name : "Select a student"}>
            {!selectedStudent ? <EmptyState text="Select a student from the list to edit profile, PIN or batch." /> : null}
            {selectedStudent ? (
              <form onSubmit={submitSave} className="grid gap-3">
                <Field label="Name" value={studentForm.name} onChange={(value) => setStudentForm((current) => ({ ...current, name: value }))} icon={UserRound} required />
                <Field label="Mobile" value={studentForm.phone} onChange={(value) => setStudentForm((current) => ({ ...current, phone: value.replace(/[^\d+]/g, "") }))} icon={Phone} required />
                <Field label="Email" value={studentForm.email} onChange={(value) => setStudentForm((current) => ({ ...current, email: value }))} icon={Mail} />
                <Field label="Roll number" value={studentForm.rollNumber} onChange={(value) => setStudentForm((current) => ({ ...current, rollNumber: value.toUpperCase() }))} icon={BookOpen} />
                <Field label="New PIN" value={studentForm.pin} onChange={(value) => setStudentForm((current) => ({ ...current, pin: value.replace(/\D/g, "").slice(0, 4) }))} icon={KeyRound} placeholder="Leave blank unless changing" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <button disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-black text-white disabled:opacity-60">
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={() => resetPinMutation.mutate()} disabled={resetPinMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black disabled:opacity-60">
                    <KeyRound className="h-4 w-4" />
                    {resetPinMutation.isPending ? "Resetting..." : `Reset ${studentForm.pin || "1234"}`}
                  </button>
                </div>
                <Link href={progressHref(audience, selectedStudent.id, activeBatchId)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
                  Open Progress Report
                </Link>
              </form>
            ) : null}
          </Panel>

          <Panel title="Batch Allocation" eyebrow="Move or keep in both">
            {!selectedStudent ? <EmptyState text="Select a student to move or copy to another batch." /> : null}
            {selectedStudent ? (
              <form onSubmit={submitTransfer} className="grid gap-3">
                <select value={moveMode} onChange={(event) => setMoveMode(event.target.value as MoveMode)} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold">
                  <option value="TRANSFER">Move to another batch</option>
                  <option value="COPY">Keep in both batches</option>
                </select>
                <select value={targetBatchId} onChange={(event) => setTargetBatchId(event.target.value)} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold">
                  {batches.filter((batch) => batch.id !== activeBatchId).map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                </select>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-xs font-bold leading-5 text-[var(--muted-blue)]">
                  Current batches: {(membershipMap.get(selectedStudent.id) ?? []).map((item) => item.batchName).join(", ") || "Current batch only"}
                </div>
                <button disabled={transferMutation.isPending || !targetBatchId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-black text-white disabled:opacity-60">
                  <ArrowRightLeft className="h-4 w-4" />
                  {transferMutation.isPending ? "Updating..." : moveMode === "COPY" ? "Add to Another Batch" : "Move Student"}
                </button>
              </form>
            ) : null}
          </Panel>
        </div>
      </section>

      {showAddStudent ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <section className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Add Student</p>
                <h2 className="mt-1 text-xl font-black text-[var(--navy)]">Admission to Batch</h2>
                <p className="mt-1 text-sm font-bold text-[var(--muted-blue)]">Select course, choose an existing batch or create a new one, then add the student.</p>
              </div>
              <button type="button" onClick={() => setShowAddStudent(false)} className="icon-button h-10 w-10 rounded-xl border border-[var(--border)] bg-white" aria-label="Close add student">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submitAdd} className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm font-bold text-[var(--navy)]">
                  Course
                  <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold">
                    <option value="">All courses</option>
                    {admissionCourseOptions.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-bold text-[var(--navy)]">
                  Batch
                  <select value={addBatchMode} onChange={(event) => setAddBatchMode(event.target.value as typeof addBatchMode)} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold">
                    <option value="EXISTING">Select existing batch</option>
                    <option value="NEW">Create new batch</option>
                  </select>
                </label>
                {addBatchMode === "EXISTING" ? (
                  <label className="grid gap-1 text-sm font-bold text-[var(--navy)]">
                    Select batch
                    <select value={addTargetBatchId || activeBatchId} onChange={(event) => setAddTargetBatchId(event.target.value)} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold">
                      {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                    </select>
                  </label>
                ) : (
                  <Field label="New batch name" value={newBatchName} onChange={setNewBatchName} icon={Users} placeholder="Example: NDA F3 Offline 2026" />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setAddSource("ADMISSION")} className={`rounded-xl border px-4 py-2 text-sm font-black ${addSource === "ADMISSION" ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--border)] bg-white"}`}>
                  Admission List
                </button>
                <button type="button" onClick={() => setAddSource("MANUAL")} className={`rounded-xl border px-4 py-2 text-sm font-black ${addSource === "MANUAL" ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--border)] bg-white"}`}>
                  Manual Entry
                </button>
              </div>

              {addSource === "ADMISSION" ? (
                <div className="grid gap-3">
                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm">
                    <Search className="h-4 w-4 text-[var(--muted-blue)]" />
                    <input value={admissionSearch} onChange={(event) => setAdmissionSearch(event.target.value)} placeholder="Search admission name, mobile, course or batch" className="min-w-0 flex-1 bg-transparent font-bold outline-none" />
                  </label>
                  {admissionsQuery.isLoading ? <EmptyState text="Loading admission list..." /> : null}
                  <div className="grid max-h-72 gap-2 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-2 sm:grid-cols-2">
                    {visibleAdmissions.slice(0, 40).map((admission: Admission) => {
                      const selected = selectedAdmissionId === admission.id;
                      return (
                        <button
                          key={admission.id}
                          type="button"
                          onClick={() => {
                            setSelectedAdmissionId(admission.id);
                            setAddForm((current) => ({
                              ...current,
                              name: admission.student?.name ?? current.name,
                              email: admission.student?.email ?? current.email,
                              phone: admission.student?.mobile ?? current.phone,
                            }));
                          }}
                          className={`rounded-xl border p-3 text-left transition hover:border-[var(--gold-border)] ${selected ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`}
                        >
                          <p className="truncate text-sm font-black">{admission.student?.name ?? "Student"}</p>
                          <p className="mt-1 truncate text-xs font-bold text-[var(--muted-blue)]">{admission.student?.mobile || admission.student?.email || "Contact missing"}</p>
                          <p className="mt-2 truncate text-[11px] font-black text-[var(--gold-dark)]">{admission.course?.title ?? admission.batch}</p>
                        </button>
                      );
                    })}
                    {!visibleAdmissions.length && !admissionsQuery.isLoading ? <EmptyState text="No admissions found. Use manual entry if this is an old student." /> : null}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Name" value={addForm.name} onChange={(value) => setAddForm((current) => ({ ...current, name: value }))} icon={UserRound} required />
                  <Field label="Mobile" value={addForm.phone} onChange={(value) => setAddForm((current) => ({ ...current, phone: value.replace(/[^\d+]/g, "") }))} icon={Phone} required />
                  <Field label="Email" value={addForm.email} onChange={(value) => setAddForm((current) => ({ ...current, email: value }))} icon={Mail} />
                  <Field
                    label="Roll number override"
                    value={addForm.rollNumber}
                    onChange={(value) => setAddForm((current) => ({ ...current, rollNumber: value.toUpperCase() }))}
                    icon={BookOpen}
                    placeholder={nextRollNumber ? `Auto: ${nextRollNumber}` : "Auto-generated if blank"}
                    helpText={nextRollNumber ? `Leave blank to assign ${nextRollNumber}.` : "Leave blank to auto-generate after selecting a batch."}
                  />
                </div>
              )}

              {addSource === "ADMISSION" ? (
                <Field
                  label="Roll number override"
                  value={addForm.rollNumber}
                  onChange={(value) => setAddForm((current) => ({ ...current, rollNumber: value.toUpperCase() }))}
                  icon={BookOpen}
                  placeholder={nextRollNumber ? `Auto: ${nextRollNumber}` : "Auto-generated if blank"}
                  helpText={nextRollNumber ? `Leave blank to assign ${nextRollNumber}.` : "Leave blank to auto-generate after selecting a batch."}
                />
              ) : null}

              <button disabled={addMutation.isPending || (addSource === "ADMISSION" && !selectedAdmissionId)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-black text-white disabled:opacity-60">
                <Plus className="h-4 w-4" />
                {addMutation.isPending ? "Adding..." : addBatchMode === "NEW" ? "Create Batch & Add Student" : "Add to Batch"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );

  if (embedded) return <section className="grid gap-4">{content}</section>;
  return <AcademicShell>{content}</AcademicShell>;
}

function Field({
  icon: Icon,
  label,
  onChange,
  placeholder,
  required,
  value,
  helpText,
}: {
  icon: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
  helpText?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-[var(--navy)]">
      <span>{label}{required ? <span className="text-rose-600"> *</span> : null}</span>
      <span className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
        <Icon className="h-4 w-4 shrink-0 text-[var(--muted-blue)]" />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="min-w-0 flex-1 bg-transparent outline-none" />
      </span>
      {helpText ? <span className="text-xs font-bold leading-5 text-[var(--muted-blue)]">{helpText}</span> : null}
    </label>
  );
}
