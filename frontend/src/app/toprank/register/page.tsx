import { TopRankPublicLayout, TopRankSection } from "@/components/toprank";
import { TopRankRegisterForm } from "@/components/toprank/toprank-auth-forms";

export default function TopRankRegisterPage() {
  return (
    <TopRankPublicLayout>
      <TopRankSection eyebrow="Create account" title="Register for TopRank">
        <TopRankRegisterForm />
      </TopRankSection>
    </TopRankPublicLayout>
  );
}
