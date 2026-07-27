import { redirect } from "next/navigation";

export default function DirectorTeacherPerformanceRedirectPage() {
  redirect("/dashboard/director/academic/reports");
}
