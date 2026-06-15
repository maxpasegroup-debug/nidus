"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  BarChart3,
  BookOpen,
  CalendarDays,
  Camera,
  ClipboardCheck,
  CreditCard,
  FileArchive,
  FileText,
  GraduationCap,
  KeyRound,
  Megaphone,
  MessageCircle,
  PieChart,
  PlayCircle,
  ReceiptText,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDirectorDashboard } from "@/services/dashboard";
import { getAssignmentSummary, getAttendanceSummary, getExamSummary, getMaterialSummary, getSyllabusSummary } from "@/services/academy";

type DirectorSubArea = {
  title: string;
  text: string;
  href: string;
  icon: LucideIcon;
  status?: "Ready" | "Manage" | "Monitor";
};

type DirectorArea = {
  title: string;
  label: string;
  text: string;
  icon: LucideIcon;
  accent: string;
  subAreas: DirectorSubArea[];
};

const directorAreas: DirectorArea[] = [
  {
    title: "Academics",
    label: "Courses, batches and teaching",
    text: "Plan programs, assign teachers, prepare timetables and track syllabus progress.",
    icon: GraduationCap,
    accent: "from-amber-200 via-white to-emerald-100",
    subAreas: [
      { title: "Programs & Courses", text: "Manage Academy programs and course structure.", href: "/dashboard/director/academic/programs", icon: BookOpen, status: "Ready" },
      { title: "Batches", text: "Create offline, online, crash and foundation batches.", href: "/dashboard/director/academic/batches", icon: Users, status: "Ready" },
      { title: "Timetable Planner", text: "Plan weekly class schedules and teacher calendars.", href: "/dashboard/director/academic/timetable", icon: CalendarDays, status: "Ready" },
      { title: "Teacher Allocation", text: "Assign subject teachers and trainers to batches.", href: "/dashboard/director/academic/teachers", icon: UserCheck, status: "Ready" },
      { title: "Syllabus Tracker", text: "Track topic completion with green, orange and red status.", href: "/dashboard/director/academic/syllabus", icon: BarChart3, status: "Ready" },
      { title: "Exams & Tests", text: "Create, approve, publish and monitor exams.", href: "/dashboard/director/exams", icon: ClipboardCheck, status: "Ready" },
      { title: "Study Materials", text: "Control notes, recorded classes and batch library.", href: "/dashboard/director/materials", icon: FileArchive, status: "Ready" },
      { title: "Student Progress", text: "Review batch health, attendance, assignments, exams and risk students.", href: "/dashboard/director/academic/student-progress", icon: PieChart, status: "Monitor" },
      { title: "Teacher Performance", text: "Monitor teaching quality and academic delivery.", href: "/dashboard/director/academic/teacher-performance", icon: UserCheck, status: "Monitor" },
      { title: "Academic Calendar Monitor", text: "Track class execution and syllabus completion.", href: "/dashboard/director/academic/calendar-monitor", icon: CalendarDays, status: "Monitor" },
    ],
  },
  {
    title: "Administrative Officer",
    label: "Enquiries to admissions",
    text: "Process students through admissions, documents, fees, batch allocation and activation.",
    icon: ClipboardCheck,
    accent: "from-sky-100 via-white to-amber-100",
    subAreas: [
      { title: "New Admissions", text: "Confirmed cases received from Business Development Executive.", href: "/dashboard/admission-cell#new-admissions", icon: MessageCircle, status: "Manage" },
      { title: "Document Verification", text: "Photo, Aadhaar, marksheet, parent details and files.", href: "/dashboard/admission-cell#document-verification", icon: FileArchive, status: "Manage" },
      { title: "Fees & Enrollment", text: "Record and verify registration fee, course fee and installments.", href: "/dashboard/admission-cell#fees-enrollment", icon: BadgeIndianRupee, status: "Manage" },
      { title: "Batch Allocation", text: "Assign batches after document and fee readiness checks.", href: "/dashboard/admission-cell#batch-allocation", icon: Users, status: "Ready" },
      { title: "Student Activation", text: "Final approval, student dashboard and batch access.", href: "/dashboard/admission-cell#student-activation", icon: ShieldCheck, status: "Ready" },
      { title: "Admission Reports", text: "Real counts for new, pending and activated students.", href: "/dashboard/admission-cell#admission-reports", icon: BarChart3, status: "Monitor" },
    ],
  },
  {
    title: "Advertisement & Marketing",
    label: "Sales Booster",
    text: "Plan campaigns, manage creatives, track leads and run social growth from Director control.",
    icon: Megaphone,
    accent: "from-orange-100 via-white to-green-100",
    subAreas: [
      { title: "Sales Booster", text: "AI campaign creation and marketing automation.", href: "#sales-booster", icon: Sparkles, status: "Ready" },
      { title: "Campaigns", text: "Academy, exam coaching, NIDUS Guru and assessment campaigns.", href: "#sales-booster", icon: Megaphone, status: "Manage" },
      { title: "Creative Library", text: "Posters, videos, brochures and reels.", href: "/media-library", icon: FileArchive, status: "Manage" },
      { title: "Social Media", text: "Facebook, Instagram, Threads and YouTube posting.", href: "#sales-booster", icon: MessageCircle, status: "Manage" },
      { title: "WhatsApp Campaigns", text: "Bulk messages, templates and counsellor routing.", href: "#sales-booster", icon: MessageCircle, status: "Manage" },
      { title: "Campaign Leads", text: "Track campaign-wise leads and source quality.", href: "/crm/leads", icon: UserPlus, status: "Monitor" },
      { title: "Marketing Reports", text: "Reach, engagement, conversion and best creatives.", href: "#sales-booster", icon: BarChart3, status: "Monitor" },
    ],
  },
  {
    title: "HRM",
    label: "Employees and team",
    text: "Create employees, generate credentials, assign roles and archive safely.",
    icon: Users,
    accent: "from-emerald-100 via-white to-slate-100",
    subAreas: [
      { title: "Employee Control", text: "Add teachers, heads, trainers, admin and staff.", href: "/dashboard/director/management", icon: UserPlus, status: "Ready" },
      { title: "Credentials", text: "Generate login, reset password and manage access.", href: "/dashboard/director/management", icon: KeyRound, status: "Ready" },
      { title: "Roles & Departments", text: "Assign role, department, dashboard and access level.", href: "/dashboard/director/management", icon: ShieldCheck, status: "Ready" },
      { title: "Full-Time / Part-Time / Hourly", text: "Manage employment type and hourly trainers.", href: "/dashboard/director/management", icon: Users, status: "Ready" },
      { title: "Attendance & Leave", text: "Staff attendance, leave and approvals.", href: "/dashboard/director/management#attendance", icon: CalendarDays, status: "Manage" },
      { title: "Performance Review", text: "Class completion, student feedback and staff output.", href: "/dashboard/director/management#performance", icon: PieChart, status: "Monitor" },
      { title: "Archive History", text: "Archive employees safely instead of deleting.", href: "/dashboard/director/management", icon: FileArchive, status: "Ready" },
    ],
  },
  {
    title: "Admin & Accounts",
    label: "Finance and operations",
    text: "Monitor payments, invoices, expenses, subscriptions, reports and system settings.",
    icon: WalletCards,
    accent: "from-slate-100 via-white to-amber-100",
    subAreas: [
      { title: "Fee Management", text: "Course fees, student payments and pending dues.", href: "/fees", icon: BadgeIndianRupee, status: "Ready" },
      { title: "Invoices & Receipts", text: "Generate and track payment receipts.", href: "/invoices", icon: ReceiptText, status: "Ready" },
      { title: "Expenses", text: "Office, salary, rent, marketing and operations.", href: "/dashboard/director/accounts#expenses", icon: CreditCard, status: "Manage" },
      { title: "Subscriptions", text: "Assessments, exam coaching and premium module subscriptions.", href: "/subscriptions", icon: WalletCards, status: "Ready" },
      { title: "Reports & Launch QA", text: "Academic, admissions, marketing, finance, staff reports and launch checklist.", href: "/dashboard/director/launch-qa", icon: BarChart3, status: "Ready" },
      { title: "Settings", text: "Company details, contact number and system controls.", href: "/dashboard/director/accounts#settings", icon: Settings, status: "Ready" },
      { title: "Audit Logs", text: "Track important staff and management actions.", href: "/admin-center/audit-logs", icon: FileText, status: "Monitor" },
    ],
  },
];

