"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignTeacherToBatch, createAcademyTeacher, getAcademyBatches, getAcademyTeachers, updateAcademyUser } from "@/services/academy";
import { AcademicHero, AcademicShell, EmptyState, GoldButton, Input, Panel, Select, StatCard } from "../_components";

const employmentTypes = ["FULL_TIME", "PART_TIME", "HOURLY", "CONTRACT"];

export default function DirectorTeachersPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "allocate">("list");
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [lastCredentials, setLastCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [editTeacherForm, setEditTeacherForm] = useState({ name: "", email: "", phone: "", role: "TEACHER", designation: "", department: "", employmentType: "FULL_TIME", dashboardTemplate: "", password: "" });
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "Teacher",
    department: "Academics",
    employmentType: "FULL_TIME",
    hourlyRate: "",
    subjects: "",
    password: "123456789",
  });
  const [allocation, setAllocation] = useState({ programSlug: "", batchId: "", teacherId: "", subject: "", role: "Subject Teacher" });
  const teachersQuery = useQuery({ queryKey: ["academy", "teachers"], queryFn: () => getAcademyTeachers() });
  const batchesQuery = useQuery({ queryKey: ["academy", "batches"], queryFn: () => getAcademyBatches() });
  const teachers = teachersQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const programs = Array.from(
    new Map(
      batches.map((batch) => [
        batch.programSlug || batch.course?.slug || batch.courseId || batch.name,
        batch.course?.title || batch.programSlug || batch.name,
      ]),
    ),
  ).filter(([slug]) => Boolean(slug));
  const filteredBatches = allocation.programSlug
    ? batches.filter((batch) => (batch.programSlug || batch.course?.slug || batch.courseId || batch.name) === allocation.programSlug)
    : [];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["academy", "teachers"] });
    void queryClient.invalidateQueries({ queryKey: ["academy", "batches"] });
  };

  const createTeacher = useMutation({
    mutationFn: () =>
      createAcademyTeacher({
        name: teacherForm.name,
        email: teacherForm.email,
        phone: teacherForm.phone || undefined,
        role: "TEACHER",
        designation: teacherForm.designation,
        department: teacherForm.department,
        employmentType: teacherForm.employmentType as "FULL_TIME" | "PART_TIME" | "HOURLY" | "CONTRACT",
        hourlyRate: teacherForm.hourlyRate ? Number(teacherForm.hourlyRate) : undefined,
        subjects: teacherForm.subjects.split(",").map((subject) => subject.trim()).filter(Boolean),
        dashboardTemplate: "",
        password: teacherForm.password || "123456789",
      }),
    onSuccess: (data) => {
      setTeacherForm({ name: "", email: "", phone: "", designation: "Teacher", department: "Academics", employmentType: "FULL_TIME", hourlyRate: "", subjects: "", password: "123456789" });
      setLastCredentials(data.credentials);
      refresh();
      setNotice("Teacher created and dashboard access allocated.");
      setMode("list");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not create teacher."),
  });

  const assignTeacher = useMutation({
    mutationFn: () =>
      assignTeacherToBatch(allocation.batchId, {
        teacherId: allocation.teacherId,
        subject: allocation.subject.trim(),
        role: allocation.role || undefined,
      }),
    onSuccess: () => {
      setAllocation({ programSlug: "", batchId: "", teacherId: "", subject: "", role: "Subject Teacher" });
      refresh();
      setNotice("Teacher allocated to selected subjects.");
      setMode("list");
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not allocate teacher."),
  });

  const updateTeacher = useMutation({
    mutationFn: ({ id, form }: { id: string; form: typeof editTeacherForm }) =>
      updateAcademyUser(id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        designation: form.designation,
        department: form.department,
        employmentType: form.employmentType as "FULL_TIME" | "PART_TIME" | "HOURLY" | "CONTRACT",
        dashboardTemplate: form.dashboardTemplate,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      }),
    onSuccess: (teacher) => {
      setNotice(`${teacher.name} updated. Login details are now active.`);
      setEditingTeacherId(null);
      setEditTeacherForm({ name: "", email: "", phone: "", role: "TEACHER", designation: "", department: "", employmentType: "FULL_TIME", dashboardTemplate: "", password: "" });
      refresh();
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not update teacher."),
  });

  const submitTeacher = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createTeacher.mutate();
  };

  const submitAllocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    assignTeacher.mutate();
  };

  const startEditTeacher = (teacher: (typeof teachers)[number]) => {
    setEditingTeacherId(teacher.id);
    setEditTeacherForm({
      name: teacher.name ?? "",
      email: teacher.email ?? "",
      phone: teacher.mobile ?? "",
      role: teacher.role ?? "TEACHER",
      designation: String(teacher.roleMetadata?.designation ?? "Teacher"),
      department: String(teacher.roleMetadata?.department ?? "Academics"),
      employmentType: String(teacher.roleMetadata?.employmentType ?? "FULL_TIME"),
      dashboardTemplate: String(teacher.roleMetadata?.dashboardTemplate ?? ""),
      password: "",
    });
  };

  return (
    <AcademicShell>
      <AcademicHero
        eyebrow="Teachers"
        title="Faculty Control"
        description="Keep the teacher list visible. Add teachers or allocate subjects only when that action is needed."
        action={
          <div className="flex flex-wrap gap-2">
            <button className={`rounded-xl px-3 py-2 text-sm font-black ${mode === "list" ? "bg-[var(--navy)] text-white" : "border border-[var(--border)] bg-white"}`} onClick={() => setMode("list")} type="button">Teacher List</button>
            <button className={`rounded-xl px-3 py-2 text-sm font-black ${mode === "create" ? "bg-[var(--navy)] text-white" : "border border-[var(--border)] bg-white"}`} onClick={() => setMode("create")} type="button">Add Teacher</button>
            <button className={`rounded-xl px-3 py-2 text-sm font-black ${mode === "allocate" ? "bg-[var(--navy)] text-white" : "border border-[var(--border)] bg-white"}`} onClick={() => setMode("allocate")} type="button">Allocate Subject</button>
          </div>
        }
      />
      {notice ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{notice}</div> : null}
      {lastCredentials ? <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm font-bold">Login created: {lastCredentials.email} / Password: {lastCredentials.temporaryPassword}</div> : null}
      <section className="grid shrink-0 gap-3 md:grid-cols-3">
        <StatCard label="Teachers" value={teachers.length} />
        <StatCard label="Batches" value={batches.length} />
        <StatCard label="Default Password" value="123456789" />
      </section>
      {mode !== "list" ? (
      <section className="grid gap-4 xl:grid-cols-2">
        {mode === "create" ? (
        <Panel title="Create Teacher" eyebrow="Employee account">
          <form onSubmit={submitTeacher} className="grid gap-4 md:grid-cols-2">
            <Input label="Teacher name" value={teacherForm.name} onChange={(value) => setTeacherForm((state) => ({ ...state, name: value }))} required />
            <Input label="Email" type="email" value={teacherForm.email} onChange={(value) => setTeacherForm((state) => ({ ...state, email: value }))} required />
            <Input label="Phone" value={teacherForm.phone} onChange={(value) => setTeacherForm((state) => ({ ...state, phone: value }))} />
            <Input label="Designation" value={teacherForm.designation} onChange={(value) => setTeacherForm((state) => ({ ...state, designation: value }))} />
            <Select label="Employment" value={teacherForm.employmentType} onChange={(value) => setTeacherForm((state) => ({ ...state, employmentType: value }))}>
              {employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
            <Input label="Hourly rate" type="number" value={teacherForm.hourlyRate} onChange={(value) => setTeacherForm((state) => ({ ...state, hourlyRate: value }))} />
            <Input label="Subjects comma separated" value={teacherForm.subjects} onChange={(value) => setTeacherForm((state) => ({ ...state, subjects: value }))} />
            <Input label="Temporary password" value={teacherForm.password} onChange={(value) => setTeacherForm((state) => ({ ...state, password: value }))} />
            <div className="md:col-span-2"><GoldButton disabled={createTeacher.isPending}>Create Teacher</GoldButton></div>
          </form>
        </Panel>
        ) : null}
        {mode === "allocate" ? (
        <Panel title="Allocate Teacher" eyebrow="Program batch subject">
          <form onSubmit={submitAllocation} className="grid gap-4">
            <Select label="Program" value={allocation.programSlug} onChange={(value) => setAllocation((state) => ({ ...state, programSlug: value, batchId: "" }))} required>
              <option value="">Select program</option>
              {programs.map(([slug, title]) => <option key={slug} value={slug}>{title}</option>)}
            </Select>
            <Select label="Batch" value={allocation.batchId} onChange={(value) => setAllocation((state) => ({ ...state, batchId: value }))} required disabled={!allocation.programSlug}>
              <option value="">Select batch</option>
              {filteredBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
            </Select>
            <Select label="Teacher" value={allocation.teacherId} onChange={(value) => setAllocation((state) => ({ ...state, teacherId: value }))} required>
              <option value="">Select teacher</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.email}</option>)}
            </Select>
            <Input label="Subject" value={allocation.subject} onChange={(value) => setAllocation((state) => ({ ...state, subject: value }))} placeholder="Mathematics" required />
            <Input label="Role" value={allocation.role} onChange={(value) => setAllocation((state) => ({ ...state, role: value }))} />
            <GoldButton disabled={assignTeacher.isPending}>Assign Teacher</GoldButton>
          </form>
        </Panel>
        ) : null}
      </section>
      ) : null}
      <Panel title="Teacher List" eyebrow="Employees">
        {!teachers.length ? <EmptyState text="No teachers available yet." /> : null}
        <div className="grid max-h-[54vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => (
            <article key={teacher.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              {editingTeacherId === teacher.id ? (
                <div className="grid gap-3">
                  <Input label="Name" value={editTeacherForm.name} onChange={(value) => setEditTeacherForm((state) => ({ ...state, name: value }))} />
                  <Input label="Email / Login" type="email" value={editTeacherForm.email} onChange={(value) => setEditTeacherForm((state) => ({ ...state, email: value }))} />
                  <Input label="Contact" value={editTeacherForm.phone} onChange={(value) => setEditTeacherForm((state) => ({ ...state, phone: value }))} />
                  <Input label="Designation" value={editTeacherForm.designation} onChange={(value) => setEditTeacherForm((state) => ({ ...state, designation: value }))} />
                  <Select label="Role" value={editTeacherForm.role} onChange={(value) => setEditTeacherForm((state) => ({ ...state, role: value }))}>
                    <option value="TEACHER">Teacher / Trainer</option>
                    <option value="ACADEMIC_HEAD">Academic Head</option>
                    <option value="PHYSICAL_TRAINER">Physical Trainer</option>
                  </Select>
                  <Select label="Employment" value={editTeacherForm.employmentType} onChange={(value) => setEditTeacherForm((state) => ({ ...state, employmentType: value }))}>
                    {employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </Select>
                  <Select label="Dashboard" value={editTeacherForm.dashboardTemplate} onChange={(value) => setEditTeacherForm((state) => ({ ...state, dashboardTemplate: value }))}>
                    <option value="">Default teacher</option>
                    <option value="ACADEMIC_HEAD">Academic Head</option>
                    <option value="PHYSICAL_TRAINER">Physical Trainer</option>
                  </Select>
                  <Input label="New password" value={editTeacherForm.password} onChange={(value) => setEditTeacherForm((state) => ({ ...state, password: value }))} placeholder="Leave blank to keep same" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingTeacherId(null)} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-black">Cancel</button>
                    <button type="button" onClick={() => updateTeacher.mutate({ id: teacher.id, form: editTeacherForm })} disabled={updateTeacher.isPending} className="rounded-xl bg-[var(--navy)] px-3 py-2 text-xs font-black text-white disabled:opacity-60">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-black">{teacher.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">{teacher.email} / {teacher.mobile || "No phone"}</p>
                  <p className="mt-2 text-sm font-bold">{String(teacher.roleMetadata?.designation ?? "Teacher")}</p>
                  <p className="mt-1 text-xs text-[var(--muted-blue)]">{String(teacher.roleMetadata?.employmentType ?? "FULL_TIME")}</p>
                  <button type="button" onClick={() => startEditTeacher(teacher)} className="mt-3 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-black">Edit profile</button>
                </>
              )}
            </article>
          ))}
        </div>
      </Panel>
    </AcademicShell>
  );
}
