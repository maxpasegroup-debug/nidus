import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { PwaRegistration } from "@/components/pwa-registration";
import { MaintenanceBanner } from "@/components/maintenance-banner";
import { NetworkStatus } from "@/components/network-status";

export const metadata: Metadata = {
  metadataBase: new URL("https://nidusacademy.in"),
  title: {
    default: "NIDUS Academy | Defence Coaching for NDA, CDS, AFCAT, SSB, AISSEE & Agniveer",
    template: "%s | NIDUS Academy"
  },
  description: "NIDUS Academy is a premium defence training academy for NDA, CDS, AFCAT, SSB, AISSEE, RIMC, Agniveer and officer interview preparation in Kerala.",
  keywords: [
    "NIDUS Academy",
    "defence academy Kerala",
    "NDA coaching",
    "CDS coaching",
    "AFCAT coaching",
    "SSB interview training",
    "AISSEE coaching",
    "RIMC coaching",
    "Agniveer coaching"
  ],
  openGraph: {
    title: "NIDUS Academy | Defence Coaching for Indian Defence Aspirants",
    description: "Premium coaching, physical training, counselling and exam practice for NDA, CDS, AFCAT, SSB, AISSEE, RIMC and Agniveer aspirants.",
    url: "https://nidusacademy.in",
    siteName: "NIDUS Academy",
    type: "website",
    locale: "en_IN"
  },
  twitter: {
    card: "summary_large_image",
    title: "NIDUS Academy | Defence Coaching for Indian Defence Aspirants",
    description: "Structured defence preparation for NDA, CDS, AFCAT, SSB, AISSEE, RIMC and Agniveer aspirants."
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg"
  },
  appleWebApp: {
    capable: true,
    title: "NIDUS",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#0B1F3A"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded focus:bg-gold focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-navy-deep">
            Skip to content
          </a>
          <PwaRegistration />
          <MaintenanceBanner />
          <NetworkStatus />
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
