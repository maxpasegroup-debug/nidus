import { PublicInfoPage, publicMetadata } from "@/components/marketing/public-pages";

export const metadata = publicMetadata("events");

export default function EventsPage() {
  return <PublicInfoPage pageKey="events" />;
}
