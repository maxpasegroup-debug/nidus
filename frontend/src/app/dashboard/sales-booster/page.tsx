import { redirect } from "next/navigation";

export default function SalesBoosterDashboardRedirectPage() {
  redirect("/dashboard/business-development?tab=PIPELINE");
}
