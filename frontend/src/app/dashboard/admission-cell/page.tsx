"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeIndianRupee, CheckCircle2, ClipboardCheck, FileArchive, FileText, GraduationCap, ShieldCheck, UserCheck, Users } from "lucide-react";
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

type BatchResponse = BatchOption[] | { batches: BatchOption[] };

type ApprovalPayload = {
  batchId: string;
  email: string;
  name?: string;
  phone?: string;
  rollNumber?: string;
  notes?: string;
  leadId?: string;
  totalFee?: number;
  amountPaid?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionRef?: string;
  receiptUploadUrl?: string;
};

type LeadApplication = {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  targetExam: string;
  source: string;
  status: "NEW" | "CONTACTED" | "COUNSELLING" | "ENROLLED" | "LOST";
  notes?: string | null;
  assignee?: {
    name?: string | null;
    email?: string | null;
  } | null;
  createdAt: string;
};

type DocumentKey = "photo" | "aadhaar" | "marksheet" | "parentDetails" | "otherFiles";
type DocumentStatus = "Pending" | "Verified" | "Rejected";

const workflowCards = [
  { id: "new-admissions", title: "New Admissions", text: "Confirmed admissions from Business Development Executive.", icon: FileText },
  { id: "document-verification", title: "Document Verification", text: "Photo, Aadhaar, marksheet, parent details and files.", icon: FileArchive },
  { id: "fees-enrollment", title: "Fees & Enrollment", text: "Registration fee, course fee and installment readiness.", icon: BadgeIndianRupee },
  { id: "batch-allocation", title: "Batch Allocation", text: "Assign program batch only after readiness checks pass.", icon: GraduationCap },
  { id: "student-activation", title: "Student Activation", text: "Final approval, dashboard access and batch access.", icon: UserCheck },
  { id: "admission-reports", title: "Admission Reports", text: "Real counts only: new, pending, fee pending and activated.", icon: ClipboardCheck },
] as const;

const documentLabels: Record<DocumentKey, string> = {
  photo: "Photo",
  aadhaar: "Aadhaar",
  marksheet: "Marksheet",
  parentDetails: "Parent Details",
  otherFiles: "Other Files",
};

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken") || localStorage.getItem("nidus_token")
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

function normalizeBatches(response: BatchResponse | undefined) {
  if (!response) return [];
  return Array.isArray(response) ? response : response.batches ?? [];
}

