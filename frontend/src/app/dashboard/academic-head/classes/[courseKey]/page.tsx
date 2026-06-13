import TeacherDashboardClient from "../../../teacher/TeacherDashboardClient";

export default async function AcademicHeadCourseDetailPage({ params }: { params: Promise<{ courseKey: string }> }) {
  const { courseKey } = await params;

  return <TeacherDashboardClient view="classes" courseKey={courseKey} />;
}