export default function DirectorDashboardPage() {
  const [selectedArea, setSelectedArea] = useState<DirectorArea>(directorAreas[0]);
  const SelectedIcon = selectedArea.icon;
  const directorQuery = useQuery({ queryKey: ["dashboard", "director", "command-room"], queryFn: getDirectorDashboard });
  const attendanceQuery = useQuery({ queryKey: ["academy", "attendance-summary", "director-command"], queryFn: () => getAttendanceSummary() });
  const assignmentQuery = useQuery({ queryKey: ["academy", "assignment-summary", "director-command"], queryFn: () => getAssignmentSummary() });
  const materialQuery = useQuery({ queryKey: ["academy", "material-summary", "director-command"], queryFn: () => getMaterialSummary() });
  const examQuery = useQuery({ queryKey: ["academy", "exam-summary", "director-command"], queryFn: () => getExamSummary() });
  const syllabusQuery = useQuery({ queryKey: ["academy", "syllabus-summary", "director-command"], queryFn: () => getSyllabusSummary() });
  const director = directorQuery.data;
  const commandCenter = director?.commandCenter;
  const areaMetrics = metricsForArea(selectedArea.title, {
    director,
    attendance: attendanceQuery.data?.summary,
    assignments: assignmentQuery.data?.summary,
    materials: materialQuery.data?.summary,
    exams: examQuery.data?.summary,
    syllabus: syllabusQuery.data?.summary,
  });
  const emptyStaffStatus = { active: 0, onLeave: 0, archived: 0 };
  const staffRows = [
    { label: "Academic Heads", stats: commandCenter?.staff.academicHeads ?? emptyStaffStatus },
    { label: "Teachers", stats: commandCenter?.staff.teachers ?? emptyStaffStatus },
    { label: "Physical Trainers", stats: commandCenter?.staff.physicalTrainers ?? emptyStaffStatus },
    { label: "Administrative Officers", stats: commandCenter?.staff.administrativeOfficers ?? emptyStaffStatus },
    { label: "BDEs", stats: commandCenter?.staff.businessDevelopmentExecutives ?? emptyStaffStatus }
  ];

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white/90 shadow-xl">
          <div className="relative p-6 md:p-10">
            <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] md:block" />
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Director Command Room</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              Manage the whole company from five clear areas.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-blue)]">
              A simple glossy control room for Academics, Administrative Officer, Advertisement & Marketing, HRM, and Admin & Accounts.
            </p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <CommandMetric label="Students" value={director?.instituteAnalytics.students ?? 0} />
          <CommandMetric label="Teachers" value={director?.instituteAnalytics.teachers ?? 0} />
          <CommandMetric label="Admissions" value={director?.admissionsAnalytics.admissions ?? 0} />
          <CommandMetric label="Collected" value={`Rs ${(director?.revenueAnalytics.collected ?? 0).toLocaleString()}`} />
          <CommandMetric label="Academic Completion" value={`${syllabusQuery.data?.summary.completionPercentage ?? 0}%`} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-xl md:p-7">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Academy Overview</p>
                <h2 className="mt-3 text-3xl font-black text-[var(--navy)]">Director command center</h2>
              </div>
              <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">Real Data</span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <CommandPanel
                title="Admissions"
                rows={[
                  ["New Leads", commandCenter?.admissions.newLeads ?? director?.admissionsAnalytics.leads ?? 0],
                  ["Ready For Admission", commandCenter?.admissions.readyForAdmission ?? 0],
                  ["Activated Students", commandCenter?.admissions.activatedStudents ?? 0]
                ]}
              />
              <CommandPanel
                title="Academics"
                rows={[
                  ["Active Programs", commandCenter?.academics.activePrograms ?? director?.academyArchitecture.programs ?? 0],
                  ["Active Batches", commandCenter?.academics.activeBatches ?? director?.academyArchitecture.batches ?? 0],
                  ["Teachers", commandCenter?.academics.teachers ?? director?.instituteAnalytics.teachers ?? 0],
                  ["Academic Heads", commandCenter?.academics.academicHeads ?? 0]
                ]}
              />
              <CommandPanel
                title="Learning"
                rows={[
                  ["Live Classes", commandCenter?.learning.liveClasses ?? 0],
                  ["Lessons Uploaded", commandCenter?.learning.lessonsUploaded ?? materialQuery.data?.summary.total ?? 0],
                  ["Exams Published", commandCenter?.learning.examsPublished ?? examQuery.data?.summary.exams ?? 0],
                  ["Assignments Published", commandCenter?.learning.assignmentsPublished ?? assignmentQuery.data?.summary.assignments ?? 0]
                ]}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-xl md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Operational Alerts</p>
            <h2 className="mt-3 text-3xl font-black text-[var(--navy)]">Attention needed</h2>
            <div className="mt-6 grid gap-3">
              {[
                ["Pending Admissions", commandCenter?.operationalAlerts.pendingAdmissions ?? 0],
                ["Pending Documents", commandCenter?.operationalAlerts.pendingDocuments ?? 0],
                ["Pending Fees", commandCenter?.operationalAlerts.pendingFees ?? 0],
                ["Pending Batch Allocation", commandCenter?.operationalAlerts.pendingBatchAllocation ?? 0],
                ["Low Attendance Alerts", commandCenter?.operationalAlerts.lowAttendanceAlerts ?? 0],
                ["Exam Publication Delays", commandCenter?.operationalAlerts.examPublicationDelays ?? 0]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
                  <span className="text-sm font-black text-[var(--navy)]">{label}</span>
                  <span className="rounded-full border border-[var(--gold-border)] bg-white px-3 py-1 text-sm font-black text-[var(--navy)]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-xl md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Staff Overview</p>
            <h2 className="mt-3 text-2xl font-black text-[var(--navy)]">Team status</h2>
            <div className="mt-5 space-y-3">
              {staffRows.map((row) => (
                <StaffRow key={row.label} label={row.label} active={row.stats.active} onLeave={row.stats.onLeave} archived={row.stats.archived} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-xl md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Student Overview</p>
            <h2 className="mt-3 text-2xl font-black text-[var(--navy)]">Batch and program spread</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <CommandMetric label="Total Students" value={commandCenter?.students.total ?? director?.instituteAnalytics.students ?? 0} />
              <CommandMetric label="Active Students" value={commandCenter?.students.active ?? 0} />
            </div>
            <div className="mt-5 space-y-3">
              {(commandCenter?.students.batchDistribution ?? []).slice(0, 5).map((item) => (
                <DistributionRow key={item.program} label={item.program} value={item.count} />
              ))}
              {!(commandCenter?.students.batchDistribution ?? []).length ? <EmptyCommandNote text="Batch distribution appears after students are allocated." /> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-white/95 p-5 shadow-xl md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Finance & Reports</p>
            <h2 className="mt-3 text-2xl font-black text-[var(--navy)]">Money and reports</h2>
            <div className="mt-5 grid gap-3">
              <CommandMetric label="Fees Collected" value={`Rs ${(commandCenter?.finance.feesCollected ?? director?.revenueAnalytics.collected ?? 0).toLocaleString()}`} />
              <CommandMetric label="Pending Fees" value={`Rs ${(commandCenter?.finance.pendingFees ?? director?.revenueAnalytics.pending ?? 0).toLocaleString()}`} />
              <CommandMetric label="Installments Pending" value={commandCenter?.finance.installmentsPending ?? 0} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(commandCenter?.reports ?? ["Admissions Reports", "Academic Reports", "Attendance Reports", "Student Reports", "Staff Reports"]).map((report) => (
                <span key={report} className="rounded-full border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-xs font-black text-[var(--navy)]">{report}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {directorAreas.map((area) => {
            const Icon = area.icon;
            const active = selectedArea.title === area.title;
            return (
              <button
                key={area.title}
                className={`group min-h-48 rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:p-5 ${
                  active ? "border-[var(--gold-border)] bg-white shadow-xl" : "border-[var(--border)] bg-white/80"
                }`}
                onClick={() => setSelectedArea(area)}
                type="button"
              >
                <div className={`h-full rounded-2xl bg-gradient-to-br ${area.accent} p-4 shadow-inner`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/70 shadow-sm">
                    <Icon className="h-6 w-6 text-[var(--navy)]" />
                  </div>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">{area.label}</p>
                  <h2 className="mt-2 text-xl font-black text-[var(--navy)] md:text-2xl">{area.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-blue)]">{area.text}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-xl md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Selected Area</p>
              <div className="mt-3 flex items-center gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedArea.accent} shadow-inner`}>
                  <SelectedIcon className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-black">{selectedArea.title}</h2>
                  <p className="text-sm text-[var(--muted-blue)]">{selectedArea.text}</p>
                </div>
              </div>
            </div>
            <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">
              {selectedArea.subAreas.length} controls
            </span>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {selectedArea.subAreas.map((subArea) => (
              <SubAreaCard key={subArea.title} subArea={subArea} />
            ))}
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {areaMetrics.map((metric) => (
              <CommandMetric key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>
        </section>

        <section id="sales-booster" className="rounded-3xl border border-[var(--gold-border)] bg-white/95 p-5 shadow-xl md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Sales Booster</p>
              <h2 className="mt-3 text-3xl font-black text-[var(--navy)]">Director marketing command module</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">
                Create campaigns for Academy admissions, NIDUS Exam Coaching, assessments and NIDUS Guru. Social posting and WhatsApp follow-up stay under Director control.
              </p>
            </div>
            <Link className="rounded-2xl bg-[var(--gold-gradient)] px-5 py-3 text-sm font-black text-[var(--navy)] shadow-lg" href="/dashboard/director#sales-booster">
              Open Module
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Facebook", text: "Lead ads and parent campaigns", icon: Share2 },
              { title: "Instagram", text: "Reels, stories and poster campaigns", icon: Camera },
              { title: "YouTube", text: "Campaign videos and academy proof", icon: PlayCircle },
              { title: "WhatsApp", text: "Follow-up, templates and counsellor routing", icon: MessageCircle }
            ].map((channel) => {
              const Icon = channel.icon;
              return (
                <div key={channel.title} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-white">
                    <Icon className="h-6 w-6 text-[var(--navy)]" />
                  </div>
                  <h3 className="mt-4 text-xl font-black text-[var(--navy)]">{channel.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{channel.text}</p>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

type MetricContext = {
  director?: Awaited<ReturnType<typeof getDirectorDashboard>>;
  attendance?: { percentage: number; sessions: number };
  assignments?: { assignments: number; pending: number; submitted: number };
  materials?: { total: number; pendingReview: number; approved: number };
  exams?: { exams: number; liveTests: number; submitted: number; averageScore: number };
  syllabus?: { completionPercentage: number; green: number; orange: number; red: number };
};

function metricsForArea(title: string, context: MetricContext) {
  if (title === "Academics") {
    return [
      { label: "Programs", value: context.director?.academyArchitecture.programs ?? 0 },
      { label: "Batches", value: context.director?.academyArchitecture.batches ?? 0 },
      { label: "Live Tests", value: context.exams?.liveTests ?? context.director?.academyArchitecture.liveTests ?? 0 },
      { label: "Syllabus", value: `${context.syllabus?.completionPercentage ?? 0}%` },
    ];
  }
  if (title === "Administrative Officer") {
    return [
      { label: "Leads", value: context.director?.admissionsAnalytics.leads ?? 0 },
      { label: "Admissions", value: context.director?.admissionsAnalytics.admissions ?? 0 },
      { label: "Conversion", value: `${context.director?.admissionsAnalytics.conversionRate ?? 0}%` },
      { label: "Students", value: context.director?.instituteAnalytics.students ?? 0 },
    ];
  }
  if (title === "Advertisement & Marketing") {
    return [
      { label: "Campaign Leads", value: context.director?.admissionsAnalytics.leads ?? 0 },
      { label: "Admissions", value: context.director?.admissionsAnalytics.admissions ?? 0 },
      { label: "Conversion", value: `${context.director?.admissionsAnalytics.conversionRate ?? 0}%` },
      { label: "Forecast", value: `Rs ${(context.director?.revenueAnalytics.forecast ?? 0).toLocaleString()}` },
    ];
  }
  if (title === "HRM") {
    return [
      { label: "Faculty", value: context.director?.facultyAnalytics.active ?? 0 },
      { label: "Utilization", value: `${context.director?.facultyAnalytics.utilization ?? 0}%` },
      { label: "Review Due", value: context.director?.facultyAnalytics.reviewDue ?? 0 },
      { label: "Attendance", value: `${context.attendance?.percentage ?? 0}%` },
    ];
  }
  return [
    { label: "Collected", value: `Rs ${(context.director?.revenueAnalytics.collected ?? 0).toLocaleString()}` },
    { label: "Pending", value: `Rs ${(context.director?.revenueAnalytics.pending ?? 0).toLocaleString()}` },
    { label: "Forecast", value: `Rs ${(context.director?.revenueAnalytics.forecast ?? 0).toLocaleString()}` },
    { label: "Transactions", value: context.exams?.submitted ?? 0 },
  ];
}

function CommandMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[var(--navy)]">{value}</p>
    </div>
  );
}

function CommandPanel({ title, rows }: { title: string; rows: Array<[string, string | number]> }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-5">
      <h3 className="text-xl font-black text-[var(--navy)]">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0">
            <span className="text-sm font-semibold text-[var(--muted-blue)]">{label}</span>
            <span className="text-lg font-black text-[var(--navy)]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffRow({ label, active, onLeave, archived }: { label: string; active: number; onLeave: number; archived: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-black text-[var(--navy)]">{label}</span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">{active} active</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-800">{onLeave} on leave</span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">{archived} archived</span>
      </div>
    </div>
  );
}

function DistributionRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3">
      <span className="text-sm font-black text-[var(--navy)]">{label}</span>
      <span className="rounded-full border border-[var(--gold-border)] bg-white px-3 py-1 text-sm font-black text-[var(--navy)]">{value}</span>
    </div>
  );
}

function EmptyCommandNote({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-4 text-sm font-semibold text-[var(--muted-blue)]">{text}</p>;
}

function SubAreaCard({ subArea }: { subArea: DirectorSubArea }) {
  const Icon = subArea.icon;
  const status = subArea.status ?? "Ready";
  const statusClass =
    status === "Ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "Manage"
        ? "border-orange-200 bg-orange-50 text-orange-800"
        : "border-sky-200 bg-sky-50 text-sky-800";
  return (
    <Link
      className="group rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--gold-border)] hover:shadow-xl"
      href={subArea.href}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] shadow-inner">
          <Icon className="h-6 w-6 text-[var(--navy)]" />
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${statusClass}`}>
          {status}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-black text-[var(--navy)]">{subArea.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">{subArea.text}</p>
      <span className="mt-5 inline-flex font-black text-[var(--navy)]">Open +</span>
    </Link>
  );
}
