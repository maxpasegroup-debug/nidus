"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, GraduationCap, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type BatchOption = {
  id: string;
  name: string;
  batchType?: string | null;
  status?: string | null;
  course?: {
    title?: string | null;
  } | null;
};

type ApprovalPayload = {
  batchId: string;
  email: string;
  name?: string;
  phone?: string;
  rollNumber?: string;
  notes?: string;
  applicationId?: string;
  leadId?: string;
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

export default function AdmissionCellDashboardPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ApprovalPayload>({
    batchId: "",
    email: "",
    name: "",
    phone: "",
    rollNumber: "",
    notes: "",
  });
  const [message, setMessage] = useState("");

  const batchesQuery = useQuery({
    queryKey: ["admission-cell", "batches"],
    queryFn: () => apiJson<BatchOption[]>("/api/academy/batches"),
  });

  const approveMutation = useMutation({
    mutationFn: (payload: ApprovalPayload) =>
      apiJson<{ message?: string }>("/api/academy/admissions/approve", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setMessage(data.message || "Admission approved and student dashboard activated.");
      setForm({ batchId: "", email: "", name: "", phone: "", rollNumber: "", notes: "" });
      void queryClient.invalidateQueries({ queryKey: ["admission-cell", "batches"] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Could not approve admission.");
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    approveMutation.mutate(form);
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Admission Cell</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Approve student admission</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            Use this screen after counselling and fee confirmation. Select the student&apos;s batch and approve. Their guest/public
            dashboard will become a student academic dashboard.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Approval Form</p>
            <h2 className="mt-2 text-2xl font-black">Convert guest to student</h2>

            <form onSubmit={submit} className="mt-5 grid gap-4">
              <Field label="Student free-account email" icon={Mail} required value={form.email} onChange={(value) => setForm((item) => ({ ...item, email: value }))} />
              <Field label="Student name" icon={UserRound} value={form.name ?? ""} onChange={(value) => setForm((item) => ({ ...item, name: value }))} />
              <Field label="WhatsApp / phone" icon={Phone} value={form.phone ?? ""} onChange={(value) => setForm((item) => ({ ...item, phone: value }))} />
              <Field label="Roll number" icon={ShieldCheck} value={form.rollNumber ?? ""} onChange={(value) => setForm((item) => ({ ...item, rollNumber: value }))} />

              <label className="grid gap-2 text-sm font-bold">
                Select batch
                <select
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                  required
                  value={form.batchId}
                  onChange={(event) => setForm((item) => ({ ...item, batchId: event.target.value }))}
                >
                  <option value="">Choose batch</option>
                  {(batchesQuery.data ?? []).map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} {batch.course?.title ? `- ${batch.course.title}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Admission note
                <textarea
                  className="min-h-28 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                  value={form.notes}
                  onChange={(event) => setForm((item) => ({ ...item, notes: event.target.value }))}
                />
              </label>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                disabled={approveMutation.isPending}
                type="submit"
              >
                <CheckCircle2 className="h-5 w-5" />
                Approve Admission
              </button>
            </form>

            {message && (
              <div className="mt-4 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold text-[var(--navy)]">
                {message}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Available Batches</p>
            <h2 className="mt-2 text-2xl font-black">Assign into the correct batch</h2>
            <div className="mt-5 grid gap-3">
              {(batchesQuery.data ?? []).map((batch) => (
                <article key={batch.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black">{batch.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">
                        {batch.course?.title ?? "Academy batch"} / {batch.batchType ?? "Batch"} / {batch.status ?? "ACTIVE"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              {!batchesQuery.data?.length && (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm text-[var(--muted-blue)]">
                  No batches available. Director must create batches from Academic Department.
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 focus-within:border-[var(--gold)]">
        <Icon className="h-4 w-4 text-[var(--gold)]" />
        <input
          className="min-w-0 flex-1 bg-transparent py-3 text-[var(--navy)] outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
        />
      </div>
    </label>
  );
}
