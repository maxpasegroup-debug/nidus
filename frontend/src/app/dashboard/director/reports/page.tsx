"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  GraduationCap,
  Printer,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getAssignmentSummary,
  getAttendanceSummary,
  getExamSummary,
  getMaterialSummary,
  getStudentProgressSummary,
  getSyllabusSummary,
} from "@/services/academy";
import { getAdmissions, getApprovals, getLeads } from "@/services/crm";
import { getDirectorDashboard } from "@/services/dashboard";
import { getFees, getPaymentAnalytics } from "@/services/payments";

type ReportMode = "overview" | "fees-admissions" | "students-academics" | "staff-access";
type LegacyMode = ReportMode | "academic" | "admissions" | "finance" | "staff" | "students" | "marketing" | "launch" | "custom";

const reportOptions: Array<{ key: ReportMode; label: string; detail: string; icon: LucideIcon }> = [
  { key: "overview", label: "Academy Health", detail: "Main numbers and urgent work", icon: BarChart3 },
  { key: "fees-admissions", label: "Fees & Admissions", detail: "Applications, approvals and dues", icon: WalletCards },
  { key: "students-academics", label: "Students & Academics", detail: "Progress, attendance and learning", icon: GraduationCap },
  { key: "staff-access", label: "Staff & Access", detail: "Team count and access signals", icon: ShieldCheck },
];

function modeFromQuery(value: LegacyMode | null): ReportMode {
  if (value === "admissions" || value === "finance" || value === "marketing" || value === "fees-admissions") return "fees-admissions";
  if (value === "academic" || value === "students" || value === "launch" || value === "students-academics") return "students-academics";
  if (value === "staff" || value === "staff-access") return "staff-access";
  return "overview";
}

