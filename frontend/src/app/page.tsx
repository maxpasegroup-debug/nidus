import type { Metadata } from "next";
import { ExperienceLanding } from "@/experience/landing";

const title = "NIDUS Defence Academy | Begin Your Officer Journey";
const description = "A cinematic introduction to NIDUS Defence Academy, built for NDA, CDS, AFCAT, SSB, AISSEE, RIMC, Agniveer and defence aspirants who want disciplined preparation.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://nidusacademy.in"
  },
  openGraph: {
    title,
    description,
    url: "https://nidusacademy.in",
    siteName: "NIDUS Defence Academy",
    type: "website",
    locale: "en_IN"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description
  }
};

const academyStructuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "NIDUS Defence Academy",
  url: "https://nidusacademy.in",
  description,
  areaServed: {
    "@type": "Country",
    name: "India"
  },
  knowsAbout: ["NDA", "CDS", "AFCAT", "SSB", "AISSEE", "RIMC", "Agniveer", "Defence Academy Preparation"]
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(academyStructuredData) }} />
      <ExperienceLanding />
    </>
  );
}
