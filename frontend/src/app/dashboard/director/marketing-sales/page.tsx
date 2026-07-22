"use client";

import { BarChart3, Camera, ClipboardCheck, Globe2, Megaphone, MessageCircle, PhoneCall, Users } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

const tiles: DirectorTile[] = [
  {
    label: "Telecallers",
    href: "/dashboard/business-development?tab=CALLING",
    icon: PhoneCall,
    note: "Open calling work, follow-ups and lead handoff.",
  },
  {
    label: "BDE Team",
    href: "/dashboard/business-development?tab=REPORTS",
    icon: Users,
    note: "Review business development work and team pipeline.",
  },
  {
    label: "Campaign Reports",
    href: "/dashboard/business-development?tab=REPORTS",
    icon: Megaphone,
    note: "Open sales support and campaign reporting.",
  },
  {
    label: "Leads",
    href: "/dashboard/business-development?tab=LEADS",
    icon: ClipboardCheck,
    note: "View and manage active lead records.",
  },
  {
    label: "Follow-ups",
    href: "/dashboard/business-development?tab=FOLLOWUPS",
    icon: PhoneCall,
    note: "Check pending calls and next actions.",
  },
  {
    label: "Counselling",
    href: "/dashboard/business-development?tab=COUNSELLING",
    icon: Users,
    note: "Open counselling pipeline and conversion notes.",
  },
  {
    label: "Campaign Reports",
    href: "/dashboard/business-development?tab=REPORTS",
    icon: BarChart3,
    note: "Review marketing and sales performance signals.",
  },
  {
    label: "Instagram",
    href: "/dashboard/business-development?tab=REPORTS",
    icon: Camera,
    note: "Review Instagram campaign leads and reporting handoff.",
  },
  {
    label: "Facebook",
    href: "/dashboard/business-development?tab=REPORTS",
    icon: Globe2,
    note: "Review Facebook campaign leads and reporting handoff.",
  },
  {
    label: "WhatsApp",
    href: "/dashboard/director/notifications",
    icon: MessageCircle,
    note: "Open announcement and batch message tools.",
  },
];

export default function DirectorMarketingSalesPage() {
  return (
    <DirectorLauncher
      eyebrow="Marketing And Sales"
      title="Leads, Calling And Campaigns"
      description="One-touch entry for sales team work, CRM pipeline and future social channel controls."
      tiles={tiles}
      backHref="/dashboard/director"
    />
  );
}
