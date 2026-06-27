import TeacherDashboardClient from "../../../../teacher/TeacherDashboardClient";

export default async function AcademicHeadMyClassesBatchPage({ params }: { params: Promise<{ courseKey: string; batchId: string }> }) {
  const { courseKey, batchId } = await params;
  return <TeacherDashboardClient view="classes" courseKey={courseKey} batchId={batchId} classesMode="CATALOG" />;
}
