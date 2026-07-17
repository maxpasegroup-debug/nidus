import { PublicInfoPage, publicMetadata } from "@/components/marketing/public-pages";

export const metadata = publicMetadata("success");

export default function SuccessStoriesPage() {
  return <PublicInfoPage pageKey="success" />;
}
