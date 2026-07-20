import Link from "next/link";
import { FAQAccordion, FeatureCard, GatewayCard, HeroBanner, SectionHeading, StatsCard, Timeline, TopRankPublicLayout, TopRankSection } from "@/components/toprank";
import { getTopRankFaqs, getTopRankFeatures } from "@/services/toprank-content-service";
import { getTopRankGateways } from "@/services/toprank-gateway-service";

export default function TopRankPage() {
  const gateways = getTopRankGateways();
  const features = getTopRankFeatures();

  return (
    <TopRankPublicLayout>
      <HeroBanner
        eyebrow="TopRank by Maxpase Group"
        title={<>TOPRANK<sup className="align-super text-2xl sm:text-4xl">{"\u2122"}</sup></>}
        description="India's AI Powered Defence Training Platform. Mission-based learning, mentor driven preparation and a clear pathway for serious defence aspirants."
        primaryHref="/toprank/gateway/agniveer"
        primaryLabel="Enter Gateway"
        secondaryHref="#why-toprank"
        secondaryLabel="Learn More"
      />
      <TopRankSection eyebrow="Why TopRank" title="Built for students who need direction before speed">
        <div id="why-toprank" className="grid gap-5 md:grid-cols-3">
          <StatsCard label="Preparation" value="6 Month" note="A focused rhythm for Agniveer preparation, discipline and selection readiness." />
          <StatsCard label="Batch Entry" value="2x Monthly" note="Upcoming batches are planned on the 1st and 15th of every month." />
          <StatsCard label="Gateway" value="Agniveer" note="The first open gateway. Other defence pathways are staged for later releases." />
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="Defence gateways" title="Choose Your Defence Gateway">
        <div id="gateways" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gateways.map((gateway) => (
            <GatewayCard key={gateway.id} gateway={gateway} />
          ))}
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="How it works" title="A simple preparation journey">
        <Timeline items={["Choose the Agniveer Gateway", "Watch the orientation", "Understand ALTT", "Review curriculum and trainers", "Join the next available batch"]} />
      </TopRankSection>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Training features" title="What students receive" description="RC2 presents the platform promise clearly. The engines behind these features will be activated in later releases." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
            ))}
          </div>
        </div>
      </section>
      <TopRankSection eyebrow="Testimonials" title="Proof placeholders">
        <div className="grid gap-5 md:grid-cols-3">
          {["Student confidence", "Parent clarity", "Mentor guidance"].map((title) => (
            <article key={title} className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-6">
              <p className="text-xl font-black text-white">{title}</p>
              <p className="mt-3 text-sm leading-6 text-[#b9c2b4]">Verified TopRank stories will appear here after launch.</p>
            </article>
          ))}
        </div>
      </TopRankSection>
      <TopRankSection eyebrow="FAQ" title="Common questions">
        <FAQAccordion items={getTopRankFaqs()} />
      </TopRankSection>
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#d6a447]/24 bg-[#d6a447]/10 p-8 text-center sm:p-12">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-[#f6d17a]">Join TopRank</p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl">Start with the Agniveer Gateway.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#dbe4d7]">Understand the program, check the batch rhythm and enter the enrollment path when you are ready.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/toprank/join" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">Join TopRank</Link>
            <Link href="/toprank/login" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/16 px-6 text-sm font-bold text-white">Login</Link>
          </div>
        </div>
      </section>
    </TopRankPublicLayout>
  );
}
