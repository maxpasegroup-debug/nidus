"use client";

import { useParams } from "next/navigation";
import { EmptyState, RoleDashboardGuard } from "@/components/dashboard";
import { AssessmentReportView } from "@/components/assessments/assessment-report-view";
import { buildAssessmentReport } from "@/components/assessments/assessment-catalog";

export default function AssessmentReportPage() {
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = typeof params?.assessmentId === "string" ? params.assessmentId : "";
  const report = buildAssessmentReport(assessmentId);

  return (
    <RoleDashboardGuard role={["GUEST", "STUDENT", "PARENT"]}>
      {report ? (
        <AssessmentReportView report={report} />
      ) : (
        <EmptyState title="Assessment report not found" description="Open a valid assessment from the assessment ecosystem." />
      )}
    </RoleDashboardGuard>
  );
}
