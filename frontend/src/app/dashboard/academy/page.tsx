import { redirect } from "next/navigation";

export default function AcademyDashboardRedirectPage() {
  redirect("/dashboard/student#classes");
}
