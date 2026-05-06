import "dotenv/config";
import { prisma } from "../config/prisma.js";

const thumbnails = [
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80"
];

async function main() {
  await prisma.liveClass.createMany({
    data: [
      {
        title: "NDA Current Affairs War Room",
        description: "Live defence current affairs briefing with rapid recall drills.",
        examType: "NDA",
        instructorName: "Col. Arvind Rao",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 60,
        meetingLink: "https://meet.google.com/placeholder-nda",
        thumbnail: thumbnails[0],
        isLive: false
      },
      {
        title: "SSB Psychology Live Lab",
        description: "Live TAT, WAT and SRT response analysis session.",
        examType: "SSB",
        instructorName: "Maj. Neha Sharma",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        duration: 90,
        meetingLink: "https://meet.google.com/placeholder-ssb",
        thumbnail: thumbnails[1],
        isLive: true
      }
    ],
    skipDuplicates: true
  });

  await prisma.recordedLecture.createMany({
    data: [
      {
        title: "AFCAT Reasoning Formation",
        description: "Spatial and verbal reasoning lecture with timed practice.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: thumbnails[2],
        duration: 48,
        instructorName: "Sqn Ldr. Meera Kapoor"
      },
      {
        title: "CDS English Scoring Patterns",
        description: "Grammar, ordering and comprehension tactics for CDS.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: thumbnails[0],
        duration: 55,
        instructorName: "Capt. Rohan Iyer"
      }
    ],
    skipDuplicates: true
  });

  console.log("Seeded live classes and recorded lectures");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
