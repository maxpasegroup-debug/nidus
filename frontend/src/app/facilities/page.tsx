import { PublicInfoPage, publicMetadata } from "@/components/marketing/public-pages";

export const metadata = publicMetadata("facilities");

export default function FacilitiesPage() {
  return <PublicInfoPage pageKey="facilities" />;
}
