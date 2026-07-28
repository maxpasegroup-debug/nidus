import { redirect } from "next/navigation";

export default async function AcademicHeadBatchDetailPage({ params }: { params: Promise<{ courseKey: string; batchId: string }> }) {
  const { courseKey, batchId } = await params;
  redirect(`/dashboard/academic-head/my-classes/${encodeURIComponent(courseKey)}/${encodeURIComponent(batchId)}`);
}
