import { Suspense } from "react";
import { TeacherReviewWorkspace } from "@/components/ndie/teacher-review-workspace";

export default async function TeacherNdieReviewPage({ searchParams }: { searchParams: Promise<{ importId?: string }> }) {
  const params = await searchParams;
  return (
    <Suspense>
      <TeacherReviewWorkspace importId={params.importId || ""} />
    </Suspense>
  );
}