export default function AdmissionCellDashboardPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [callNote, setCallNote] = useState("");
  const [admissionStatus, setAdmissionStatus] = useState("Received");
  const [documentStatuses, setDocumentStatuses] = useState<Record<DocumentKey, DocumentStatus>>({
    photo: "Pending",
    aadhaar: "Pending",
    marksheet: "Pending",
    parentDetails: "Pending",
    otherFiles: "Pending",
  });
  const [form, setForm] = useState<ApprovalPayload>({
    batchId: "",
    email: "",
    name: "",
    phone: "",
    rollNumber: "",
    notes: "",
    totalFee: 0,
    amountPaid: 0,
    paymentStatus: "PENDING",
    paymentMethod: "OFFICE_COLLECTION",
    transactionRef: "",
    receiptUploadUrl: "",
  });

  const batchesQuery = useQuery({
    queryKey: ["admission-cell", "batches"],
    queryFn: () => apiJson<BatchResponse>("/api/academy/batches"),
  });

  const leadsQuery = useQuery({
    queryKey: ["admission-cell", "applications"],
    queryFn: () => apiJson<{ leads: LeadApplication[] }>("/api/crm/leads"),
  });

  const activeBatches = useMemo(() => normalizeBatches(batchesQuery.data).filter((batch) => batch.status !== "ARCHIVED"), [batchesQuery.data]);
  const applications = useMemo(() => {
    const leads = leadsQuery.data?.leads ?? [];
    return leads.filter((lead) => lead.status !== "ENROLLED" && lead.status !== "LOST");
  }, [leadsQuery.data]);
  const selectedLead = useMemo(() => applications.find((lead) => lead.id === selectedLeadId) ?? null, [applications, selectedLeadId]);

  const requiredDocumentsVerified = documentStatuses.photo === "Verified" && documentStatuses.aadhaar === "Verified" && documentStatuses.parentDetails === "Verified";
  const rejectedDocuments = Object.entries(documentStatuses).filter(([, status]) => status === "Rejected").map(([key]) => documentLabels[key as DocumentKey]);
  const pendingDocuments = Object.entries(documentStatuses).filter(([, status]) => status === "Pending").map(([key]) => documentLabels[key as DocumentKey]);
  const totalFee = Number(form.totalFee || 0);
  const amountPaid = Number(form.amountPaid || 0);
  const feesReady = form.paymentStatus === "PAID" || form.paymentStatus === "APPROVED" || (totalFee > 0 && amountPaid >= totalFee);
  const readyForEnrollment = requiredDocumentsVerified && rejectedDocuments.length === 0 && feesReady && admissionStatus === "Ready For Admission";
  const readinessIssues = [
    !requiredDocumentsVerified ? `Documents pending: ${pendingDocuments.join(", ") || "Required documents not verified"}` : "",
    rejectedDocuments.length ? `Rejected documents: ${rejectedDocuments.join(", ")}` : "",
    !feesReady ? "Registration/course fee pending or not approved" : "",
    admissionStatus !== "Ready For Admission" ? "Student status is not Ready For Admission" : "",
  ].filter(Boolean);

  const documentReadyLeads = applications.filter((lead) => lead.notes?.includes("Documents: VERIFIED")).length;
  const feeReadyLeads = applications.filter((lead) => lead.notes?.includes("Fees: PAID") || lead.notes?.includes("Fees: APPROVED")).length;
  const reportCounts = {
    newAdmissions: applications.length,
    pendingDocuments: Math.max(applications.length - documentReadyLeads, 0),
    pendingFees: Math.max(applications.length - feeReadyLeads, 0),
    batchAllocationPending: applications.filter((lead) => lead.notes?.includes("Ready For Admission")).length,
    activationsPending: applications.filter((lead) => lead.status === "COUNSELLING").length,
    activatedStudents: activeBatches.reduce((total, batch) => total + (batch._count?.students ?? 0), 0),
  };

  const saveLeadNoteMutation = useMutation({
    mutationFn: (payload: { lead: LeadApplication; note: string; status: LeadApplication["status"] }) => {
      const existing = payload.lead.notes ? `${payload.lead.notes}\n\n` : "";
      return apiJson<{ lead: LeadApplication }>(`/api/crm/leads/${payload.lead.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: payload.status,
          notes: `${existing}[${new Date().toISOString()}] ${payload.note || "Administrative Officer processed admission."}`,
        }),
      });
    },
    onSuccess: () => {
      setMessage("Admission note saved.");
      setCallNote("");
      void queryClient.invalidateQueries({ queryKey: ["admission-cell", "applications"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not save admission note."),
  });

  const approveMutation = useMutation({
    mutationFn: (payload: ApprovalPayload) =>
      apiJson<{ message?: string }>("/api/academy/admissions/approve", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setMessage(data.message || "Student activated with batch access.");
      resetProcessingState();
      void queryClient.invalidateQueries({ queryKey: ["admission-cell", "batches"] });
      void queryClient.invalidateQueries({ queryKey: ["admission-cell", "applications"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not activate student."),
  });

  function resetProcessingState() {
    setSelectedLeadId("");
    setAdmissionStatus("Received");
    setDocumentStatuses({ photo: "Pending", aadhaar: "Pending", marksheet: "Pending", parentDetails: "Pending", otherFiles: "Pending" });
    setForm({
      batchId: "",
      email: "",
      name: "",
      phone: "",
      rollNumber: "",
      notes: "",
      totalFee: 0,
      amountPaid: 0,
      paymentStatus: "PENDING",
      paymentMethod: "OFFICE_COLLECTION",
      transactionRef: "",
      receiptUploadUrl: "",
    });
  }

  function selectLead(lead: LeadApplication) {
    setSelectedLeadId(lead.id);
    setAdmissionStatus("Received");
    setForm((item) => ({
      ...item,
      leadId: lead.id,
      email: lead.email,
      name: lead.fullName,
      phone: lead.mobile,
      notes: [`Program: ${lead.targetExam}`, `Source: ${lead.source}`, lead.notes ? `Previous notes: ${lead.notes}` : ""].filter(Boolean).join("\n"),
    }));
  }

  function submitActivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!readyForEnrollment) {
      setMessage(`Cannot allocate batch yet. Pending requirements: ${readinessIssues.join("; ")}`);
      return;
    }
    if (!form.batchId) {
      setMessage("Cannot activate student without batch allocation.");
      return;
    }
    approveMutation.mutate({
      ...form,
      paymentStatus: feesReady ? "PAID" : form.paymentStatus,
      notes: [form.notes, `Document status: ${JSON.stringify(documentStatuses)}`].filter(Boolean).join("\n"),
    });
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Administrative Officer</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Simple admission processing desk</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
            Process students only: receive admissions, verify documents, record fees, allocate batches, and activate access.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {workflowCards.map((stage) => {
            const Icon = stage.icon;
            return (
              <a key={stage.id} href={`#${stage.id}`} className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
                  <Icon className="h-6 w-6 text-[var(--navy)]" />
                </div>
                <h2 className="mt-5 text-lg font-black">{stage.title}</h2>
                <p className="mt-2 text-xs leading-5 text-[var(--muted-blue)]">{stage.text}</p>
              </a>
            );
          })}
        </section>

        {message ? <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-4 text-sm font-bold">{message}</div> : null}

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel id="new-admissions" title="New Admissions" eyebrow="BDE handover">
            <div className="grid gap-3">
              {applications.map((lead) => (
                <article key={lead.id} className={`rounded-2xl border p-4 ${selectedLeadId === lead.id ? "border-[var(--gold)] bg-[var(--gold-soft)]" : "border-[var(--border)] bg-white"}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">{admissionStatusForLead(lead)}</p>
                      <h3 className="mt-2 text-xl font-black">{lead.fullName}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">Program: {lead.targetExam}</p>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">Parent: {parentNameFromNotes(lead.notes) || "To be confirmed"}</p>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">Phone: {lead.mobile}</p>
                      <p className="mt-1 text-sm text-[var(--muted-blue)]">Counsellor: {lead.assignee?.name ?? "BDE team"}</p>
                      <p className="mt-1 text-xs text-[var(--muted-blue)]">{lead.email}</p>
                    </div>
                    <button type="button" onClick={() => selectLead(lead)} className="rounded-xl border border-[var(--gold-border)] bg-white px-4 py-2 text-sm font-black">
                      Open
                    </button>
                  </div>
                  {lead.notes ? <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--muted-blue)]">{lead.notes}</p> : null}
                </article>
              ))}
              {!applications.length ? <Empty text="No new admissions right now. Confirmed BDE handovers and website applications will appear here." /> : null}
            </div>
          </Panel>

          <Panel id="document-verification" title="Document Verification" eyebrow="Photo, Aadhaar, marksheet">
            {selectedLead ? (
              <div className="grid gap-4">
                <StudentMiniCard lead={selectedLead} />
                {Object.entries(documentLabels).map(([key, label]) => (
                  <label key={key} className="grid gap-2 text-sm font-bold">
                    {label}
                    <select
                      value={documentStatuses[key as DocumentKey]}
                      onChange={(event) => setDocumentStatuses((state) => ({ ...state, [key]: event.target.value as DocumentStatus }))}
                      className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Verified">Verified</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </label>
                ))}
                <label className="grid gap-2 text-sm font-bold">
                  Verification note / resubmission request
                  <textarea
                    value={callNote}
                    onChange={(event) => setCallNote(event.target.value)}
                    className="min-h-24 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                    placeholder="Call notes, missing document details, rejection reason, parent details..."
                  />
                </label>
                <button
                  type="button"
                  onClick={() => saveLeadNoteMutation.mutate({
                    lead: selectedLead,
                    status: rejectedDocuments.length ? "CONTACTED" : requiredDocumentsVerified ? "COUNSELLING" : "CONTACTED",
                    note: [
                      `Admission Status: ${admissionStatus}`,
                      `Documents: ${requiredDocumentsVerified && !rejectedDocuments.length ? "VERIFIED" : rejectedDocuments.length ? "REJECTED" : "PENDING"}`,
                      `Document Details: ${JSON.stringify(documentStatuses)}`,
                      callNote || "Document verification updated."
                    ].join("\n"),
                  })}
                  className="rounded-xl border border-[var(--gold-border)] bg-white px-4 py-3 text-sm font-black"
                >
                  Save Verification Note
                </button>
              </div>
            ) : (
              <Empty text="Open a new admission first, then verify documents here." />
            )}
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel id="fees-enrollment" title="Fees & Enrollment" eyebrow="Payment readiness">
            {selectedLead ? (
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <NumberField label="Registration + course fee" value={form.totalFee ?? 0} onChange={(value) => setForm((item) => ({ ...item, totalFee: value }))} />
                  <NumberField label="Amount paid" value={form.amountPaid ?? 0} onChange={(value) => setForm((item) => ({ ...item, amountPaid: value }))} />
                  <SelectField label="Payment status" value={form.paymentStatus ?? "PENDING"} onChange={(value) => setForm((item) => ({ ...item, paymentStatus: value }))}>
                    <option value="PENDING">Pending</option>
                    <option value="LINK_SENT">Razorpay link sent</option>
                    <option value="PARTIAL">Partial paid</option>
                    <option value="PAID">Paid</option>
                    <option value="APPROVED">Approved by management</option>
                  </SelectField>
                  <SelectField label="Payment method" value={form.paymentMethod ?? "OFFICE_COLLECTION"} onChange={(value) => setForm((item) => ({ ...item, paymentMethod: value }))}>
                    <option value="OFFICE_COLLECTION">Office collection</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="RAZORPAY_LINK">Razorpay link</option>
                  </SelectField>
                  <Field label="Transaction / receipt ref" value={form.transactionRef ?? ""} onChange={(value) => setForm((item) => ({ ...item, transactionRef: value }))} />
                  <Field label="Receipt upload URL" value={form.receiptUploadUrl ?? ""} onChange={(value) => setForm((item) => ({ ...item, receiptUploadUrl: value }))} />
                </div>
                <SelectField label="Enrollment status" value={admissionStatus} onChange={setAdmissionStatus}>
                  <option value="Received">Received</option>
                  <option value="Documents Pending">Documents Pending</option>
                  <option value="Verification Pending">Verification Pending</option>
                  <option value="Ready For Admission">Ready For Admission</option>
                </SelectField>
                <button
                  type="button"
                  onClick={() => saveLeadNoteMutation.mutate({
                    lead: selectedLead,
                    status: feesReady ? "COUNSELLING" : "CONTACTED",
                    note: [
                      `Admission Status: ${admissionStatus}`,
                      `Fees: ${feesReady ? form.paymentStatus === "APPROVED" ? "APPROVED" : "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING"}`,
                      `Fee Details: total=${totalFee}, paid=${amountPaid}, method=${form.paymentMethod}, ref=${form.transactionRef || "NA"}`,
                      callNote || "Fee and enrollment status updated."
                    ].join("\n"),
                  })}
                  className="rounded-xl border border-[var(--gold-border)] bg-white px-4 py-3 text-sm font-black"
                >
                  Save Fee Status
                </button>
              </div>
            ) : (
              <Empty text="Open a new admission first, then record registration fee, course fee, installments or approval here." />
            )}
          </Panel>

          <Panel id="batch-allocation" title="Batch Allocation" eyebrow="Readiness gated">
            {selectedLead ? (
              <form onSubmit={submitActivation} className="grid gap-4">
                <ReadinessBox ready={readyForEnrollment} issues={readinessIssues} />
                <Field label="Student login email" value={form.email} onChange={(value) => setForm((item) => ({ ...item, email: value }))} required />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Student name" value={form.name ?? ""} onChange={(value) => setForm((item) => ({ ...item, name: value }))} />
                  <Field label="Phone" value={form.phone ?? ""} onChange={(value) => setForm((item) => ({ ...item, phone: value }))} />
                  <Field label="Roll number" value={form.rollNumber ?? ""} onChange={(value) => setForm((item) => ({ ...item, rollNumber: value }))} />
                  <SelectField label="Assign batch" value={form.batchId} onChange={(value) => setForm((item) => ({ ...item, batchId: value }))} disabled={!readyForEnrollment} required>
                    <option value="">Choose batch</option>
                    {activeBatches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} {batch.programSlug ? `- ${batch.programSlug}` : ""}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <label className="grid gap-2 text-sm font-bold">
                  Admission note
                  <textarea
                    className="min-h-28 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]"
                    value={form.notes}
                    onChange={(event) => setForm((item) => ({ ...item, notes: event.target.value }))}
                    placeholder="Parent discussion, fee confirmation, document notes..."
                  />
                </label>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gold-gradient)] px-5 py-3 font-black text-[var(--navy)] shadow-lg disabled:cursor-not-allowed disabled:opacity-60" disabled={!readyForEnrollment || !form.batchId || approveMutation.isPending} type="submit">
                  <CheckCircle2 className="h-5 w-5" />
                  Activate Student
                </button>
              </form>
            ) : (
              <Empty text="Open a new admission first. Batch allocation is allowed only after documents and fees are ready." />
            )}
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel id="student-activation" title="Student Activation" eyebrow="Final approval">
            <div className="grid gap-3">
              <StatusLine label="Document verification" ok={requiredDocumentsVerified && rejectedDocuments.length === 0} />
              <StatusLine label="Fees & enrollment" ok={feesReady} />
              <StatusLine label="Batch selected" ok={Boolean(form.batchId)} />
              <StatusLine label="Student status" ok={admissionStatus === "Ready For Admission"} />
            </div>
          </Panel>

          <Panel id="admission-reports" title="Admission Reports" eyebrow="Real data only">
            <div className="grid gap-4 md:grid-cols-2">
              <Metric icon={Users} label="New Admissions" value={reportCounts.newAdmissions} />
              <Metric icon={FileArchive} label="Pending Documents" value={reportCounts.pendingDocuments} />
              <Metric icon={BadgeIndianRupee} label="Pending Fees" value={reportCounts.pendingFees} />
              <Metric icon={GraduationCap} label="Batch Allocation Pending" value={reportCounts.batchAllocationPending} />
              <Metric icon={UserCheck} label="Activations Pending" value={reportCounts.activationsPending} />
              <Metric icon={ShieldCheck} label="Activated Students" value={reportCounts.activatedStudents} />
            </div>
          </Panel>
        </section>

        <Panel id="admission-boundary" title="Officer Scope" eyebrow="Role boundary">
          <Empty text="Administrative Officer processes students only. Programs, batches, teachers, timetables and academic content remain inside Director and Academic Head modules." />
        </Panel>
      </section>
    </main>
  );
}

function admissionStatusForLead(lead: LeadApplication) {
  if (lead.status === "NEW") return "Received";
  if (lead.status === "CONTACTED") return "Documents Pending";
  if (lead.status === "COUNSELLING") return "Verification Pending";
  return "Ready For Admission";
}

function parentNameFromNotes(notes?: string | null) {
  const match = notes?.match(/Parent(?: Name)?:\s*([^\n]+)/i);
  return match?.[1]?.trim() ?? "";
}

function StudentMiniCard({ lead }: { lead: LeadApplication }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <h3 className="font-black">{lead.fullName}</h3>
      <p className="mt-1 text-sm text-[var(--muted-blue)]">{lead.targetExam} / {lead.mobile}</p>
    </div>
  );
}

function ReadinessBox({ ready, issues }: { ready: boolean; issues: string[] }) {
  return (
    <div className={`rounded-2xl border p-4 text-sm leading-7 ${ready ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-[var(--gold-border)] bg-[var(--gold-soft)] text-[var(--navy)]"}`}>
      <p className="font-black">{ready ? "Ready for batch allocation" : "Cannot allocate batch yet"}</p>
      {!ready ? <ul className="mt-2 list-disc pl-5">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
    </div>
  );
}

function StatusLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-4 text-sm font-bold">
      <span>{label}</span>
      <span className={ok ? "text-emerald-700" : "text-amber-700"}>{ok ? "Ready" : "Pending"}</span>
    </div>
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
      <input className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]" value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input type="number" min="0" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)]" value={value} onChange={(event) => onChange(Number(event.target.value || 0))} />
    </label>
  );
}

function SelectField({ label, value, onChange, children, disabled, required }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; disabled?: boolean; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <select className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--navy)] outline-none focus:border-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={required}>
        {children}
      </select>
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm leading-7 text-[var(--muted-blue)]">{text}</div>;
}
