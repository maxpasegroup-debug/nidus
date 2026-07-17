"use client";

import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  Check,
  CheckCircle2,
  FileArchive,
  FileText,
  FileUp,
  GraduationCap,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdmissionAutomationPanel, AdmissionDocumentsPanel, AdmissionJourneyBanner, AdmissionRoleActions } from "@/components/admission/admission-journey-workspace";
import { AiOperatingLayer } from "@/components/ai/ai-operating-layer";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { ExecutiveIntelligenceSystem } from "@/components/reporting/executive-intelligence-system";
import { createDocument } from "@/services/media";

type OfficerTab = "TODAY" | "APPLICATIONS" | "DOCUMENTS" | "FEES" | "BATCH" | "ACTIVATION" | "STUDENTS" | "REPORTS";
type DocumentKey = "photo" | "aadhaar" | "marksheet" | "parentDetails" | "otherFiles";
type DocumentStatus = "Pending" | "Verified" | "Rejected";
type DocumentUploads = Record<DocumentKey, string>;

type StudentAccount = { id: string; name: string; email: string; mobile: string; role: string };
type BatchStudent = { id: string; status: string; student?: StudentAccount | null; user?: StudentAccount | null };
type BatchOption = {
  id: string;
  name: string;
  batchType?: string | null;
  status?: string | null;
  programSlug?: string | null;
  course?: { title?: string | null } | null;
  students?: BatchStudent[];
  _count?: { students?: number; teachers?: number };
};
type BatchResponse = BatchOption[] | { batches: BatchOption[] };

type LeadApplication = {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  targetExam: string;
  source: string;
  status: "NEW" | "CONTACTED" | "COUNSELLING" | "ENROLLED" | "LOST";
  notes?: string | null;
  assignee?: { name?: string | null; email?: string | null } | null;
  createdAt: string;
};

type ApprovalPayload = {
  batchId: string;
  batchIds: string[];
  email: string;
  name: string;
  phone: string;
  rollNumber: string;
  notes: string;
  leadId?: string;
  totalFee: number;
  amountPaid: number;
  paymentStatus: string;
  paymentMethod: string;
  transactionRef: string;
  receiptUploadUrl: string;
};

type ApprovalResponse = {
  message?: string;
  payment?: { id?: string; receiptNumber?: string | null; amount?: number; currency?: string } | null;
  enrollment?: { id?: string };
  student?: { id?: string; name?: string | null; email?: string | null; mobile?: string | null } | null;
  admission?: { id?: string; status?: string; paymentStatus?: string; dueAmount?: number | null } | null;
};

type ApplicationDraft = {
  fullName: string;
  mobile: string;
  email: string;
  targetExam: string;
  source: string;
  status: LeadApplication["status"];
  notes: string;
};

const tabs: Array<{ key: OfficerTab; label: string }> = [
  { key: "TODAY", label: "Today" },
  { key: "APPLICATIONS", label: "Applications" },
  { key: "DOCUMENTS", label: "Documents" },
  { key: "FEES", label: "Payment" },
  { key: "BATCH", label: "Batch" },
  { key: "ACTIVATION", label: "Activate" },
  { key: "STUDENTS", label: "Active Students" },
  { key: "REPORTS", label: "Reports" },
];

const hashTabs: Record<string, OfficerTab> = {
  today: "TODAY",
  applications: "APPLICATIONS",
  documents: "DOCUMENTS",
  fees: "FEES",
  batch: "BATCH",
  activation: "ACTIVATION",
  students: "STUDENTS",
  reports: "REPORTS",
};

const documentLabels: Record<DocumentKey, string> = {
  photo: "Photo",
  aadhaar: "Aadhaar / identity",
  marksheet: "Marksheet / qualification",
  parentDetails: "Parent details",
  otherFiles: "Other supporting files",
};

const blankDocuments = (): Record<DocumentKey, DocumentStatus> => ({ photo: "Pending", aadhaar: "Pending", marksheet: "Pending", parentDetails: "Pending", otherFiles: "Pending" });
const blankDocumentUploads = (): DocumentUploads => ({ photo: "", aadhaar: "", marksheet: "", parentDetails: "", otherFiles: "" });
const blankForm = (): ApprovalPayload => ({
  batchId: "", batchIds: [], email: "", name: "", phone: "", rollNumber: "", notes: "", totalFee: 0, amountPaid: 0,
  paymentStatus: "PENDING", paymentMethod: "OFFICE_COLLECTION", transactionRef: "", receiptUploadUrl: "",
});

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function normalizeBatches(response?: BatchResponse) {
  if (!response) return [];
  return Array.isArray(response) ? response : response.batches ?? [];
}

function noteHas(lead: LeadApplication, text: string) {
  return String(lead.notes || "").toUpperCase().includes(text.toUpperCase());
}

function leadStage(lead: LeadApplication) {
  if (lead.status === "ENROLLED") return "Activated";
  if (noteHas(lead, "AO_QUEUE: YES") && noteHas(lead, "READY_FOR_ADMISSION")) return "Ready for AO";
  if (noteHas(lead, "FEES: PAID") || noteHas(lead, "FEES: APPROVED")) return "Ready for batch";
  if (noteHas(lead, "DOCUMENTS: VERIFIED")) return "Fee confirmation";
  if (noteHas(lead, "APPLICATION_STATUS: SUBMITTED")) return "Submitted";
  if (lead.status === "COUNSELLING") return "Verification";
  return "New application";
}

function paymentLabel(status: string, totalFee: number, amountPaid: number) {
  if (status === "APPROVED") return "Management approved";
  if (totalFee > 0 && amountPaid >= totalFee) return "Paid in full";
  if (amountPaid > 0) return "Partial payment";
  return "Payment pending";
}

