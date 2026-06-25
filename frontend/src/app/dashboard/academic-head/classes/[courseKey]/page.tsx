import { redirect } from "next/navigation";

export default async function AcademicHeadCourseDetailPage({ params }: { params: Promise<{ courseKey: string }> }) {
  await params;

  redirect("/dashboard/academic-head/hod/batches");
}
