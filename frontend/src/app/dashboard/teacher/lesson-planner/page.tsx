import { LessonPlannerPage } from "@/components/teacher/lesson-planner-page";

export default function TeacherLessonPlannerRoute() {
  return <LessonPlannerPage role="TEACHER" backHref="/dashboard/teacher/workspace" />;
}