export default function DirectorReportsPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ReportMode>(modeFromQuery(searchParams?.get("mode") as LegacyMode | null));
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchText, setSearchText] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const directorQuery = useQuery({ queryKey: ["director", "reports", "command"], queryFn: getDirectorDashboard });
  const leadsQuery = useQuery({ queryKey: ["director", "reports", "leads"], queryFn: () => getLeads() });
  const admissionsQuery = useQuery({ queryKey: ["director", "reports", "admissions"], queryFn: getAdmissions });
  const approvalsQuery = useQuery({ queryKey: ["director", "reports", "approvals"], queryFn: getApprovals });
  const attendanceQuery = useQuery({ queryKey: ["director", "reports", "attendance"], queryFn: () => getAttendanceSummary() });
  const assignmentsQuery = useQuery({ queryKey: ["director", "reports", "assignments"], queryFn: () => getAssignmentSummary() });
  const examsQuery = useQuery({ queryKey: ["director", "reports", "exams"], queryFn: () => getExamSummary() });
  const materialsQuery = useQuery({ queryKey: ["director", "reports", "materials"], queryFn: () => getMaterialSummary() });
  const syllabusQuery = useQuery({ queryKey: ["director", "reports", "syllabus"], queryFn: () => getSyllabusSummary() });
  const studentsQuery = useQuery({ queryKey: ["director", "reports", "student-progress"], queryFn: getStudentProgressSummary });
  const financeQuery = useQuery({ queryKey: ["director", "reports", "payment-analytics"], queryFn: getPaymentAnalytics });
  const feesQuery = useQuery({ queryKey: ["director", "reports", "fees"], queryFn: getFees });

  const director = directorQuery.data;
  const command = director?.commandCenter;
  const attendance = attendanceQuery.data?.summary;
  const assignments = assignmentsQuery.data?.summary;
  const exams = examsQuery.data?.summary;
  const materials = materialsQuery.data?.summary;
  const syllabus = syllabusQuery.data?.summary;
  const finance = financeQuery.data;
  const pendingFees = (feesQuery.data ?? []).filter((fee) => fee.paidStatus !== "PAID");
  const leads = leadsQuery.data ?? [];
  const admissions = admissionsQuery.data ?? [];
  const approvals = approvalsQuery.data ?? [];
  const activeStudents = command?.students.active ?? 0;
  const activeTeachers = command?.academics.teachers ?? 0;
  const academicHeads = command?.staff.academicHeads.active ?? 0;
  const physicalTrainers = command?.staff.physicalTrainers.active ?? 0;
  const lowAttendance = command?.operationalAlerts.lowAttendanceAlerts ?? 0;
  const attentionCount = pendingFees.length + approvals.length + lowAttendance;

  const groups = {
    overview: [
      ["Academy", "Active students", String(activeStudents)],
      ["Academy", "Running batches", String(command?.academics.activeBatches ?? 0)],
      ["Academy", "Faculty", String(activeTeachers + academicHeads + physicalTrainers)],
      ["Academy", "Items to review", String(attentionCount)],
    ],
    "fees-admissions": [
      ["Admissions", "Leads", String(leads.length)],
      ["Admissions", "Admissions", String(admissions.length)],
      ["Admissions", "Waiting approvals", String(approvals.length)],
      ["Admissions", "Counselling leads", String(leads.filter((lead) => lead.status === "COUNSELLING").length)],
      ["Fees", "Collected this month", `Rs ${(finance?.monthlyRevenue ?? 0).toLocaleString()}`],
      ["Fees", "Pending dues", `Rs ${(finance?.pendingDues ?? 0).toLocaleString()}`],
      ["Fees", "Open fee records", String(pendingFees.length)],
    ],
    "students-academics": [
      ["Students", "Active students", String(activeStudents)],
      ["Students", "Batch reports", String(studentsQuery.data?.batches.length ?? 0)],
      ["Students", "Low attendance alerts", String(lowAttendance)],
      ["Academics", "Today classes", String(command?.learning.liveClasses ?? 0)],
      ["Academics", "Attendance", `${attendance?.percentage ?? 0}%`],
      ["Academics", "Syllabus", `${syllabus?.completionPercentage ?? 0}%`],
      ["Learning", "Assignments", String(assignments?.assignments ?? 0)],
      ["Learning", "Exams", String(exams?.exams ?? 0)],
      ["Learning", "Library materials", String(materials?.total ?? 0)],
    ],
    "staff-access": [
      ["Staff", "Academic heads", String(academicHeads)],
      ["Staff", "Teachers", String(activeTeachers)],
      ["Staff", "Physical trainers", String(physicalTrainers)],
      ["Access", "Staff access desk", "Open"],
      ["Access", "PIN reset desk", "Open"],
    ],
  } satisfies Record<ReportMode, string[][]>;

  const rows = useMemo(() => {
    const selectedRows = mode === "overview"
      ? [...groups.overview, ...groups["fees-admissions"], ...groups["students-academics"], ...groups["staff-access"]]
      : groups[mode];
    return [["Area", "What to check", "Status"], ...selectedRows];
  }, [mode, groups]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return rows;
    return [rows[0], ...rows.slice(1).filter((row) => row.join(" ").toLowerCase().includes(query))];
  }, [rows, searchText]);

  const selectedOption = reportOptions.find((option) => option.key === mode) ?? reportOptions[0];
  const reportTitle = `${selectedOption.label} (${fromDate} to ${toDate})`;

  const downloadReport = (format: "json" | "csv") => {
    const payload = {
      title: reportTitle,
      generatedAt: new Date().toISOString(),
      range: { from: fromDate, to: toDate },
      rows: rows.slice(1).map(([area, check, status]) => ({ area, check, status })),
    };
    const content = format === "json"
      ? JSON.stringify(payload, null, 2)
      : rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([content], { type: format === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director Reports</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_0.35fr] lg:items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">Report Room</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Four simple report views for weekly review. Pick one area, check the numbers, then open the action page if something needs follow-up.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Updated</p>
              <p className="mt-2 text-sm font-black">{director?.lastUpdatedAt ? new Date(director.lastUpdatedAt).toLocaleString() : "Live data loading"}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <DirectorSignal title="Students" value={activeStudents} detail="active learners" tone="ok" />
          <DirectorSignal title="Admissions" value={admissions.length} detail={`${approvals.length} waiting`} tone={approvals.length ? "warn" : "ok"} />
          <DirectorSignal title="Fees Pending" value={`Rs ${(finance?.pendingDues ?? 0).toLocaleString()}`} detail={`${pendingFees.length} open records`} tone={pendingFees.length ? "warn" : "ok"} />
          <DirectorSignal title="Alerts" value={attentionCount} detail="items to review" tone={attentionCount ? "warn" : "ok"} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <Panel title="Today's Action List" eyebrow="Start here">
            <div className="grid gap-3">
              <ActionLink title="Clear admission queue" text="Check applications, documents, approvals and fee status." href="/dashboard/director/admissions" value={command?.operationalAlerts.pendingAdmissions ?? 0} />
              <ActionLink title="Review fee pressure" text="Open pending dues and overdue fee records." href="/dashboard/director/accounts?tab=dues" value={pendingFees.length} />
              <ActionLink title="Check class delivery" text="Review attendance, syllabus movement and teacher delivery." href="/dashboard/director/academic/reports" value={`${attendance?.percentage ?? 0}%`} />
              <ActionLink title="Open student progress" text="See batches with weak attendance or progress signals." href="/dashboard/director/students" value={lowAttendance} />
            </div>
          </Panel>

          <Panel title="Choose Report" eyebrow="Simple menu">
            <div className="grid gap-3 sm:grid-cols-2">
              {reportOptions.map((option) => (
                <MenuButton
                  key={option.key}
                  active={mode === option.key}
                  detail={option.detail}
                  icon={option.icon}
                  label={option.label}
                  onClick={() => setMode(option.key)}
                />
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4">
          <Panel title={selectedOption.label} eyebrow="Report details">
            <div className="mb-4 grid gap-3 lg:grid-cols-[auto_auto_1fr_auto] lg:items-end">
              <DateField label="From" value={fromDate} onChange={setFromDate} />
              <DateField label="To" value={toDate} onChange={setToDate} />
              <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm">
                <Search className="h-4 w-4 shrink-0 text-[var(--muted-blue)]" />
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search this report" className="min-w-0 flex-1 bg-transparent outline-none" />
              </label>
              <div className="relative">
                <button type="button" onClick={() => setExportOpen((open) => !open)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black">
                  <Download className="h-4 w-4" />
                  Export
                </button>
                {exportOpen ? (
                  <div className="absolute right-0 z-10 mt-2 grid min-w-44 gap-2 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-xl">
                    <UtilityButton icon={Download} label="CSV" onClick={() => downloadReport("csv")} />
                    <UtilityButton icon={Download} label="JSON" onClick={() => downloadReport("json")} />
                    <UtilityButton icon={Printer} label="Print" onClick={() => window.print()} />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[var(--page-bg)]">
                  <tr>
                    {filteredRows[0].map((heading) => (
                      <th key={heading} className="border-b border-[var(--border)] px-3 py-3 font-black">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.slice(1).map((row) => (
                    <tr key={row.join("-")} className="border-b border-[var(--border)] last:border-b-0">
                      {row.map((cell) => (
                        <td key={cell} className="px-3 py-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        <Panel title="Open Action Page" eyebrow="Next step">
          <div className="grid gap-3 md:grid-cols-4">
            <QuickLink href="/dashboard/director/admissions" icon={ClipboardCheck} label="Admissions" />
            <QuickLink href="/dashboard/director/accounts" icon={WalletCards} label="Accounts" />
            <QuickLink href="/dashboard/director/students" icon={Users} label="Students" />
            <QuickLink href="/dashboard/director/management" icon={ShieldCheck} label="Staff & Access" />
          </div>
        </Panel>
      </section>
    </main>
  );
}

function MenuButton({ active, detail, icon: Icon, label, onClick }: { active: boolean; detail: string; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button className={`flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left shadow-sm transition hover:border-[var(--gold-border)] ${active ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"}`} onClick={onClick} type="button">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-white/10" : "bg-[var(--gold-soft)]"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{label}</span>
        <span className={`mt-1 block text-xs leading-5 ${active ? "text-white/75" : "text-[var(--muted-blue)]"}`}>{detail}</span>
      </span>
    </button>
  );
}

function DirectorSignal({ title, value, detail, tone }: { title: string; value: string | number; detail: string; tone: "ok" | "warn" }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-blue)]">{title}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{detail}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {tone === "ok" ? "OK" : "Check"}
        </span>
      </div>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="min-h-0 rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--gold)]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--navy)]">
      {label}
      <span className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
        <CalendarDays className="h-4 w-4 text-[var(--muted-blue)]" />
        <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 bg-transparent outline-none" />
      </span>
    </label>
  );
}

function UtilityButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black text-[var(--navy)] hover:border-[var(--gold-border)]">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ActionLink({ title, text, href, value }: { title: string; text: string; href: string; value: string | number }) {
  return (
    <Link href={href} className="rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--gold-border)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm text-[var(--muted-blue)]">{text}</p>
        </div>
        <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-sm font-black">{value}</span>
      </div>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black transition hover:border-[var(--gold-border)]">
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[var(--gold)]" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
