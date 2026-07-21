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
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
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
  const [searchText, setSearchText] = useState("");
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
      href: "/dashboard/director/accounts?mode=reports",
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
  const attentionCount = pendingFees.length + (approvalsQuery.data?.length ?? 0) + (command?.operationalAlerts.lowAttendanceAlerts ?? 0);
  const selectedMenu = reportCards.find((card) => card.key === mode);
  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return reportRows;
    return [reportRows[0], ...reportRows.slice(1).filter((row) => row.join(" ").toLowerCase().includes(query))];
  }, [reportRows, searchText]);

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

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-4 text-[var(--navy)] md:px-6">
      <section className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <section className="rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-sm md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold)]">Director Reports</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_0.35fr] lg:items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">Reports</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                A simple review desk for admissions, academics, students, staff and finance. Start with the alerts, then open the area you want to check.
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
          <DirectorSignal title="Admissions" value={admissionsQuery.data?.length ?? 0} detail={`${approvalsQuery.data?.length ?? 0} waiting for approval`} tone={(approvalsQuery.data?.length ?? 0) ? "warn" : "ok"} />
          <DirectorSignal title="Fees Pending" value={`Rs ${(finance?.pendingDues ?? 0).toLocaleString()}`} detail={`${pendingFees.length} open fee records`} tone={pendingFees.length ? "warn" : "ok"} />
          <DirectorSignal title="Alerts" value={attentionCount} detail="items need review" tone={attentionCount ? "warn" : "ok"} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Today's Action List" eyebrow="Start here">
            <div className="grid gap-3">
              <ActionLink title="Clear admission queue" text="Check applications, documents, approvals and fee status." href="/dashboard/director/admissions" value={command?.operationalAlerts.pendingAdmissions ?? 0} />
              <ActionLink title="Review fee pressure" text="Open pending dues and overdue fee records." href="/dashboard/director/accounts?mode=fees" value={pendingFees.length} />
              <ActionLink title="Check class delivery" text="Review attendance, syllabus movement and teacher delivery." href="/dashboard/director/academic/reports" value={`${attendance?.percentage ?? 0}%`} />
              <ActionLink title="Open student progress" text="See batches with weak attendance or progress signals." href="/dashboard/director/teaching/students" value={command?.operationalAlerts.lowAttendanceAlerts ?? 0} />
            </div>
          </Panel>

          <Panel title="Open a Report" eyebrow="Simple menu">
            <div className="grid gap-3 sm:grid-cols-2">
              <MenuButton active={mode === "overview"} icon={BarChart3} label="Overview" detail="Main academy picture" onClick={() => setMode("overview")} />
              <MenuButton active={mode === "academic"} icon={GraduationCap} label="Academic" detail="Classes, syllabus, attendance" onClick={() => setMode("academic")} />
              <MenuButton active={mode === "admissions"} icon={ClipboardCheck} label="Admissions" detail="Leads and approvals" onClick={() => setMode("admissions")} />
              <MenuButton active={mode === "finance"} icon={WalletCards} label="Finance" detail="Collection and pending fees" onClick={() => setMode("finance")} />
              <MenuButton active={mode === "students"} icon={Users} label="Students" detail="Student progress signals" onClick={() => setMode("students")} />
              <MenuButton active={mode === "staff"} icon={ShieldCheck} label="Staff" detail="Teachers and team" onClick={() => setMode("staff")} />
              <MenuButton active={mode === "marketing"} icon={BarChart3} label="Marketing" detail="Lead conversion" onClick={() => setMode("marketing")} />
              <MenuButton active={mode === "launch"} icon={CheckCircle2} label="Launch Check" detail="Readiness before go-live" onClick={() => setMode("launch")} />
            </div>
          </Panel>
        </section>

        {mode === "overview" ? (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {reportCards.map((card) => (
              <ReportCard key={`${card.key}-${card.title}`} card={card} onOpen={() => setMode(card.key)} />
            ))}
          </section>
        ) : null}

        {mode === "launch" || mode === "overview" ? (
          <Panel title="Launch Readiness" eyebrow="Before go-live">
            <div className="grid gap-3 md:grid-cols-2">
              {readiness.map((item) => (
                <ReadinessRow key={item.title} item={item} />
              ))}
            </div>
          </Panel>
        ) : null}

        {mode !== "overview" && mode !== "launch" ? (
          <section className="grid gap-4">
            <Panel title={selectedMenu?.title ?? reportTitle} eyebrow="Report details">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-2 sm:grid-cols-2">
                  <DateField label="From" value={fromDate} onChange={setFromDate} />
                  <DateField label="To" value={toDate} onChange={setToDate} />
                </div>
                <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm lg:max-w-md">
                  <Search className="h-4 w-4 shrink-0 text-[var(--muted-blue)]" />
                  <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search inside this report" className="min-w-0 flex-1 bg-transparent outline-none" />
                </label>
              </div>
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-white">
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
            </Panel>
          </section>
        ) : null}

        <Panel title="Download or Print" eyebrow="Optional">
          <div className="flex flex-wrap gap-2">
            <UtilityButton icon={Download} label="Download CSV" onClick={() => downloadReport("csv")} />
            <UtilityButton icon={Download} label="Download JSON" onClick={() => downloadReport("json")} />
            <UtilityButton icon={Printer} label="Print" onClick={() => window.print()} />
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

function ReportCard({ card, onOpen }: { card: { title: string; href: string; icon: LucideIcon; metrics: Array<{ label: string; value: string | number }> }; onOpen: () => void }) {
  const Icon = card.icon;
  return (
    <button type="button" onClick={onOpen} className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)]">
          <Icon className="h-6 w-6 text-[var(--navy)]" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-black">Open <ArrowRight className="h-3 w-3" /></span>
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
    <button type="button" onClick={onClick} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-black text-[var(--navy)] shadow-sm hover:border-[var(--gold-border)]">
      <Icon className="h-4 w-4" />
      {label}
    </button>
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
