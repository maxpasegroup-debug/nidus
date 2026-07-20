import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FeatureCard, HeroBanner, StatsCard, Timeline, TopRankPublicLayout, TopRankSection } from "@/components/toprank";
import { getAgniveerProgramDetails } from "@/services/toprank-program-service";

const included = ["Orientation Center", "ALTT learning rhythm", "Curriculum guidance", "Trainer guidance foundation", "Batch selection support", "Mobile-friendly access"];

export default function TopRankJoinPage() {
  const details = getAgniveerProgramDetails();

  return (
    <TopRankPublicLayout>
      <HeroBanner
        eyebrow="Enrollment"
        title="Join TopRank"
        description="For students preparing seriously for Agniveer and families who want a clear, guided, disciplined preparation path."
        primaryHref="/toprank/register"
        primaryLabel="Register"
        secondaryHref="/toprank/login"
        secondaryLabel="Login"
      />
      <TopRankSection eyebrow="Who should join" title="Built for committed aspirants">
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard title="Agniveer aspirants" description="Students looking for structured academic and physical preparation." />
          <FeatureCard title="Parents seeking clarity" description="Families who want a visible preparation pathway before enrollment." />
          <FeatureCard title="Repeatable discipline" description="Students who need routine, guidance and accountability." />
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Requirements and fee" title="Know before you register">
        <div className="grid gap-5 md:grid-cols-3">
          <StatsCard label="Requirement" value="Commitment" note="Student must be ready for academic and physical preparation." />
          <StatsCard label="Program Fee" value="Admissions" note={details.fee} />
          <StatsCard label="Status" value={details.admissionStatus} note="Next batch enrollment foundation is open." />
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Included" title="What is included">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((item) => <FeatureCard key={item} title={item} description="Included in the TopRank public enrollment foundation for RC2." />)}
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Admission process" title="A simple path">
        <Timeline items={details.admissionProcess} />
      </TopRankSection>
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-[2rem] border border-[#d6a447]/24 bg-[#d6a447]/10 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#f6d17a]">Final step</p>
            <h2 className="mt-3 text-3xl font-black text-white">Register or login to continue.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/toprank/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">Register <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/toprank/login" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/16 px-6 text-sm font-bold text-white">Login</Link>
          </div>
        </div>
      </section>
    </TopRankPublicLayout>
  );
}
