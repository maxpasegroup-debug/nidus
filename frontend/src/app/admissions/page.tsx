import { PublicInfoPage, publicMetadata } from "@/components/marketing/public-pages";

export const metadata = publicMetadata("admissions");

export default function AdmissionsPage() {
  return <PublicInfoPage pageKey="admissions" />;
}
