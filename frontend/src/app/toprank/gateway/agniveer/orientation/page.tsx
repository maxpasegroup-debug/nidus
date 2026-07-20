import { HeroBanner, SectionHeading, TopRankPublicLayout, VideoCard } from "@/components/toprank";
import { getAgniveerOrientationVideos } from "@/services/toprank-orientation-service";

export default function AgniveerOrientationPage() {
  return (
    <TopRankPublicLayout>
      <HeroBanner
        eyebrow="Orientation Center"
        title="Start With Clarity"
        description="Two guided orientation videos help students and parents understand Agniveer, TopRank and the training journey before registration."
        primaryHref="/toprank/join"
        primaryLabel="Join TopRank"
        secondaryHref="/toprank/gateway/agniveer/altt"
        secondaryLabel="Explore ALTT"
      />
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Orientation videos" title="Know the journey before you begin" description="Video playback is represented as a production placeholder in RC2. The media system can connect later without changing page structure." />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {getAgniveerOrientationVideos().map((video) => <VideoCard key={video.title} {...video} />)}
          </div>
        </div>
      </section>
    </TopRankPublicLayout>
  );
}
