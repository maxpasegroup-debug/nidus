import { redirect } from "next/navigation";

export default async function AcademicHeadBatchDetailPage({ params }: { params: Promise<{ courseKey: string; batchId: string }> }) {
  await params;

  redirect("/dashboard/academic-head/hod/batches");
}
