"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MessageCircle,
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
  getTeacherPerformanceSummary,
} from "@/services/academy";
import { getAdmissions, getApprovals, getLeads } from "@/services/crm";
import { getDirectorDashboard } from "@/services/dashboard";
import { getFees, getPaymentAnalytics } from "@/services/payments";

type ReportMode = "overview" | "academic" | "admissions" | "finance" | "staff" | "students" | "marketing" | "launch" | "custom";

export default function DirectorReportsPage() {
  const searchParams = useSearchParams();
  const requestedMode = searchParams?.get("mode") as ReportMode | null;
  const [mode, setMode] = useState<ReportMode>(
    requestedMode && ["overview", "academic", "admissions", "finance", "staff", "students", "marketing", "launch", "custom"].includes(requestedMode) ? requestedMode : "overview",
  );
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const directorQuery = useQuery({ queryKey: ["director", "reports", "command"], queryFn: getDirectorDashboard });
  const leadsQuery = useQuery({ queryKey: ["director", "reports", "leads"], queryFn: () => getLeads() });
  const admissionsQuery = useQuery({ queryKey: ["director", "reports", "admissions"], queryFn: getAdmissions });
  const approvalsQuery = useQuery({ queryKey: ["director", "reports", "approvals"], queryFn: getApprovals });
  const attendanceQuery = useQuery({ queryKey: ["director", "reports", "attendance"], queryFn: () => getAttendanceSummary() });
  const assignmentsQuery = useQuery({ queryKey: ["director", "reports", "assignments"], queryFn: () => getAssignmentSummary() });
  const examsQuery = useQuery({ queryKey: ["director", "reports", "exams"], queryFn: () => getExamSummary() });
  const materialsQuery = useQuery({ queryKey: ["director", "reports", "materials"], queryFn: () => getMaterialSummary() });
  const syllabusQuery = useQuery({ queryKey: ["director", "reports", "syllabus"], queryFn: () => getSyllabusSummary() });
  const teachersQuery = useQuery({ queryKey: ["director", "reports", "teacher-performance"], queryFn: getTeacherPerformanceSummary });
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
  const activeStudents = command?.students.active ?? 0;
  const activeTeachers = command?.academics.teachers ?? 0;
  const physicalTrainers = command?.staff.physicalTrainers.active ?? 0;

  const reportCards: Array<{ key: ReportMode; title: string; icon: LucideIcon; href: string; metrics: Array<{ label: string; value: string | number }> }> = [
    {
      key: "admissions",
      title: "Admissions",
      icon: ClipboardCheck,
      href: "/dashboard/director/admissions",
      metrics: [
        { label: "Leads", value: leadsQuery.data?.length ?? 0 },
        { label: "Admissions", value: admissionsQuery.data?.length ?? 0 },
        { label: "Approvals", value: approvalsQuery.data?.length ?? 0 },
      ],
    },
    {
      key: "academic",
      title: "Academics",
      icon: GraduationCap,
      href: "/dashboard/director/academic",
      metrics: [
        { label: "Batches", value: command?.academics.activeBatches ?? 0 },
        { label: "Today Classes", value: command?.learning.liveClasses ?? 0 },
        { label: "Syllabus", value: `${syllabus?.completionPercentage ?? 0}%` },
      ],
    },
    {
      key: "students",
      title: "Students",
      icon: Users,
      href: "/dashboard/director/academic/student-progress",
      metrics: [
        { label: "Active", value: activeStudents },
        { label: "Batch Reports", value: studentsQuery.data?.batches.length ?? 0 },
        { label: "Low Attendance", value: command?.operationalAlerts.lowAttendanceAlerts ?? 0 },
      ],
    },
    {
      key: "staff",
      title: "Team",
      icon: ShieldCheck,
      href: "/dashboard/director/management?mode=manage",
      metrics: [
        { label: "Teachers", value: activeTeachers },
        { label: "Academic Heads", value: command?.staff.academicHeads.active ?? 0 },
        { label: "Physical Trainers", value: physicalTrainers },
      ],
    },
    {
      key: "finance",
      title: "Finance",
      icon: WalletCards,
      href: "/dashboard/director/accounts?mode=overview",
      metrics: [
        { label: "Collected", value: `Rs ${(finance?.monthlyRevenue ?? 0).toLocaleString()}` },
        { label: "Pending", value: `Rs ${(finance?.pendingDues ?? 0).toLocaleString()}` },
        { label: "Open Fees", value: pendingFees.length },
      ],
    },
    {
      key: "marketing",
      title: "Marketing",
      icon: BarChart3,
      href: "/dashboard/business-development?tab=REPORTS",
      metrics: [
        { label: "Leads", value: leadsQuery.data?.length ?? 0 },
        { label: "Counselling", value: leadsQuery.data?.filter((lead) => lead.status === "COUNSELLING").length ?? 0 },
        { label: "Converted", value: leadsQuery.data?.filter((lead) => lead.status === "ENROLLED").length ?? 0 },
      ],
    },
    {
      key: "academic",
      title: "Learning",
      icon: BookOpen,
      href: "/dashboard/director/academic/reports",
      metrics: [
        { label: "Assignments", value: assignments?.assignments ?? 0 },
        { label: "Exams", value: exams?.exams ?? 0 },
        { label: "Library", value: materials?.total ?? 0 },
      ],
    },
  ];

  const readiness = [
    {
      title: "Admissions readiness",
      value: approvalsQuery.data?.length ? "Action" : "Clear",
      text: "No pending approval queue means AO workflow is calm.",
      tone: approvalsQuery.data?.length ? "warn" : "ok",
    },
    {
      title: "Academic readiness",
      value: `${syllabus?.completionPercentage ?? 0}%`,
      text: "Syllabus progress comes from real teacher progress records.",
      tone: (syllabus?.completionPercentage ?? 0) >= 70 ? "ok" : "warn",
    },
    {
      title: "Attendance readiness",
      value: `${attendance?.percentage ?? 0}%`,
      text: "Academy attendance health based on marked sessions.",
      tone: (attendance?.percentage ?? 0) >= 75 ? "ok" : "warn",
    },
    {
      title: "Assessment readiness",
      value: exams?.exams ?? 0,
      text: "Published and scheduled exam records available for monitoring.",
      tone: exams?.exams ? "ok" : "warn",
    },
  ];

  const reportRows = useMemo(() => {
    const rows = [
      ["Report", "Metric", "Value"],
      ["Admissions", "Leads", String(leadsQuery.data?.length ?? 0)],
      ["Admissions", "Admissions", String(admissionsQuery.data?.length ?? 0)],
      ["Admissions", "Approvals", String(approvalsQuery.data?.length ?? 0)],
      ["Academics", "Batches", String(command?.academics.activeBatches ?? 0)],
      ["Academics", "Syllabus", `${syllabus?.completionPercentage ?? 0}%`],
      ["Academics", "Attendance", `${attendance?.percentage ?? 0}%`],
      ["Students", "Active Students", String(activeStudents)],
      ["Students", "Low Attendance", String(command?.operationalAlerts.lowAttendanceAlerts ?? 0)],
      ["Staff", "Teachers", String(activeTeachers)],
      ["Staff", "Academic Heads", String(command?.staff.academicHeads.active ?? 0)],
      ["Staff", "Physical Trainers", String(physicalTrainers)],
      ["Finance", "Monthly Revenue", String(finance?.monthlyRevenue ?? 0)],
      ["Finance", "Pending Dues", String(finance?.pendingDues ?? 0)],
      ["Finance", "Open Fees", String(pendingFees.length)],
      ["Marketing", "Total Leads", String(leadsQuery.data?.length ?? 0)],
      ["Marketing", "Counselling Leads", String(leadsQuery.data?.filter((lead) => lead.status === "COUNSELLING").length ?? 0)],
      ["Marketing", "Converted Leads", String(leadsQuery.data?.filter((lead) => lead.status === "ENROLLED").length ?? 0)],
      ["Marketing", "Lost Leads", String(leadsQuery.data?.filter((lead) => lead.status === "LOST").length ?? 0)],
      ["Learning", "Assignments", String(assignments?.assignments ?? 0)],
      ["Learning", "Exams", String(exams?.exams ?? 0)],
      ["Learning", "Library", String(materials?.total ?? 0)],
    ];
    if (mode === "overview" || mode === "custom") return rows;
    const label = mode === "staff" ? "Staff" : mode.charAt(0).toUpperCase() + mode.slice(1);
    return [rows[0], ...rows.slice(1).filter((row) => row[0] === label || (mode === "academic" && row[0] === "Learning"))];
  }, [
    activeStudents,
    activeTeachers,
    admissionsQuery.data?.length,
    approvalsQuery.data?.length,
    assignments?.assignments,
    attendance?.percentage,
    command?.academics.activeBatches,
    command?.operationalAlerts.lowAttendanceAlerts,
    command?.staff.academicHeads.active,
    exams?.exams,
    finance?.monthlyRevenue,
    finance?.pendingDues,
    leadsQuery.data?.length,
    leadsQuery.data,
    materials?.total,
    mode,
    pendingFees.length,
    physicalTrainers,
    syllabus?.completionPercentage,
  ]);

  const reportTitle = `${mode === "overview" ? "Director Overview" : mode === "custom" ? "Custom Report" : `${mode.charAt(0).toUpperCase()}${mode.slice(1)} Report`} (${fromDate} to ${toDate})`;

  const downloadReport = (format: "json" | "csv") => {
    const payload = {
      title: reportTitle,
      generatedAt: new Date().toISOString(),
      range: { from: fromDate, to: toDate },
      rows: reportRows.slice(1).map(([category, metric, value]) => ({ category, metric, value })),
    };
    const content = format === "json"
      ? JSON.stringify(payload, null, 2)
      : reportRows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
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

  const emailBody = encodeURIComponent(reportRows.slice(1).map(([category, metric, value]) => `${category} - ${metric}: ${value}`).join("\n"));
  const shareText = encodeURIComponent(`${reportTitle}\n${reportRows.slice(1).map(([category, metric, value]) => `${category} - ${metric}: ${value}`).join("\n")}`);

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6 lg:h-[calc(100vh-var(--nav-height)-2rem)] lg:min-h-0 lg:overflow-hidden">
      <section className="mx-auto flex h-full max-w-[1500px] flex-col gap-4 overflow-y-auto pr-0 lg:pr-2">
        <section className="shrink-0 rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director Reports</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_0.35fr] lg:items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">Report Room</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Live reports for admissions, academics, students, team, finance and learning. This page is built for weekly review and launch certification.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">Last Updated</p>
              <p className="mt-2 text-sm font-black">{director?.lastUpdatedAt ? new Date(director.lastUpdatedAt).toLocaleString() : "Live data loading"}</p>
            </div>
          </div>
        </section>

        <section className="grid shrink-0 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <ModeButton active={mode === "overview"} icon={BarChart3} label="Overview" onClick={() => setMode("overview")} />
          <ModeButton active={mode === "academic"} icon={GraduationCap} label="Academic" onClick={() => setMode("academic")} />
          <ModeButton active={mode === "admissions"} icon={ClipboardCheck} label="Admissions" onClick={() => setMode("admissions")} />
          <ModeButton active={mode === "finance"} icon={WalletCards} label="Finance" onClick={() => setMode("finance")} />
          <ModeButton active={mode === "staff"} icon={ShieldCheck} label="Staff" onClick={() => setMode("staff")} />
          <ModeButton active={mode === "students"} icon={Users} label="Students" onClick={() => setMode("students")} />
          <ModeButton active={mode === "marketing"} icon={BarChart3} label="Marketing" onClick={() => setMode("marketing")} />
          <ModeButton active={mode === "launch"} icon={CheckCircle2} label="Launch QA" onClick={() => setMode("launch")} />
          <ModeButton active={mode === "custom"} icon={FileText} label="Custom" onClick={() => setMode("custom")} />
        </section>

        <section className="grid shrink-0 gap-3 rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-black">
            From
            <input className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-normal" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-black">
            To
            <input className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-normal" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white" type="button" onClick={() => downloadReport("csv")}>
            <Download className="h-4 w-4" /> CSV
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black" type="button" onClick={() => downloadReport("json")}>
            <Download className="h-4 w-4" /> JSON
          </button>
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black" href={`mailto:?subject=${encodeURIComponent(reportTitle)}&body=${emailBody}`}>
            <Mail className="h-4 w-4" /> Email
          </a>
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-black" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </section>

        {mode === "overview" ? (
        <section className="grid min-h-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reportCards.map((card) => (
            <ReportCard key={`${card.key}-${card.title}`} card={card} onOpen={() => setMode(card.key)} />
          ))}
        </section>
        ) : null}

        {mode === "launch" || mode === "overview" ? (
        <section className="grid min-h-0 gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Panel title="Launch readiness" eyebrow="Certification">
            <div className="grid gap-3">
              {readiness.map((item) => (
                <ReadinessRow key={item.title} item={item} />
              ))}
            </div>
          </Panel>

          <Panel title="Director action list" eyebrow="Today">
            <div className="grid gap-3">
              <ActionLink title="Clear admission queue" text="Review leads, approvals, documents and fees." href="/dashboard/director/admissions" value={command?.operationalAlerts.pendingAdmissions ?? 0} />
              <ActionLink title="Review fee pressure" text="Open pending dues and overdue fees." href="/dashboard/director/accounts?mode=fees" value={pendingFees.length} />
              <ActionLink title="Check teacher delivery" text="Open faculty performance and class logs." href="/dashboard/director/academic/teacher-performance" value={teachersQuery.data?.teachers.length ?? 0} />
              <ActionLink title="Run launch QA" text="Open the final module checklist before public launch." href="/dashboard/director/launch-qa" value="QA" />
            </div>
          </Panel>
        </section>
        ) : null}

        {mode !== "overview" && mode !== "launch" ? (
        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_0.75fr]">
          <Panel title={reportTitle} eyebrow="Preview">
            <div className="max-h-[58vh] overflow-y-auto pr-1">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    {reportRows[0].map((heading) => (
                      <th key={heading} className="border-b border-[var(--border)] px-3 py-3 font-black">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportRows.slice(1).map((row) => (
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
          <Panel title="Report Actions" eyebrow="Download and share">
            <div className="grid gap-3">
              <button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white" type="button" onClick={() => downloadReport("csv")}>Download CSV</button>
              <button className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black" type="button" onClick={() => downloadReport("json")}>Download JSON</button>
              <a className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-center text-sm font-black" href={`mailto:?subject=${encodeURIComponent(reportTitle)}&body=${emailBody}`}>Email Report</a>
              <a className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-center text-sm font-black" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">WhatsApp Share</a>
              <Link className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-center text-sm font-black" href={mode === "finance" ? "/dashboard/director/accounts?mode=overview" : mode === "admissions" ? "/dashboard/director/admissions" : mode === "staff" ? "/dashboard/director/management?mode=manage" : mode === "marketing" ? "/dashboard/business-development?tab=REPORTS" : "/dashboard/director/academic"}>
                Open Source Page
              </Link>
            </div>
          </Panel>
        </section>
        ) : null}
      </section>
    </main>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-center text-xs font-black shadow-sm transition hover:border-[var(--gold-border)] ${active ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"}`} onClick={onClick} type="button">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ReportCard({ card, onOpen }: { card: { title: string; href: string; icon: LucideIcon; metrics: Array<{ label: string; value: string | number }> }; onOpen: () => void }) {
  const Icon = card.icon;
  return (
    <button type="button" onClick={onOpen} className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
          <Icon className="h-6 w-6 text-[var(--navy)]" />
        </div>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">Open</span>
      </div>
      <h2 className="mt-4 text-xl font-black">{card.title}</h2>
      <div className="mt-4 grid gap-2">
        {card.metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-3">
            <span className="text-sm text-[var(--muted-blue)]">{metric.label}</span>
            <span className="font-black">{metric.value}</span>
          </div>
        ))}
      </div>
    </button>
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

function ReadinessRow({ item }: { item: { title: string; value: string | number; text: string; tone: string } }) {
  const Icon = item.tone === "ok" ? CheckCircle2 : AlertTriangle;
  const toneClass = item.tone === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Icon className="mt-1 h-5 w-5 shrink-0 text-[var(--gold)]" />
          <div>
            <p className="font-black">{item.title}</p>
            <p className="mt-1 text-sm text-[var(--muted-blue)]">{item.text}</p>
          </div>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-black ${toneClass}`}>{item.value}</span>
      </div>
    </div>
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
