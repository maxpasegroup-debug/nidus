"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Plus, UserRound } from "lucide-react";
import { useUsers } from "@/hooks/use-admin-center";
import type { AuthRole } from "@/services/auth.v2";

const roles: Array<{ label: string; value: AuthRole }> = [
  { label: "Director / Management", value: "DIRECTOR" },
  { label: "Teacher / Faculty", value: "TEACHER" },
  { label: "Business Development Executive", value: "TELECALLER" },
  { label: "Learner", value: "STUDENT" },
  { label: "Parent", value: "PARENT" }
];

const employeeRoles = ["DIRECTOR", "TEACHER", "TELECALLER"];

function roleLabel(role: string) {
  return roles.find((item) => item.value === role)?.label ?? role;
}

export default function UsersPage() {
  const users = useUsers();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<Exclude<AuthRole, "ADMIN" | "GUEST">>("TEACHER");

  function openCreate(defaultRole: Exclude<AuthRole, "ADMIN" | "GUEST">) {
    setRole(defaultRole);
    setOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    users.create.mutate(
      { name, email, mobile, role },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setEmail("");
          setMobile("");
          setRole("TEACHER");
        }
      }
    );
  }

  const allUsers = users.data ?? [];
  const employees = allUsers.filter((user) => employeeRoles.includes(user.role));
  const learners = allUsers.filter((user) => user.role === "STUDENT" || user.role === "PARENT");

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">People & HR</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">Employees, students, and parents</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Add staff and learners from one place. Employees get the correct dashboard, and every new account can sign in immediately with default password: 123456789.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => openCreate("TEACHER")} className="inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-3 text-sm font-semibold text-navy-deep">
              <Plus className="h-5 w-5" /> Add employee
            </button>
            <button onClick={() => openCreate("STUDENT")} className="inline-flex items-center justify-center gap-2 rounded border border-white/15 px-4 py-3 text-sm font-semibold text-ink transition hover:border-gold/50">
              <Plus className="h-5 w-5" /> Add student
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Employees</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{employees.length}</p>
            <p className="mt-1 text-sm text-muted">Director, teacher, business development, learner, and parent accounts</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Students & Parents</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{learners.length}</p>
            <p className="mt-1 text-sm text-muted">Learner and parent access for dashboards and reports</p>
          </div>
          <div className="rounded-lg border border-gold/20 bg-gold/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">Login Ready</p>
            <p className="mt-3 text-xl font-semibold text-ink">Default password: 123456789</p>
            <p className="mt-1 text-sm text-muted">Reset anytime using the key button beside a person</p>
          </div>
        </section>

        {users.isLoading && <div className="mt-6 grid gap-4">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-white/10" />)}</div>}

        <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
          <div className="grid min-w-[760px] grid-cols-[1.4fr_1.6fr_1.15fr_1fr_0.8fr] bg-white/8 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Reset</span>
          </div>
          {allUsers.map((user) => (
            <div key={user.id} className="grid min-w-[760px] grid-cols-[1.4fr_1.6fr_1.15fr_1fr_0.8fr] items-center border-t border-white/10 px-4 py-4 text-sm">
              <span className="font-semibold text-ink">{user.name}</span>
              <span className="text-muted">{user.email}</span>
              <span className="text-gold-soft">{roleLabel(user.role)}</span>
              <span className="text-muted">{user.roleMetadata?.defaultPassword ? "Default password" : user.roleOnboardingStatus ?? "ACTIVE"}</span>
              <button type="button" onClick={() => users.resetPassword.mutate(user.id)} disabled={users.resetPassword.isPending} className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/15 text-gold-soft transition hover:border-gold/50 disabled:opacity-50" aria-label={`Reset password for ${user.name}`}>
                <KeyRound className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="premium-surface w-full max-w-2xl rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="rounded bg-gold/15 p-3 text-gold-soft">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">Add employee, student, or parent</h2>
                <p className="text-sm text-muted">Choose the role carefully. The correct dashboard opens automatically after login.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input value={name} onChange={(event) => setName(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Full name" required />
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Email" type="email" required />
              <input value={mobile} onChange={(event) => setMobile(event.target.value)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60" placeholder="Mobile" required />
              <select value={role} onChange={(event) => setRole(event.target.value as Exclude<AuthRole, "ADMIN" | "GUEST">)} className="rounded border border-white/10 bg-navy-deep/70 px-3 py-2 text-sm outline-none focus:border-gold/60 sm:col-span-2">
                {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <div className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm leading-6 text-muted sm:col-span-2">
                Employee roles: Director, Teacher, and Business Development Executive. Administrative Officer is created from Director Management with the correct dashboard template. Learner roles: Learner and Parent.
              </div>
              <div className="rounded border border-gold/20 bg-gold/10 px-3 py-2 text-sm text-gold-soft sm:col-span-2">Default password: 123456789</div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded border border-white/15 px-5 py-3 text-sm font-semibold text-muted">Cancel</button>
              <button disabled={users.create.isPending} className="rounded bg-gold px-5 py-3 text-sm font-semibold text-navy-deep disabled:opacity-60">Create account</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
