import { TopRankMissionDetailClient } from "@/components/toprank/toprank-mission-detail-client";

export default async function TopRankMissionDetailPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  return <TopRankMissionDetailClient missionId={missionId} />;
}

