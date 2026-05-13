import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { PwaRegistration } from "@/components/pwa-registration";
import { MaintenanceBanner } from "@/components/maintenance-banner";
import { NetworkStatus } from "@/components/network-status";

export const metadata: Metadata = {
  title: "NIDUS Defence Training Platform",
  description: "Defence training, course readiness, and personnel development platform.",
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
