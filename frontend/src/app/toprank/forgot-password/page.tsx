import { TopRankPublicLayout, TopRankSection } from "@/components/toprank";

export default function TopRankForgotPasswordPage() {
  return (
    <TopRankPublicLayout>
      <TopRankSection eyebrow="Account recovery" title="Forgot Password">
        <form className="mx-auto grid max-w-xl gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-6">
          <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Email<input type="email" className="min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]" /></label>
          <button type="button" className="min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">Send Reset Link</button>
        </form>
      </TopRankSection>
    </TopRankPublicLayout>
  );
}
