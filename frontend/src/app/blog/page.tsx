import { PublicInfoPage, publicMetadata } from "@/components/marketing/public-pages";

export const metadata = publicMetadata("blog");

export default function BlogPage() {
  return <PublicInfoPage pageKey="blog" />;
}
