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
  Pencil,
  Save,
  ShieldCheck,
  UserPlus,
  Users,
  X,
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

type EditableAccountPayload = {
  name: string;
  email: string;
  phone: string;
  role: string;
  designation: string;
  department: string;
  employmentType: string;
  dashboardTemplate: string;
  password: string;
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
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditableAccountPayload | null>(null);
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

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditableAccountPayload }) =>
      apiJson<Employee>(`/api/academy/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
          designation: payload.designation,
          department: payload.department,
          employmentType: payload.employmentType,
          dashboardTemplate: payload.dashboardTemplate,
          ...(payload.password.trim() ? { password: payload.password.trim() } : {}),
        }),
      }),
    onSuccess: (employee) => {
      setNotice(`${employee.name} updated. Login details are now active across dashboards.`);
      setEditingAccountId(null);
      setEditForm(null);
      void queryClient.invalidateQueries({ queryKey: ["director", "employees"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not update account."),
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

  const startEditAccount = (employee: Employee) => {
    const metadata = employee.roleMetadata ?? {};
    setEditingAccountId(employee.id);
    setEditForm({
      name: employee.name ?? "",
      email: employee.email ?? "",
      phone: employee.phone || employee.mobile || "",
      role: employee.role,
      designation: String(metadata.designation ?? employee.role),
      department: String(metadata.department ?? "Academy"),
      employmentType: String(metadata.employmentType ?? "FULL_TIME"),
      dashboardTemplate: String(metadata.dashboardTemplate ?? ""),
      password: "",
    });
  };

  const cancelEditAccount = () => {
    setEditingAccountId(null);
    setEditForm(null);
  };

  const submitEditAccount = (id: string) => {
    if (!editForm) return;
    updateMutation.mutate({ id, payload: editForm });
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-3 py-3 text-[var(--navy)] lg:h-[calc(100vh-var(--nav-height)-2rem)] lg:min-h-0 lg:overflow-hidden">
      <section className="mx-auto flex h-full max-w-[1500px] flex-col gap-3 overflow-y-auto pr-0 lg:pr-2">
        <div className="shrink-0 rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">People Control</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">HRM Staff And Access</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
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

        <section className="grid shrink-0 gap-2 md:grid-cols-4 xl:grid-cols-7">
          <ModeButton active={mode === "overview"} icon={Users} label="Overview" onClick={() => setMode("overview")} />
          <ModeButton active={mode === "add"} icon={UserPlus} label="Add Employee" onClick={() => setMode("add")} />
          <ModeButton active={mode === "manage"} icon={Users} label="Manage Staff" onClick={() => setMode("manage")} />
          <ModeButton active={mode === "archive"} icon={Archive} label="Archive Staff" onClick={() => { setActiveTab("ARCHIVED"); setMode("archive"); }} />
          <ModeButton active={mode === "access"} icon={KeyRound} label="Access" onClick={() => setMode("access")} />
          <ModeButton active={mode === "roles"} icon={ShieldCheck} label="Roles" onClick={() => setMode("roles")} />
          <ModeButton active={mode === "permissions"} icon={ShieldCheck} label="Permissions" onClick={() => setMode("permissions")} />
        </section>

        {mode === "overview" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">People Structure</p>
          <h2 className="mt-1 text-xl font-black">Team grouped by duty</h2>
          <div className="mt-3 grid max-h-[52vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
            {activeTeamGroups.map((group) => (
              <div key={group.label} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{group.label}</p>
                <p className="mt-2 text-2xl font-black">{group.accounts.length}</p>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{group.description}</p>
              </div>
            ))}
          </div>
        </section>
        ) : null}

        {notice && <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-2 text-sm font-bold">{notice}</div>}

        {lastCredentials && (
          <section className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3 shadow-sm md:p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Generated Credentials</p>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <CredentialBox label="Login email" value={lastCredentials.email} />
              <CredentialBox label="Temporary password" value={lastCredentials.temporaryPassword} />
              <button
                className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black"
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
        <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Add Employee</p>
            <h2 className="mt-1 text-xl font-black">Create credentials</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
            <form onSubmit={submit} className="mt-3 grid gap-3">
              <Input label="Name" value={form.name} onChange={(value) => setForm((item) => ({ ...item, name: value }))} required />
              <Input label="Email" value={form.email} onChange={(value) => setForm((item) => ({ ...item, email: value }))} required />
              <Input label="Phone" value={form.phone ?? ""} onChange={(value) => setForm((item) => ({ ...item, phone: value }))} />
              <label className="grid gap-2 text-sm font-bold">
                Employee type
                <select
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
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
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
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
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)] shadow-lg">
                <UserPlus className="h-4 w-4" />
                Create Employee
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director Teaching Mode</p>
            <h2 className="mt-1 text-xl font-black">Director can teach when required</h2>
            <div className="mt-3 grid gap-3">
              <Info icon={CheckCircle2} text="Director can open Academic Department and assign himself/herself as teacher to any batch." />
              <Info icon={GraduationCap} text="Once assigned, the same class calendar, batch and syllabus tracker can be managed by the Director." />
              <Info icon={BadgeIndianRupee} text="Academic Head and teachers remain operational users; Director keeps planning and override control." />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)] shadow-lg" href="/dashboard/director/academic">
                Assign Teaching Role
              </Link>
              <Link className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-black" href="/dashboard/director/teaching">
                Open Teaching View
              </Link>
            </div>
          </div>
        </section>
        ) : null}

        {mode === "overview" ? (
        <>
        <section id="attendance" className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Attendance & Leave</p>
          <h2 className="mt-1 text-xl font-black">Launch setup state</h2>
          <div className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-3 text-sm leading-6 text-[var(--muted-blue)]">
            Staff attendance and leave approval can be connected here. Employee account creation and access control are already active.
          </div>
        </section>

        <section id="performance" className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Performance Review</p>
          <h2 className="mt-1 text-xl font-black">Teacher and staff output</h2>
          <div className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-3 text-sm leading-6 text-[var(--muted-blue)]">
            Performance combines class completion, academic calendar logs, student progress and management reviews as those records are created.
          </div>
        </section>
        </>
        ) : null}

        {mode === "access" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Credential Readiness</p>
            <h2 className="mt-1 text-xl font-black">Account unlock and password reset</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">
              Director can reset any launch user to the default temporary password and clear lockout counters from this screen.
            </p>
          </div>
          <div className="mt-3 grid max-h-[52vh] gap-3 overflow-y-auto pr-1">
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
                editing={editingAccountId === employee.id}
                editForm={editingAccountId === employee.id ? editForm : null}
                onEdit={() => startEditAccount(employee)}
                onCancelEdit={cancelEditAccount}
                onEditChange={(field, value) => setEditForm((current) => current ? { ...current, [field]: value } : current)}
                onSaveEdit={() => submitEditAccount(employee.id)}
                saving={updateMutation.isPending && editingAccountId === employee.id}
              />
            ))}
            {!activeTeam.length && <Empty text="No team accounts found." />}
          </div>
        </section>
        ) : null}

        {mode === "roles" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Roles</p>
          <h2 className="mt-1 text-xl font-black">Role control</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roleOptions.map((role) => (
              <div key={`${role.value}-${role.dashboardTemplate ?? role.label}`} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                <p className="font-black">{role.label}</p>
                <p className="mt-2 text-sm text-[var(--muted-blue)]">System role: {role.value}</p>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">Dashboard: {role.dashboardTemplate || "Default"}</p>
              </div>
            ))}
          </div>
          <Link href="/admin-center/roles" className="mt-3 inline-flex rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)] shadow-lg">
            Open Advanced Roles
          </Link>
        </section>
        ) : null}

        {mode === "permissions" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Permissions</p>
          <h2 className="mt-1 text-xl font-black">Access rules</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Info icon={ShieldCheck} text="Director keeps full access to all department control panels." />
            <Info icon={GraduationCap} text="Academic Head controls timetable, teachers, batches and academic reports." />
            <Info icon={BadgeIndianRupee} text="Administrative Officer handles applications, documents, fees and activation." />
            <Info icon={Users} text="Teachers and trainers see only their assigned classes, batches and attendance." />
          </div>
          <Link href="/admin-center/permissions" className="mt-3 inline-flex rounded-xl bg-[var(--gold-gradient)] px-4 py-2 text-sm font-black text-[var(--navy)] shadow-lg">
            Open Advanced Permissions
          </Link>
        </section>
        ) : null}

        {(mode === "manage" || mode === "archive") ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 shadow-sm md:p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">Credential Directory</p>
          <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">{accountGroup === "TEAM" ? "Team accounts" : "Students by batch"}</h2>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">
                {accountGroup === "TEAM"
                  ? "Teachers, trainers, academic heads, directors and operations staff."
                  : "Student accounts grouped by their active batch allocation."}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <div className="flex rounded-xl border border-[var(--border)] bg-white p-1">
                <button
                  className={`rounded-lg px-3 py-1.5 text-sm font-black ${accountGroup === "TEAM" ? "bg-[var(--gold-gradient)] text-[var(--navy)]" : "text-[var(--muted-blue)]"}`}
                  onClick={() => setAccountGroup("TEAM")}
                  type="button"
                >
                  Team
                </button>
                <button
                  className={`rounded-lg px-3 py-1.5 text-sm font-black ${accountGroup === "STUDENTS" ? "bg-[var(--gold-gradient)] text-[var(--navy)]" : "text-[var(--muted-blue)]"}`}
                  onClick={() => setAccountGroup("STUDENTS")}
                  type="button"
                >
                  Students
                </button>
              </div>
              <div className="flex rounded-xl border border-[var(--border)] bg-white p-1">
                <button
                  className={`rounded-lg px-3 py-1.5 text-sm font-black ${activeTab === "ACTIVE" ? "bg-[var(--navy)] text-white" : "text-[var(--muted-blue)]"}`}
                  onClick={() => setActiveTab("ACTIVE")}
                  type="button"
                >
                  Active
                </button>
                <button
                  className={`rounded-lg px-3 py-1.5 text-sm font-black ${activeTab === "ARCHIVED" ? "bg-[var(--navy)] text-white" : "text-[var(--muted-blue)]"}`}
                  onClick={() => setActiveTab("ARCHIVED")}
                  type="button"
                >
                  Archived
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 grid max-h-[52vh] gap-3 overflow-y-auto pr-1">
            {accountGroup === "TEAM" ? (
              <>
                {visibleTeamGroups.map((group) => (
                  <div key={group.label} className="rounded-2xl border border-[var(--border)] bg-white/80 p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{group.label}</p>
                        <h3 className="mt-1 text-lg font-black">{group.title}</h3>
                        <p className="mt-1 text-sm text-[var(--muted-blue)]">{group.description}</p>
                      </div>
                      <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-black">{group.accounts.length} account(s)</span>
                    </div>
                    <div className="mt-3 grid gap-3">
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
                          editing={editingAccountId === employee.id}
                          editForm={editingAccountId === employee.id ? editForm : null}
                          onEdit={() => startEditAccount(employee)}
                          onCancelEdit={cancelEditAccount}
                          onEditChange={(field, value) => setEditForm((current) => current ? { ...current, [field]: value } : current)}
                          onSaveEdit={() => submitEditAccount(employee.id)}
                          saving={updateMutation.isPending && editingAccountId === employee.id}
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
                  <div key={group.batchId} className="rounded-2xl border border-[var(--border)] bg-white/80 p-3">
                    <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">Batch</p>
                        <h3 className="mt-1 text-lg font-black">{group.batchName}</h3>
                      </div>
                      <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-black">{group.students.length} student(s)</span>
                    </div>
                    <div className="mt-3 grid gap-3">
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
                          editing={editingAccountId === student.id}
                          editForm={editingAccountId === student.id ? editForm : null}
                          onEdit={() => startEditAccount(student)}
                          onCancelEdit={cancelEditAccount}
                          onEditChange={(field, value) => setEditForm((current) => current ? { ...current, [field]: value } : current)}
                          onSaveEdit={() => submitEditAccount(student.id)}
                          saving={updateMutation.isPending && editingAccountId === student.id}
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
    <div className="rounded-2xl border border-[var(--border)] bg-white/85 p-3 shadow-sm">
      <Icon className="h-4 w-4 text-[var(--gold)]" />
      <p className="mt-2 text-xl font-black">{value}</p>
      <p className="mt-0.5 text-sm text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md ${active ? "border-[var(--gold-border)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white/90"}`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

function CredentialBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{label}</p>
      <p className="mt-1 break-all text-sm font-black text-[var(--navy)]">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
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
    <div className="flex gap-3 rounded-2xl border border-[var(--border)] bg-white p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
      <p className="text-sm leading-6 text-[var(--muted-blue)]">{text}</p>
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
  editing,
  editForm,
  onEdit,
  onCancelEdit,
  onEditChange,
  onSaveEdit,
  saving,
}: {
  employee: Employee;
  archived?: boolean;
  groupLabel?: string;
  onArchive?: () => void;
  onReset?: () => void;
  onUnlock?: () => void;
  editing?: boolean;
  editForm?: EditableAccountPayload | null;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onEditChange?: (field: keyof EditableAccountPayload, value: string) => void;
  onSaveEdit?: () => void;
  saving?: boolean;
}) {
  const metadata = employee.roleMetadata ?? {};
  const lockedUntil = employee.lockedUntil ? new Date(employee.lockedUntil) : null;
  const isLocked = Boolean(employee.isDisabled || (lockedUntil && lockedUntil > new Date()));

  if (editing && editForm) {
    return (
      <article className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3">
        <div className="grid gap-2 md:grid-cols-3">
          <EditField label="Name" value={editForm.name} onChange={(value) => onEditChange?.("name", value)} />
          <EditField label="Email / Login" type="email" value={editForm.email} onChange={(value) => onEditChange?.("email", value)} />
          <EditField label="Contact" value={editForm.phone} onChange={(value) => onEditChange?.("phone", value)} />
          <EditField label="Designation" value={editForm.designation} onChange={(value) => onEditChange?.("designation", value)} />
          <EditField label="Department" value={editForm.department} onChange={(value) => onEditChange?.("department", value)} />
          <label className="grid gap-1.5 text-xs font-black">
            Employment
            <select className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm" value={editForm.employmentType} onChange={(event) => onEditChange?.("employmentType", event.target.value)}>
              {employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-black">
            Role
            <select className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm" value={editForm.role} onChange={(event) => onEditChange?.("role", event.target.value)}>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher / Trainer</option>
              <option value="ACADEMIC_HEAD">Academic Head</option>
              <option value="ADMIN">Admin</option>
              <option value="DIRECTOR">Director</option>
              <option value="BUSINESS_DEVELOPMENT_EXECUTIVE">BDE</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-black">
            Dashboard
            <select className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm" value={editForm.dashboardTemplate} onChange={(event) => onEditChange?.("dashboardTemplate", event.target.value)}>
              <option value="">Default</option>
              <option value="ACADEMIC_HEAD">Academic Head</option>
              <option value="PHYSICAL_TRAINER">Physical Trainer</option>
              <option value="ADMISSION_CELL">Admission Cell</option>
              <option value="LEAD_SUPPORT">Lead Support</option>
              <option value="ADMINISTRATION">Administration</option>
            </select>
          </label>
          <EditField label="New password" value={editForm.password} onChange={(value) => onEditChange?.("password", value)} placeholder="Leave blank to keep same" />
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancelEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          <button type="button" onClick={onSaveEdit} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--navy)] px-3 py-2 text-xs font-black text-white disabled:opacity-60">
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-black">{employee.name}</h3>
          <p className="mt-0.5 text-sm text-[var(--muted-blue)]">{employee.email} / {employee.phone || employee.mobile || "No phone"}</p>
          <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">
            {groupLabel ? `${groupLabel} / ` : ""}{String(metadata.designation ?? employee.role)} / {String(metadata.employmentType ?? "FULL_TIME")} / {String(metadata.department ?? "Academy")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-black">
            <span className={`rounded-full px-2.5 py-1 ${isLocked ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
              {isLocked ? "LOCKED" : "ACTIVE"}
            </span>
            {employee.roleOnboardingStatus && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{employee.roleOnboardingStatus}</span>}
            {typeof employee.loginFailureCount === "number" && employee.loginFailureCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">{employee.loginFailureCount} failed login(s)</span>
            )}
            {lockedUntil && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-800">Locked until {lockedUntil.toLocaleString()}</span>}
            {employee.lastLoginAt && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">Last login {new Date(employee.lastLoginAt).toLocaleString()}</span>}
          </div>
        </div>
        {!archived && (
          <div className="flex flex-wrap gap-2">
            <button onClick={onEdit} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">
              <Pencil className="mr-1 inline h-3.5 w-3.5" />
              Edit
            </button>
            {isLocked && (
              <button onClick={onUnlock} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                Unlock
              </button>
            )}
            <button onClick={onReset} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">
              <KeyRound className="mr-1 inline h-3.5 w-3.5" />
              Reset + Unlock
            </button>
            <button onClick={onArchive} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800">
              <Archive className="mr-1 inline h-3.5 w-3.5" />
              Archive
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function EditField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-black">
      {label}
      <input
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-3 text-sm text-[var(--muted-blue)]">{text}</div>;
}
