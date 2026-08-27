"use client";
import { useSearchParams } from "next/navigation";
import { DirectorExamControl } from "./director-exam-control";
import { SimpleExamStudio } from "@/components/teacher/simple-exam-studio";

export function DirectorExamsWorkspace() {
  const params = useSearchParams();
  if (params?.get("create") === "1") return <SimpleExamStudio initialStage="essentials" />;
  const resume = params?.get("resume");
  if (resume) return <SimpleExamStudio initialTestId={resume} initialStage={(params?.get("stage") || "essentials") as "essentials" | "upload" | "review" | "release"} />;
  return <DirectorExamControl />;
}
