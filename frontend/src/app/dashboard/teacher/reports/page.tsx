import TeacherDashboardClient from "../TeacherDashboardClient";
import { ExecutiveIntelligenceSystem, ReportQuestionCards } from "@/components/reporting/executive-intelligence-system";

export default function TeacherReportsPage() {
  return (
    <>
      <main className="bg-[var(--page-bg)] px-4 pt-4 md:px-6">
        <section className="mx-auto max-w-[1500px]">
          <ExecutiveIntelligenceSystem
            role="TEACHER"
            title="Teacher Intelligence"
            description="My classes, attendance trends, assignment completion, quiz results, weak students, top performers and lesson completion stay connected to the current teacher workspace."
            metrics={[
              { label: "My Classes", value: "Live", note: "Loaded in the teacher workspace below", tone: "info" },
              { label: "Attendance Trends", value: "Reports", note: "Use class and student views", tone: "info" },
              { label: "Assignments", value: "Queue", note: "Completion and evaluation signals", tone: "warning" },
              { label: "Lesson Completion", value: "Track", note: "Completion logs remain in class workflow", tone: "success" },
            ]}
            insights={[
              { title: "What happened?", detail: "Teacher report data continues to load through the existing teacher dashboard client.", tone: "info" },
              { title: "What needs attention?", detail: "Open students, assignments and exams below to review weak students and pending evaluations.", href: "/dashboard/teacher/reports", tone: "warning" },
              { title: "What should I do next?", detail: "Use the connected report links before making class or evaluation updates.", href: "/dashboard/teacher/classes", tone: "info" },
            ]}
          >
            <ReportQuestionCards />
          </ExecutiveIntelligenceSystem>
        </section>
      </main>
      <TeacherDashboardClient view="students" />
    </>
  );
}
