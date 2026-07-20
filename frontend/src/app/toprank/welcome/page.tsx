import Link from "next/link";
import { TopRankPublicLayout, TopRankSection } from "@/components/toprank";

export default function TopRankWelcomePage() {
  return (
    <TopRankPublicLayout>
      <TopRankSection eyebrow="Enrollment complete" title="Welcome to TopRank">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#d6a447]/25 bg-white/[0.055] p-6 text-center sm:p-10">
          <p className="text-lg font-bold leading-8 text-[#dbe4d7]">Your Agniveer onboarding foundation is complete. Your profile, batch selection and program agreement are now connected to your TopRank account.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/toprank/gateway/agniveer/orientation" className="rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-white">Watch Orientation</Link>
            <Link href="/toprank/student/profile" className="rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-white">Complete Profile</Link>
            <span className="rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-[#95a08f]">Join Community</span>
            <Link href="/toprank/student" className="rounded-full bg-[#d6a447] px-5 py-3 text-sm font-black text-[#06120e]">Enter Command Center</Link>
          </div>
        </div>
      </TopRankSection>
    </TopRankPublicLayout>
  );
}
