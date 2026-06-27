import TeacherDashboardClient from "../../../teacher/TeacherDashboardClient";

export default async function AcademicHeadMyClassesCoursePage({ params }: { params: Promise<{ courseKey: string }> }) {
  const { courseKey } = await params;
  return <TeacherDashboardClient view="classes" courseKey={courseKey} classesMode="CATALOG" />;
}
