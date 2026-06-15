"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  BadgeIndianRupee,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Employee = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  mobile?: string | null;
  role: string;
  roleMetadata?: Record<string, unknown> | null;
};

type EmployeePayload = {
  name: string;
  email: string;
  phone?: string;
  role: string;
  designation?: string;
  department?: string;
  employmentType?: string;
  hourlyRate?: number;
  subjects?: string[];
  dashboardTemplate?: string;
  password?: string;
};

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("nidus_token")
      : null;
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Request failed");
  }

  return response.json() as Promise<T>;
}

const roleOptions = [
  { label: "Teacher", value: "TEACHER" },
  { label: "Academic Head", value: "TEACHER", dashboardTemplate: "ACADEMIC_HEAD" },
  { label: "Physical Trainer", value: "TEACHER", dashboardTemplate: "PHYSICAL_TRAINER" },
  { label: "Administrative Officer", value: "ADMIN", dashboardTemplate: "ADMISSION_CELL" },
  { label: "Business Development Executive", value: "BUSINESS_DEVELOPMENT_EXECUTIVE", dashboardTemplate: "LEAD_SUPPORT" },
  { label: "Management", value: "DIRECTOR" },
  { label: "Administration", value: "ADMIN" },
];

const employmentTypes = ["FULL_TIME", "PART_TIME", "HOURLY", "CONTRACT"];

const quickProfiles = [
  {
    label: "Teacher",
    role: "TEACHER",
    designation: "Teacher",
    department: "Academics",
    dashboardTemplate: "",
  },
  {
    label: "Academic Head",
    role: "TEACHER",
    designation: "Academic Head",
    department: "Academics",
    dashboardTemplate: "ACADEMIC_HEAD",
  },
  {
    label: "Physical Trainer",
    role: "TEACHER",
    designation: "Physical Trainer",
    department: "Physical Training",
    dashboardTemplate: "PHYSICAL_TRAINER",
  },
  {
    label: "Admission Staff",
    role: "ADMIN",
    designation: "Administrative Officer",
    department: "Administration",
    dashboardTemplate: "ADMISSION_CELL",
  },
  {
    label: "Business Development Executive",
    role: "BUSINESS_DEVELOPMENT_EXECUTIVE",
    designation: "Business Development Executive",
    department: "Admissions and Sales",
    dashboardTemplate: "LEAD_SUPPORT",
  },
  {
    label: "Administration",
    role: "ADMIN",
    designation: "Administration",
    department: "Admin & Accounts",
    dashboardTemplate: "ADMINISTRATION",
  },
];

