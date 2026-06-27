import TeacherDashboardClient from "../TeacherDashboardClient";

export default function TeacherMyClassesPage() {
  return <TeacherDashboardClient view="classes" classesMode="CATALOG" />;
}
