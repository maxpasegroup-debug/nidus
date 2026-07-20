import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CountdownCard, FAQAccordion, FeatureCard, HeroBanner, StatsCard, Timeline, TopRankPublicLayout, TopRankSection } from "@/components/toprank";
import { getTopRankFaqs, getTopRankFeatures } from "@/services/toprank-content-service";
import { getAgniveerProgramDetails, getTopRankPrograms } from "@/services/toprank-program-service";

const benefits = ["Structured daily preparation", "Academic and physical readiness", "Mentor direction", "Battle-test mindset", "Parent-friendly progress clarity", "Mobile-first learning access"];
const why = [
  "Agniveer is a national-level opportunity for young aspirants to serve in uniform.",
  "Selection needs academic preparation, discipline, physical readiness and emotional consistency.",
  "TopRank turns that preparation into a guided six-month pathway.",
];

export default function AgniveerGatewayPage() {
  const program = getTopRankPrograms()[0];
  const details = getAgniveerProgramDetails();
  const features = getTopRankFeatures();

  return (
    <TopRankPublicLayout>
      <HeroBanner
        eyebrow="Agniveer Gateway"
        title="AGNIVEER GATEWAY"
        description={`6 Month AI Powered TopRank Training Program${"\u2122"}. Built for students who need discipline, clarity, mentorship and a serious pathway to selection readiness.`}
        primaryHref="/toprank/join"
        primaryLabel="Apply Now"
        secondaryHref="#program"
        secondaryLabel="View Program"
      />
      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
          <Link href="/toprank/gateway/agniveer/orientation" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/16 px-5 text-sm font-bold text-white transition hover:bg-white/8">Watch Orientation</Link>
          <Link href="/toprank/gateway/agniveer/altt" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/16 px-5 text-sm font-bold text-white transition hover:bg-white/8">Understand ALTT</Link>
          <Link href="/toprank/gateway/agniveer/curriculum" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/16 px-5 text-sm font-bold text-white transition hover:bg-white/8">View Curriculum</Link>
        </div>
      </section>
      <TopRankSection eyebrow="Program overview" title={program.title}>
        <div id="program" className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-6 lg:col-span-2">
            <h3 className="text-xl font-black text-white">Program Overview</h3>
            <p className="mt-4 text-base leading-8 text-[#c9d0c2]">{details.overview}</p>
          </article>
          <StatsCard label="Duration" value={program.duration} note={`Fee: ${program.fee}`} />
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Why choose Agniveer" title="A gateway for disciplined young aspirants">
        <div className="grid gap-5 md:grid-cols-3">
          {why.map((item) => (
            <article key={item} className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-6 text-sm leading-7 text-[#dbe4d7]">{item}</article>
          ))}
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Benefits" title="What students gain">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item) => (
            <FeatureCard key={item} title={item} description="Designed as a visible part of the TopRank preparation promise for RC2." />
          ))}
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Salary and growth" title="Understand the long-term opportunity">
        <div className="grid gap-5 lg:grid-cols-2">
          <Timeline items={details.salary} />
          <Timeline items={details.careerGrowth} />
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Selection process" title="Preparation mapped to selection">
        <Timeline items={details.selectionProcess} />
      </TopRankSection>
      <TopRankSection eyebrow="Training duration and fee" title="Clear batch information">
        <div className="grid gap-5 md:grid-cols-3">
          <StatsCard label="Duration" value={details.duration} note="Structured six-month preparation rhythm." />
          <StatsCard label="Program Fee" value="Admissions" note={details.fee} />
          <StatsCard label="Status" value={details.admissionStatus} note="Agniveer Gateway is open now." />
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Batch schedule" title="Upcoming batches">
        <div className="grid gap-5 md:grid-cols-3">
          <CountdownCard title="Upcoming Batch" value={details.batchSchedule[0]} note="Countdown placeholder will connect in a later release." />
          <CountdownCard title="Next Intake" value={details.batchSchedule[1]} note="Students can choose the next suitable intake." />
          <CountdownCard title="Seats Remaining" value={details.seatsRemaining} note="Seat count placeholder for admissions team." />
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Program features" title="The TopRank training promise">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => <FeatureCard key={feature.title} title={feature.title} description={feature.description} />)}
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Admission process" title="Simple path to begin">
        <Timeline items={details.admissionProcess} />
      </TopRankSection>
      <TopRankSection eyebrow="FAQ" title="Agniveer Gateway questions">
        <FAQAccordion items={getTopRankFaqs()} />
      </TopRankSection>
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#d6a447]/24 bg-[#d6a447]/10 p-8 text-center sm:p-12">
          <h2 className="text-3xl font-black text-white sm:text-5xl">Ready to enter the Agniveer Gateway?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#dbe4d7]">Join the next TopRank batch and begin with orientation, curriculum clarity and mentor guidance.</p>
          <Link href="/toprank/join" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">
            Apply Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </TopRankPublicLayout>
  );
}
