import "dotenv/config";
import { prisma } from "../config/prisma.js";

const courses = [
  {
    title: "NDA Foundation Course",
    slug: "nda-foundation-course",
    description:
      "A complete National Defence Academy foundation program covering mathematics, general ability, current affairs, discipline routines, and test readiness.",
    thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
    category: "Foundation",
    examType: "NDA",
    duration: "24 weeks",
    price: 24999,
    isPremium: true,
    modules: [
      {
        title: "NDA Mathematics Command",
        order: 1,
        lessons: [
          {
            title: "Algebra readiness briefing",
            description: "Core algebra patterns and NDA speed tactics.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            duration: "38 min",
            isPreview: true,
            order: 1
          },
          {
            title: "Trigonometry battle drills",
            description: "High-yield identities, shortcuts, and mock problems.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            duration: "46 min",
            isPreview: false,
            order: 2
          }
        ]
      },
      {
        title: "GAT and Current Affairs",
        order: 2,
        lessons: [
          {
            title: "Defence current affairs briefing",
            description: "Daily defence, geography, and polity briefing format.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            duration: "32 min",
            isPreview: true,
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: "CDS Crash Course",
    slug: "cds-crash-course",
    description:
      "A sharp Combined Defence Services crash course for English, GK, elementary mathematics, and rapid revision.",
    thumbnail: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    category: "Crash Course",
    examType: "CDS",
    duration: "10 weeks",
    price: 17999,
    isPremium: true,
    modules: [
      {
        title: "CDS Rapid Revision",
        order: 1,
        lessons: [
          {
            title: "English scoring patterns",
            description: "Sentence improvement, ordering, and comprehension tactics.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            duration: "41 min",
            isPreview: true,
            order: 1
          },
          {
            title: "GK recall map",
            description: "History, polity, science, and defence awareness recall map.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            duration: "44 min",
            isPreview: false,
            order: 2
          }
        ]
      }
    ]
  },
  {
    title: "AFCAT Master Program",
    slug: "afcat-master-program",
    description:
      "A complete AFCAT program for reasoning, verbal ability, numerical aptitude, military aptitude, and mock-test analytics.",
    thumbnail: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80",
    category: "Master Program",
    examType: "AFCAT",
    duration: "16 weeks",
    price: 21999,
    isPremium: true,
    modules: [
      {
        title: "AFCAT Aptitude Grid",
        order: 1,
        lessons: [
          {
            title: "Reasoning formation drills",
            description: "Series, analogy, spatial reasoning, and timed practice.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            duration: "39 min",
            isPreview: true,
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: "SSB Interview Program",
    slug: "ssb-interview-program",
    description:
      "A military-inspired SSB interview preparation program for screening, psychology, GTO tasks, conference, and officer-like qualities.",
    thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
    category: "Interview",
    examType: "SSB",
    duration: "8 weeks",
    price: 29999,
    isPremium: true,
    modules: [
      {
        title: "SSB Screening and Psychology",
        order: 1,
        lessons: [
          {
            title: "OIR and PPDT briefing",
            description: "Screening day structure and high-pressure response strategy.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            duration: "52 min",
            isPreview: true,
            order: 1
          },
          {
            title: "TAT, WAT, SRT response design",
            description: "Psychology test frameworks and authentic response practice.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            duration: "58 min",
            isPreview: false,
            order: 2
          }
        ]
      }
    ]
  }
];

async function main() {
  for (const course of courses) {
    await prisma.course.deleteMany({ where: { slug: course.slug } });
    await prisma.course.create({
      data: {
        ...course,
        modules: {
          create: course.modules.map((module) => ({
            title: module.title,
            order: module.order,
            lessons: {
              create: module.lessons
            }
          }))
        }
      }
    });
  }

  console.log(`Seeded ${courses.length} NIDUS courses`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
