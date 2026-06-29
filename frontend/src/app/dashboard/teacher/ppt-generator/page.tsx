import { PptGeneratorPage } from "@/components/teacher/ppt-generator-page";

export default function TeacherPptGeneratorRoute() {
  return <PptGeneratorPage role="TEACHER" backHref="/dashboard/teacher/workspace" />;
}
