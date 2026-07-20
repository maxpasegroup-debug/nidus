import Link from "next/link";
import { TopRankPublicLayout, TopRankSection } from "@/components/toprank";

export default function TopRankLoginPage() {
  return (
    <TopRankPublicLayout>
      <TopRankSection eyebrow="Gateway access" title="Login to TopRank">
        <form className="mx-auto grid max-w-xl gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-6">
          <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Email<input type="email" className="min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]" /></label>
          <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Password<input type="password" className="min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]" /></label>
          <div className="flex items-center justify-between gap-4">
            <Link href="/toprank/forgot-password" className="text-sm font-bold text-[#f6d17a]">Forgot Password</Link>
            <button type="button" className="min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">Login</button>
          </div>
        </form>
      </TopRankSection>
    </TopRankPublicLayout>
  );
}
