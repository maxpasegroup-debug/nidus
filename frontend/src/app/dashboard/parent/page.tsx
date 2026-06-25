"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  HeartPulse,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DashboardError,
  DashboardSkeleton,
  RoleDashboardGuard
} from "@/components/dashboard";
import { useParentDashboard } from "@/hooks/use-dashboard";
import type { ParentDashboardData } from "@/services/dashboard";

type MetricCardProps = {
  label: string;
  value: string | number;
  note: string;
  tone?: "good" | "warn" | "quiet";
};

function metricTone(tone: MetricCardProps["tone"]) {
  if (tone === "good") return "bg-emerald-50 text-emerald-900";
  if (tone === "warn") return "bg-amber-50 text-amber-950";
  return "bg-slate-50 text-slate-950";
}

function MetricCard({ label, value, note, tone = "quiet" }: MetricCardProps) {
  return (
    <div className="rounded-[8px] border border-slate-950 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-600">{label}</p>
      <div className={`mt-4 inline-flex min-w-20 items-center justify-center rounded-[8px] px-4 py-3 text-3xl font-black ${metricTone(tone)}`}>
        {value}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{note}</p>
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-[8px] border border-slate-950 bg-white p-5 shadow-sm md:p-6">
      <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusRow({ title, detail, value }: { title: string; detail: string; value?: string | number }) {
  return (
    <div className="flex flex-col gap-3 rounded-[8px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-700">{detail}</p>
      </div>
      {value !== undefined ? (
        <span className="rounded-full border border-slate-950 bg-white px-4 py-2 text-sm font-black text-slate-950">{value}</span>
      ) : null}
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
      <b className="text-slate-950">{title}</b>
      <br />
      {detail}
    </div>
  );
}

function attendanceTone(percentage: number): MetricCardProps["tone"] {
  if (percentage >= 85) return "good";
  if (percentage >= 75) return "quiet";
  return "warn";
}

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function buildTodayActions(data: ParentDashboardData) {
  const pendingAssignments = data.assignments?.pending ?? 0;
  const feeDue = data.feeStatus.dueAmount ?? 0;
  const attendance = data.attendance.percentage ?? 0;
  const examAverage = data.exams?.averageScore ?? data.studentPerformance.averageScore ?? 0;

  return [
    {
      title: pendingAssignments > 0 ? "Homework pending" : "Homework clear",
      detail: pendingAssignments > 0 ? `${pendingAssignments} assignment(s) need attention.` : "No pending homework is reported now.",
      value: pendingAssignments
    },
    {
      title: attendance < 75 ? "Attendance needs attention" : "Attendance is under watch",
      detail: `${data.attendance.present}/${data.attendance.total} sessions marked. Keep the student above 75%.`,
      value: `${attendance}%`
    },
    {
      title: feeDue > 0 ? "Fee payment pending" : "Fees clear",
      detail: feeDue > 0 ? `Next due date: ${data.feeStatus.nextDueDate}.` : "No pending fee amount is shown.",
      value: feeDue > 0 ? `Rs ${feeDue}` : "Clear"
    },
    {
      title: "Exam performance",
      detail: `${data.exams?.submitted ?? 0} submitted exam(s). Track weak areas after every test.`,
      value: `${examAverage}%`
    }
  ];
}

export default function ParentDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useParentDashboard();

  if (isLoading) {
    return (
      <RoleDashboardGuard role="PARENT">
        <DashboardSkeleton />
      </RoleDashboardGuard>
    );
  }

  if (error || !data) {
    return (
      <RoleDashboardGuard role="PARENT">
        <DashboardError error={error} onRefresh={() => refetch()} />
      </RoleDashboardGuard>
    );
  }

  const linkedStudent = data.linkedStudent;
  const assessmentProfile = data.assessmentProfile;
  const todayActions = buildTodayActions(data);
  const pendingAssignments = data.assignments?.pending ?? 0;
  const assignmentTotal = data.assignments?.total ?? 0;
  const submittedAssignments = data.assignments?.submitted ?? 0;
  const examAverage = data.exams?.averageScore ?? data.studentPerformance.averageScore ?? 0;
  const feeDue = data.feeStatus.dueAmount ?? 0;

  return (
    <RoleDashboardGuard role="PARENT">
      <motion.main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6 lg:px-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <section className="rounded-[8px] border border-slate-950 bg-white p-6 shadow-sm md:p-8" id="today">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-slate-700">Parent Command View</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-slate-950 md:text-6xl">
                {linkedStudent ? `${linkedStudent.name}'s academy update.` : "Link a student to start monitoring."}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
                Attendance, homework, exams, progress, fees and academy notices in one simple parent view.
              </p>
            </div>
            <div className="rounded-[8px] border border-slate-950 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-700">Linked Student</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">{linkedStudent?.name ?? "No student linked"}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {linkedStudent ? `${linkedStudent.mobile ?? linkedStudent.email ?? "Student account linked"}` : "Ask the student to send a parent invitation from their account."}
              </p>
              <Button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-5 w-full">
                {isFetching ? "Refreshing..." : "Refresh Parent View"}
              </Button>
            </div>
          </div>
        </section>

        {!linkedStudent ? (
          <section className="rounded-[8px] border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <div className="flex gap-3">
              <AlertCircle className="mt-1 h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-black">Parent access is not active yet</h2>
                <p className="mt-1 text-sm leading-6">The parent dashboard stays read-only and empty until a student account is linked by invitation.</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Attendance" value={`${data.attendance.percentage}%`} note={`${data.attendance.present}/${data.attendance.total} sessions marked`} tone={attendanceTone(data.attendance.percentage)} />
          <MetricCard label="Homework" value={`${submittedAssignments}/${assignmentTotal}`} note={`${pendingAssignments} pending assignment(s)`} tone={pendingAssignments === 0 ? "good" : "warn"} />
          <MetricCard label="Exam Score" value={`${examAverage}%`} note={`${data.exams?.submitted ?? 0} submitted exam(s)`} tone={examAverage >= 70 ? "good" : "quiet"} />
          <MetricCard label="Fees" value={feeDue > 0 ? `Rs ${feeDue}` : "Clear"} note={data.feeStatus.nextDueDate ?? data.feeStatus.status} tone={feeDue > 0 ? "warn" : "good"} />
        </section>

        <Section id="notifications" eyebrow="Today" title="What needs parent attention">
          <div className="grid gap-3 md:grid-cols-2">
            {todayActions.map((item) => (
              <StatusRow key={item.title} title={item.title} detail={item.detail} value={item.value} />
            ))}
          </div>
        </Section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Section id="attendance" eyebrow="Attendance" title="Attendance and leave visibility">
            <div className="grid gap-3">
              <StatusRow title="Attendance percentage" detail="This is the official academy attendance visible to parent." value={`${data.attendance.percentage}%`} />
              <StatusRow title="Present sessions" detail="Classes where student was marked present." value={data.attendance.present} />
              <StatusRow title="Total sessions" detail="All sessions recorded by faculty." value={data.attendance.total} />
              {(data.attendance.recent ?? []).slice(0, 5).map((item, index) => (
                <StatusRow
                  key={`${item.date}-${index}`}
                  title={item.subject ?? item.batchName ?? "Class attendance"}
                  detail={`${item.status} on ${formatDate(item.date)}`}
                />
              ))}
              {data.attendance.recent?.length ? null : <EmptyState title="No recent attendance yet" detail="Attendance will appear here after teachers mark class registers." />}
            </div>
          </Section>

          <Section id="assignments" eyebrow="Assignments" title="Homework tracking">
            <div className="grid gap-3">
              <StatusRow title="Submitted homework" detail="Assignments already turned in by the student." value={submittedAssignments} />
              <StatusRow title="Pending homework" detail="Assignments that need parent follow-up." value={pendingAssignments} />
              {(data.assignments?.recent ?? []).slice(0, 5).map((item) => (
                <StatusRow
                  key={item.id}
                  title={item.title}
                  detail={`${item.status}${item.dueDate ? ` / due ${formatDate(item.dueDate)}` : ""}${item.subject ? ` / ${item.subject}` : ""}`}
                  value={item.score !== null && item.score !== undefined ? `${item.score}` : undefined}
                />
              ))}
              {data.assignments?.recent?.length ? null : <EmptyState title="No assignments yet" detail="Published homework will appear here with submission status." />}
            </div>
          </Section>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Section id="exams" eyebrow="Exams" title="Exam performance">
            <div className="grid gap-3">
              <StatusRow title="Average score" detail="Current exam performance across submitted exams." value={`${examAverage}%`} />
              <StatusRow title="Published exams" detail="Exams made available to the student." value={data.exams?.published ?? 0} />
              <StatusRow title="Submitted exams" detail="Exams attempted by the student." value={data.exams?.submitted ?? 0} />
              {(data.exams?.recent ?? []).slice(0, 5).map((item) => (
                <StatusRow
                  key={item.id}
                  title="Recent exam"
                  detail={`${item.status}${item.submittedAt ? ` / submitted ${formatDate(item.submittedAt)}` : ""}`}
                  value={item.score !== null && item.score !== undefined ? `${item.score}%` : undefined}
                />
              ))}
              {data.exams?.recent?.length ? null : <EmptyState title="No exams submitted yet" detail="Exam results will appear after student attempts published exams." />}
            </div>
          </Section>

          <Section id="fees" eyebrow="Fees" title="Fee and receipt watch">
            <div className="grid gap-3">
              <StatusRow title="Fee status" detail="Administrative Officer recorded fee position." value={data.feeStatus.status} />
              <StatusRow title="Pending amount" detail="Amount currently pending in academy accounts." value={`Rs ${feeDue}`} />
              <StatusRow title="Next due date" detail="Upcoming fee reminder date." value={data.feeStatus.nextDueDate} />
              {(data.feeStatus.installments ?? []).slice(0, 4).map((fee) => (
                <StatusRow key={fee.id} title={fee.title} detail={`${fee.paidStatus} / due ${formatDate(fee.dueDate)}`} value={`Rs ${fee.dueAmount || fee.amount - fee.paidAmount}`} />
              ))}
            </div>
          </Section>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Section id="progress" eyebrow="Progress" title="Student growth summary">
            <div className="grid gap-3">
              <StatusRow title="Academic score" detail={`${data.studentPerformance.improvement}% improvement this month.`} value={`${data.studentPerformance.averageScore}%`} />
              <StatusRow title="Discipline" detail={data.disciplineScore.notes} value={data.disciplineScore.grade} />
              <StatusRow title="Fitness" detail={data.fitness ? `BMI ${data.fitness.bmi} / Run ${data.fitness.runningTime} min / ${data.fitness.fitnessLevel}` : "Fitness profile pending."} value={data.fitness ? `${Math.round(data.fitness.staminaScore)}%` : "Pending"} />
              <StatusRow title="Assessment profile" detail={assessmentProfile?.latestReport?.title ?? "Assessment reports pending."} value={assessmentProfile ? `${assessmentProfile.completedCount}/${assessmentProfile.totalAssessments}` : "0/15"} />
            </div>
          </Section>

          <Section id="reports" eyebrow="Reports" title="Assessment report guidance">
            <div className="grid gap-3 md:grid-cols-2">
              {(assessmentProfile?.completed ?? []).slice(0, 4).map((report) => (
                <div key={report.attemptId} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                  <FileText className="h-5 w-5 text-slate-950" />
                  <h3 className="mt-3 font-black text-slate-950">{report.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{report.score}/100 / {report.readinessBand}</p>
                </div>
              ))}
              {assessmentProfile?.completed?.length ? null : (
                <EmptyState title="No reports completed" detail="Psychometric and readiness reports will appear here after student completion." />
              )}
            </div>
          </Section>
        </section>

        <Section id="quick-actions" eyebrow="Parent Guide" title="How to use this dashboard">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Start with attendance", detail: "Low attendance is the first warning signal for discipline and performance." },
              { icon: ClipboardList, title: "Check homework", detail: "Pending assignments tell you where the student needs daily follow-up." },
              { icon: GraduationCap, title: "Watch exams", detail: "Use exam scores to understand weak topics and improvement direction." },
              { icon: CreditCard, title: "Track fees", detail: "Fee and receipt status stays visible without calling the office." },
              { icon: HeartPulse, title: "Fitness matters", detail: "Defence readiness includes stamina, BMI and consistency." },
              { icon: BookOpen, title: "Ask for reports", detail: "Use assessment reports during parent-teacher counselling." },
              { icon: CalendarDays, title: "Follow dates", detail: "Due dates and scheduled actions should guide home routines." },
              { icon: Bell, title: "Read notices", detail: "Notifications are the official parent communication channel." }
            ].map((item) => (
              <div key={item.title} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                <item.icon className="h-5 w-5 text-slate-950" />
                <h3 className="mt-3 font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="notifications-list" eyebrow="Notifications" title="Academy messages">
          <div className="grid gap-3">
            {(data.notifications ?? []).slice(0, 8).map((message) => (
              <StatusRow key={message} title="Academy update" detail={message} />
            ))}
            {data.notifications?.length ? null : <EmptyState title="No notices now" detail="Important updates from the academy will appear here." />}
          </div>
        </Section>
      </motion.main>
    </RoleDashboardGuard>
  );
}
