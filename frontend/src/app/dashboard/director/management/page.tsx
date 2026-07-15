"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  isDisabled?: boolean;
  loginFailureCount?: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  roleOnboardingStatus?: string;
  batchEnrollments?: Array<{
    id: string;
    status: string;
    batch: {
      id: string;
      name: string;
      programSlug?: string | null;
      batchType?: string | null;
      status?: string | null;
    };
  }>;
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

type HrmMode = "overview" | "add" | "manage" | "archive" | "access" | "roles" | "permissions";

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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
  const searchParams = useSearchParams();
  const requestedMode = searchParams?.get("mode") as HrmMode | null;
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<HrmMode>(
    requestedMode && ["overview", "add", "manage", "archive", "access", "roles", "permissions"].includes(requestedMode) ? requestedMode : "overview",
  );
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [accountGroup, setAccountGroup] = useState<"TEAM" | "STUDENTS">("TEAM");
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
      setNotice(`Password reset and account unlocked. Login: ${data.credentials.email} / Password: ${data.credentials.temporaryPassword}`);
      setLastCredentials(data.credentials);
      void queryClient.invalidateQueries({ queryKey: ["director", "employees"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not reset password."),
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => apiJson<Employee>(`/api/academy/employees/${id}/unlock`, { method: "POST" }),
    onSuccess: (employee) => {
      setNotice(`${employee.name} is unlocked and active.`);
      void queryClient.invalidateQueries({ queryKey: ["director", "employees"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not unlock account."),
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

  const activeAccounts = (employeesQuery.data ?? []).filter((employee) => employee.roleMetadata?.status !== "ARCHIVED");
  const archivedAccounts = (employeesQuery.data ?? []).filter((employee) => employee.roleMetadata?.status === "ARCHIVED");
  const lockedAccounts = activeAccounts.filter((employee) => isAccountLocked(employee));
  const activeTeam = activeAccounts.filter(isTeamAccount);
  const activeStudents = activeAccounts.filter(isStudentAccount);
  const visibleAccounts = activeTab === "ACTIVE" ? activeAccounts : archivedAccounts;
  const visibleTeam = visibleAccounts.filter(isTeamAccount);
  const visibleStudents = visibleAccounts.filter(isStudentAccount);
  const studentGroups = groupStudentsByBatch(visibleStudents);
  const activeTeamGroups = groupTeamAccounts(activeTeam);
  const visibleTeamGroups = groupTeamAccounts(visibleTeam);

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
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6 lg:h-[calc(100vh-var(--nav-height)-2rem)] lg:min-h-0 lg:overflow-hidden">
      <section className="mx-auto flex h-full max-w-[1500px] flex-col gap-4 overflow-y-auto pr-0 lg:pr-2">
        <div className="shrink-0 rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">People Control</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">HRM Staff And Access</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
            Add employees, generate credentials, control student and staff access, reset passwords and archive old accounts safely
            into history.
          </p>
        </div>

        <div className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} label="Team Accounts" value={activeTeam.length} />
          <Metric icon={GraduationCap} label="Students" value={activeStudents.length} />
          <Metric icon={Archive} label="Archived History" value={archivedAccounts.length} />
          <Metric icon={ShieldCheck} label="Locked Accounts" value={lockedAccounts.length} />
        </div>

        <section className="grid shrink-0 gap-3 md:grid-cols-3 xl:grid-cols-7">
          <ModeButton active={mode === "overview"} icon={Users} label="Overview" onClick={() => setMode("overview")} />
          <ModeButton active={mode === "add"} icon={UserPlus} label="Add Employee" onClick={() => setMode("add")} />
          <ModeButton active={mode === "manage"} icon={Users} label="Manage Staff" onClick={() => setMode("manage")} />
          <ModeButton active={mode === "archive"} icon={Archive} label="Archive Staff" onClick={() => { setActiveTab("ARCHIVED"); setMode("archive"); }} />
          <ModeButton active={mode === "access"} icon={KeyRound} label="Access" onClick={() => setMode("access")} />
          <ModeButton active={mode === "roles"} icon={ShieldCheck} label="Roles" onClick={() => setMode("roles")} />
          <ModeButton active={mode === "permissions"} icon={ShieldCheck} label="Permissions" onClick={() => setMode("permissions")} />
        </section>

        {mode === "overview" ? (
        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">People Structure</p>
          <h2 className="mt-2 text-2xl font-black">Team grouped by duty</h2>
          <div className="mt-5 grid max-h-[58vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
            {activeTeamGroups.map((group) => (
              <div key={group.label} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">{group.label}</p>
                <p className="mt-3 text-3xl font-black">{group.accounts.length}</p>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{group.description}</p>
              </div>
            ))}
          </div>
        </section>
        ) : null}

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

        {mode === "add" ? (
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
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Director Teaching Mode</p>
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
              <Link className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 font-black" href="/dashboard/director/teaching">
                Open Teaching View
              </Link>
            </div>
          </div>
        </section>
        ) : null}

        {mode === "overview" ? (
        <>
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
        </>
        ) : null}

        {mode === "access" ? (
        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Credential Readiness</p>
            <h2 className="mt-2 text-2xl font-black">Account unlock and password reset</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted-blue)]">
              Director can reset any launch user to the default temporary password and clear lockout counters from this screen.
            </p>
          </div>
          <div className="mt-5 grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
            {(lockedAccounts.length ? lockedAccounts : activeTeam).map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                groupLabel={teamGroupLabel(employee)}
                onArchive={() => {
                  if (window.confirm(`Archive ${employee.name}? This will move the account into history.`)) {
                    archiveMutation.mutate(employee.id);
                  }
                }}
                onReset={() => {
                  if (window.confirm(`Reset password and unlock ${employee.name}?`)) {
                    resetMutation.mutate(employee.id);
                  }
                }}
                onUnlock={() => unlockMutation.mutate(employee.id)}
              />
            ))}
            {!activeTeam.length && <Empty text="No team accounts found." />}
          </div>
        </section>
        ) : null}

        {mode === "roles" ? (
        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Roles</p>
          <h2 className="mt-2 text-2xl font-black">Role control</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roleOptions.map((role) => (
              <div key={`${role.value}-${role.dashboardTemplate ?? role.label}`} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="font-black">{role.label}</p>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">System role: {role.value}</p>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">Dashboard: {role.dashboardTemplate || "Default"}</p>
              </div>
            ))}
          </div>
          <Link href="/admin-center/roles" className="mt-5 inline-flex rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
            Open Advanced Roles
          </Link>
        </section>
        ) : null}

        {mode === "permissions" ? (
        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Permissions</p>
          <h2 className="mt-2 text-2xl font-black">Access rules</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Info icon={ShieldCheck} text="Director keeps full access to all department control panels." />
            <Info icon={GraduationCap} text="Academic Head controls timetable, teachers, batches and academic reports." />
            <Info icon={BadgeIndianRupee} text="Administrative Officer handles applications, documents, fees and activation." />
            <Info icon={Users} text="Teachers and trainers see only their assigned classes, batches and attendance." />
          </div>
          <Link href="/admin-center/permissions" className="mt-5 inline-flex rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg">
            Open Advanced Permissions
          </Link>
        </section>
        ) : null}

        {(mode === "manage" || mode === "archive") ? (
        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Credential Directory</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">{accountGroup === "TEAM" ? "Team accounts" : "Students by batch"}</h2>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">
                {accountGroup === "TEAM"
                  ? "Teachers, trainers, academic heads, directors and operations staff."
                  : "Student accounts grouped by their active batch allocation."}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <div className="flex rounded-xl border border-[var(--border)] bg-white p-1">
                <button
                  className={`rounded-lg px-4 py-2 text-sm font-black ${accountGroup === "TEAM" ? "bg-[var(--gold-gradient)] text-[var(--navy)]" : "text-[var(--muted-blue)]"}`}
                  onClick={() => setAccountGroup("TEAM")}
                  type="button"
                >
                  Team
                </button>
                <button
                  className={`rounded-lg px-4 py-2 text-sm font-black ${accountGroup === "STUDENTS" ? "bg-[var(--gold-gradient)] text-[var(--navy)]" : "text-[var(--muted-blue)]"}`}
                  onClick={() => setAccountGroup("STUDENTS")}
                  type="button"
                >
                  Students
                </button>
              </div>
              <div className="flex rounded-xl border border-[var(--border)] bg-white p-1">
                <button
                  className={`rounded-lg px-4 py-2 text-sm font-black ${activeTab === "ACTIVE" ? "bg-[var(--navy)] text-white" : "text-[var(--muted-blue)]"}`}
                  onClick={() => setActiveTab("ACTIVE")}
                  type="button"
                >
                  Active
                </button>
                <button
                  className={`rounded-lg px-4 py-2 text-sm font-black ${activeTab === "ARCHIVED" ? "bg-[var(--navy)] text-white" : "text-[var(--muted-blue)]"}`}
                  onClick={() => setActiveTab("ARCHIVED")}
                  type="button"
                >
                  Archived
                </button>
              </div>
            </div>
          </div>
          <div className="mt-5 grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
            {accountGroup === "TEAM" ? (
              <>
                {visibleTeamGroups.map((group) => (
                  <div key={group.label} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">{group.label}</p>
                        <h3 className="mt-1 text-xl font-black">{group.title}</h3>
                        <p className="mt-1 text-sm text-[var(--muted-blue)]">{group.description}</p>
                      </div>
                      <span className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">{group.accounts.length} account(s)</span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {group.accounts.map((employee) => (
                        <EmployeeRow
                          key={employee.id}
                          employee={employee}
                          archived={activeTab === "ARCHIVED"}
                          groupLabel={group.label}
                          onArchive={() => {
                            if (window.confirm(`Archive ${employee.name}? This will move the account into history.`)) {
                              archiveMutation.mutate(employee.id);
                            }
                          }}
                          onReset={() => {
                            if (window.confirm(`Reset password and unlock ${employee.name}?`)) {
                              resetMutation.mutate(employee.id);
                            }
                          }}
                          onUnlock={() => unlockMutation.mutate(employee.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {!visibleTeam.length && <Empty text={activeTab === "ACTIVE" ? "No active team accounts found." : "No archived team accounts yet."} />}
              </>
            ) : (
              <>
                {studentGroups.map((group) => (
                  <div key={group.batchId} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
                    <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">Batch</p>
                        <h3 className="mt-1 text-xl font-black">{group.batchName}</h3>
                      </div>
                      <span className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">{group.students.length} student(s)</span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {group.students.map((student) => (
                        <EmployeeRow
                          key={student.id}
                          employee={student}
                          archived={activeTab === "ARCHIVED"}
                          groupLabel="Student"
                          onArchive={() => {
                            if (window.confirm(`Archive ${student.name}? This will move the account into history.`)) {
                              archiveMutation.mutate(student.id);
                            }
                          }}
                          onReset={() => {
                            if (window.confirm(`Reset password and unlock ${student.name}?`)) {
                              resetMutation.mutate(student.id);
                            }
                          }}
                          onUnlock={() => unlockMutation.mutate(student.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {!studentGroups.length && <Empty text={activeTab === "ACTIVE" ? "No active student accounts found." : "No archived student accounts yet."} />}
              </>
            )}
          </div>
        </section>
        ) : null}
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

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md ${active ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white/90"}`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
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

function isStudentAccount(account: Employee) {
  return account.role === "STUDENT";
}

function isTeamAccount(account: Employee) {
  return account.role !== "STUDENT" && account.role !== "PARENT";
}

function isAccountLocked(account: Employee) {
  return Boolean(account.isDisabled || (account.lockedUntil && new Date(account.lockedUntil) > new Date()));
}

function teamGroupLabel(account: Employee) {
  const metadata = account.roleMetadata ?? {};
  const template = String(metadata.dashboardTemplate ?? "");
  const designation = String(metadata.designation ?? "");
  if (template === "ACADEMIC_HEAD" || designation.toLowerCase().includes("academic head")) return "Academic Head";
  if (template === "PHYSICAL_TRAINER" || designation.toLowerCase().includes("trainer")) return "Physical Trainer";
  if (account.role === "TEACHER") return "Teacher";
  if (account.role === "DIRECTOR") return "Director";
  if (account.role === "BUSINESS_DEVELOPMENT_EXECUTIVE") return "BDE";
  if (template === "ADMISSION_CELL" || designation.toLowerCase().includes("administrative")) return "Administrative Officer";
  return "Team";
}

function groupStudentsByBatch(students: Employee[]) {
  const groups = new Map<string, { batchId: string; batchName: string; students: Employee[] }>();
  for (const student of students) {
    const enrollments = student.batchEnrollments?.length ? student.batchEnrollments : [{ id: "unassigned", status: "ACTIVE", batch: { id: "unassigned", name: "Unassigned Students" } }];
    for (const enrollment of enrollments) {
      const batchId = enrollment.batch.id;
      const batchName = enrollment.batch.name;
      const existing = groups.get(batchId) ?? { batchId, batchName, students: [] };
      existing.students.push(student);
      groups.set(batchId, existing);
    }
  }
  return Array.from(groups.values()).sort((first, second) => {
    if (first.batchId === "unassigned") return 1;
    if (second.batchId === "unassigned") return -1;
    return first.batchName.localeCompare(second.batchName);
  });
}

function groupTeamAccounts(accounts: Employee[]) {
  const definitions = [
    { label: "Directors", title: "Leadership", description: "Owners and senior management users.", match: (account: Employee) => account.role === "DIRECTOR" },
    { label: "Academic Heads", title: "Academic operations", description: "Batch, timetable, teacher and student monitoring control.", match: (account: Employee) => teamGroupLabel(account) === "Academic Head" },
    { label: "Teachers", title: "Classroom faculty", description: "Subject teachers assigned to batches.", match: (account: Employee) => teamGroupLabel(account) === "Teacher" },
    { label: "Physical Trainers", title: "Fitness faculty", description: "PT, running, BMI and fitness users.", match: (account: Employee) => teamGroupLabel(account) === "Physical Trainer" },
    { label: "Administrative Officers", title: "Admissions and records", description: "AO users handling documents, fees and activation.", match: (account: Employee) => teamGroupLabel(account) === "Administrative Officer" },
    { label: "BDE Team", title: "Lead and counselling", description: "Business development and follow-up users.", match: (account: Employee) => teamGroupLabel(account) === "BDE" },
    { label: "Other Team", title: "Support accounts", description: "Admin, operations and uncategorized staff.", match: (account: Employee) => teamGroupLabel(account) === "Team" },
  ];

  return definitions
    .map((definition) => ({
      ...definition,
      accounts: accounts.filter(definition.match).sort((first, second) => first.name.localeCompare(second.name)),
    }))
    .filter((group) => group.accounts.length > 0);
}

function EmployeeRow({
  employee,
  archived,
  groupLabel,
  onArchive,
  onReset,
  onUnlock,
}: {
  employee: Employee;
  archived?: boolean;
  groupLabel?: string;
  onArchive?: () => void;
  onReset?: () => void;
  onUnlock?: () => void;
}) {
  const metadata = employee.roleMetadata ?? {};
  const lockedUntil = employee.lockedUntil ? new Date(employee.lockedUntil) : null;
  const isLocked = Boolean(employee.isDisabled || (lockedUntil && lockedUntil > new Date()));
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black">{employee.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{employee.email} / {employee.phone || employee.mobile || "No phone"}</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">
            {groupLabel ? `${groupLabel} / ` : ""}{String(metadata.designation ?? employee.role)} / {String(metadata.employmentType ?? "FULL_TIME")} / {String(metadata.department ?? "Academy")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
            <span className={`rounded-full px-3 py-1 ${isLocked ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
              {isLocked ? "LOCKED" : "ACTIVE"}
            </span>
            {employee.roleOnboardingStatus && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{employee.roleOnboardingStatus}</span>}
            {typeof employee.loginFailureCount === "number" && employee.loginFailureCount > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{employee.loginFailureCount} failed login(s)</span>
            )}
            {lockedUntil && <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">Locked until {lockedUntil.toLocaleString()}</span>}
            {employee.lastLoginAt && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Last login {new Date(employee.lastLoginAt).toLocaleString()}</span>}
          </div>
        </div>
        {!archived && (
          <div className="flex flex-wrap gap-2">
            {isLocked && (
              <button onClick={onUnlock} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
                <ShieldCheck className="mr-1 inline h-4 w-4" />
                Unlock
              </button>
            )}
            <button onClick={onReset} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black">
              <KeyRound className="mr-1 inline h-4 w-4" />
              Reset + Unlock
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
