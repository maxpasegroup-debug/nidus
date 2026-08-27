import { Suspense } from "react";
import { DirectorExamsWorkspace } from "@/components/director/director-exams-workspace";

export default function DirectorExamsPage() {
  return <Suspense fallback={<main className="p-8 text-sm">Loading Exam Control…</main>}><DirectorExamsWorkspace /></Suspense>;
}
