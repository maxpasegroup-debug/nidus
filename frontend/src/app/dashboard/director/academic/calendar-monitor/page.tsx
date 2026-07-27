import { redirect } from "next/navigation";

export default function DirectorCalendarMonitorRedirectPage() {
  redirect("/dashboard/director/academic/reports");
}
