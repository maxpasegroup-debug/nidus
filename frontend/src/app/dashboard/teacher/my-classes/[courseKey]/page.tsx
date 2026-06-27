import TeacherDashboardClient from "../../TeacherDashboardClient";

export default async function TeacherMyClassesCoursePage({ params }: { params: Promise<{ courseKey: string }> }) {
  const { courseKey } = await params;
  return <TeacherDashboardClient view="classes" courseKey={courseKey} classesMode="CATALOG" />;
}
