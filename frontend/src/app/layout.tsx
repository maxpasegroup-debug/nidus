import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { PwaRegistration } from "@/components/pwa-registration";
import { MaintenanceBanner } from "@/components/maintenance-banner";

export const metadata: Metadata = {
  title: "NIDUS Defence Training Platform",
  description: "Defence training, course readiness, and personnel development platform.",
  manifest: "/manifest.webmanifest",
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
          <PwaRegistration />
          <MaintenanceBanner />
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
