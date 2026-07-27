import { redirect } from "next/navigation";

export default function DirectorSyllabusRedirectPage() {
  redirect("/dashboard/director/academic/reports");
}
