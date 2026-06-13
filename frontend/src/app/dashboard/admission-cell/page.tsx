"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  CheckCircle2,
  ClipboardCheck,
  FileArchive,
  FileText,
  GraduationCap,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type BatchOption = {
  id: string;
  name: string;
  batchType?: string | null;
  status?: string | null;
  course?: { title?: string | null } | null;
  programSlug?: string | null;
  _count?: { students?: number; teachers?: number };
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

const stages = [
  { id: "enquiries", title: "New Enquiries", text: "Website, phone, WhatsApp, social and walk-in leads.", icon: MessageCircle },
  { id: "applications", title: "Applications", text: "Students who selected a program and requested admission.", icon: FileText },
  { id: "counselling", title: "Counselling", text: "Parent discussion, student need and course guidance.", icon: Users },
  { id: "approval", title: "Admission Approval", text: "Approve, assign batch and activate student dashboard.", icon: ShieldCheck },
  { id: "fees", title: "Fee Follow-Up", text: "Track pending and completed admission fee follow-up.", icon: BadgeIndianRupee },
  { id: "documents", title: "Documents", text: "Academic details, ID proof, blood group and admission documents.", icon: FileArchive },
  { id: "reports", title: "Admission Reports", text: "Course-wise conversion and admission status.", icon: ClipboardCheck },
] as const;

export default function AdmissionCellDashboardPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<ApprovalPayload>({
    batchId: "",
    email: "",
    name: "",
    phone: "",
    rollNumber: "",
    notes: "",
  });

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
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not approve admission."),
  });

  const activeBatches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);
  const totalStudents = useMemo(
    () => activeBatches.reduce((total, batch) => total + (batch._count?.students ?? 0), 0),
    [activeBatches],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    approveMutation.mutate(form);
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Admission Cell</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Enquiry to student activation</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            One simple workspace to guide enquiries, approve applications, assign batches and activate the student dashboard.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric icon={GraduationCap} label="Available Batches" value={activeBatches.length} />
          <Metric icon={Users} label="Students In Batches" value={totalStudents} />
          <Metric icon={ShieldCheck} label="Approval Mode" value="Ready" />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <a
                key={stage.id}
                className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
                href={`#${stage.id}`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                  <Icon className="h-6 w-6 text-[var(--navy)]" />
                </div>
                <h2 className="mt-5 text-xl font-black">{stage.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{stage.text}</p>
              </a>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel id="approval" title="Approve Admission" eyebrow="Activate student dashboard">
            <form onSubmit={submit} className="grid gap-4">
              <Field label="Student free-account email" value={form.email} onChange={(value) => setForm((item) => ({ ...item, email: value }))} required />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Student name" value={form.name ?? ""} onChange={(value) => setForm((item) => ({ ...item, name: value }))} />
                <Field label="WhatsApp / phone" value={form.phone ?? ""} onChange={(value) => setForm((item) => ({ ...item, phone: value }))} />
                <Field label="Roll number" value={form.rollNumber ?? ""} onChange={(value) => setForm((item) => ({ ...item, rollNumber: value }))} />
                <label className="grid gap-2 text-sm font-bold">
                  Assign batch
                  <select
                    className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                    required
                    value={form.batchId}
                    onChange={(event) => setForm((item) => ({ ...item, batchId: event.target.value }))}
                  >
                    <option value="">Choose batch</option>
                    {activeBatches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} {batch.programSlug ? `- ${batch.programSlug}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-bold">
                Counselling / admission note
                <textarea
                  className="min-h-28 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                  value={form.notes}
                  onChange={(event) => setForm((item) => ({ ...item, notes: event.target.value }))}
                  placeholder="Course selected, payment status, document pending, parent discussion..."
                />
              </label>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                disabled={approveMutation.isPending}
                type="submit"
              >
                <CheckCircle2 className="h-5 w-5" />
                Approve And Activate
              </button>
            </form>

            {message && (
              <div className="mt-4 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold text-[var(--navy)]">
                {message}
              </div>
            )}
          </Panel>

          <Panel id="applications" title="Batch Assignment Board" eyebrow="Real batches">
            <div className="grid gap-3">
              {activeBatches.map((batch) => (
                <article key={batch.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black">{batch.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">
                        {batch.batchType ?? "Batch"} / {batch.status ?? "ACTIVE"} / {batch._count?.students ?? 0} students
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              {!activeBatches.length && <Empty text="No batches available. Director must create batches from Academic Department before admissions can be approved." />}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel id="enquiries" title="New Enquiries" eyebrow="Lead capture">
            <Empty text="Live enquiries appear here after website, WhatsApp, social media or manual CRM lead capture is connected." />
          </Panel>
          <Panel id="counselling" title="Counselling Notes" eyebrow="Parent and student clarity">
            <Empty text="Use the admission note during approval for now. Full counselling history can be connected to CRM notes." />
          </Panel>
          <Panel id="fees" title="Fee Follow-Up" eyebrow="Payment readiness">
            <Empty text="Use this section to track pending fee workflow from connected accounts/payment records." />
          </Panel>
          <Panel id="documents" title="Documents" eyebrow="Admission files">
            <Empty text="Document upload and verification can be connected here. Required documents: ID proof, academic details, photo and blood group." />
          </Panel>
        </section>

        <Panel id="reports" title="Admission Reports" eyebrow="Conversion overview">
          <Empty text="Admission conversion reports will show real enquiries, applications, approvals and batch assignment data after lead capture is connected." />
        </Panel>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/85 p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[var(--gold)]" />
      <p className="mt-4 text-3xl font-black text-[var(--navy)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{label}</p>
    </div>
  );
}

function Panel({ id, title, eyebrow, children }: { id: string; title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm leading-7 text-[var(--muted-blue)]">{text}</div>;
}
