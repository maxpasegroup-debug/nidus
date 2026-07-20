import { TopRankPublicLayout, TopRankSection } from "@/components/toprank";
import { TopRankLoginForm } from "@/components/toprank/toprank-auth-forms";

export default function TopRankLoginPage() {
  return (
    <TopRankPublicLayout>
      <TopRankSection eyebrow="Gateway access" title="Login to TopRank">
        <TopRankLoginForm />
      </TopRankSection>
    </TopRankPublicLayout>
  );
}
