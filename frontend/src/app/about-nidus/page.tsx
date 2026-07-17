import { PublicInfoPage, publicMetadata } from "@/components/marketing/public-pages";

export const metadata = publicMetadata("about");

export default function AboutNidusPage() {
  return <PublicInfoPage pageKey="about" />;
}
