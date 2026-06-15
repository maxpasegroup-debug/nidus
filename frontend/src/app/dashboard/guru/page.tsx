import { redirect } from "next/navigation";

export default function GuruDashboardRedirectPage() {
  redirect("/dashboard/student#nidus-guru");
}
