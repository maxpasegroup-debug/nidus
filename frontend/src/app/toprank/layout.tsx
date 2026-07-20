import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "TopRank | AI Powered Defence Training Platform",
  description: "TopRank by Maxpase Group is India's AI Powered Defence Training Platform.",
};

export default function TopRankLayout({ children }: { children: ReactNode }) {
  return children;
}
