"use client";

import { useParams } from "next/navigation";
import { CommunicationConsole } from "@/components/communication/communication-console";

export default function MessageThreadPage() {
  const params = useParams<{ id: string }>();
  return <CommunicationConsole view="thread" threadId={params?.id} />;
}
