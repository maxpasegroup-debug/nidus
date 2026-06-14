import TeacherDashboardClient from "../../../TeacherDashboardClient";

export default async function TeacherBatchDetailPage({ params }: { params: Promise<{ courseKey: string; batchId: string }> }) {
  const { courseKey, batchId } = await params;
  return <TeacherDashboardClient view="classes" courseKey={courseKey} batchId={batchId} />;
}
