import { PublicInfoPage, publicMetadata } from "@/components/marketing/public-pages";

export const metadata = publicMetadata("faculty");

export default function FacultyPage() {
  return <PublicInfoPage pageKey="faculty" />;
}
