import { TopRankPublicLayout, TopRankSection } from "@/components/toprank";

export default function TopRankRegisterPage() {
  return (
    <TopRankPublicLayout>
      <TopRankSection eyebrow="Create account" title="Register for TopRank">
        <form className="mx-auto grid max-w-2xl gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Name<input className="min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]" /></label>
            <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Phone<input className="min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]" /></label>
          </div>
          <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Email<input type="email" className="min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]" /></label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Password<input type="password" className="min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]" /></label>
            <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Confirm Password<input type="password" className="min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]" /></label>
          </div>
          <label className="flex items-start gap-3 text-sm leading-6 text-[#c9d0c2]"><input type="checkbox" className="mt-1" /> I agree to the TopRank terms and admission communication policy.</label>
          <button type="button" className="min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">Register</button>
        </form>
      </TopRankSection>
    </TopRankPublicLayout>
  );
}
