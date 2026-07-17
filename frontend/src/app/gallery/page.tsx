import { PublicInfoPage, publicMetadata } from "@/components/marketing/public-pages";

export const metadata = publicMetadata("gallery");

export default function GalleryPage() {
  return <PublicInfoPage pageKey="gallery" />;
}
