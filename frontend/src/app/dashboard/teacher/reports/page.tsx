import Link from "next/link";
import { CalendarCheck, ClipboardList, FileText, Users } from "lucide-react";
import TeacherDashboardClient from "../TeacherDashboardClient";

const reportActions = [
  { label: "Class Attendance", href: "/dashboard/teacher/attendance", icon: CalendarCheck },
  { label: "Student Progress", href: "/dashboard/teacher/students", icon: Users },
  { label: "Homework Review", href: "/dashboard/teacher/assignments", icon: ClipboardList },
  { label: "Exam Results", href: "/dashboard/teacher/exams", icon: FileText },
];

export default function TeacherReportsPage() {
  return (
    <>
      <main className="bg-[var(--page-bg)] px-4 pt-4 md:px-6">
        <section className="mx-auto max-w-[1500px] rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">My Class Reports</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-[var(--ink)]">Check students and class work</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Use these simple report buttons to check attendance, homework, exams and student progress.
              </p>
            </div>
            <Link href="/dashboard/teacher" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-black">
              Back to Dashboard
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {reportActions.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="flex min-h-24 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4 text-sm font-black hover:border-slate-950">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-950">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <TeacherDashboardClient view="students" />
    </>
  );
}