function parseDocumentDetails(notes?: string | null) {
  const line = notes?.split("\n").reverse().find((item) => item.startsWith("Document Details:"));
  if (!line) return blankDocuments();
  try {
    const parsed = JSON.parse(line.replace("Document Details:", "").trim()) as Partial<Record<DocumentKey, DocumentStatus>>;
    return { ...blankDocuments(), ...parsed };
  } catch {
    return blankDocuments();
  }
}

function parseDocumentUploads(notes?: string | null) {
  const line = notes?.split("\n").reverse().find((item) => item.startsWith("Document Uploads:"));
  if (!line) return blankDocumentUploads();
  try {
    const parsed = JSON.parse(line.replace("Document Uploads:", "").trim()) as Partial<DocumentUploads>;
    return { ...blankDocumentUploads(), ...parsed };
  } catch {
    return blankDocumentUploads();
  }
}

function draftFromLead(lead: LeadApplication): ApplicationDraft {
  return {
    fullName: lead.fullName,
    mobile: lead.mobile,
    email: lead.email,
    targetExam: lead.targetExam,
    source: lead.source,
    status: lead.status,
    notes: lead.notes ?? "",
  };
}

export function AdministrativeOfficerDashboard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<OfficerTab>("TODAY");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentBatchId, setStudentBatchId] = useState("");
  const [admissionStatus, setAdmissionStatus] = useState("Received");
  const [documentStatuses, setDocumentStatuses] = useState<Record<DocumentKey, DocumentStatus>>(blankDocuments());
  const [documentUploads, setDocumentUploads] = useState<DocumentUploads>(blankDocumentUploads());
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft | null>(null);
  const [uploadingDocumentKey, setUploadingDocumentKey] = useState<DocumentKey | null>(null);
  const [note, setNote] = useState("");
  const [form, setForm] = useState<ApprovalPayload>(blankForm());
  const [message, setMessage] = useState("");
  const [activationResult, setActivationResult] = useState<ApprovalResponse | null>(null);

  useEffect(() => {
    const syncHash = () => {
      const key = window.location.hash.replace("#", "").toLowerCase();
      if (hashTabs[key]) setTab(hashTabs[key]);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function openTab(next: OfficerTab) {
    setTab(next);
    const hash = Object.entries(hashTabs).find(([, value]) => value === next)?.[0];
    if (hash) window.history.replaceState(null, "", `${window.location.pathname}#${hash}`);
  }

  const batchesQuery = useQuery({ queryKey: ["admission-cell", "batches"], queryFn: () => apiJson<BatchResponse>("/api/academy/batches") });
  const leadsQuery = useQuery({ queryKey: ["admission-cell", "applications"], queryFn: () => apiJson<{ leads: LeadApplication[] }>("/api/crm/leads") });
  const batches = useMemo(() => normalizeBatches(batchesQuery.data).filter((item) => item.status !== "ARCHIVED"), [batchesQuery.data]);
  const applications = useMemo(() => (leadsQuery.data?.leads ?? []).filter((lead) => !["ENROLLED", "LOST"].includes(lead.status)), [leadsQuery.data]);
  const selectedLead = applications.find((lead) => lead.id === selectedLeadId) ?? null;
  const selectedBatchIds = form.batchIds.length ? form.batchIds : form.batchId ? [form.batchId] : [];
  const selectedBatches = batches.filter((batch) => selectedBatchIds.includes(batch.id));
  const visibleApplications = applications
    .filter((lead) => [lead.fullName, lead.mobile, lead.email, lead.targetExam].join(" ").toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => Number(noteHas(b, "AO_QUEUE: YES")) - Number(noteHas(a, "AO_QUEUE: YES")) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const requiredDocumentsVerified = documentStatuses.photo === "Verified" && documentStatuses.aadhaar === "Verified" && documentStatuses.parentDetails === "Verified";
  const rejectedDocuments = Object.entries(documentStatuses).filter(([, value]) => value === "Rejected").map(([key]) => documentLabels[key as DocumentKey]);
  const totalFee = Number(form.totalFee || 0);
  const amountPaid = Number(form.amountPaid || 0);
  const identityReady = Boolean(form.name.trim()) && Boolean(form.phone.trim() || form.email.trim());
  const feesReady = form.paymentStatus === "APPROVED" || (form.paymentStatus === "PAID" && totalFee > 0 && amountPaid >= totalFee);
  const readyForEnrollment = Boolean(selectedLead) && identityReady && requiredDocumentsVerified && !rejectedDocuments.length && feesReady && selectedBatchIds.length > 0 && admissionStatus === "Ready For Admission";
  const readiness = [
    { label: "Application selected", ready: Boolean(selectedLead) },
    { label: "Student identity ready", ready: identityReady },
    { label: "Required documents verified", ready: requiredDocumentsVerified && !rejectedDocuments.length },
    { label: "Required fee confirmed", ready: feesReady },
    { label: "Batch selected", ready: selectedBatchIds.length > 0 },
    { label: "Ready for admission", ready: admissionStatus === "Ready For Admission" },
  ];

  const documentPending = applications.filter((lead) => !noteHas(lead, "DOCUMENTS: VERIFIED")).length;
  const feePending = applications.filter((lead) => !noteHas(lead, "FEES: PAID") && !noteHas(lead, "FEES: APPROVED")).length;
  const batchPending = applications.filter((lead) => noteHas(lead, "DOCUMENTS: VERIFIED") && (noteHas(lead, "FEES: PAID") || noteHas(lead, "FEES: APPROVED"))).length;
  const aoReady = applications.filter((lead) => noteHas(lead, "AO_QUEUE: YES")).length;
  const allStudentRows = useMemo(() => batches.flatMap((batch) => (batch.students ?? []).map((entry) => ({ batch, entry, student: entry.student ?? entry.user ?? null }))).filter((row) => row.student), [batches]);
  const uniqueStudents = new Set(allStudentRows.map((row) => row.student?.id)).size;
  const visibleStudentRows = allStudentRows.filter((row) => (!studentBatchId || row.batch.id === studentBatchId) && [row.student?.name, row.student?.email, row.student?.mobile, row.batch.name].join(" ").toLowerCase().includes(studentSearch.trim().toLowerCase()));

  const saveLeadMutation = useMutation({
    mutationFn: ({ lead, text, status }: { lead: LeadApplication; text: string; status: LeadApplication["status"] }) => apiJson(`/api/crm/leads/${lead.id}`, { method: "PUT", body: JSON.stringify({ status, notes: `${lead.notes ? `${lead.notes}\n\n` : ""}[${new Date().toISOString()}] ${text}` }) }),
    onSuccess: () => { setMessage("Applicant record updated."); setNote(""); void queryClient.invalidateQueries({ queryKey: ["admission-cell", "applications"] }); },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not update applicant."),
  });

  const activateMutation = useMutation({
    mutationFn: (payload: ApprovalPayload) => apiJson<ApprovalResponse>("/api/academy/admissions/approve", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (result) => {
      setActivationResult(result);
      setMessage(result.message || "Student account activated.");
      void queryClient.invalidateQueries({ queryKey: ["admission-cell"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not activate student."),
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ lead, draft, documents, uploads }: { lead: LeadApplication; draft: ApplicationDraft; documents: Record<DocumentKey, DocumentStatus>; uploads: DocumentUploads }) => {
      const previousNotes = draft.notes.trim();
      const officeEntry = [
        `[${new Date().toISOString()}] AO application file updated`,
        `APPLICATION_STATUS: ${draft.status === "NEW" ? "SUBMITTED" : draft.status}`,
        `Document Details: ${JSON.stringify(documents)}`,
        `Document Uploads: ${JSON.stringify(uploads)}`,
        note ? `Office Note: ${note}` : "",
      ].filter(Boolean).join("\n");
      return apiJson(`/api/crm/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: draft.fullName,
          mobile: draft.mobile,
          email: draft.email.trim() || undefined,
          targetExam: draft.targetExam,
          source: draft.source,
          status: draft.status,
          notes: `${previousNotes ? `${previousNotes}\n\n` : ""}${officeEntry}`,
        }),
      });
    },
    onSuccess: () => {
      setMessage("Application file saved.");
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["admission-cell", "applications"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not save application."),
  });

  const archiveApplicationMutation = useMutation({
    mutationFn: (lead: LeadApplication) => apiJson(`/api/crm/leads/${lead.id}`, { method: "DELETE" }),
    onSuccess: () => {
      setMessage("Application archived.");
      setSelectedLeadId("");
      setApplicationDraft(null);
      setDocumentStatuses(blankDocuments());
      setDocumentUploads(blankDocumentUploads());
      void queryClient.invalidateQueries({ queryKey: ["admission-cell", "applications"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not archive application."),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: ({ lead, key, file }: { lead: LeadApplication; key: DocumentKey; file: File }) => {
      setUploadingDocumentKey(key);
      return createDocument({
        title: `${lead.fullName} - ${documentLabels[key]}`,
        category: "AO_APPLICATION_DOCUMENT",
        description: `Application ID: ${lead.id}. Program: ${lead.targetExam}.`,
        file,
      });
    },
    onSuccess: (document, variables) => {
      setDocumentUploads((current) => ({ ...current, [variables.key]: document.fileUrl }));
      setMessage(`${documentLabels[variables.key]} uploaded and linked to application.`);
      setUploadingDocumentKey(null);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Could not upload document.");
      setUploadingDocumentKey(null);
    },
  });

  function openLead(lead: LeadApplication) {
    setSelectedLeadId(lead.id);
    setApplicationDraft(draftFromLead(lead));
    setDocumentStatuses(parseDocumentDetails(lead.notes));
    setDocumentUploads(parseDocumentUploads(lead.notes));
    setAdmissionStatus(noteHas(lead, "FEES: PAID") || noteHas(lead, "FEES: APPROVED") ? "Ready For Admission" : "Received");
    setForm({ ...blankForm(), leadId: lead.id, email: lead.email, name: lead.fullName, phone: lead.mobile, notes: [`Program: ${lead.targetExam}`, `Source: ${lead.source}`].join("\n"), paymentStatus: noteHas(lead, "FEES: PAID") ? "PAID" : noteHas(lead, "FEES: APPROVED") ? "APPROVED" : "PENDING" });
    setMessage("");
    setActivationResult(null);
    openTab("APPLICATIONS");
  }

  function saveApplication() {
    if (!selectedLead || !applicationDraft) return;
    updateApplicationMutation.mutate({ lead: selectedLead, draft: applicationDraft, documents: documentStatuses, uploads: documentUploads });
  }

  function archiveApplication() {
    if (!selectedLead) return;
    archiveApplicationMutation.mutate(selectedLead);
  }

  function uploadApplicationDocument(key: DocumentKey, file: File) {
    if (!selectedLead) return;
    uploadDocumentMutation.mutate({ lead: selectedLead, key, file });
  }

  function saveDocuments() {
    if (!selectedLead) return;
    const verified = requiredDocumentsVerified && !rejectedDocuments.length;
    saveLeadMutation.mutate({ lead: selectedLead, status: verified ? "COUNSELLING" : "CONTACTED", text: [`Documents: ${verified ? "VERIFIED" : rejectedDocuments.length ? "REJECTED" : "PENDING"}`, `Document Details: ${JSON.stringify(documentStatuses)}`, `Document Uploads: ${JSON.stringify(documentUploads)}`, note || "Document verification updated."].join("\n") });
  }

  function saveFees() {
    if (!selectedLead) return;
    saveLeadMutation.mutate({ lead: selectedLead, status: feesReady ? "COUNSELLING" : "CONTACTED", text: [`Fees: ${feesReady ? form.paymentStatus === "APPROVED" ? "APPROVED" : "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING"}`, `Fee Details: total=${totalFee}, paid=${amountPaid}, method=${form.paymentMethod}, ref=${form.transactionRef || "NA"}`, note || "Fee status updated."].join("\n") });
  }

  function submitActivation(event: FormEvent) {
    event.preventDefault();
    if (!readyForEnrollment || !selectedBatchIds.length) { setMessage("Complete every activation check before activating the learner account."); return; }
    activateMutation.mutate({ ...form, batchId: selectedBatchIds[0], batchIds: selectedBatchIds, paymentStatus: form.paymentStatus === "APPROVED" ? "APPROVED" : "PAID", notes: [form.notes, `Document status: ${JSON.stringify(documentStatuses)}`, selectedBatches.length ? `Activated batches: ${selectedBatches.map((batch) => batch.name).join(", ")}` : ""].filter(Boolean).join("\n") });
  }

  return (
    <WorkspaceDashboard
      roleTitle="Admission Cell Workspace"
      greeting="Today's Leads"
      subtitle="Applications, follow-ups, documents and admissions activation in one clean office desk."
      focus={[
        { label: "Today's Leads", title: applications.length, detail: selectedLead ? "Application is open. Save details before payment or activation." : "Open Applications and choose one applicant.", href: "/dashboard/admission-cell#applications", icon: FileText, tone: applications.length ? "warning" : "success" },
        { label: "Follow Ups", title: documentPending, detail: "Application documents pending verification.", href: "/dashboard/admission-cell#documents", icon: FileArchive, tone: documentPending ? "warning" : "success" },
        { label: "Admissions", title: aoReady, detail: "Applicants ready for activation handover.", href: "/dashboard/admission-cell#activation", icon: GraduationCap, tone: aoReady ? "info" : "default" },
      ]}
      actions={[
        { label: "Leads", href: "/crm/leads", icon: Users },
        { label: "Applications", href: "/dashboard/admission-cell#applications", icon: FileText },
        { label: "Counselling", href: "/crm/counselling", icon: Search },
        { label: "Documents", href: "/dashboard/admission-cell#documents", icon: FileArchive },
        { label: "Fees", href: "/dashboard/admission-cell#fees", icon: BadgeIndianRupee },
        { label: "Admissions", href: "/crm/admissions", icon: GraduationCap },
      ]}
      metrics={[
        { label: "Applications", value: applications.length },
        { label: "Pending Documents", value: documentPending, tone: documentPending ? "warning" : "success" },
        { label: "Fees Pending", value: feePending, tone: feePending ? "warning" : "success" },
        { label: "Active Students", value: uniqueStudents },
      ]}
      activity={visibleApplications.slice(0, 5).map((lead) => ({ title: lead.fullName, detail: `${lead.mobile} / ${lead.targetExam}`, href: "/dashboard/admission-cell#applications", meta: leadStage(lead) }))}
      upcoming={[
        { title: "Pending documents", detail: `${documentPending} applicant file(s) need document verification.`, href: "/dashboard/admission-cell#documents", meta: "Docs" },
        { title: "Pending fee confirmation", detail: `${feePending} applicant file(s) need payment update.`, href: "/dashboard/admission-cell#fees", meta: "Fees" },
        { title: "Ready for activation", detail: `${aoReady} applicant file(s) can move to admission activation.`, href: "/dashboard/admission-cell#activation", meta: "Admission" },
      ]}
    >

      {message ? <p className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold">{message}</p> : null}

      <AdmissionJourneyBanner
        role="ADMISSION_CELL"
        metrics={[
          { label: "Today's Leads", value: applications.length },
          { label: "Pending Documents", value: documentPending, tone: documentPending ? "warning" : "success" },
          { label: "Pending Approvals", value: aoReady, tone: aoReady ? "info" : "default" },
          { label: "Completed Admissions", value: uniqueStudents },
        ]}
      />
      <AdmissionRoleActions role="ADMISSION_CELL" />
      <section className="grid gap-5 xl:grid-cols-2">
        <AdmissionDocumentsPanel />
        <AdmissionAutomationPanel />
      </section>
      <AiOperatingLayer
        role="ADMISSION_CELL"
        compact
        items={[
          { title: documentPending ? `${documentPending} document file(s) pending` : "Documents are clear", detail: "Lead summary stays inside existing verification workflow.", href: "/dashboard/admission-cell#documents", icon: FileArchive, tone: documentPending ? "warning" : "success" },
          { title: feePending ? `${feePending} fee follow-up(s)` : "Fee follow-ups are calm", detail: "Suggested follow-up uses the same fee status shown here.", href: "/dashboard/admission-cell#fees", icon: BadgeIndianRupee, tone: feePending ? "warning" : "success" },
          { title: `${aoReady} activation candidate(s)`, detail: "Admission probability is surfaced through AO-ready handover signals.", href: "/dashboard/admission-cell#activation", icon: GraduationCap, tone: aoReady ? "info" : "default" },
        ]}
      />

      <ExecutiveIntelligenceSystem
        role="ADMISSION_CELL"
        title="Admission Intelligence"
        description="Lead funnel, conversions, pending admissions, counselling outcomes and revenue forecast are connected to the existing admission journey."
        metrics={[
          { label: "Lead Funnel", value: applications.length, note: "Open admission applications", tone: "info" },
          { label: "Pending Documents", value: documentPending, note: "Files waiting for verification", tone: documentPending ? "warning" : "success" },
          { label: "Pending Admissions", value: aoReady, note: "AO-ready handovers", tone: aoReady ? "warning" : "success" },
          { label: "Batch Allocation", value: batchPending, note: "Ready for batch assignment", tone: batchPending ? "warning" : "success" },
        ]}
        insights={[
          { title: "What happened?", detail: `${applications.length} application(s) are currently moving through documents, fees, batch and activation.`, tone: "info" },
          { title: "What needs attention?", detail: `${documentPending} document, ${feePending} payment and ${batchPending} batch allocation item(s) need follow-up.`, href: "/dashboard/admission-cell#reports", tone: documentPending || feePending || batchPending ? "warning" : "success" },
          { title: "What should I do next?", detail: "Continue from the existing application, document, payment, batch and activation tabs below.", href: "/dashboard/admission-cell#applications", tone: "info" },
        ]}
      />

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white p-2 shadow-sm" aria-label="Admission workflow">
        {tabs.map((item) => <button key={item.key} type="button" onClick={() => openTab(item.key)} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-black ${tab === item.key ? "bg-slate-950 text-white" : "hover:bg-[var(--page-bg)]"}`}>{item.label}</button>)}
      </nav>

      {tab === "TODAY" ? <TodayView applications={applications} documentPending={documentPending} feePending={feePending} batchPending={batchPending} aoReady={aoReady} onOpenApplications={() => openTab("APPLICATIONS")} /> : null}

      {tab === "APPLICATIONS" ? (
        <ApplicationWorkspace
          applicationDraft={applicationDraft}
          archiveApplication={archiveApplication}
          archivePending={archiveApplicationMutation.isPending}
          documentStatuses={documentStatuses}
          documentUploads={documentUploads}
          note={note}
          onOpenLead={openLead}
          saveApplication={saveApplication}
          savePending={updateApplicationMutation.isPending}
          search={search}
          selectedLead={selectedLead}
          setApplicationDraft={setApplicationDraft}
          setDocumentStatuses={setDocumentStatuses}
          setDocumentUploads={setDocumentUploads}
          setNote={setNote}
          setSearch={setSearch}
          uploadApplicationDocument={uploadApplicationDocument}
          uploadingDocumentKey={uploadingDocumentKey}
          visibleApplications={visibleApplications}
        />
      ) : null}

      {tab === "DOCUMENTS" ? (
        <ApplicantPanel lead={selectedLead} title="Verify required documents" onChoose={() => openTab("APPLICATIONS")}>
          <div className="grid gap-3 sm:grid-cols-2">{Object.entries(documentLabels).map(([key, label]) => <label key={key} className="grid gap-2 text-sm font-black">{label}<select value={documentStatuses[key as DocumentKey]} onChange={(event) => setDocumentStatuses((current) => ({ ...current, [key]: event.target.value as DocumentStatus }))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3"><option>Pending</option><option>Verified</option><option>Rejected</option></select></label>)}</div>
          <TextArea label="Verification note or replacement request" value={note} onChange={setNote} />
          <button type="button" onClick={saveDocuments} disabled={saveLeadMutation.isPending} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">Save Document Verification</button>
        </ApplicantPanel>
      ) : null}

      {tab === "FEES" ? (
        <ApplicantPanel lead={selectedLead} title="Record admission fee" onChoose={() => openTab("APPLICATIONS")}>
          <div className="grid gap-3 sm:grid-cols-2"><NumberField label="Total fee" value={form.totalFee} onChange={(value) => setForm((item) => ({ ...item, totalFee: value }))} /><NumberField label="Amount paid" value={form.amountPaid} onChange={(value) => setForm((item) => ({ ...item, amountPaid: value }))} /><SelectField label="Payment status" value={form.paymentStatus} onChange={(value) => setForm((item) => ({ ...item, paymentStatus: value }))}><option value="PENDING">Pending</option><option value="PARTIAL">Partially paid</option><option value="PAID">Paid</option><option value="APPROVED">Approved by management</option></SelectField><SelectField label="Payment method" value={form.paymentMethod} onChange={(value) => setForm((item) => ({ ...item, paymentMethod: value }))}><option value="OFFICE_COLLECTION">Office collection</option><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CHEQUE">Cheque</option></SelectField><Field label="Transaction reference" value={form.transactionRef} onChange={(value) => setForm((item) => ({ ...item, transactionRef: value }))} /><Field label="Existing receipt upload URL (optional)" value={form.receiptUploadUrl} onChange={(value) => setForm((item) => ({ ...item, receiptUploadUrl: value }))} /></div>
          <div className={`rounded-xl border p-4 text-sm ${feesReady ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <strong className="block">{paymentLabel(form.paymentStatus, totalFee, amountPaid)}</strong>
            <span className="mt-1 block">Total fee: Rs {totalFee.toLocaleString("en-IN")} / Paid: Rs {amountPaid.toLocaleString("en-IN")} / Due: Rs {Math.max(totalFee - amountPaid, 0).toLocaleString("en-IN")}</span>
            {!feesReady ? <span className="mt-2 block font-bold">Activation unlocks only after full payment or management approval.</span> : null}
          </div>
          <TextArea label="Payment note" value={note} onChange={setNote} />
          <button type="button" onClick={saveFees} disabled={saveLeadMutation.isPending} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">Save Fee Confirmation</button>
        </ApplicantPanel>
      ) : null}

      {tab === "BATCH" ? (
        <ApplicantPanel lead={selectedLead} title="Allocate an active batch" onChoose={() => openTab("APPLICATIONS")}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{batches.filter((item) => item.status === "ACTIVE").map((batch) => {
            const checked = selectedBatchIds.includes(batch.id);
            return <button key={batch.id} type="button" onClick={() => setForm((item) => {
              const nextBatchIds = checked ? item.batchIds.filter((id) => id !== batch.id) : [...item.batchIds, batch.id];
              return { ...item, batchId: nextBatchIds[0] || "", batchIds: nextBatchIds };
            })} className={`rounded-xl border p-4 text-left ${checked ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)]"}`}><span className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{batch.course?.title || batch.programSlug}</span><strong className="mt-2 block">{batch.name}</strong><span className="mt-3 block text-xs opacity-75">{batch.batchType || "Mode pending"} / {batch._count?.students ?? batch.students?.length ?? 0} students / {batch._count?.teachers ?? 0} teachers</span><span className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black">{checked ? "Selected" : "Tap to select"}</span></button>;
          })}</div>
          {selectedBatches.length ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><strong className="block">Selected batches: {selectedBatches.map((batch) => batch.name).join(", ")}</strong><span className="mt-1 block text-sm">{selectedBatches.length} batch(es) will be activated for this learner. Only students enrolled in these batches will receive LMS content.</span></div> : null}
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Student login email" value={form.email} onChange={(value) => setForm((item) => ({ ...item, email: value }))} /><Field label="Student name" value={form.name} onChange={(value) => setForm((item) => ({ ...item, name: value }))} /><Field label="Mobile" value={form.phone} onChange={(value) => setForm((item) => ({ ...item, phone: value }))} /><Field label="Roll number (optional)" value={form.rollNumber} onChange={(value) => setForm((item) => ({ ...item, rollNumber: value }))} /></div>
          <button type="button" onClick={() => openTab("ACTIVATION")} disabled={!selectedBatchIds.length} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">Continue to Activation</button>
        </ApplicantPanel>
      ) : null}

      {tab === "ACTIVATION" ? (
        <ApplicantPanel lead={selectedLead} title="Final activation check" onChoose={() => openTab("APPLICATIONS")}>
          <form onSubmit={submitActivation} className="grid gap-4"><div className="grid gap-2">{readiness.map((item) => <div key={item.label} className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--border)] px-4"><span className="font-bold">{item.label}</span><span className={`inline-flex items-center gap-1 text-sm font-black ${item.ready ? "text-emerald-700" : "text-amber-700"}`}>{item.ready ? <Check size={16} /> : null}{item.ready ? "Ready" : "Pending"}</span></div>)}</div><SelectField label="Enrollment status" value={admissionStatus} onChange={setAdmissionStatus}><option>Received</option><option>Documents Pending</option><option>Verification Pending</option><option>Ready For Admission</option></SelectField><TextArea label="Final admission note" value={form.notes} onChange={(value) => setForm((item) => ({ ...item, notes: value }))} /><button type="submit" disabled={!readyForEnrollment || !form.batchId || activateMutation.isPending} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-50">{activateMutation.isPending ? "Activating..." : "Activate Learner Account"}</button></form>
          {activationResult ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><div className="flex items-center gap-2 font-black"><CheckCircle2 size={18} /> Learner activated</div><p className="mt-2 text-sm">LMS access and batch membership are active. The applicant is removed from the open AO queue.</p>{activationResult.student ? <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-black">Student: {activationResult.student.name || activationResult.student.email || activationResult.student.mobile}</p> : null}{activationResult.payment?.receiptNumber ? <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-black">Receipt: {activationResult.payment.receiptNumber}</p> : <p className="mt-3 text-sm">No payment receipt was required for this activation.</p>}</div> : null}
        </ApplicantPanel>
      ) : null}

      {tab === "STUDENTS" ? (
        <Panel eyebrow="Students" title="Active learners by batch"><div className="grid gap-3 sm:grid-cols-[1fr_260px]"><SearchField value={studentSearch} onChange={setStudentSearch} placeholder="Search student, phone or batch" /><select value={studentBatchId} onChange={(event) => setStudentBatchId(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 font-bold"><option value="">All batches</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></div><div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)]"><div className="hidden grid-cols-[1fr_1fr_180px] bg-[var(--page-bg)] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] sm:grid"><span>Student</span><span>Batch</span><span>Status</span></div>{visibleStudentRows.map((row) => <div key={`${row.batch.id}-${row.student?.id}`} className="grid gap-2 border-t border-[var(--border)] p-4 first:border-t-0 sm:grid-cols-[1fr_1fr_180px]"><div><strong>{row.student?.name}</strong><p className="mt-1 text-xs text-[var(--muted-blue)]">{row.student?.mobile || row.student?.email}</p></div><span className="text-sm font-bold">{row.batch.name}</span><span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{row.entry.status || "ACTIVE"}</span></div>)}{!visibleStudentRows.length ? <Empty>No matching active students.</Empty> : null}</div></Panel>
      ) : null}

      {tab === "REPORTS" ? <ReportsView applications={applications} batches={batches} uniqueStudents={uniqueStudents} documentPending={documentPending} feePending={feePending} batchPending={batchPending} /> : null}
    </WorkspaceDashboard>
  );
}

function ApplicationWorkspace({
  applicationDraft,
  archiveApplication,
  archivePending,
  documentStatuses,
  documentUploads,
  note,
  onOpenLead,
  saveApplication,
  savePending,
  search,
  selectedLead,
  setApplicationDraft,
  setDocumentStatuses,
  setDocumentUploads,
  setNote,
  setSearch,
  uploadApplicationDocument,
  uploadingDocumentKey,
  visibleApplications,
}: {
  applicationDraft: ApplicationDraft | null;
  archiveApplication: () => void;
  archivePending: boolean;
  documentStatuses: Record<DocumentKey, DocumentStatus>;
  documentUploads: DocumentUploads;
  note: string;
  onOpenLead: (lead: LeadApplication) => void;
  saveApplication: () => void;
  savePending: boolean;
  search: string;
  selectedLead: LeadApplication | null;
  setApplicationDraft: Dispatch<SetStateAction<ApplicationDraft | null>>;
  setDocumentStatuses: Dispatch<SetStateAction<Record<DocumentKey, DocumentStatus>>>;
  setDocumentUploads: Dispatch<SetStateAction<DocumentUploads>>;
  setNote: (value: string) => void;
  setSearch: (value: string) => void;
  uploadApplicationDocument: (key: DocumentKey, file: File) => void;
  uploadingDocumentKey: DocumentKey | null;
  visibleApplications: LeadApplication[];
}) {
  const paymentDone = Boolean(selectedLead && (noteHas(selectedLead, "FEES: PAID") || noteHas(selectedLead, "FEES: APPROVED")));
  const canSave = Boolean(selectedLead && applicationDraft?.fullName.trim() && applicationDraft.mobile.trim() && applicationDraft.targetExam.trim());

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Panel eyebrow="Applications" title="Open one application">
        <SearchField value={search} onChange={setSearch} placeholder="Search name, phone, email or program" />
        <div className="mt-4 grid max-h-[68vh] gap-3 overflow-y-auto pr-1">
          {visibleApplications.map((lead) => {
            const selected = lead.id === selectedLead?.id;
            return (
              <button
                key={lead.id}
                type="button"
                onClick={() => onOpenLead(lead)}
                className={`rounded-xl border p-4 text-left transition hover:border-slate-950 ${
                  selected ? "border-slate-950 bg-slate-950 text-white" : noteHas(lead, "AO_QUEUE: YES") ? "border-emerald-200 bg-emerald-50/60" : "border-[var(--border)] bg-white"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-black">{lead.fullName}</span>
                    <span className={`mt-1 block text-sm ${selected ? "text-white/75" : "text-[var(--muted-blue)]"}`}>{lead.targetExam} / {lead.mobile}</span>
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${selected ? "bg-white/15" : "bg-white"}`}>{leadStage(lead)}</span>
                </span>
                <span className={`mt-3 block text-xs ${selected ? "text-white/70" : "text-[var(--muted-blue)]"}`}>From {lead.source} / {lead.assignee?.name || "Unassigned"}</span>
              </button>
            );
          })}
          {!visibleApplications.length ? <Empty>No matching applications.</Empty> : null}
        </div>
      </Panel>

      <Panel eyebrow="Application File" title={selectedLead ? selectedLead.fullName : "Choose an applicant"}>
        {selectedLead && applicationDraft ? (
          <div className="grid gap-5">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">One-click application file</p>
                  <h3 className="mt-1 text-2xl font-black">{applicationDraft.fullName}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-blue)]">Default details are pre-filled. AO can add missing office data before payment and activation.</p>
                </div>
                <span className={`w-fit rounded-full px-3 py-2 text-xs font-black ${paymentDone ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>
                  {paymentDone ? "Payment done: deletion locked" : "Editable application"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Applicant name" value={applicationDraft.fullName} onChange={(value) => setApplicationDraft((current) => current ? { ...current, fullName: value } : current)} />
              <Field label="Mobile" value={applicationDraft.mobile} onChange={(value) => setApplicationDraft((current) => current ? { ...current, mobile: value } : current)} />
              <Field label="Email" value={applicationDraft.email} onChange={(value) => setApplicationDraft((current) => current ? { ...current, email: value } : current)} />
              <Field label="Course / exam" value={applicationDraft.targetExam} onChange={(value) => setApplicationDraft((current) => current ? { ...current, targetExam: value } : current)} />
              <Field label="Source" value={applicationDraft.source} onChange={(value) => setApplicationDraft((current) => current ? { ...current, source: value } : current)} />
              <SelectField label="Application status" value={applicationDraft.status} onChange={(value) => setApplicationDraft((current) => current ? { ...current, status: value as LeadApplication["status"] } : current)}>
                <option value="NEW">New application</option>
                <option value="CONTACTED">Contacted</option>
                <option value="COUNSELLING">Under processing</option>
                <option value="LOST">Archived</option>
              </SelectField>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <FileUp size={18} className="text-[var(--gold-dark)]" />
                <h3 className="font-black">Documents and uploads</h3>
              </div>
              <div className="mt-4 grid gap-3">
                {Object.entries(documentLabels).map(([key, label]) => (
                  <div key={key} className="grid gap-3 rounded-xl border border-[var(--border)] bg-white p-3 lg:grid-cols-[190px_160px_minmax(0,1fr)_220px] lg:items-center">
                    <strong className="text-sm">{label}</strong>
                    <select value={documentStatuses[key as DocumentKey]} onChange={(event) => setDocumentStatuses((current) => ({ ...current, [key]: event.target.value as DocumentStatus }))} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold">
                      <option>Pending</option>
                      <option>Verified</option>
                      <option>Rejected</option>
                    </select>
                    <input value={documentUploads[key as DocumentKey]} onChange={(event) => setDocumentUploads((current) => ({ ...current, [key]: event.target.value }))} placeholder="Paste uploaded file link or document number" className="min-h-11 rounded-xl border border-[var(--border)] px-3 text-sm outline-none" />
                    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm font-black">
                      <FileUp size={16} /> {uploadingDocumentKey === key ? "Uploading..." : "Choose file"}
                      <input type="file" className="sr-only" onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        uploadApplicationDocument(key as DocumentKey, file);
                      }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <TextArea label="Application notes" value={applicationDraft.notes} onChange={(value) => setApplicationDraft((current) => current ? { ...current, notes: value } : current)} />
            <TextArea label="New office note" value={note} onChange={setNote} />

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-between">
              <button type="button" onClick={archiveApplication} disabled={paymentDone || archivePending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                <Trash2 size={16} /> Archive application
              </button>
              <button type="button" onClick={saveApplication} disabled={!canSave || savePending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">
                <Save size={16} /> Save application file
              </button>
            </div>
            {paymentDone ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Payment is already recorded. This application cannot be deleted here; after activation, handle exit only as student discontinuation.</p> : null}
          </div>
        ) : (
          <Empty>Select any application from the left. The full application file will open here with default details filled.</Empty>
        )}
      </Panel>
    </section>
  );
}

function TodayView({ applications, documentPending, feePending, batchPending, aoReady, onOpenApplications }: { applications: LeadApplication[]; documentPending: number; feePending: number; batchPending: number; aoReady: number; onOpenApplications: () => void }) {
  const actions = [{ label: "AO ready", value: aoReady, note: "Process handovers first", icon: GraduationCap }, { label: "New applications", value: applications.length, note: "Open and begin verification", icon: FileText }, { label: "Documents pending", value: documentPending, note: "Verify or request replacements", icon: FileArchive }, { label: "Fees pending", value: feePending, note: "Confirm payment readiness", icon: BadgeIndianRupee }, { label: "Batch allocation", value: batchPending, note: "Assign and activate learners", icon: GraduationCap }];
  return <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><Panel eyebrow="Today" title="What needs action now"><div className="grid gap-3 sm:grid-cols-2">{actions.map(({ icon: Icon, ...item }) => <button key={item.label} type="button" onClick={onOpenApplications} className="flex min-h-28 items-start gap-3 rounded-xl border border-[var(--border)] p-4 text-left hover:border-slate-950"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--page-bg)]"><Icon size={18} /></span><span><strong className="text-2xl">{item.value}</strong><span className="block font-black">{item.label}</span><span className="mt-1 block text-sm text-[var(--muted-blue)]">{item.note}</span></span></button>)}</div></Panel><Panel eyebrow="Admission Flow" title="One applicant, five checks"><ol className="grid gap-3">{["Open application", "Verify documents", "Confirm payment", "Allocate batch", "Activate learner"].map((item, index) => <li key={item} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">{index + 1}</span><strong>{item}</strong></li>)}</ol></Panel></section>;
}

function ReportsView({ applications, batches, uniqueStudents, documentPending, feePending, batchPending }: { applications: LeadApplication[]; batches: BatchOption[]; uniqueStudents: number; documentPending: number; feePending: number; batchPending: number }) {
  const spread = Array.from(new Set(applications.map((lead) => lead.targetExam))).map((program) => ({ program, count: applications.filter((lead) => lead.targetExam === program).length }));
  return <section className="grid gap-5 lg:grid-cols-2"><Panel eyebrow="Admission Reports" title="Pipeline status"><div className="grid grid-cols-2 gap-3"><Metric label="Open applications" value={applications.length} icon={FileText} /><Metric label="Documents pending" value={documentPending} icon={FileArchive} /><Metric label="Fees pending" value={feePending} icon={BadgeIndianRupee} /><Metric label="Ready for batch" value={batchPending} icon={GraduationCap} /><Metric label="Active students" value={uniqueStudents} icon={Users} /><Metric label="Active batches" value={batches.filter((item) => item.status === "ACTIVE").length} icon={ShieldCheck} /></div></Panel><Panel eyebrow="Program Interest" title="Applicant demand"><div className="grid gap-3">{spread.map((item) => <div key={item.program} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-4"><strong>{item.program}</strong><span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-sm font-black">{item.count}</span></div>)}{!spread.length ? <Empty>No application data is available.</Empty> : null}</div></Panel></section>;
}

function ApplicantPanel({ lead, title, onChoose, children }: { lead: LeadApplication | null; title: string; onChoose: () => void; children: ReactNode }) {
  return <Panel eyebrow="Applicant Workspace" title={title}>{lead ? <div className="grid gap-5"><div className="flex flex-col gap-3 rounded-xl bg-[var(--page-bg)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-xl font-black">{lead.fullName}</h3><p className="mt-1 text-sm text-[var(--muted-blue)]">{lead.targetExam} / {lead.mobile} / {lead.email}</p></div><button type="button" onClick={onChoose} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">Change Applicant</button></div>{children}</div> : <Empty>Choose an application before continuing.</Empty>}</Panel>;
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) { return <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">{eyebrow}</p><h2 className="mt-2 text-2xl font-black">{title}</h2><div className="mt-5">{children}</div></section>; }
function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) { return <div className="rounded-xl border border-[var(--border)] bg-white p-4"><Icon size={18} className="text-[var(--gold-dark)]" /><strong className="mt-3 block text-2xl">{value}</strong><span className="text-xs font-bold text-[var(--muted-blue)]">{label}</span></div>; }
function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3"><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-black">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 font-normal" /></label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="grid gap-2 text-sm font-black">{label}<input type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value || 0))} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 font-normal" /></label>; }
function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) { return <label className="grid gap-2 text-sm font-black">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3 font-normal">{children}</select></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-black">{label}<textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className="resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-3 font-normal" /></label>; }
function Empty({ children }: { children: string }) { return <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted-blue)]">{children}</p>; }
