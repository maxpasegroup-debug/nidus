import Link from "next/link";
import { BarChart3, CalendarCheck, ClipboardList, FileText, UserCheck, Users } from "lucide-react";

const reportActions = [
  { label: "Attendance", description: "Open class attendance history and edit saved registers.", href: "/dashboard/teacher/attendance", icon: CalendarCheck },
  { label: "Students", description: "Open student profiles, login details and progress records.", href: "/dashboard/teacher/students", icon: Users },
  { label: "Homework", description: "Check published homework and class submissions.", href: "/dashboard/teacher/assignments", icon: ClipboardList },
  { label: "Exams", description: "Review hosted exams, drafts and results.", href: "/dashboard/teacher/exams", icon: FileText },
  { label: "NDP Progress", description: "Enter or review term-wise student performance.", href: "/dashboard/teacher/ndp", icon: UserCheck },
  { label: "Today", description: "Return to the daily teacher command view.", href: "/dashboard/teacher", icon: BarChart3 },
];

export default function TeacherReportsPage() {
  return (
      <main className="bg-[var(--page-bg)] px-4 py-4 md:px-6">
        <section className="mx-auto max-w-[1500px] rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">My Class Reports</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-[var(--ink)]">Reports</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">
                Open the exact report you need. No technical dashboard, no duplicate student page below.
              </p>
            </div>
            <Link href="/dashboard/teacher" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-black">
              Back to Dashboard
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {reportActions.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="flex min-h-28 items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-4 text-sm font-black transition hover:-translate-y-0.5 hover:border-slate-950">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-950">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-base">{item.label}</span>
                    <span className="mt-1 block text-sm font-semibold leading-6 text-[var(--muted-blue)]">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
  );
}
