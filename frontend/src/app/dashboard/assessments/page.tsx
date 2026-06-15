import { redirect } from "next/navigation";

export default function AssessmentsDashboardRedirectPage() {
  redirect("/dashboard/student#assessments");
}
