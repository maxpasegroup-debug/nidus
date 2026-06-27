import TeacherDashboardClient from "../../teacher/TeacherDashboardClient";

export default function AcademicHeadMyClassesPage() {
  return <TeacherDashboardClient view="classes" classesMode="CATALOG" />;
}
