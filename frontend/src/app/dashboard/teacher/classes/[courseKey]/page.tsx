import TeacherDashboardClient from "../../TeacherDashboardClient";

export default async function TeacherCourseDetailPage({ params }: { params: Promise<{ courseKey: string }> }) {
  const { courseKey } = await params;
  return <TeacherDashboardClient view="classes" courseKey={courseKey} />;
}
