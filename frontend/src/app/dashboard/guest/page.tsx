import { redirect } from "next/navigation";

export default function LearnerDashboardRedirectPage() {
  redirect("/dashboard/student");
}
