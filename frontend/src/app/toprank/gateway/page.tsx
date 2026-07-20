import { GatewayCard, HeroBanner, SectionHeading, TopRankPublicLayout } from "@/components/toprank";
import { getTopRankGateways } from "@/services/toprank-gateway-service";

export default function TopRankGatewayPage() {
  return (
    <TopRankPublicLayout>
      <HeroBanner
        eyebrow="Defence gateway selection"
        title="Choose Your Gateway"
        description="Start with the defence pathway that matches your ambition. Agniveer is open now; other gateways are being prepared for later releases."
        primaryHref="/toprank/gateway/agniveer"
        primaryLabel="Enter Agniveer"
        secondaryHref="/toprank/join"
        secondaryLabel="Join TopRank"
      />
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Gateways" title="One platform, many defence paths" description="Every gateway will eventually receive its own curriculum, trainers, tests and progress structure. RC2 opens Agniveer first." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {getTopRankGateways().map((gateway) => (
              <GatewayCard key={gateway.id} gateway={gateway} />
            ))}
          </div>
        </div>
      </section>
    </TopRankPublicLayout>
  );
}