export default function DirectorManagementPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [lastCredentials, setLastCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [form, setForm] = useState<EmployeePayload>({
    name: "",
    email: "",
    phone: "",
    role: "TEACHER",
    designation: "Teacher",
    department: "Academy",
    employmentType: "FULL_TIME",
    hourlyRate: undefined,
    subjects: [],
    dashboardTemplate: "",
    password: "123456789",
  });
  const [subjectText, setSubjectText] = useState("");

  const employeesQuery = useQuery({
    queryKey: ["director", "employees"],
    queryFn: () => apiJson<Employee[]>("/api/academy/employees?includeArchived=true"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: EmployeePayload) =>
      apiJson<{ employee: Employee; credentials: { email: string; temporaryPassword: string } }>("/api/academy/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setNotice(`Employee created. Login: ${data.credentials.email} / Password: ${data.credentials.temporaryPassword}`);
      setLastCredentials(data.credentials);
      setForm({
        name: "",
        email: "",
        phone: "",
        role: "TEACHER",
        designation: "Teacher",
        department: "Academy",
        employmentType: "FULL_TIME",
        hourlyRate: undefined,
        subjects: [],
        dashboardTemplate: "",
        password: "123456789",
      });
      setSubjectText("");
      void queryClient.invalidateQueries({ queryKey: ["director", "employees"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not create employee."),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiJson<Employee>(`/api/academy/employees/${id}/archive`, { method: "POST" }),
    onSuccess: () => {
      setNotice("Employee archived into history.");
      setActiveTab("ARCHIVED");
      void queryClient.invalidateQueries({ queryKey: ["director", "employees"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not archive employee."),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) =>
      apiJson<{ credentials: { email: string; temporaryPassword: string } }>(`/api/academy/employees/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password: "123456789" }),
      }),
    onSuccess: (data) => {
      setNotice(`Password reset. Login: ${data.credentials.email} / Password: ${data.credentials.temporaryPassword}`);
      setLastCredentials(data.credentials);
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not reset password."),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      ...form,
      subjects: subjectText
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean),
    });
  };

  const activeEmployees = (employeesQuery.data ?? []).filter((employee) => employee.roleMetadata?.status !== "ARCHIVED");
  const archivedEmployees = (employeesQuery.data ?? []).filter((employee) => employee.roleMetadata?.status === "ARCHIVED");
  const visibleEmployees = activeTab === "ACTIVE" ? activeEmployees : archivedEmployees;

  const applyQuickProfile = (profile: (typeof quickProfiles)[number]) => {
    setForm((item) => ({
      ...item,
      role: profile.role,
      designation: profile.designation,
      department: profile.department,
      dashboardTemplate: profile.dashboardTemplate,
    }));
    setNotice(`${profile.label} profile selected. Fill name, email and phone to generate credentials.`);
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Management Control</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">User and dashboard control</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            Add employees, generate credentials, control student and staff access, reset passwords and archive old accounts safely
            into history.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric icon={Users} label="Active Users" value={activeEmployees.length} />
          <Metric icon={Archive} label="Archived History" value={archivedEmployees.length} />
          <Metric icon={GraduationCap} label="Faculty Roles" value={activeEmployees.filter((employee) => employee.role === "TEACHER").length} />
          <Metric icon={ShieldCheck} label="Admin Roles" value={activeEmployees.filter((employee) => employee.role === "ADMIN").length} />
        </div>

        {notice && <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{notice}</div>}

        {lastCredentials && (
          <section className="rounded-3xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Generated Credentials</p>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <CredentialBox label="Login email" value={lastCredentials.email} />
              <CredentialBox label="Temporary password" value={lastCredentials.temporaryPassword} />
              <button
                className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black"
                onClick={() => {
                  void navigator.clipboard?.writeText(`${lastCredentials.email}\n${lastCredentials.temporaryPassword}`);
                  setNotice("Credentials copied.");
                }}
                type="button"
              >
                Copy
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Add Employee</p>
            <h2 className="mt-2 text-2xl font-black">Create credentials</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {quickProfiles.map((profile) => (
                <button
                  key={profile.label}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-left text-sm font-black transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]"
                  onClick={() => applyQuickProfile(profile)}
                  type="button"
                >
                  {profile.label}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="mt-5 grid gap-3">
              <Input label="Name" value={form.name} onChange={(value) => setForm((item) => ({ ...item, name: value }))} required />
              <Input label="Email" value={form.email} onChange={(value) => setForm((item) => ({ ...item, email: value }))} required />
              <Input label="Phone" value={form.phone ?? ""} onChange={(value) => setForm((item) => ({ ...item, phone: value }))} />
              <label className="grid gap-2 text-sm font-bold">
                Employee type
                <select
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                  value={`${form.role}:${form.dashboardTemplate ?? ""}`}
                  onChange={(event) => {
                    const selected = roleOptions.find((option) => `${option.value}:${option.dashboardTemplate ?? ""}` === event.target.value);
                    setForm((item) => ({
                      ...item,
                      role: selected?.value ?? "TEACHER",
                      designation: selected?.label ?? "Teacher",
                      dashboardTemplate: selected?.dashboardTemplate ?? "",
                    }));
                  }}
                >
                  {roleOptions.map((option) => (
                    <option key={`${option.value}:${option.dashboardTemplate ?? option.label}`} value={`${option.value}:${option.dashboardTemplate ?? ""}`}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Department" value={form.department ?? ""} onChange={(value) => setForm((item) => ({ ...item, department: value }))} />
                <label className="grid gap-2 text-sm font-bold">
                  Employment
                  <select
                    className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                    value={form.employmentType}
                    onChange={(event) => setForm((item) => ({ ...item, employmentType: event.target.value }))}
                  >
                    {employmentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <Input
                  label="Hourly rate"
                  type="number"
                  value={form.hourlyRate ? String(form.hourlyRate) : ""}
                  onChange={(value) => setForm((item) => ({ ...item, hourlyRate: value ? Number(value) : undefined }))}
                />
                <Input label="Temporary password" value={form.password ?? ""} onChange={(value) => setForm((item) => ({ ...item, password: value }))} />
              </div>
              <Input label="Subjects / skills comma separated" value={subjectText} onChange={setSubjectText} />
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
                <UserPlus className="h-4 w-4" />
                Create Employee
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Director Teaching Access</p>
            <h2 className="mt-2 text-2xl font-black">Director can teach when required</h2>
            <div className="mt-5 grid gap-3">
              <Info icon={CheckCircle2} text="Director can open Academic Department and assign himself/herself as teacher to any batch." />
              <Info icon={GraduationCap} text="Once assigned, the same class calendar, batch and syllabus tracker can be managed by the Director." />
              <Info icon={BadgeIndianRupee} text="Academic Head and teachers remain operational users; Director keeps planning and override control." />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg" href="/dashboard/director/academic">
                Assign Teaching Role
              </Link>
              <Link className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black" href="/dashboard/teacher">
                Open Teaching View
              </Link>
            </div>
          </div>
        </section>

        <section id="attendance" className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Attendance & Leave</p>
          <h2 className="mt-2 text-2xl font-black">Launch setup state</h2>
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm leading-7 text-[var(--muted-blue)]">
            Staff attendance and leave approval can be connected here. Employee account creation and access control are already active.
          </div>
        </section>

        <section id="performance" className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Performance Review</p>
          <h2 className="mt-2 text-2xl font-black">Teacher and staff output</h2>
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm leading-7 text-[var(--muted-blue)]">
            Performance combines class completion, academic calendar logs, student progress and management reviews as those records are created.
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Employees</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-black">{activeTab === "ACTIVE" ? "Active users" : "Archived history"}</h2>
            <div className="flex rounded-xl border border-[var(--border)] bg-white p-1">
              <button
                className={`rounded-lg px-4 py-2 text-sm font-black ${activeTab === "ACTIVE" ? "bg-[var(--gold-gradient)] text-[var(--navy)]" : "text-[var(--muted-blue)]"}`}
                onClick={() => setActiveTab("ACTIVE")}
                type="button"
              >
                Active
              </button>
              <button
                className={`rounded-lg px-4 py-2 text-sm font-black ${activeTab === "ARCHIVED" ? "bg-[var(--gold-gradient)] text-[var(--navy)]" : "text-[var(--muted-blue)]"}`}
                onClick={() => setActiveTab("ARCHIVED")}
                type="button"
              >
                Archived
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {visibleEmployees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                archived={activeTab === "ARCHIVED"}
                onArchive={() => {
                  if (window.confirm(`Archive ${employee.name}? This will move the account into history.`)) {
                    archiveMutation.mutate(employee.id);
                  }
                }}
                onReset={() => resetMutation.mutate(employee.id)}
              />
            ))}
            {!visibleEmployees.length && <Empty text={activeTab === "ACTIVE" ? "No active users found." : "No archived users yet."} />}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/85 p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function CredentialBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{label}</p>
      <p className="mt-2 break-all font-black text-[var(--navy)]">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function Info({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gold)]" />
      <p className="text-sm leading-7 text-[var(--muted-blue)]">{text}</p>
    </div>
  );
}

function EmployeeRow({ employee, archived, onArchive, onReset }: { employee: Employee; archived?: boolean; onArchive?: () => void; onReset?: () => void }) {
  const metadata = employee.roleMetadata ?? {};
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black">{employee.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{employee.email} / {employee.phone || employee.mobile || "No phone"}</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">
            {String(metadata.designation ?? employee.role)} / {String(metadata.employmentType ?? "FULL_TIME")} / {String(metadata.department ?? "Academy")}
          </p>
        </div>
        {!archived && (
          <div className="flex flex-wrap gap-2">
            <button onClick={onReset} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
              <KeyRound className="mr-1 inline h-4 w-4" />
              Reset Password
            </button>
            <button onClick={onArchive} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-800">
              <Archive className="mr-1 inline h-4 w-4" />
              Archive
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm text-[var(--muted-blue)]">{text}</div>;
}
