import { redirect } from "next/navigation";

export default async function AcademicHeadCourseDetailPage({ params }: { params: Promise<{ courseKey: string }> }) {
  const { courseKey } = await params;
  redirect(`/dashboard/academic-head/my-classes/${encodeURIComponent(courseKey)}`);
}
