import { TopRankPublicLayout, TopRankSection } from "@/components/toprank";
import { TopRankForgotPasswordForm } from "@/components/toprank/toprank-auth-forms";

export default function TopRankForgotPasswordPage() {
  return (
    <TopRankPublicLayout>
      <TopRankSection eyebrow="Account recovery" title="Forgot Password">
        <TopRankForgotPasswordForm />
      </TopRankSection>
    </TopRankPublicLayout>
  );
}
