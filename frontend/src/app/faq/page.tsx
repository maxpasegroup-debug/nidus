import { PublicInfoPage, publicMetadata } from "@/components/marketing/public-pages";

export const metadata = publicMetadata("faq");

export default function FaqPage() {
  return <PublicInfoPage pageKey="faq" />;
}
